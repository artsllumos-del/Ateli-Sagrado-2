# Ateliê Sagrado ERP - Especificações Completas do Projeto & Cenários de Teste E2E

Este documento consolida a arquitetura completa, mapeamento detalhado de todos os módulos, regras de negócio refinadas, motores de cálculo e especificações técnicas de teste de ponta a ponta (E2E) para o ERP de alta costura e joalheria sacra do **Ateliê Sagrado**.

---

## 1. Diretrizes Visuais & Princípios de Design (Design System)

*   **Paleta de Cores (Luxo Silencioso)**:
    *   **Fundo Geral (`bg-bg-app`)**: Off-white suave (`#FFFDF9`) trazendo uma estética de galeria de arte ou ateliê clássico.
    *   **Destaque Sagrado (`text-gold-600` / `bg-gold-500` / `#D4AF37`)**: Dourado/âmbar sagrado que representa a majestade das joias, ornamentos sacros e pérolas.
    *   **Textos & Títulos (`text-ink-900`)**: Carvão profundo (`#2A2420`) substituindo o preto puro por uma legibilidade suave e sofisticada.
*   **Ausência de Bordas Fortes**: O projeto prioriza **profundidade tridimensional e sombras sutis** (`shadow-xs` para estados normais, `shadow-md` para elevações interativas). Divisores usam linhas com opacidade baixíssima (`rgba(42,36,32,0.04)`) para evitar poluição visual.
*   **Arredondamento de Bordas**: Todos os contêineres e cartões estruturais adotam cantos confortáveis (`rounded-xl` com `16px` de raio, `rounded-2xl` ou `rounded-[24px]` para seções maiores).
*   **Micro-Interações**: Elementos clicáveis respondem ao cursor do mouse com sutil elevação física e ganho de nitidez de sombra (`hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`).

---

## 2. Estrutura de Sincronização & Persistência de Dados

O ERP compartilha um contexto de dados centralizado em `/src/context/DbContext.tsx`, sincronizado de forma transparente e persistido localmente no `localStorage` do navegador do usuário utilizando chaves com prefixo estruturado:

*   `as_clients`: Cadastro completo de clientes (PF/PJ), endereços e preferências.
*   `as_inventory`: Controle físico e financeiro de matérias-primas e insumos litúrgicos.
*   `as_products`: Catálogo de produtos com fichas técnicas de composição detalhadas.
*   `as_quotes`: Orçamentos comerciais emitidos, snapshot da empresa e histórico.
*   `as_orders`: Pedidos de venda com trilhas cronológicas individuais de eventos.
*   `as_production_tasks`: (Auxiliar) Tarefas operacionais derivadas.
*   `as_transactions`: Registro contábil consolidado de receitas e despesas.
*   `as_settings`: Variáveis globais do sistema, parâmetros de cálculo e informações de marca.
*   `as_notifications`: Inbox de alertas do sistema (estoque crítico, prazos de entrega).
*   `as_agenda_activities`: Compromissos diários integrados de reuniões, entregas e compras.
*   `as_audit_logs`: Registros cronológicos irreversíveis de ações sensíveis (audit trail).
*   `as_users`: Cadastro de operadores administrativos e artesãos do sistema.

---

## 3. Mapeamento Detalhado de Módulos & Funcionalidades

### A. Autenticação & Portão de Acesso (`AuthView.tsx`)
*   **Propósito**: Impede o acesso não autorizado de terceiros aos segredos de negócio e valores financeiros do ateliê.
*   **Lógica de Credenciais**:
    *   **Administrador**: Usuário `Admin` (ou `admin@atelie.com`), senha `301310Lr`. Desbloqueia todas as abas e painéis do ERP.
    *   **Vendedor**: Usuária `Rosana` (ou `rosana@atelie.com`), senha `123456`. Restringe visualização de produção e abas financeiras (com base na matriz de permissões).
*   **Controles**: Campo de visualização de senha com alternância (`Eye`/`EyeOff`), login rápido por cartões pré-configurados e persistência duradoura de sessão no navegador (`as_user`).

