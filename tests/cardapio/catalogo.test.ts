/**
 * Suíte de Testes: F-CARDAPIO-V1
 * Cada teste prova matematicamente uma Acceptance Criteria (AC) da spec.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  Produto,
  listarCardapioDisponivel,
  filtrarPorCategoria,
  obterDetalhesCombo
} from '../../src/catalogo.js';

const mockCatalogo: Produto[] = [
  { id: '1', nome: 'Pipoca Grande', categoria: 'pipocas', precoCentavos: 3500, ativo: true, emEstoque: true },
  { id: '2', nome: 'Pipoca Média Esgotada', categoria: 'pipocas', precoCentavos: 2800, ativo: true, emEstoque: false },
  { id: '3', nome: 'Refrigerante 1L', categoria: 'bebidas', precoCentavos: 1800, ativo: true, emEstoque: true },
  { id: '4', nome: 'Item Desativado', categoria: 'doces', precoCentavos: 1000, ativo: false, emEstoque: true },
  { id: '5', nome: 'Combo Pipoca + Refri', categoria: 'combos', precoCentavos: 4500, ativo: true, emEstoque: true, itensCombo: ['1', '3'] },
];

describe('F-CARDAPIO-V1: Catálogo e Cardápio', () => {
  // Prova a AC-1: Retorna apenas produtos ativos e em estoque
  it('AC-1: deve retornar apenas produtos ativos e em estoque', () => {
    const disponiveis = listarCardapioDisponivel(mockCatalogo);
    assert.equal(disponiveis.length, 3);
    assert.ok(disponiveis.every(p => p.ativo && p.emEstoque));
    assert.ok(!disponiveis.some(p => p.id === '2')); // Esgotado
    assert.ok(!disponiveis.some(p => p.id === '4')); // Inativo
  });

  // Prova a AC-2: Filtra produtos por categoria
  it('AC-2: deve filtrar produtos disponíveis pela categoria selecionada', () => {
    const pipocas = filtrarPorCategoria(mockCatalogo, 'pipocas');
    assert.equal(pipocas.length, 1);
    assert.equal(pipocas[0].id, '1');
    assert.equal(pipocas[0].nome, 'Pipoca Grande');
  });

  // Prova a AC-3: Combos exibem os itens inclusos e detalhes
  it('AC-3: combo deve listar os itens individuais correspondentes', () => {
    const combo = mockCatalogo.find(p => p.id === '5')!;
    const detalhes = obterDetalhesCombo(combo, mockCatalogo);

    assert.equal(detalhes.itens.length, 2);
    assert.deepEqual(detalhes.itens.map(i => i.id), ['1', '3']);
  });
});
