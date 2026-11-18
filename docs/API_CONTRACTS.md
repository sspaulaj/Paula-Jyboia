# Contratos da API

Implementados para desenvolvimento local. OpenAPI: [openapi.yaml](openapi.yaml), gerado dos schemas de `packages/shared` (JSON, também válido como YAML), e `GET /openapi.json`. A solicitação atual substitui a base proposta `/api/v1` por `/api` e `title/document` por `name/workspaceData`. Não existiam rotas de projetos implementadas nem consumidores frontend a migrar.

## Status no MVP

Fora do MVP público desde 18/11/2026 (D-17). Contrato preservado para manutenção/evolução; o frontend estático não o consome. Não publicar esta API sem política de acesso. Ver [STATIC_MVP](STATIC_MVP.md).

## Acesso e operação local

**Sem autenticação, proprietários ou isolamento entre usuários.** Qualquer cliente com acesso à instalação pode listar, ler, alterar e excluir seus projetos. Adequado somente para desenvolvimento local. Não expor por rede, proxy ou túnel sem definir e implementar política de acesso. `API_HOST` aceita somente loopback. CORS permite a origem configurada, mas não autentica clientes nem protege dados por usuário.

| Método | Endpoint | Sucesso |
| --- | --- | --- |
| POST | `/api/projects` | 201, projeto completo, Location e ETag |
| GET | `/api/projects?limit=20&offset=0` | 200, página de metadados |
| GET | `/api/projects/{id}` | 200, projeto completo e ETag |
| PUT | `/api/projects/{id}` | 200, substituição completa e novo ETag |
| DELETE | `/api/projects/{id}` | 204, sem corpo |
| GET | `/health` | 200, liveness independente do banco |
| GET | `/openapi.json` | 200, contrato OpenAPI 3.1 |

`{id}` é UUID. Não há endpoint de execução de programas nem lógica visual.

## Dados

POST e PUT recebem exatamente `name`, `description`, `workspaceData`, `formatVersion`.

- `name`: string de 1–120 caracteres Unicode, aparada nas extremidades; rejeitar nome em branco.
- `description`: string de até 2.000 caracteres; enviar `""` quando ausente.
- `formatVersion`: inteiro `1` (legado) ou `2` (editor integrado), concordante com `workspaceData.schemaVersion`.
- `workspaceData`: união versionada descrita em [BLOCK_MODEL](BLOCK_MODEL.md). Contém IDs, tipos, parâmetros, conexões, entradas, estado inicial e layout. Não é imagem, HTML ou serialização nativa Blockly.

Resposta completa acrescenta `id`, `revision`, `createdAt`, `updatedAt`. Revisão começa em 1; timestamps ISO 8601 UTC. POST gera UUID no servidor. PUT preserva ID/createdAt, incrementa revisão e atualiza updatedAt. Servidor não aceita metadados gerenciados no corpo.

Listagem retorna `{items, total, limit, offset}`. Cada item tem os metadados, sem `workspaceData`; carregar o documento por ID. `limit`: 1–100 (padrão 20); `offset`: 0–999999 (padrão 0). Ordem `createdAt` decrescente, depois `id` crescente. Count e página compartilham snapshot no banco; páginas em requisições distintas podem mudar diante de inserções/exclusões concorrentes.

## Validação e limites

JSON UTF-8; corpo máximo **256 KiB**, sem compressão. Campos extras e coerção de tipos são rejeitados. Textos não aceitam NUL ou Unicode inválido. Até 200 blocos e 200 posições de layout; um personagem. Referências devem existir; rejeitar IDs duplicados, múltiplos predecessores, ciclos inclusive desconectados, conexões entrando em `start`, parâmetros fora dos limites e versões desconhecidas. V1 aceita `start`, `move`, `turn`, `say`. V2 aceita também `goto`, `show`, `hide`, `wait`, `repeat`, `forever`, `if`, `gt`, `lt`, `eq`, `set` e `change`, com até 20 níveis de aninhamento.

Salvar rascunho vazio/sem entrada e blocos soltos é permitido se a estrutura for válida. V1 segue `entryBlockId` e `next`; v2 segue `entryBlockIds`, `next`, `body` e `condition`. Coordenadas não determinam execução. A API preserva o documento recebido e não executa para validar. O editor converte v1 explicitamente ao abrir e salva v2 somente quando solicitado; a API continua aceitando v1. A migração `202611050001_editor_format_v2` amplia a restrição de versão sem apagar projetos.

## Revisão e concorrência

ETag é a revisão entre aspas, por exemplo `"1"`. **PUT e DELETE exigem `If-Match`** com o ETag atual. Não aceitam `*`. Comparação e alteração/exclusão são atômicas. Escritas concorrentes com a mesma revisão: somente uma vence; a outra recebe 412. Operações sobre ID inexistente com requisição válida retornam 404. PUT nunca cria.

Cabeçalho ausente retorna 428; sintaxe inválida retorna 400. Após timeout, consultar o recurso antes de repetir, pois a escrita pode ter ocorrido. POST não possui chave de idempotência: repetir criação pode gerar duplicata. Revisão não oferece histórico nem colaboração.

## Erros

```json
{
  "error": {
    "code": "INVALID_DOCUMENT",
    "message": "Revise a estrutura e os parâmetros dos blocos.",
    "requestId": "req-1",
    "issues": [{"code":"MISSING_TARGET","path":"/workspaceData/program/blocks/0/next","blockId":"start1"}]
  }
}
```

`issues` sempre é lista (até 20 diagnósticos), `path` JSON Pointer, `blockId` opcional. Códigos estáveis orientam consumidores; mensagens em português. Não retornar SQL, credenciais, stack trace ou corpo de projeto em erros/logs.

| HTTP | Código |
| --- | --- |
| 400 | INVALID_REQUEST |
| 404 | PROJECT_NOT_FOUND / ROUTE_NOT_FOUND |
| 412 | REVISION_CONFLICT |
| 413 | PAYLOAD_TOO_LARGE |
| 415 | UNSUPPORTED_MEDIA_TYPE |
| 422 | INVALID_DOCUMENT / UNSUPPORTED_FORMAT_VERSION |
| 428 | REVISION_REQUIRED |
| 500 | INTERNAL_ERROR |
| 503 | SERVICE_UNAVAILABLE |

A validação do envelope produz 400; validação semântica/estrutura do documento produz 422. Erros de transporte não são respostas HTTP. CORS expõe Location e ETag para a origem local configurada. Respostas usam Cache-Control: no-store.

## Banco, contratos e testes

Prisma mapeia Project para `projects`, com `workspace_data` JSONB e colunas de metadados. A migração inicial inclui restrições básicas e índice de listagem. Não há migração destrutiva de tabela anterior: o scaffold anterior não tinha migrações. Instalações onde alguém tenha aplicado manualmente o schema antigo precisam de migração/baseline explícitos; não executar reset para contornar conflito.

Schemas de transporte ficam em `shared/projects`; OpenAPI em `shared/openapi`; modelo e validação em `block-engine/model` e `block-engine/validation`. Artefato gerado com `pnpm openapi:generate`; teste compara documento publicado e arquivo versionado.

Comandos e testes reais em [BACKEND_VALIDATION](BACKEND_VALIDATION.md). Fontes técnicas: [validação Fastify](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) e [transações Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions). Ajv usa remoção de campos e coerção desativadas para rejeitar entradas sem alterá-las silenciosamente.