### B. Painel Executivo & Customização de Widgets (`DashboardView.tsx`)
*   **Propósito**: Centralizar a saúde financeira, operacional e o status de faturamento do ateliê em tempo real.
*   **Lógica de KPI Dinâmico**:
    *   **Faturamento Mensal**: Soma consolidada de pedidos de venda (`Order`) ativos com status de pagamento `Pago` ou entradas financeiras registradas no mês corrente.
    *   **Lucro Líquido Estimado**: Faturamento total bruto deduzido dos custos diretos de materiais (fórmula baseada na composição técnica) e tempo de mão de obra.
    *   **Peças Concluídas**: Total de itens de pedidos concluídos no mês ou tarefas operacionais terminadas.
    *   **Horas Reais Trabalhadas**: Tempo acumulado ativo em ordens em fabricação (conversão em horas reais de trabalho calculadas pelo tempo estimado dos produtos vendidos).
*   **Personalizador de Widgets**: Modal interativo que permite reordenar, ocultar ou fixar cartões de KPIs e módulos (Alertas, KPIs, Kanban de Produção, Receitas/Despesas, Produtos mais Vendidos, Metas e Agenda do Dia).
*   **Banner de Boas-Vindas Configurável**: Opção de alterar o título do banner superior do Dashboard, subtítulo e imagem decorativa, persistindo a identidade desejada pela gestora.
*   **Agenda do Dia Integrada**: Lista cronológica de compromissos com filtros rápidos (Pendentes, Concluídas, Todas) e checkbox para marcar conclusão, disparando notificações visuais automáticas.

### C. Controle de Insumos & Valorização Patrimonial (`InventoryView.tsx`)
*   **Propósito**: Cadastrar meticulosamente gemas, metais preciosos, tecidos litúrgicos, contas e embalagens.
*   **Funcionalidades Específicas**:
    *   **Métricas de Controle**: Exibe o Valor Total Consolidado das matérias-primas no estoque e indica alertas visuais chamativos (laranja/vermelho) para itens abaixo da quantidade mínima configurada.
    *   **Modal de Ajuste Manual**: Permite adicionar ou remover unidades do estoque especificando o motivo (correção de balanço, refugo de produção, compra adicional), operador responsável e valor de custo atualizado do lote.
    *   **Geração Financeira Automática**: Ajustes positivos que configurem nova compra disparam automaticamente uma despesa contábil no fluxo de caixa no nome do fornecedor especificado.

### D. Planejador de Compras Necessárias (`PurchasesView.tsx`)
*   **Propósito**: Motor inteligente que orienta e automatiza compras de insumos para evitar paralisações no chão de fábrica.
*   **Algoritmo de Cálculo de Falta Real (Shortfall)**:
    1.  Varre todos os Pedidos de Venda em andamento que ainda não estejam marcados como `completed` (Concluídos).
    2.  Busca as receitas dos produtos pertencentes a esses pedidos ativos para calcular o somatório da demanda bruta de cada insumo.
    3.  Subtrai o saldo de estoque físico disponível atual:
        $$\text{Falta Real} = \max(0, \text{Demanda Requerida para Pedidos Ativos} - \text{Quantidade Disponível})$$
    4.  Apresenta a listagem clara apenas das matérias-primas em falta com o respectivo custo estimado de aquisição.
*   **Compra Rápida de Reposição**: Botão que possibilita realizar a aquisição imediata da quantidade exata faltante com um clique. A ação atualiza o estoque físico de insumos e cria um lançamento automático de débito no módulo financeiro.

### E. Ficha Técnica de Composição (`ProductsView.tsx`)
*   **Propósito**: Cadastrar produtos acabados e estruturar a sua "receita" de fabricação (composição quantitativa de matérias-primas).
*   **Ficha de Composição**:
    *   Permite associar múltiplos insumos e as quantidades necessárias (ex: `0.6 pacote` de pérolas, `1` crucifixo folheado, `5 metros` de fio de alpaca).
    *   Calcula dinamicamente na tela o **Custo Industrial de Materiais** somando a multiplicação das frações usadas pelos preços unitários atuais de aquisição do estoque.
    *   Registra o tempo estimado de produção em minutos e o código SKU exclusivo.

