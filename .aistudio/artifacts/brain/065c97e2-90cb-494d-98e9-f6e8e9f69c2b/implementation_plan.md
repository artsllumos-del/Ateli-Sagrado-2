# Reestruturação do Núcleo Financeiro & Refinamento Visual do Ateliê Sagrado ERP

Reestruturação arquitetural e visual para transformar o sistema em uma experiência SaaS premium, limpa e funcional, eliminando modais em favor de telas próprias com retorno consistente, simplificando o módulo financeiro para focar exclusivamente nas rotinas gerenciais essenciais (Entradas, Saídas, Contas a Pagar e Receber) e adicionando botão universal de Home.

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> As seguintes escolhas de arquitetura e experiência foram validadas na etapa de alinhamento prévio:
> - **Eliminação de Modais**: Operações de criação e edição agora utilizam telas dedicadas de página inteira (sub-views) com cabeçalho limpo e botão funcional de "Voltar ao Início/Listagem".
> - **Escopo do Núcleo Financeiro**: Remoção de funcionalidades experimentais e excessivas (simuladores hipotéticos complexos, drops de OCR não essenciais, conciliação redundante) para concentrar o núcleo em 4 pilares gerenciais sólidos: **Visão Geral/Fluxo de Caixa (Entradas & Saídas)**, **Contas a Pagar** e **Contas a Receber**.
> - **Botão de Home Universal**: Implementação de um botão flutuante acessível e elegante presente em todas as páginas do sistema para retorno instantâneo ao Dashboard principal.
> - **Confiabilidade Total de Ações**: Todos os botões (Excluir, Restaurar, Voltar, Ajustar, Baixar Parcela) com handlers reais, validações e feedback de Toast sem loops ou travamentos.

---

## 1. Visão Geral e Conceito do Negócio

- **Objetivo**: Proporcionar ao artesão e gestor do ateliê sacro uma interface sem atrito, livre de poluição visual, sem excesso de rolagem vertical ou blocos desconexos.
- **Público-Alvo**: Gestores de ateliês sacros, ourives, montadores de terços e artigos religiosos que precisam de clareza imediata sobre receitas, custos e fluxo financeiro em celulares e desktops.
- **Valor Agregado**:
  - Eliminação de modais sobrepostos que quebram o fluxo e dificultam o uso em telas móveis e tablets.
  - Eliminação de "blocos soltos" e padronização absoluta de bordas, raios (`rounded-2xl`), espaçamentos (`gap-4`, `p-5`) e fontes (`Geist` para interface, `Geist Mono` para números e moedas).
  - Controle cirúrgico do fluxo de caixa: saber exatamente o que entrou, o que saiu, o que vence hoje e o que está provisionado.

---

## 2. Experiência do Usuário & Design Visual

### A. Navegação Sem Modais (Sub-Views com Retorno Próprio)
Cada ação de registro possui agora um ciclo claro:
1. **Listagem / Gestão**: Tabela e cards responsivos, filtros rápidos, botão de ação primária ("Nova Entrada/Saída", "Nova Conta a Pagar", "Nova Conta a Receber").
2. **Sub-View de Cadastro / Edição**:
   - Cabeçalho padronizado com botão `< Voltar para o Financeiro`.
   - Card unificado centralizado com formulário organizado em seções lógicas:
     - Informações da Transação (Tipo, Categoria, Contato/Fornecedor/Cliente).
     - Valores e Condições (Valor R$, Data de Vencimento/Emissão, Forma de Pagamento, Parcelamento).
     - Observações e Identificação (Documento/Comprovante, Anotações).
   - Barra de ações no rodapé com botão secundário "Cancelar / Voltar" e primário "Salvar Transação".
3. **Retorno Seguro**: Ao salvar ou cancelar, o usuário retorna à listagem com preservação de estado e toast explicativo.

### B. Botão Flutuante Universal "Home"
- Localizado no canto inferior da viewport (com z-index elevado, respeitando a barra mobile inferior).
- Design discreto e sofisticado: botão circular com acabamento escuro/dourado (`bg-ink-900 text-white shadow-lg border border-amber-500/30`), ícone de Início (`Home`) e microinteração de elevação ao toque/hover.
- Ação imediata: navega diretamente para o `DashboardView` a partir de qualquer ponto do aplicativo.

### C. Simplificação Radical do Núcleo Financeiro
O componente `FinancialView.tsx` será refatorado e enxugado para 3 abas essenciais e responsivas:
1. **Fluxo de Caixa (Visão Geral)**:
   - Resumo financeiro limpo (Saldo Atual, Entradas do Mês, Saídas do Mês, Resultado Operacional).
   - Gráfico de tendência mensal simplificado e compacto (sem poluição visual).
   - Tabela unificada de lançamentos com filtros rápidos (Todas, Entradas, Saídas) e paginação.
