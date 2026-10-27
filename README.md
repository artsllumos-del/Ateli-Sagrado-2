# Ateliê Sagrado ERP — Guia de Execução e Build Local

Sistema Integrado de Gestão (ERP) desenvolvido especificamente para ateliês de terços marianos, de noiva, joias devocionais e artigos sacros.

O projeto é **Full-Stack**, integrando:
- **Frontend SPA**: React 19, Vite 6, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons e Motion.
- **Backend & API**: Express 4 com middleware integrado do Vite em desenvolvimento e empacotamento Node.js em produção via `esbuild`.
- **Persistência de Dados**: Banco relacional multi-tenant com fallback em arquivo JSON estruturado em `data/database.json` com auto-seeding.
- **Segurança**: Criptografia AES-256 para campos sensíveis (LGPD) e autenticação JWT (Access + Refresh Token).

---

## 📋 Pré-requisitos para o Ambiente Local

Antes de iniciar, certifique-se de ter instalado em sua máquina:

1. **Node.js**: Versão `>= 18.0.0` (recomendado: Node.js 20 LTS ou 22 LTS).
   - Verifique sua versão com: `node -v`
2. **npm**: Versão `>= 9.0.0` (acompanha o Node.js).
   - Verifique sua versão com: `npm -v`
3. **Git**: Para clonar o repositório.

---

## 🚀 Passo a Passo: Instalação e Execução Local

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
```

### 2. Instalar as Dependências
Execute o comando abaixo para instalar todas as dependências de produção e desenvolvimento:
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie seu arquivo `.env` a partir do modelo de exemplo:
```bash
# No Linux/macOS:
cp .env.example .env

# No Windows (Command Prompt):
copy .env.example .env

# No Windows (PowerShell):
cp .env.example .env
```

Edite o arquivo `.env` caso queira customizar a porta (`PORT`), chaves de segurança (`JWT_SECRET`, `ENCRYPTION_KEY`) ou adicionar sua chave do Google AI Studio (`GEMINI_API_KEY`).

---

## 🛠️ Comandos Disponíveis (`npm scripts`)

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Full-Stack em modo desenvolvimento (Express + Vite middlewares) em `http://localhost:3000`. |
| `npm test` | Executa a suíte de 47 testes automatizados de precisão monetária (IEEE-754), juros, parcelas perfeitas, rateio de insumos e margens de lucro. |
| `npm run lint` | Executa a validação estática de tipos do TypeScript sem emitir código (`tsc --noEmit`). |
| `npm run build` | Compila o frontend com Vite em `dist/` e empacota o backend Node com `esbuild` em `dist/server.cjs`. |
| `npm start` | Inicia a aplicação empacotada em modo produção através do Node.js (`node dist/server.cjs`). |
| `npm run clean` | Limpa com segurança a pasta `dist/` e resíduos de build (compatível com Windows, macOS e Linux). |

---

## 💻 Rodando em Modo Desenvolvimento

Para rodar localmente com recarregamento rápido e API ativa:
```bash
npm run dev
```

Abra seu navegador em:
👉 **`http://localhost:3000`**

### Credenciais de Acesso Inicial (Seed)
Caso acesse a tela de login (`/login`), o banco de dados inicial já contém o usuário administrador pré-configurado:
- **E-mail**: `admin@atelie.com`
- **Senha**: `admin123`

---

## 🧪 Executando os Testes Automatizados

Para garantir que todas as regras de negócio de precificação sacra, arredondamento centavo-a-centavo e custeio médio ponderado móvel (CMP) estejam 100% íntegras:
```bash
npm test
```
*Resultado esperado: 47 testes aprovados (0 falhas).*

---

## 📦 Build e Execução para Produção Local

Para testar como a aplicação se comportará em um servidor de produção:

1. **Compilar a aplicação:**
   ```bash
   npm run build
   ```
   *Isso criará a pasta `dist/` com o HTML/CSS/JS minificados do frontend e o arquivo `dist/server.cjs` do backend.*

2. **Iniciar em modo produção:**
   ```bash
   npm start
   ```

3. Acesse `http://localhost:3000`. O servidor Express servirá os arquivos estáticos de `dist/` e responderá a todas as rotas de API (`/api/*`).

---

## 🌐 Implantação na Hostinger (Web App Node.js 22)

Para implantar no painel da **Hostinger** (hPanel ou cPanel Setup Node.js App):

1. **Versão do Node.js**: Selecione `Node.js 22.x` (LTS).
2. **Application Mode**: Selecione `Production`.
3. **Application Root**: Diretório raiz da sua aplicação (ex: `public_html` ou o diretório do seu domínio/subdomínio).
4. **Application Startup File (Entry File)**:
   - **`server.js`** (Recomendado — arquivo JavaScript na raiz do projeto).
   - *Alternativa direta suportada:* `dist/server.cjs`.
5. **Comando de Instalação de Dependências**:
   ```bash
   npm install
   ```
6. **Comando de Build (Compilação)**:
   ```bash
   npm run build
   ```
7. **Comando de Inicialização (Start)**:
   ```bash
   npm start
   ```
   *(Ou executado automaticamente pela Hostinger via `node server.js`).*

> **Nota de Compatibilidade**: O servidor detecta automaticamente se a porta fornecida via `process.env.PORT` é uma porta TCP numérica (ex: 3000) ou um socket Unix utilizado pelo Phusion Passenger da Hostinger/CloudLinux, assegurando compatibilidade total sem travamentos de inicialização.

---

## 📂 Estrutura do Projeto

```text
├── data/
│   └── database.json          # Banco de dados local em formato JSON (auto-criado e populado)
├── public/
│   └── assets/                # Imagens, mockups e assets estáticos
├── src/
│   ├── components/            # Componentes visuais do ERP e Landing Page
│   ├── domain/                # Regras de negócio, precificação e billing
│   ├── hooks/                 # Hooks React customizados
│   ├── types/                 # Definições de tipos TypeScript
│   ├── utils/                 # Funções utilitárias e financeiras testadas
│   ├── App.tsx                # Roteamento e orquestrador principal
│   └── index.css              # Tokens e estilos Tailwind CSS v4
├── test/
│   └── calculations.test.ts   # Suíte de testes automatizados com TSX
├── .env.example               # Exemplo de configuração de variáveis de ambiente
├── package.json               # Configurações de dependências e scripts de automação
├── server.ts                  # Servidor Express Full-Stack e rotas da API
├── tsconfig.json              # Configurações do compilador TypeScript
└── vite.config.ts             # Configuração do empacotador Vite
```

---

## 💡 Dicas de Resolução de Problemas (Troubleshooting)

1. **Porta 3000 já em uso:**
   - Se outro processo já estiver utilizando a porta 3000, defina uma porta diferente no arquivo `.env` (ex: `PORT=3001`) ou na linha de comando:
     ```bash
     PORT=3001 npm run dev
     ```

2. **Erros de Tipagem ou Dependências:**
   - Se atualizar pacotes e encontrar inconsistências de tipos, execute:
     ```bash
     npm run clean
     npm install
     npm run lint
     ```

3. **Compatibilidade de Sistemas Operacionais:**
   - Todos os scripts do `package.json` foram auditados para funcionar de maneira nativa e idêntica no **Windows**, **macOS** e **Linux**, sem dependência de comandos exclusivos de Unix/Bash.