### F. Motor de Precificação Interativo (`PricingView.tsx`)
*   **Propósito**: Simulador analítico e iterativo para encontrar o preço ideal de venda de peças de luxo.
*   **Fórmulas Matemáticas Integradas**:
    *   **Custo de Perda**: Adiciona margem de segurança contra desperdício ou refugo operacional (padrão de $5\%$ sobre materiais):
        $$\text{Custo de Perda} = \text{Custo de Materiais} \times 0.05$$
    *   **Custo de Mão de Obra**: Converte o tempo de fabricação estimado em custo monetário real com base no valor da hora de trabalho parametrizado nas configurações:
        $$\text{Custo de Mão de Obra} = \left(\frac{\text{Tempo de Produção em Minutos}}{60}\right) \times \text{Valor da Hora de Trabalho}$$
    *   **Custo Base de Fabricação**: Consolida os gastos diretos e indiretos:
        $$\text{Custo Base} = \text{Custo de Materiais} + \text{Custo de Perda} + \text{Custo de Mão de Obra} + \text{Custos Indiretos Configuráveis}$$
    *   **Markup da Margem de Lucro Desejada**: Calcula o preço de venda sugerido para atingir a margem ideal utilizando o controle deslizante (slider) interativo de margem:
        $$\text{Preço Sugerido} = \frac{\text{Custo Base} + \text{Tarifas de Canais (Pix: } 0\%, \text{ Cartão: } 4.5\%, \text{ Marketplace: } 12\%)}{1 - \left(\frac{\text{Margem Alvo \%}}{100}\right)}$$
    *   **Override de Preço Manual**: Campo de texto para estipular o preço final comercial desejado. O sistema recalcula instantaneamente a Margem Líquida Real obtida e o Lucro Real gerado na simulação se o preço manual for adotado.
*   **Aplicação Instantânea**: Botão "Aplicar ao Produto" salva o preço calculado e a estrutura de custos diretamente na ficha oficial de catálogo do produto selecionado.

### G. CRM & Dossiê Completo de Clientes (`ClientsView.tsx`)
*   **Propósito**: Cadastrar clientes, centralizar históricos de relacionamento e integrar dados geográficos.
*   **Funcionalidades de CRM**:
    *   **Dossiê Inteligente**: Ao clicar sobre um cliente, abre-se um painel de inteligência comercial consolidando o LTV (Lifetime Value), ticket médio de compra, anotações de preferências litúrgicas personalizadas, e o histórico discriminado de todos os pedidos efetuados pelo cliente no ateliê.
    *   **Autocomplete de Endereços**: Campo CEP integrado ao digitar os 8 dígitos, o sistema executa uma simulação rápida de geolocalização e preenche automaticamente os campos de Logradouro, Bairro, Cidade e Estado. Suporta o cadastro de múltiplos endereços (Principal, Entrega, Faturamento) por cliente.

### H. Simulador de Orçamentos & Advisor de Insumos (`QuotesView.tsx`)
*   **Propósito**: Criar propostas comerciais detalhadas, testando a viabilidade de estoque antes do fechamento.
*   **Advisor de Estoque Integrado**:
    *   Ao adicionar produtos em um orçamento, o sistema realiza uma varredura em tempo real nas fichas técnicas e compara a necessidade de matérias-primas contra o estoque livre disponível.
    *   Caso algum insumo seja insuficiente, o ERP exibe um painel de advertência destacado com o título **"Insumos Insuficientes"**, listando o nome e a quantidade exata de cada componente que falta para poder atender àquele orçamento.
*   **Duplicação e PDF**: Suporta a duplicação instantânea de orçamentos complexos e a exportação direta de uma proposta de alta qualidade em formato PDF utilizando a biblioteca `jsPDF`.
*   **Conversão Direta para Pedido (`convertToOrder`)**:
    *   Verifica fisicamente se o estoque suporta a conversão. Se houver falta, impede a conversão e exibe tela informativa.
    *   Se houver insumos suficientes, o orçamento é marcado como `converted`, as quantidades de matérias-primas correspondentes são **deduzidas definitivamente** do estoque, um novo Pedido de Venda ativo é gerado no status `received`, uma tarefa de produção correspondente é alocada e a receita do pedido é gerada de forma automática no módulo financeiro.

