# Backend preservado

A API Fastify/TypeScript existente mantém rotas HTTP, validação, serviço de projetos e repositório Prisma/PostgreSQL separados. Não mover essas camadas somente para imitar diretórios do frontend. O MVP público não depende da API nem do banco.

- Contratos canônicos: [API_CONTRACTS](../../../docs/API_CONTRACTS.md), OpenAPI em `packages/shared` e `docs/openapi.yaml` quando gerado.
- Execução e testes locais: [BACKEND_VALIDATION](../../../docs/BACKEND_VALIDATION.md).
- Projetos atuais preservam o documento Scratch versionado em JSONB e revisão otimista; não reinterpretar esse formato como Python.

## Integração futura

Autenticação, cadastro, autorização por recurso e persistência pública permanecem fora desta etapa. Antes de ativar, definir identidade/proprietário, acesso, retenção e migração de documentos. Um futuro envelope com tipo de módulo e versão precisa ser decidido explicitamente; não aceitar JSON arbitrário sem validação.

O frontend acessará serviços exclusivamente por HTTP. Não implementar `/python` como endpoint: é rota estática. Não executar programas Python no servidor/AWS no MVP. Não adicionar endpoints para sustentar a página preparatória.

A API atual não oferece isolamento entre usuários e permanece restrita a desenvolvimento local. CORS não substitui autorização. Testes de integração usam PostgreSQL real e schema aleatório próprio, sem reset de dados existentes.
