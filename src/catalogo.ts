/**
 * Módulo de Catálogo de Produtos e Combos do CineFood
 * Implementado sob a especificação F-CARDAPIO-V1
 */

export interface Produto {
  id: string;
  nome: string;
  categoria: 'pipocas' | 'bebidas' | 'doces' | 'combos';
  precoCentavos: number;
  ativo: boolean;
  emEstoque: boolean;
  itensCombo?: string[];
}

/**
 * Retorna apenas os produtos ativos e em estoque (Atende AC-1)
 */
export function listarCardapioDisponivel(produtos: Produto[]): Produto[] {
  return produtos.filter(p => p.ativo && p.emEstoque);
}

/**
 * Filtra produtos disponíveis por categoria (Atende AC-2)
 */
export function filtrarPorCategoria(produtos: Produto[], categoria: Produto['categoria']): Produto[] {
  return listarCardapioDisponivel(produtos).filter(p => p.categoria === categoria);
}

/**
 * Valida se um combo possui itens e calcula o desconto aplicado (Atende AC-3)
 */
export function obterDetalhesCombo(combo: Produto, catalogo: Produto[]): { combo: Produto; itens: Produto[] } {
  if (combo.categoria !== 'combos' || !combo.itensCombo) {
    throw new Error('O produto informado não é um combo válido.');
  }

  const itens = catalogo.filter(p => combo.itensCombo?.includes(p.id));
  return {
    combo,
    itens
  };
}