### I. Pedidos de Venda & Emissor de Recibos (`OrdersView.tsx`)
*   **Propósito**: Controlar o ciclo de venda, faturamento e entrega litúrgica do ateliê.
*   **Lógica de Operação**:
    *   **Faturamento Vinculado**: Permite registrar o pedido como Pago ou Pendente de Pagamento.
    *   **Geração de Fatura PDF**: Motor integrado via `jsPDF` que cria um recibo e termo de garantia litúrgica em PDF pronto para impressão de altíssimo nível, contendo o logotipo personalizado do Ateliê Sagrado, dados do cliente, itens comprados, termos de garantia permanente e assinatura da gestora configurada.
    *   **Compartilhamento WhatsApp**: Gera textos pré-formatados com os detalhes do pedido para facilitar a comunicação direta com os compradores com apenas um clique.

### J. Chão de Fábrica & Kanban de Produção (`ProductionView.tsx`)
*   **Propósito**: Acompanhar o fluxo de confecção artesanal dos pedidos de ponta a ponta sem planilhas externas.
*   **Kanban Físico de 7 Estágios**:
    *   As ordens de venda ativas fluem linearmente através das colunas:
        1.  `received` (**Pedido Recebido**): Entrada inicial do pedido no sistema.
        2.  `approved` (**Separação de Materiais**): Fase de agrupamento dos insumos necessários.
        3.  `production` (**Produção**): Trabalho ativo na bancada do artesão.
        4.  `finishing` (**Acabamento**): Polimento e detalhes finais da joia.
        5.  `packing` (**Embalagem**): Preparação da caixa de veludo e mimos.
        6.  `ready` (**Pronto para Entrega**): Liberação para despacho ou retirada.
        7.  `completed` (**Concluído**): Pedido faturado e entregue com sucesso ao cliente.
*   **Tratamento de Insumos**: Permite visualizar com um clique os insumos reservados e as quantidades de componentes necessárias para aquele pedido específico.
*   **Atribuição e Histórico de Arquivamento**:
    *   Permite atribuir o nome do artesão responsável por cada pedido através de um modal rápido.
    *   Pedidos que permaneçam no status `completed` por mais de 30 dias (ou que sejam arquivados manualmente pela gestora) são movidos automaticamente para a aba **"Histórico de Arquivados"**, limpando o quadro Kanban diário para melhorar a visibilidade e o desempenho do sistema. A aba de histórico fornece filtros detalhados de período (mensal, trimestral, anual, personalizado).

### K. Fluxo Financeiro, Conciliação OFX/CSV & What-If (`FinancialView.tsx`)
*   **Propósito**: Controlar o caixa do ateliê, simular cenários futuros e automatizar lançamentos bancários.
*   **Funcionalidades de Vanguarda**:
    1.  **Conciliação Assistida por IA**:
        *   Permite importar arquivos de extratos bancários nos formatos `.OFX` ou `.CSV` do banco da empresa.
        *   Compara os valores e datas do extrato com os pedidos de venda ou faturas de compras registrados no ERP.
        *   Sugere correspondências inteligentes de conciliação. O operador pode aceitar a correspondência e conciliar com um clique, atualizando o caixa oficial do ERP com o saldo real do banco.
    2.  **Mecanismo OCR de Cupons**:
        *   Permite arrastar e soltar (ou selecionar) imagens de notas fiscais ou comprovantes de insumos.
        *   O sistema executa uma varredura de dados por OCR simulado e preenche automaticamente o valor, data e categoria do lançamento de despesa, diminuindo erros humanos de digitação.
    3.  **Simulador de Cenários Financeiros (What-If)**:
        *   Permite ajustar controles deslizantes para simular cenários operacionais: Ajuste de Preço de Venda ($-30\%$ a $+50\%$), Custo de Matéria-Prima ($-20\%$ a $+100\%$), Produtividade da Mão de Obra e Taxa de Conversão de Orçamentos ($0\%$ a $100\%$).
        *   Apresenta gráficos interativos comparativos entre o Cenário Real Atual e o Cenário Simulado projetando o fluxo de caixa do ateliê.

