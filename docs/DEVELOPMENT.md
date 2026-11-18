# Desenvolvimento local

O MVP vigente é estático e sem persistência. Com Node e pnpm instalados, execute `pnpm install --frozen-lockfile` e `pnpm dev`. Acesse `http://localhost:5173`. Não é necessário `.env`, API, Docker ou PostgreSQL.

`pnpm build` (ou `pnpm build:web`) gera somente o frontend em `apps/web/dist`, após compilar pacotes compartilhados. `pnpm preview` serve esse build em `http://localhost:4173` para conferência local. Publique somente a pasta dist; não publique o repositório nem `.env`. Veja [STATIC_MVP](STATIC_MVP.md).

Verificações do MVP: `pnpm test`, `pnpm lint`, `pnpm test:e2e` e `pnpm test:e2e:static`. A suíte histórica `test:e2e:persistence` está suspensa porque a interface de projetos saiu do escopo. `build:all`, `dev:all`, `dev:api`, migrações e testes de banco abaixo são opcionais para manutenção do código preservado, não etapas do MVP. A configuração antiga de banco nunca deve ser exposta publicamente.

## Referência do ambiente completo preservado (fora do MVP)

## Pré-requisitos

- Node.js 24.22.2 (linha LTS 24, também registrada em `.node-version`).
- pnpm 12.16.1, fixado em `packageManager`. Pode ser instalado com `npm install --global pnpm@12.16.1`.
- Docker com Compose v2 e suporte a containers Linux para o banco local.

No Windows, confirme que `node --version` e `pnpm --version` funcionam; a presença dos executáveis do NVM sem uma versão ativa não é suficiente. Esta validação utilizou Node portátil e pnpm em `.tools/`, que é ignorado e não constitui dependência do repositório.

Nesta máquina, enquanto o NVM não tiver uma versão ativa, é possível usar os binários já baixados abrindo PowerShell na raiz e ajustando somente a sessão atual:

```powershell
$env:Path = (Join-Path $PWD '.tools/node-v24.22.2-win-x64') + ';' + (Join-Path $PWD '.tools/pnpm/node_modules/pnpm') + ';' + $env:Path
node --version
pnpm --version
```

Essa alternativa é específica desta cópia local. Em uma nova cópia, instale os pré-requisitos normalmente. O cache pnpm fica em `.pnpm-store/`, também ignorado.

## Preparar

Na raiz, copie `.env.example` para `.env` (PowerShell: `Copy-Item .env.example .env`; shells Unix: `cp .env.example .env`). Não sobrescreva um `.env` existente sem revisar seus valores.

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:validate
pnpm build
```

As aplicações leem o `.env` da raiz independentemente do diretório de execução. Variáveis existentes no ambiente têm precedência. Apenas valores com prefixo `VITE_` são expostos no frontend; `DATABASE_URL` nunca deve receber esse prefixo. `VITE_API_URL` é incorporado ao build e precisa estar correto no momento da compilação.

## Iniciar aplicações da stack preservada

Para manutenção da API preservada, inicie PostgreSQL e aplique as migrações com `pnpm db:up` e `pnpm db:deploy`. A migração v2 preserva os projetos existentes; não use reset. A interface pública não oferece persistência. [INTEGRATION_VALIDATION](INTEGRATION_VALIDATION.md) registra o fluxo histórico anterior à D-17.

```sh
pnpm dev:all
```

Este comando compila os pacotes compartilhados e inicia seus watchers, API e Vite. Frontend: `http://localhost:5173`. API: `http://127.0.0.1:3001/health`. Vite usa porta fixa para manter CORS consistente; uma porta ocupada é erro, não causa mudança silenciosa.

Para iniciar individualmente: `pnpm dev:web` ou `pnpm dev:api`. Esses comandos preparam os pacotes, mas não acompanham alterações posteriores neles; para trabalho simultâneo nos pacotes e backend, use `pnpm dev:all`. Interrompa com Ctrl+C.

`WEB_ORIGIN` deve ser a origem exata do frontend, sem caminho ou barra final. A API permite CORS apenas para essa origem, sem credenciais. Requisições diretas sem Origin continuam possíveis; CORS não é autenticação. Se mudar host/porta, alinhe `API_HOST`, `API_PORT`, `VITE_API_URL` e `WEB_ORIGIN`. Para preview na porta 4173, ajuste WEB_ORIGIN e reinicie a API.

## Banco local

```sh
pnpm db:up
pnpm db:deploy
pnpm db:check
```

Compose publica PostgreSQL somente em `127.0.0.1`, com volume nomeado e healthcheck. A imagem 18 usa o volume em `/var/lib/postgresql`. Credenciais são exemplos exclusivos de desenvolvimento. Ao mudar POSTGRES_USER/PASSWORD/DB/PORT, atualize DATABASE_URL; alterar variáveis não reconfigura um volume já inicializado.

Prisma contém o modelo `Project` usado pela API CRUD preservada. `db:generate` gera o cliente local, `db:validate` verifica o schema sem conectar e `db:check` executa apenas `SELECT 1` usando o adapter PostgreSQL. Nenhuma migração é aplicada automaticamente.

Quando uma tarefa autorizar criar tabelas, use `pnpm db:migrate --name init` com o banco ativo e revise/versione a migração. `pnpm db:down` para containers preserva o volume. Não use remoção de volumes para resolver problemas sem avaliar perda de dados.

## Qualidade

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

`pnpm format` aplica Prettier. Vitest procura testes em `apps/*/src` e `packages/*/src`, incluindo motor, adaptadores e contratos preservados. Playwright verifica editor e build estático; testes com leitores de tela reais continuam pendentes. Para conferir somente os tipos do frontend sem geração Prisma: `pnpm build:packages` e `pnpm --filter @jyboia/web typecheck`.

`build` gera pacotes e frontend; `build:all` inclui o backend opcional. Não há aliases de TypeScript substituindo a resolução real dos pacotes. `apps/api/dist` roda com `pnpm --filter @jyboia/api start`; `pnpm preview` serve o build web localmente.

Versões e justificativas: [TOOLCHAIN](TOOLCHAIN.md). Resultados desta execução: [BOOTSTRAP_VALIDATION](BOOTSTRAP_VALIDATION.md).

## API de projetos

A API local de projetos está implementada. Inicie o PostgreSQL, execute `pnpm db:deploy` e `pnpm dev:api`. Configuração, exemplo completo de CRUD e teste com banco real: [BACKEND_VALIDATION](BACKEND_VALIDATION.md). OpenAPI em `/openapi.json`; teste integrado com `pnpm test:integration` e TEST_DATABASE_URL local. A API não oferece autenticação ou isolamento entre usuários e só aceita host loopback.
