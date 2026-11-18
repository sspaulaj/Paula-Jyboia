# Arquitetura geral

Setas contínuas indicam fluxo em execução; tracejadas, uso de pacotes. Arquitetura planejada.

```mermaid
flowchart LR
  user["Criança: mouse, teclado e leitor de tela"] --> web["apps/web: React e TypeScript"]
  web -->|"HTTP JSON /api"| api["apps/api: Node.js e TypeScript"]
  api -->|"Transações"| db[("PostgreSQL: projetos JSONB")]
  web -.->|"Modelo e runtime no navegador"| engine["packages/block-engine"]
  api -.->|"Somente modelo e validação"| engine
  web -.-> shared["packages/shared: DTOs e schemas HTTP"]
  api -.-> shared
  shared -.->|"Reutiliza modelo e validação"| engine
```

O motor não depende das aplicações ou do banco. Não há acesso direto do frontend ao PostgreSQL nem execução de programas no servidor.