### L. Central de Configurações, Segurança & Auditoria (`SettingsView.tsx`)
*   **Propósito**: Personalizar regras fiscais, taxas gerais, identidade visual e garantir a rastreabilidade contra fraudes.
*   **Painéis de Controle**:
    *   **Dados do Ateliê**: Cadastro do CNPJ, Razão Social, Logotipo em URL/Base64, Ícone Favicon, Endereço e Dados de contato da marca.
    *   **Motor de Precificação**: Parâmetros globais de cálculo como taxa de hora do artesão (padrão `R$ 25,00`), custos operacionais fixos de embalagem/depreciação, e margens ideais padrão.
    *   **Gestão de Operadores (Usuários)**: Criação, edição e exclusão de contas de operadores, definindo permissões cirúrgicas de acesso a cada aba do sistema.
    *   **Trilha de Auditoria Irreversível (Audit Log)**: Painel de segurança que exibe um log em tempo real de cada ação de alta sensibilidade no ERP (exclusão de transações, faturamento de pedidos, alteração de saldos de estoque, redefinição de fábrica), carimbando o usuário operador, data, hora exata e descrição do evento.
    *   **Zerar Sistema (Reset)**: Botão de manutenção de fábrica para limpar todo o cache local e retornar aos dados semente (seed).

---

## 4. Roteiros de Testes End-to-End (E2E) Detalhados

Estes roteiros guiam os testes automatizados ou auditorias humanas para comprovar o comportamento funcional ideal e integrado do ERP Ateliê Sagrado.

### Roteiro E2E 1: Fluxo de Precificação, Cadastro de Peça e Venda Direta
*   **Objetivo**: Garantir que as fórmulas matemáticas do motor de precificação recalculam o markup corretamente e alimentam o catálogo e pedidos sem divergências.
*   **Passos do Cenário de Teste**:
    1.  Efetue login como Administrador (`admin@atelie.com` / `301310Lr`).
    2.  Navegue até a aba **Estoque de Insumos**. Adicione um insumo com código `PER-NOIVA`, nome `Pérola Branca Prime (10mm)`, quantidade `150 unidades`, quantidade mínima `20`, e valor unitário `R$ 2,00`. Salve.
    3.  Navegue até a aba **Motor de Precificação**. No simulador de custos:
        *   Preencha o Nome do Produto como `Terço de Noiva Especial`.
        *   Tempo de Produção: `120 minutos`.
        *   Selecione o insumo `Pérola Branca Prime (10mm)` e digite a quantidade `50 unidades` para composição.
        *   Insira Custos Indiretos como `R$ 15,00`.
        *   Arraste o slider de Margem de Lucro Alvo para `100%`.
        *   Mude o Canal de Venda para `Pix` (tarifa `0%`).
    4.  **Validações Esperadas**:
        *   O Custo de Materiais deve ser computado como $50 \times \text{R\$ } 2,00 = \text{R\$ } 100,00$.
        *   O Custo de Perda ($5\%$) deve registrar `R$ 5,00`.
        *   O Custo de Mão de Obra deve registrar $2 \text{ horas} \times \text{R\$ } 25,00/\text{h} = \text{R\$ } 50,00$.
        *   O Custo Base de Fabricação deve ser $\text{R\$ } 100,00 + \text{R\$ } 5,00 + \text{R\$ } 50,00 + \text{R\$ } 15,00 = \text{R\$ } 170,00$.
        *   O Preço de Venda Sugerido para margem de $100\%$ (Markup 2x) deve ser exatamente `R$ 340,00`.
    5.  Clique em **"Aplicar ao Produto"** e escolha salvar como novo produto no catálogo.
    6.  Navegue para a aba **Produtos (Composição)** e confirme que o `Terço de Noiva Especial` consta na listagem pelo valor exato de `R$ 340,00`.
    7.  Vá em **Pedidos de Venda**, clique em **"Novo Pedido"**, selecione o cliente ativo `Ana Maria de Sousa` e adicione `2 unidades` do `Terço de Noiva Especial`. Defina o status do pedido como `received` e o status de faturamento como `Pago`. Salve o pedido.
    8.  Navegue ao **Painel Executivo (Dashboard)**.
    9.  **Validação de KPIs**: Certifique-se de que o KPI de **Faturamento Mensal** aumentou em `R$ 680,00` e o KPI de **Horas Trabalhadas** cresceu em exatas `4.0 horas` (120 min × 2 peças = 240 minutos).

