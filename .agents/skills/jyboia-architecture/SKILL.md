---
name: jyboia-architecture
description: Planejar ou revisar a arquitetura do Jyboia ao organizar o monorepo, definir contratos e APIs REST, alterar dependências ou decidir fronteiras entre frontend, backend e pacotes compartilhados.
---

# Arquitetura do Jyboia

Use a estrutura planejada no [README](../../../README.md) e os requisitos RNF-01 a RNF-04 de [REQUIREMENTS](../../../docs/REQUIREMENTS.md) como referência. Aplique as regras gerais do [AGENTS.md](../../../AGENTS.md) sem reproduzi-las nas decisões.

## Distribuir responsabilidades

- `apps/web`: interação, adaptação do editor para o modelo de programa, apresentação do palco e anúncios. Não importar implementação do servidor.
- `apps/api`: transporte HTTP, validação de entrada, serviços de persistência e acesso ao PostgreSQL. Não exigir navegador para funcionar.
- `packages/block-engine`: modelo versionado, conexões, validação, serialização e interpretação, com exportações separadas `model` e `runtime`. Não importar aplicações ou `shared`.
- `packages/shared`: esquemas públicos de requisição, resposta e erros; reutilizar `block-engine/model` sem expor entidades do banco ou importar o runtime.

Faça o grafo de dependências apontar das aplicações para os pacotes, e de `shared` para a exportação de modelo do motor. Internamente, runtime depende do modelo, não o contrário. Evite ciclos e imports de arquivos internos; defina exportações públicas pequenas. Consulte [ARCHITECTURE](../../../docs/ARCHITECTURE.md) antes de alterar fronteiras. Não use `shared` para esconder serviços sem responsabilidade definida.

## Projetar uma mudança

1. Identifique componentes consumidores e contratos afetados, inclusive dados já serializados.
2. Defina entradas, saídas, erros, validação em tempo de execução e compatibilidade. Para eventos do motor, preserve identidade do bloco e ordem de execução sem incluir DOM ou texto específico de apresentação.
3. Para REST, descreva recursos, métodos, códigos HTTP, esquemas e exemplos no OpenAPI. Adote um formato consistente de erro com código estável e detalhes de campos quando necessários. Não exponha stack traces ou detalhes do banco.
4. Separe versionamento do formato de projeto, do contrato HTTP e de dependências. Mudanças incompatíveis precisam de estratégia explícita de migração ou rejeição compreensível.
5. Ao adicionar dependências, avalie necessidade, manutenção, licença, compatibilidade com a stack, impacto no bundle e acessibilidade. Reutilize gerenciador e lockfile existentes; se ainda não definidos, documente a escolha antes de inicializá-los no escopo autorizado.
6. Registre decisões relevantes em `docs/DECISIONS.md`, incluindo alternativas e consequências, especialmente adoção de Blockly, fronteiras de pacotes e mudanças de contrato.

## Verificar a proposta

Confirme que o motor pode ser testado isoladamente, que o frontend não conhece credenciais ou detalhes de persistência e que o modelo não depende da serialização do editor. Relate contratos alterados, consumidores afetados e verificações necessárias; não escolha infraestrutura ou funcionalidades além da tarefa.
