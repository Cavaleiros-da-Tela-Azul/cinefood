import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCanteenRepository } from '../../src/modules/canteen/repository.ts';
import { CanteenService } from '../../src/modules/canteen/service.ts';
import {
  getCanteenMenu,
  postCanteenCheckout,
  postCanteenQuote,
  postCompensateCanteenPayment,
  postConfirmCanteenPayment,
} from '../../src/modules/canteen/routes.ts';
import type { CanteenAddon, CanteenProduct } from '../../src/modules/canteen/types.ts';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';

function clientSession(userId: string): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.test`,
    role: 'CLIENTE',
    iat: 1_700_000_000,
    exp: 1_800_000_000,
  };
}

function buildSeedData(): { products: CanteenProduct[]; addons: CanteenAddon[] } {
  const addons: CanteenAddon[] = [
    {
      addonId: 'add_manteiga',
      name: 'Manteiga Extra',
      priceCents: 400,
      available: true,
    },
    {
      addonId: 'add_cheddar',
      name: 'Cheddar Cremoso',
      priceCents: 700,
      available: true,
    },
    {
      addonId: 'add_indisponivel',
      name: 'Calda Especial Esgotada',
      priceCents: 500,
      available: false,
    },
  ];

  const products: CanteenProduct[] = [
    {
      productId: 'prod_combo_casal',
      name: 'Combo Casal Pipoca + 2 Refris',
      description: 'Pipoca grande + 2 refrigerantes 500ml',
      category: 'COMBO',
      unitPriceCents: 4500,
      availableStock: 5,
      active: true,
      isCombo: true,
      comboItems: ['Pipoca G', 'Refrigerante 500ml x2'],
      allowedAddonIds: ['add_manteiga', 'add_cheddar', 'add_indisponivel'],
    },
    {
      productId: 'prod_nachos_unico',
      name: 'Nachos Supreme Edição Limitada',
      description: 'Porção de nachos crocantes',
      category: 'SNACK',
      unitPriceCents: 3200,
      availableStock: 1,
      active: true,
      isCombo: false,
      allowedAddonIds: ['add_cheddar'],
    },
    {
      productId: 'prod_zero_estoque',
      name: 'Balde Colecionável',
      description: 'Edição esgotada',
      category: 'PIPOCA',
      unitPriceCents: 6000,
      availableStock: 0,
      active: true,
      isCombo: false,
      allowedAddonIds: [],
    },
    {
      productId: 'prod_inativo',
      name: 'Item Fora de Temporada',
      description: 'Produto desativado no cardápio',
      category: 'DOCE',
      unitPriceCents: 1500,
      availableStock: 10,
      active: false,
      isCombo: false,
      allowedAddonIds: [],
    },
  ];

  return { products, addons };
}

describe('Cardápio e Reserva Atômica de Estoque (RF-07, RF-08 / MAR-04)', () => {
  it('AC-1: recalcula total com adicionais no servidor e rejeita preço adulterado ou item indisponível', async () => {
    const { products, addons } = buildSeedData();
    const repo = new InMemoryCanteenRepository(products, addons);
    const service = new CanteenService(repo);

    // Cardápio lista apenas itens ativos e adicionais disponíveis
    const menuRes = await getCanteenMenu(service);
    assert.equal(menuRes.status, 200);
    assert.equal(menuRes.body.length, 3);
    assert.equal(
      menuRes.body.some((item) => item.productId === 'prod_inativo'),
      false,
    );
    const comboView = menuRes.body.find((item) => item.productId === 'prod_combo_casal');
    assert.ok(comboView);
    assert.equal(comboView.isCombo, true);
    assert.deepEqual(
      comboView.addons.map((a) => a.addonId),
      ['add_manteiga', 'add_cheddar'],
    );

    // Tentativa de adulteração de preço no quote: (4500 + 400 + 700) * 2 = 11200 centavos
    const quoteRes = await postCanteenQuote(service, [
      {
        productId: 'prod_combo_casal',
        quantity: 2,
        addonIds: ['add_manteiga', 'add_cheddar'],
        clientUnitPriceCents: 100,
        clientLineTotalCents: 200,
      },
    ]);
    assert.equal(quoteRes.status, 200);
    assert.ok('totalCents' in quoteRes.body);
    assert.equal(quoteRes.body.totalCents, 11200);
    assert.equal(quoteRes.body.clientPayloadIgnored, true);
    assert.equal(quoteRes.body.items[0].officialUnitPriceCents, 4500);
    assert.equal(quoteRes.body.items[0].addonsUnitPriceCents, 1100);

    // Checkout com clientTotalCents adulterado ignora o payload e grava o total oficial
    const checkoutRes = await postCanteenCheckout(service, clientSession('usr_alice'), {
      deliveryChannel: 'RETIRADA_BALCAO',
      clientTotalCents: 1,
      items: [
        {
          productId: 'prod_combo_casal',
          quantity: 2,
          addonIds: ['add_manteiga', 'add_cheddar'],
          clientUnitPriceCents: 1,
        },
      ],
    });
    assert.equal(checkoutRes.status, 201);
    assert.ok('orderId' in checkoutRes.body);
    assert.equal(checkoutRes.body.totalCents, 11200);
    assert.equal(checkoutRes.body.status, 'PENDENTE_PAGAMENTO');
    assert.equal(checkoutRes.body.stockStatus, 'RESERVADO');

    // Rejeita item inativo no quote e checkout
    const inactiveQuote = await postCanteenQuote(service, [
      { productId: 'prod_inativo', quantity: 1 },
    ]);
    assert.equal(inactiveQuote.status, 422);

    // Rejeita adicional indisponível
    const unavailableAddonQuote = await postCanteenQuote(service, [
      { productId: 'prod_combo_casal', quantity: 1, addonIds: ['add_indisponivel'] },
    ]);
    assert.equal(unavailableAddonQuote.status, 422);

    // Rejeita item sem estoque no quote (422) e no checkout (409)
    const zeroStockQuote = await postCanteenQuote(service, [
      { productId: 'prod_zero_estoque', quantity: 1 },
    ]);
    assert.equal(zeroStockQuote.status, 422);

    const zeroStockCheckout = await postCanteenCheckout(service, clientSession('usr_bob'), {
      deliveryChannel: 'RETIRADA_BALCAO',
      items: [{ productId: 'prod_zero_estoque', quantity: 1 }],
    });
    assert.equal(zeroStockCheckout.status, 409);
  });

  it('AC-2: na disputa pela última unidade, apenas um checkout reserva estoque sem saldo negativo e devolve em caso de falha', async () => {
    const { products, addons } = buildSeedData();
    const repo = new InMemoryCanteenRepository(products, addons);
    const service = new CanteenService(repo);

    const competitors = ['usr_1', 'usr_2', 'usr_3', 'usr_4', 'usr_5'];
    const results = await Promise.all(
      competitors.map((userId) =>
        postCanteenCheckout(service, clientSession(userId), {
          deliveryChannel: 'RETIRADA_BALCAO',
          items: [{ productId: 'prod_nachos_unico', quantity: 1, addonIds: ['add_cheddar'] }],
        }),
      ),
    );

    const winners = results.filter((res) => res.status === 201);
    const conflicts = results.filter((res) => res.status === 409);

    assert.equal(winners.length, 1);
    assert.equal(conflicts.length, 4);

    const productAfterRace = await repo.findProductById('prod_nachos_unico');
    assert.ok(productAfterRace);
    assert.equal(productAfterRace.availableStock, 0);
    assert.ok(productAfterRace.availableStock >= 0);

    // Se o vencedor falhar no pagamento, a reserva é estornada e a unidade volta ao estoque
    const winnerOrder = winners[0].body;
    assert.ok('orderId' in winnerOrder);
    assert.equal(winnerOrder.totalCents, 3900);

    const compensated = await postCompensateCanteenPayment(
      service,
      winnerOrder.orderId,
      'EXPIRADO',
    );
    assert.equal(compensated.status, 200);
    assert.ok('status' in compensated.body);
    assert.equal(compensated.body.status, 'CANCELADO');
    assert.equal(compensated.body.stockStatus, 'DEVOLVIDO');

    const productAfterCompensation = await repo.findProductById('prod_nachos_unico');
    assert.equal(productAfterCompensation?.availableStock, 1);

    // Novo cliente consegue comprar a unidade devolvida e confirmar pagamento com baixa definitiva
    const secondCheckout = await postCanteenCheckout(service, clientSession('usr_bob'), {
      deliveryChannel: 'RETIRADA_BALCAO',
      items: [{ productId: 'prod_nachos_unico', quantity: 1 }],
    });
    assert.equal(secondCheckout.status, 201);
    assert.ok('orderId' in secondCheckout.body);

    const confirmed = await postConfirmCanteenPayment(service, secondCheckout.body.orderId);
    assert.equal(confirmed.status, 200);
    assert.ok('stockStatus' in confirmed.body);
    assert.equal(confirmed.body.stockStatus, 'BAIXADO');
    assert.equal(confirmed.body.paymentStatus, 'APROVADO');
    assert.equal(confirmed.body.status, 'EM_PREPARO');
    assert.equal((await repo.findProductById('prod_nachos_unico'))?.availableStock, 0);
  });
});
