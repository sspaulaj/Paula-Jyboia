# Jyboia

Aplicação web educacional de programação visual por blocos, inspirada no Scratch e com foco em acessibilidade para pessoas com deficiência visual.

O projeto se relaciona ao Projeto Jyboia, iniciativa de educação em computação que propõe atividades de introdução ao pensamento computacional para crianças, especialmente entre 8 e 11 anos.

## Proposta

Crianças poderão construir algoritmos conectando blocos, executar seus programas e acompanhar personagens em um palco visual. Um único editor oferecerá interação por mouse, teclado e leitores de tela, com representações visual e semântica sincronizadas do mesmo programa.

A acessibilidade fará parte da interface desde sua concepção: HTML semântico, APIs de acessibilidade do navegador, gerenciamento de foco e WAI-ARIA quando necessário. Não haverá um editor assistivo separado nem sintetizador de voz próprio como solução principal.

## Estado atual

Fase B modular (22/11/2026): `/` e `/scratch` abrem o editor existente; `/python` é uma página preparatória. O escopo Python inclui geração de código e execução local futura com Pyodide em Worker e terminal acessível, sem execução no backend. Catálogo, geração e runtime não estão implementados nesta fase.

MVP público estático: editor Blockly e motor inteiramente no navegador, sem contas, API ou banco em execução. Os programas existem somente em memória e não são salvos; recarregar ou fechar perde o trabalho. O backend e os contratos anteriores permanecem no monorepo para evolução futura, fora do fluxo público. Consulte [MVP estático](docs/STATIC_MVP.md), [desenvolvimento](docs/DEVELOPMENT.md) e [validação assistiva pendente](docs/ACCESSIBILITY_VALIDATION.md).

```sh
pnpm install --frozen-lockfile
pnpm dev
# Gerar arquivos estáticos em apps/web/dist:
pnpm build
# Conferir o build localmente:
pnpm preview
```

Esses comandos não exigem `.env`, Docker, Prisma ou PostgreSQL em execução. Publique somente `apps/web/dist`; o backend não faz parte desta entrega.

## Arquitetura planejada

Monorepo em TypeScript, com responsabilidades separadas:

| Área prevista           | Responsabilidade                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web`              | Frontend React, editor único, acessibilidade e palco                                       |
| `apps/api`              | Backend Node.js, API REST e persistência PostgreSQL                                        |
| `packages/block-engine` | Modelo, regras, serialização e interpretação, independentes de React, DOM, Blockly e banco |
| `packages/shared`       | Tipos e contratos HTTP compartilhados, reutilizando o modelo do motor                      |

Blockly é a base atual do editor Scratch; a validação manual de acessibilidade continua pendente. O formato interno da biblioteca não é o contrato do motor nem o da API. Python terá modelo e runtime independentes.

## Documentação

- [Arquitetura dos módulos frontend](apps/web/docs/ARCHITECTURE.md)
- [Python e palco terminal: plano técnico](apps/web/docs/PYTHON.md)
- [Backend preservado](apps/api/docs/ARCHITECTURE.md)
- [Infraestrutura futura](infra/aws/docs/ARCHITECTURE.md)
- [Validação da modularização](apps/web/docs/VALIDATION.md)

- [Visão e escopo do produto](docs/PRODUCT.md)
- [Requisitos e critérios de aceitação](docs/REQUIREMENTS.md)
- [Entregas incrementais](docs/ROADMAP.md)
- [Arquitetura e diagramas](docs/ARCHITECTURE.md)
- [Contratos da API](docs/API_CONTRACTS.md)
- [Modelo de blocos](docs/BLOCK_MODEL.md)
- [Estratégia de acessibilidade](docs/ACCESSIBILITY.md)
- [Editor atual e exemplo com repetição/condição](docs/EDITOR.md)
- [Roteiro de validação com leitores de tela](docs/ACCESSIBILITY_VALIDATION.md)
- [Decisões arquiteturais](docs/DECISIONS.md)
- [Instruções permanentes para o Codex](AGENTS.md)

Antes de implementar, leia esses documentos. Registre decisões arquiteturais relevantes em `docs/DECISIONS.md`.

- [Iniciar localmente](docs/DEVELOPMENT.md)
- [Versões escolhidas](docs/TOOLCHAIN.md)
- [Prova de conceito do editor acessível](docs/EDITOR_POC.md): `pnpm dev:web`, rota `/experiments/editor`. Quatro blocos com Blockly; validação manual com leitores de tela pendente.

## Backend implementado

CRUD local em `/api/projects` com validação, revisão otimista e persistência JSONB. [Como executar e testar](docs/BACKEND_VALIDATION.md). Sem autenticação/proprietários; não expor publicamente. O editor experimental ainda não está integrado ao salvamento.
