# Ateliê Sagrado ERP — Integração Global, Consistência de Dados e Preparação para Produção

Plano mestre para consolidação do sistema como uma plataforma ERP coesa, consistente e pronta para produção, unificando a fonte única da verdade entre servidor e cliente, integrando módulos de estoque, vendas, produção e financeiro, limpando integralmente dados de demonstração e garantindo isolamento multi-tenant real.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Arquiteturais Confirmadas na Fase 1:**
> - **Limpeza Imediata de Dados de Demonstração**: Todos os dados pré-existentes de teste, itens mockados e lançamentos fictícios serão expurgados do banco de dados e do código. Novas contas e organizações iniciam em estado 100% limpo, com zero operações fantasmas e onboarding guiado.
> - **Fonte Única da Verdade**: A API Centralizada do Servidor (`server.ts` + persistência resiliente) atua como fonte primária da verdade, com o `DbContext` do frontend sincronizando e mantendo cache offline seguro, eliminando divergências entre telas.
> - **Baixa de Estoque Imediata**: A dedução física e rastreável dos insumos de matéria-prima ocorre imediatamente no momento da **aprovação do pedido de venda** (ou conversão de orçamento aprovado em pedido), com validação de saldo e histórico de movimentação.

---

## 1. Visão Geral e Conceito do Negócio

- **O que faz**: O Ateliê Sagrado ERP é uma plataforma especializada de gestão operacional e financeira para ateliês de arte sacra, ourivesaria devocional e confecção de artigos religiosos (terços artesanais, crucifixos, imagens e restaurações).
- **Público-Alvo**: Mestres artesãos, ourives, gestores de pequenos e médios ateliês, equipes de atendimento comercial e operadores de produção em bancada.
- **Valor Agregado**:
  - Eliminação de retrabalho manual e planilhas paralelas entre atendimento, bancada e contas.
  - Sincronização em tempo real: uma venda confirmada gera contas a receber, reserva/baixa insumos no estoque e abre ordem de serviço na produção.
  - Números e dashboards 100% factuais, sem métricas arbitrárias ou simulações infladas.

---

## 2. Experiência do Usuário & Design Visual

### A. Fluxos do Usuário

1. **Onboarding / Criação de Conta Limpa**:
   - Registro de nova organização com dados institucionais reais (Razão Social, CNPJ/CPF, WhatsApp, endereço).
   - O primeiro usuário torna-se Administrador Titular com todas as permissões liberadas.
   - O Dashboard abre com indicadores zerados e cartões de "Primeiros Passos" orientando o cadastro de insumos e clientes.
2. **Ciclo Comercial Integrado**:
   - Cadastro de cliente $\rightarrow$ Elaboração de orçamento com cálculo de margem e composição $\rightarrow$ Aprovação do cliente.
   - A aprovação converte o orçamento em Pedido de Venda:
     - Baixa automática dos insumos consumidos daquele produto no estoque.
     - Criação automática dos lançamentos em Contas a Receber (com parcelas e vencimentos).
     - Geração da Ordem de Produção / Tarefa de Bancada para o operador designado.
3. **Ciclo de Compras e Contas a Pagar**:
   - Entrada de insumo de fornecedor $\rightarrow$ Atualização de saldo em estoque e custo médio ponderado $\rightarrow$ Lançamento automático em Contas a Pagar.
   - Baixa do pagamento gera registro no Fluxo de Caixa / Extrato com conciliação.
4. **Dashboard Dinâmico e Factural**:
   - Todos os KPIs (Receitas, Despesas, Pedidos Ativos, Alertas de Estoque Mínimo) refletem estritamente as transações do banco de dados no período selecionado, sem valores artificiais.

### B. Identidade Visual e Padrões de Interface

- **Direção Estética**: Utilitária, refinada e sóbria para artesanato sacro e ourivesaria de luxo. Sem "AI slop", sem gradientes roxos genéricos e sem falsos painéis de telemetria.
- **Paleta de Cores (60-30-10)**:
  - *60% Fundo*: Tela neutra limpa (`#FBFBFB` no tema claro / `#0C0A09` no tema escuro).
  - *30% Superfícies Estruturais*: Cards limpos com bordas ultrafinas (`border border-neutral-200/80 dark:border-neutral-800`), sem empilhamento excessivo de cards dentro de cards.
  - *10% Acentos*: Dourado nobre sacro (`#D4AF37` / `#B45309`) para CTAs primários e destaques de ação.