### Roteiro E2E 2: Gestão de Falta de Insumos (Shortfall) e Entrada com Reflexo Financeiro
*   **Objetivo**: Validar a precisão contábil do motor de suprimentos e o lançamento automático de despesas ao repor insumos litúrgicos.
*   **Passos do Cenário de Teste**:
    1.  Vá até a aba **Estoque de Insumos**. Adicione um insumo chamado `Fio Metalizado Ouro Nobre`, código `FIO-OURO`, quantidade em estoque `2 rolos`, quantidade mínima `5`, e valor unitário `R$ 30,00`.
    2.  Navegue para a aba **Produtos (Composição)**. Clique em cadastrar ou editar o produto `Casula Sagrada Litúrgica` (ou crie um novo). Vincule em sua receita o insumo `Fio Metalizado Ouro Nobre` definindo o consumo de `5 rolos` por produto acabado. Salve.
    3.  Acesse **Pedidos de Venda**, crie um pedido de venda contendo `1 unidade` de `Casula Sagrada Litúrgica`. Salve.
    4.  Navegue até a aba **Compras Necessárias**.
    5.  **Validações Contábeis de Suprimentos**:
        *   Confirme se o insumo `Fio Metalizado Ouro Nobre` é listado na tabela de necessidades críticas.
        *   Valide se o sistema computou: Necessário = `5 rolos`, Disponível = `2 rolos`, Falta Real (Shortfall) = `3 rolos`.
        *   O Custo de Aquisição Projetado deve constar como exatamente `R$ 90,00` ($3 \text{ rolos} \times \text{R\$ } 30,00$).
    6.  Clique no botão **"Comprar Rápido"** ao lado da linha do insumo. Confirme a compra de `3 rolos` pelo valor de `R$ 90,00`.
    7.  Retorne à aba **Estoque de Insumos** e certifique-se de que o estoque atualizado do `Fio Metalizado Ouro Nobre` agora registra o saldo de **5 rolos** físicos.
    8.  Navegue até a aba **Fluxo Financeiro** (Transações) e certifique-se de que uma nova despesa de **R$ 90,00** foi lançada automaticamente na categoria de aquisição de insumos sob a conta de fornecedores.

### Roteiro E2E 3: Advisor de Estoque em Orçamentos, PDF e Conversão Direta
*   **Objetivo**: Garantir o funcionamento correto do motor de validação prévia de insumos, exportação de arquivos PDF e conversão automatizada em obrigações de faturamento.
*   **Passos do Cenário de Teste**:
    1.  Vá em **Estoque de Insumos**. Zere propositalmente a quantidade física de um insumo essencial como o `Crucifixo Clássico Folheado a Ouro`.
    2.  Acesse a aba **Orçamentos** e inicie a digitação de um novo orçamento para a `Paróquia Nossa Senhora da Paz`.
    3.  Adicione no orçamento `2 unidades` do produto `Terço de Noiva Imperial - Pérola de Água Doce` (produto que usa o crucifixo zerado em sua composição).
    4.  **Validação do Advisor**: Certifique-se de que o painel de alerta **"Insumos Insuficientes"** surge em destaque na tela, detalhando a escassez do `Crucifixo Clássico Folheado a Ouro`.
    5.  Acesse **Estoque de Insumos** e faça um ajuste de estoque manual somando `10 unidades` daquele crucifixo para regularizar o estoque.
    6.  Retorne ao orçamento em edição. Verifique se o alerta de insumos insuficientes desapareceu, atestando a reavaliação dinâmica em tempo real. Salve o orçamento.
    7.  Clique no botão de **Download PDF** do orçamento e confirme se o arquivo PDF é gerado sem erros de layout utilizando os dados semente da empresa.
    8.  Clique na ação de **"Converter para Pedido"**.
    9.  **Validações pós-conversão**:
        *   O status do orçamento deve mudar para `converted` (Convertido).
        *   Um novo pedido deve ser gerado automaticamente na aba de Pedidos de Venda.
        *   O saldo de crucifixos na aba de estoque deve ter sido deduzido em exatas **2 unidades** (saldo físico agora igual a 8).
        *   Uma entrada financeira correspondente ao valor total do orçamento convertido deve estar registrada de forma automatizada no fluxo de caixa.

