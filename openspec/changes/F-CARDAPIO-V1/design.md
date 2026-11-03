# Design Técnico: F-CARDAPIO-V1

* **Feature:** `F-CARDAPIO-V1`
* **Padrão Arquitetural:** TypeScript Domain Entities com tipagem estrita

---

## 1. Modelos de Dados & Schemas

```typescript
export interface Produto {
  id: string;
  nome: string;
  categoria: 'pipocas' | 'bebidas' | 'doces' | 'combos';
  precoCentavos: number;
  ativo: boolean;
  emEstoque: boolean;
  itensCombo?: string[]; // IDs dos itens inclusos se for combo
}
```

---

## 2. Decisões de Implementação
* Valores monetários manipulados inteiramente em centavos (`precoCentavos: number`) para evitar erros de ponto flutuante.
* Funções de filtragem puras e sem efeitos colaterais.