- **Tipografia e Disciplina Tabular**:
  - Títulos e Navegação: `Plus Jakarta Sans` ou display limpo.
  - Dados Financeiros, Quantidades e Timestamps: `font-mono tabular-nums` para alinhamento vertical rigoroso de centavos e quantidades.
  - Eliminação de "Pill Sandwiches": Metadados com separadores tipográficos sutis (`·`), sem cápsulas estáticas multicoloridas.
- **Feedback Interativo**:
  - Estados de Carregamento estruturados (skeletons proporcionais).
  - Estados Vazios informativos com botão direto de criação primária ("Cadastrar Primeiro Material", "Novo Orçamento").
  - Toasts de feedback claros para todas as mutações e validações de formulário.

---

## 3. Decisões de Arquitetura e Trade-Offs

- **Decisão 1: Sincronização Híbrida com API do Servidor como Fonte Única**
  - *Abordagem*: O backend Express (`server.ts` operando sobre `data/database.json` criptografado) armazena todas as entidades com integridade referencial e isolamento de tenant. O `DbContext` do cliente atua como cliente API reativo com sincronização instantânea e cache offline de contingência.
  - *Por que*: Centraliza regras de negócio críticas (baixa atômica de estoque, conversão de pedidos, geração de duplicatas a receber) no servidor, prevenindo descompassos quando o usuário utiliza múltiplos dispositivos ou recarrega a página.
- **Decisão 2: Expurgamento Total dos Registros Sementes de Demonstração**
  - *Abordagem*: Limpar todas as listas estáticas mockadas em `database.json` e remover os arrays hardcoded de clientes, materiais e pedidos de teste do `DbContext.tsx`. O banco inicializa vazio, contendo apenas o schema seguro e os dados da organização cadastrada.
  - *Por que*: Elimina o risco de pedidos e transações fictícias se misturarem com a contabilidade real do ateliê ou poluírem os relatórios fiscais.
- **Decisão 3: Baixa de Matéria-Prima com Verificação Preventiva de Saldo**
  - *Abordagem*: Na aprovação do pedido, a rotina confere se há quantidade suficiente de cada insumo da composição do produto. Se houver déficit, o sistema notifica o usuário mas permite opção de prosseguir com registro de alerta de estoque crítico, registrando a movimentação no histórico do material.

---

## 4. Arquitetura Técnica & Diagrama de Dados

### Diagrama do Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ATELIÊ SAGRADO ERP                            │
│                                                                        │
│  ┌─────────────────────── FRONTEND (REACT 19) ───────────────────────┐  │
│  │                                                                   │  │
│  │  AppShell (Layout Desktop & Mobile)                               │  │
│  │  ├── Topbar (Organização Ativa, Perfil, Busca, Notificações)     │  │
│  │  ├── Sidebar (Navegação Canônica entre Módulos)                  │  │
│  │  └── Viewport:                                                   │  │
│  │      ├── DashboardView (KPIs Factuais, Gráficos Reais)            │  │
│  │      ├── ClientsView (Clientes PF/PJ com Dados LGPD)              │  │
│  │      ├── InventoryView (Estoque, Materiais, Lotes & Alertas)      │  │
│  │      ├── ProductsView & PricingView (Ficha Técnica & Composição)  │  │
│  │      ├── QuotesView & OrdersView (Funil Comercial Integrado)      │  │
│  │      ├── ProductionView (Ordens de Serviço em Bancada)            │  │
│  │      ├── FinancialView (Fluxo de Caixa, A Pagar, A Receber)       │  │
│  │      └── SettingsView & SubscriptionBillingView (Admin & Planos)  │  │
│  │                                                                   │  │
│  │  DbContext (Reativo, Cache Seguro, Sincronização com API)        │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
│                                     │ Requisições REST / JSON           │
│                                     │ Header: x-tenant-id               │
│                                     ▼                                   │
│  ┌────────────────────── BACKEND (EXPRESS TS) ───────────────────────┐  │
│  │                                                                   │  │
│  │  Middlewares: Auth JWT, Multi-Tenant Boundary, Rate Limit, LGPD  │  │
│  │  Controladores e Regras de Negócio:                               │  │
│  │  ├── Conversão Orçamento -> Pedido -> Baixa Estoque               │  │
│  │  ├── Liquidação de Contas a Receber/Pagar -> Fluxo de Caixa       │  │
│  │  └── Cálculo Consolidado de Margem, Custo Médio e KPIs           │  │
│  │                                                                   │  │
│  │  Persistência Centralizada: `data/database.json`                  │  │
│  │  (Idempotente, Isolado por Tenant, Criptografia AES-256)          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Relacionamentos e Entidades Principais

