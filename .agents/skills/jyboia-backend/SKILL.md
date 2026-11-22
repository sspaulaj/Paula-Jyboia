---
name: jyboia-backend
description: Alterar ou revisar API REST Fastify, validação, serviços e persistência Prisma/PostgreSQL do Jyboia, preservados fora do fluxo público do MVP.
---

# Backend Jyboia

Consulte [arquitetura backend](../../../apps/api/docs/ARCHITECTURE.md) e [contratos](../../../docs/API_CONTRACTS.md). A existência do backend não autoriza reativá-lo nos editores.

Separe transporte HTTP, schemas públicos, serviço e repositório. Preserve revisão otimista e documentos versionados; tipos ORM não são contratos públicos. Atualize OpenAPI e testes ao mudar endpoints. Valide limites, estrutura, erros e versões antes de persistir.

Não adicionar autenticação, persistência pública ou endpoints por mera preparação de módulo. `/python` pertence ao frontend; execução Python no servidor está fora do MVP. A API sem proprietários permanece local e não oferece isolamento entre usuários.

Use PostgreSQL real em testes de integração, com schema aleatório dedicado e limpeza restrita. Não resetar banco existente. Avalie migrações e consumidores antes de substituir contratos.