2. **Contas a Pagar**:
   - Gestão de compromissos com fornecedores de pérolas, metais e custos fixos.
   - Status claro: Pendente, Pago, Em Atraso.
   - Ação de quitação imediata ou exclusão com confirmação em página/diálogo seguro.
3. **Contas a Receber**:
   - Cobranças de pedidos e restaurações.
   - Integração com chaves PIX reais e baixa rápida de recebimento.

---

## 3. Decisões de Arquitetura e Trade-Offs

- **Sub-Views Internas vs. Roteador Externo**:
  - *Abordagem*: Gerenciamento de estado de tela dentro de `FinancialView` (`screen: 'list' | 'create_transaction' | 'create_payable' | 'create_receivable' | 'edit_transaction'`).
  - *Por que*: Mantém compatibilidade instantânea com o Vite SPA existente, preserva o contexto sem recarregamento da página, garante que o botão "Voltar" retorne exatamente à aba e filtros ativos sem perda de dados.
- **Remoção de Módulos Hipotéticos**:
  - *Abordagem*: Descontinuar simuladores abstratos de elasticidade de preços e uploaders complexos que geravam scroll interminável.
  - *Por que*: O ateliê necessita de controle factual de faturamento, liquidez e pontualidade de pagamentos, com alinhamento pixel-perfect e alta densidade de informação útil.
- **Consolidação de Tipografia e Bordas**:
  - *Abordagem*: Substituição de classes dispersas por tokens consolidados (`border-[rgba(42,36,32,0.08)]`, tipografia tabular `tabular-nums font-mono` para valores monetários, cabeçalhos `font-sans font-bold`).

---

## 4. Arquitetura Técnica & Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                               AppShell                                 │
│  ┌──────────────┐ ┌─────────────────────────────────────────────────┐  │
│  │   Sidebar    │ │  Topbar (Header) + Breadcrumbs & Contexto       │  │
│  │   (Desktop)  │ ├─────────────────────────────────────────────────┤  │
│  │              │ │  Viewport Dinâmica (Max 1600px, sem scroll duplo)│  │
│  │              │ │                                                 │  │
│  │              │ │  ┌───────────────────────────────────────────┐  │  │
│  │              │ │  │             FinancialView                 │  │  │
│  │              │ │  │  ┌─────────────────────────────────────┐  │  │  │
│  │              │ │  │  │ PageHeader & Seletor de 3 Abas      │  │  │  │
│  │              │ │  │  │ [Fluxo de Caixa | A Pagar | Receber]│  │  │  │
│  │              │ │  │  └─────────────────────────────────────┘  │  │  │
│  │              │ │  │  ┌─────────────────────────────────────┐  │  │  │
│  │              │ │  │  │ Modo Listagem OU Sub-tela Cadastro  │  │  │  │
│  │              │ │  │  │ (com cabeçalho e botão 'Voltar')    │  │  │  │
│  │              │ │  │  └─────────────────────────────────────┘  │  │  │
│  │              │ │  └───────────────────────────────────────────┘  │  │
│  │              │ └─────────────────────────────────────────────────┘  │
│  └──────────────┘ ┌─────────────────────────────────────────────────┐  │
│                   │ Floating Home Button (Acesso Instantâneo)       │  │
│                   └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Plano Passo a Passo de Execução

1. **Botão Flutuante Home no `AppShell`**:
   - Inserir botão de retorno ao Dashboard fixo, elegante, acessível por teclado e touch (`44x44px`), com posicionamento adaptativo (evitando sobrepor a barra de navegação mobile).
2. **Refatoração Estrutural de `FinancialView.tsx`**:
   - Remover abas redundantes (`simulator`, `reconciliation`, `gateway` desnecessário).
   - Manter 3 abas essenciais com layout 100% responsivo: `dashboard` (Fluxo de Caixa), `payables` (Contas a Pagar) e `receivables` (Contas a Receber).
   - Eliminar os modais `showAddModal` em favor de sub-telas dedicadas:
     - `screen === 'new_transaction'`: tela cheia com formulário de lançamento e botão Voltar.
     - `screen === 'new_payable'`: tela cheia de cadastro de despesa/boleto com botão Voltar.
     - `screen === 'new_receivable'`: tela cheia de cobrança com botão Voltar.
3. **Harmonização de Bordas, Fontes e Espaçamentos**:
   - Unificar todas as bordas com a paleta semântica do design system.
   - Ajustar todos os números monetários para `tabular-nums font-mono`.
   - Limpar blocos soltos e reduzir altura de cards para eliminar scroll vertical excessivo.
4. **Verificação Completa de Ações de Botões**:
   - Testar e garantir funcionamento de todos os botões de ação: Excluir, Restaurar, Quitar, Filtrar, Voltar e Salvar.
5. **Compilação e Verificação em Servidor**:
   - Executar `compile_applet` e `lint_applet` garantindo zero erros.