- **Tenant / Organização**: Isolador principal (`id`, `name`, `cnpj`, `planId`).
- **Insumo / Material (`InventoryItem`)**: `id`, `tenantId`, `name`, `code`, `quantity`, `minQuantity`, `unitValue`, `supplierId`.
- **Produto Acabado (`Product`)**: `id`, `tenantId`, `sku`, `sellingPrice`, `composition: [{ materialId, quantity, cost }]`.
- **Orçamento (`Quote`)**: `id`, `tenantId`, `clientId`, `items`, `total`, `status: 'draft' | 'sent' | 'approved' | 'rejected' | 'converted'`.
- **Pedido de Venda (`Order`)**: `id`, `tenantId`, `quoteId?`, `clientId`, `items`, `totalValue`, `status: 'pending' | 'approved' | 'production' | 'completed' | 'canceled'`.
- **Ordem de Produção (`ProductionTask`)**: `id`, `orderId`, `productId`, `responsible`, `status`.
- **Contas a Receber (`AccountReceivable`)**: `id`, `orderId?`, `clientId`, `amount`, `receivedAmount`, `status: 'pending' | 'received' | 'overdue'`.
- **Contas a Pagar (`AccountPayable`)**: `id`, `supplierName`, `amount`, `paidAmount`, `dueDate`, `status: 'pending' | 'paid' | 'overdue'`.
- **Transação de Caixa (`FinancialTransaction`)**: `id`, `type: 'income' | 'expense'`, `value`, `date`, `category`, `paymentMethod`.

---

## 5. Fases de Execução da Refatoração

1. **Fase 1 — Limpeza Estrutural de Dados de Teste**:
   - Esvaziar listas de demonstração em `data/database.json`.
   - Limpar dados sementes estáticos em `DbContext.tsx`, mantendo templates vazios consistentes e estrutura de primeiro acesso.
2. **Fase 2 — Unificação da Fonte da Verdade no Servidor e Cliente**:
   - Ajustar endpoints do servidor para garantir sincronização de ponta a ponta (`/api/sync`, `/api/orders`, `/api/quotes`, `/api/inventory`, `/api/financial`).
   - Refatorar métodos de mutação do `DbContext` para persistir diretamente no backend antes de atualizar o estado local.
3. **Fase 3 — Automação do Ciclo Comercial $\rightarrow$ Estoque $\rightarrow$ Financeiro**:
   - Integrar rotina de aprovação do pedido:
     - Dedução dos insumos da composição no estoque.
     - Registro de movimentação no extrato de estoque.
     - Criação do título a receber no módulo financeiro.
     - Criação da tarefa na bancada de produção.
   - Tratar cancelamento de pedido: estorno de títulos não pagos e re-estorno de estoque quando aplicável.
4. **Fase 4 — Revisão do Dashboard e Indicadores Factuais**:
   - Recalcular todos os widgets (Total Vendido, Recebido, A Receber, A Pagar, Saldo em Caixa, Alertas de Estoque) exclusivamente com base nos registros do tenant autenticado no período ativo.
   - Fornecer estados vazios elegantes e amigáveis para contas recém-criadas.
5. **Fase 5 — Verificação, Testes e Homologação**:
   - Rodar testes automatizados de cálculo financeiro (`npm test`).
   - Executar validação de tipos e lint (`npm run lint` / `compile_applet`).
   - Testar o fluxo completo de cadastro de cliente, produto, orçamento, venda, baixa de estoque e liquidação financeira.