### Roteiro E2E 4: Kanban de Produção (Chão de Fábrica) e Gestão de Arquivos
*   **Objetivo**: Validar a transição lógica dos pedidos de venda nas 7 raias do Kanban, vinculação de artesãos e arquivamento automatizado de dados produtivos.
*   **Passos do Cenário de Teste**:
    1.  Crie um novo pedido na aba de **Pedidos de Venda** para o cliente `Carlos Eduardo Santos` com status `received` (Pedido Recebido).
    2.  Acesse a aba **Chão de Fábrica**.
    3.  Certifique-se de que o cartão do pedido recém-criado consta na primeira coluna: **Pedido Recebido**.
    4.  Clique sobre a ação de definir responsável no cartão do pedido e atribua o nome da artesã como `Ana Paula (Artesã)`. Salve e certifique-se de que o nome da artesã passou a constar no corpo do cartão de produção.
    5.  Clique no botão de **Avançar Etapa** do cartão. O pedido deve transicionar para **Separação de Materiais**.
    6.  Clique sucessivas vezes no botão de avanço até mover o cartão para a última coluna: **Concluído**.
    7.  Navegue de volta para a aba **Pedidos de Venda** e verifique se o status do pedido correspondente foi atualizado automaticamente em tempo real para `completed` (Concluído).
    8.  Retorne à aba **Chão de Fábrica** e simule ou clique na ação de arquivamento para aquele pedido concluído.
    9.  Navegue até a aba **Histórico de Arquivados** (dentro do Chão de Fábrica) e valide se o pedido está presente lá, limpo do painel Kanban operacional ativo diário.

### Roteiro E2E 5: Conciliação Bancária por Extrato e Lançamento por OCR
*   **Objetivo**: Validar os módulos avançados de importação contábil e automatização de despesas no Fluxo Financeiro.
*   **Passos do Cenário de Teste**:
    1.  Navegue até a aba **Fluxo Financeiro** e selecione a sub-aba de **Conciliação Bancária**.
    2.  Clique na zona de carregamento de arquivos e selecione um arquivo de simulação contábil `.OFX` contendo lançamentos de teste.
    3.  A tabela de lançamentos bancários carregados deve aparecer listando transações pendentes de regularização com o caixa oficial do ERP.
    4.  Selecione um lançamento bancário de crédito (entrada) e clique para fazer o cruzamento assistido por inteligência comercial. O sistema deve sugerir relacionar aquela entrada contábil com um pedido de venda aberto correspondente.
    5.  Clique em **"Conciliar"**. Verifique se o lançamento bancário foi associado com sucesso e o saldo de conciliação do ateliê foi regularizado.
    6.  Acesse a aba de **Escaneamento OCR**. Carregue um cupom fiscal em formato de imagem de teste.
    7.  Verifique se o sistema processa a leitura por OCR e preenche automaticamente o formulário de despesa financeira, gerando uma experiência de lançamento rápido e seguro.

### Roteiro E2E 6: Configuração Inicial (Setup Gate) e Logs de Auditoria de Segurança
*   **Objetivo**: Validar o fluxo de inicialização segura do ERP e a trilha irrevogável de auditoria contra incidentes de manipulação de dados.
*   **Passos do Cenário de Teste**:
    1.  Navegue para a aba **Configurações** e vá na aba de sistema. Clique no botão de reset geral vermelho **"Zerar Todos os Dados"**.
    2.  O sistema deve ser completamente redefinido e o operador será deslogado de forma automática.
    3.  Faça login novamente utilizando a conta padrão de administrador.
    4.  Como o sistema está em estado "novo em folha", o ERP detectará `settings.firstSetup = true` e exibirá **apenas** a aba de **Configuração Inicial** na barra lateral. O restante da navegação estará bloqueado pelo setup gate.
    5.  Preencha todos os campos obrigatórios da empresa (Nome: `Ateliê Sagrado`, Nome Fantasia: `Ateliê Sagrado`, Logo: `📿` ou uma URL, Favicon: `📿`, Endereço completo e Telefone).
    6.  Clique em **"Salvar e Ativar Sistema"**.
    7.  **Validação do Gate**: Certifique-se de que a barra de navegação lateral (Sidebar) foi imediatamente liberada de forma responsiva, exibindo todos os 11 módulos operacionais ativos.
    8.  Navegue até a aba de **Configurações** e abra a sub-seção de **Trilha de Auditoria**.
    9.  Certifique-se de que há um registro irreversível carimbado com o usuário operador `Administrador`, carimbo de data e hora exata e a descrição: `Configurou os dados institucionais e ativou o sistema (primeiro setup concluído)`.

---

*Documento de especificações e roteiros E2E atualizado, revisado e homologado para a arquitetura real de produção do ERP Ateliê Sagrado.*
