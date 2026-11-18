# Backend: execução e validação

API REST independente do frontend. Contrato em [API_CONTRACTS](API_CONTRACTS.md), artefato [OpenAPI](openapi.yaml). Nenhum leitor de tela ou comportamento visual é implementado no servidor.

## Iniciar localmente

Requer Node/pnpm fixados em TOOLCHAIN e PostgreSQL. Com Docker disponível:

```powershell
# Na raiz. Crie .env a partir de .env.example somente se ainda não existir.
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:deploy
pnpm dev:api
```

`db:deploy` aplica migrações versionadas sem reset ou alterações automáticas do schema. `db:migrate` é para desenvolver novas migrações, não para inicialização comum. Se não houver Docker, configure DATABASE_URL para um PostgreSQL local existente, aplique `db:deploy` e inicie a API. O backend fica em `http://127.0.0.1:3001`; `GET /health` e `GET /openapi.json` podem ser abertos no navegador. Não é necessário iniciar o frontend.

Sem autenticação/proprietários: todos os projetos são acessíveis a todos os clientes da instalação. API_HOST é limitado a loopback. Não publicar a API nem criar túnel sem política de acesso. CORS não é isolamento entre usuários.

## Exemplo com PowerShell

```powershell
$body = @{
  name = 'Minha atividade'
  description = ''
  formatVersion = 1
  workspaceData = @{
    schemaVersion = 1
    program = @{
      entryBlockId = 'start1'
      blocks = @(
        @{ id = 'start1'; type = 'start'; parameters = @{}; next = 'move1' }
        @{ id = 'move1'; type = 'move'; parameters = @{actorId = 'actor1'; steps = 10}; next = $null }
      )
    }
    actors = @(@{id = 'actor1'; name = 'Jyboia'; initialState = @{x = 0; y = 0; heading = 0}})
    layout = @()
  }
} | ConvertTo-Json -Depth 20
$project = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3001/api/projects' -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/projects/$($project.id)"
Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/projects?limit=20&offset=0'
# PUT substitui todo o corpo e precisa do ETag atual entre aspas.
$headers = @{ 'If-Match' = '"' + $project.revision + '"' }
$updated = Invoke-RestMethod -Method Put -Uri "http://127.0.0.1:3001/api/projects/$($project.id)" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$headers = @{ 'If-Match' = '"' + $updated.revision + '"' }
Invoke-RestMethod -Method Delete -Uri "http://127.0.0.1:3001/api/projects/$($project.id)" -Headers $headers
```

## Reproduzir testes

```powershell
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm openapi:generate
$env:TEST_DATABASE_URL = 'postgresql://usuario:senha@127.0.0.1:5432/banco_de_testes'
pnpm test:integration
```

`pnpm test` não exige banco. `test:integration` exige TEST_DATABASE_URL e falha explicitamente quando ausente; não substitui PostgreSQL por mock. O usuário de testes precisa criar schemas. Cada execução cria `jyboia_test_<UUID>`, aplica a migração SQL versionada nesse schema e remove somente esse namespace em finally/afterAll. Não apaga dados do schema public nem usa reset. O teste HTTP abre uma porta efêmera exclusivamente em loopback e fecha ao terminar.

## Evidências desta entrega

- PostgreSQL **18.6** real, binários oficiais portáteis EDB; cluster exclusivo em `.tools/pg-api-test-data`, porta **55432**, banco `jyboia_api_test`. Docker não estava disponível; o Compose não foi executado nesta rodada.
- Migração `202611040001_projects` aplicada com sucesso por Prisma migrate deploy nesse banco.
- **41 testes locais** passaram: regras de domínio, rejeições HTTP e regressões existentes do monorepo.
- Integração verifica criação/recuperação/atualização/exclusão, round-trip de JSONB, parâmetros alterados, listagem limitada, rascunhos, ordem dos arrays, IDs inexistentes, revisão, duas atualizações concorrentes, atualização inválida sem perda, estruturas malformadas, HTTP real e equivalência do OpenAPI publicado/versionado.
- Sem validação de produção, política de acesso pública, integração do editor com salvamento ou migração de dados antigos. O schema anterior era scaffold sem migração aplicada; instalações com aplicação manual prévia exigem plano próprio.

Binários obtidos pela [distribuição EDB indicada pelo PostgreSQL](https://www.postgresql.org/download/windows/) e [página de binários EDB](https://www.enterprisedb.com/download-postgresql-binaries). Downloads e dados temporários ficam em .tools, ignorado pelo Git; não há instalação de serviço de sistema.

Resultado final: **17 testes de integração passaram** com PostgreSQL 18.6, além dos 41 testes locais. Build, lint, typecheck e validação Prisma aprovados. O build mantém o aviso anterior de tamanho do chunk Blockly, sem mudança de lógica visual nesta tarefa.
