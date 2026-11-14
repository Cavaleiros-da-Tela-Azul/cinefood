import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentMethod } from './types.ts';

export interface CreateSandboxChargeInput {
  idempotencyKey: string;
  purchaseId: string;
  reservationId: string;
  amountCents: number;
  method: PaymentMethod;
  cardToken?: string;
}

export interface SandboxChargeOutput {
  gatewayChargeId: string;
  sandboxMode: true;
  pixCopyPaste?: string;
  pixQrPayload?: string;
}

export interface RefundSandboxChargeInput {
  gatewayChargeId: string;
  amountCents: number;
  idempotencyKey: string;
  reason: string;
}

export interface SandboxRefundOutput {
  refundId: string;
  status: 'REFUNDED';
}

export interface PaymentGatewayAdapter {
  createSandboxCharge(input: CreateSandboxChargeInput): Promise<SandboxChargeOutput>;
  refundSandboxCharge(input: RefundSandboxChargeInput): Promise<SandboxRefundOutput>;
}

/**
 * Adaptador de Gateway estritamente Sandbox (RST-03 / ADR-003).
 * Garante idempotência no provedor por `idempotencyKey` tanto em cobrança quanto em estorno.
 */
export class SandboxPaymentGatewayAdapter implements PaymentGatewayAdapter {
  private readonly chargesByIdempotency = new Map<string, SandboxChargeOutput>();
  private readonly refundsByIdempotency = new Map<string, SandboxRefundOutput>();
  public chargeCreateCalls = 0;
  public refundCalls = 0;
  private readonly productionApproved: boolean;

  constructor(options: { productionApproved?: boolean } = {}) {
    this.productionApproved = options.productionApproved ?? false;
  }

  async createSandboxCharge(input: CreateSandboxChargeInput): Promise<SandboxChargeOutput> {
    if (this.productionApproved) {
      throw new Error('Adaptador sandbox não deve processar ambiente produtivo.');
    }

    const existing = this.chargesByIdempotency.get(input.idempotencyKey);
    if (existing) {
      return { ...existing };
    }

    this.chargeCreateCalls += 1;
    const gatewayChargeId = `sbx_chg_${this.chargeCreateCalls}`;
    const output: SandboxChargeOutput = {
      gatewayChargeId,
      sandboxMode: true,
      ...(input.method === 'PIX'
        ? {
            pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136cinefood-sandbox-${gatewayChargeId}5204000053039865802BR`,
            pixQrPayload: `CINEFOOD-PIX-SANDBOX:${gatewayChargeId}:${input.amountCents}`,
          }
        : {}),
    };
    this.chargesByIdempotency.set(input.idempotencyKey, output);
    return { ...output };
  }

  async refundSandboxCharge(input: RefundSandboxChargeInput): Promise<SandboxRefundOutput> {
    const existing = this.refundedByKey(input.idempotencyKey);
    if (existing) {
      return { ...existing };
    }

    this.refundCalls += 1;
    const refund: SandboxRefundOutput = {
      refundId: `sbx_ref_${this.refundCalls}`,
      status: 'REFUNDED',
    };
    this.refundsByIdempotency.set(input.idempotencyKey, refund);
    return { ...refund };
  }

  private refundedByKey(key: string): SandboxRefundOutput | undefined {
    return this.refundsByIdempotency.get(key);
  }
}

export function signWebhookPayload(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }
  const normalized = signatureHeader.trim().replace(/^sha256=/i, '');
  const expected = signWebhookPayload(rawBody, secret);
  const actualBuf = Buffer.from(normalized, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}
