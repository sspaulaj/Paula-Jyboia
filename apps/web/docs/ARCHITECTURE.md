# Arquitetura frontend

Decisão de 22/11/2026: dois módulos pedagógicos, cada um com uma única interface para mouse, teclado e leitores de tela. Não existem versões assistivas separadas.

## Estrutura da Fase B

- `src/app`: resolução das rotas e carregamento lazy dos módulos.
- `src/modules/scratch/editor`: interface atual, palco, categorias e controle de execução.
- `src/modules/scratch/experiment`: adaptador Blockly e PoC preservados juntos; apesar do nome, o adaptador atende ao editor público.
- `src/modules/python`: PoC de execução de exemplos Python com Worker e terminal (Fase C). Catálogo e geração de blocos ainda não implementados; ver [PYTHON_RUNTIME](PYTHON_RUNTIME.md).
- `src/shared/accessibility`: coordenação de anúncios independente de React e do catálogo; cada consumidor cria sua própria instância.
- `src/assets`: identidade visual existente. Não mover nem generalizar componentes somente para reduzir duplicação.

Scratch e Python não importam um ao outro. Ambos podem consumir infraestrutura compartilhada, mas `shared` não importa módulos. O motor Scratch continua em `packages/block-engine`, sem React, DOM, Blockly, rede ou banco. O runtime Python da Fase C é outro componente, sem dependência desse motor.

## Implementado versus planejado

`/` e `/scratch` abrem o editor existente; `/python` oferece a PoC de execução autorizada na Fase C. Pyodide só é carregado ao iniciar um exemplo Python; abrir Scratch não carrega runtime Python, servidor ou banco.

A arquitetura Python alvo inclui geração **e execução local** em Web Worker, terminal com saída e formulários de entrada acessíveis. O contrato e os pontos em investigação estão em [PYTHON](PYTHON.md). Isso substitui a proposta anterior de somente gerar código, mas não amplia a implementação desta fase.

O estado continua somente em memória durante a vida da página. Rotas são resolvidas na entrada; navegação por links de documento reinicia a página. Não há seletor novo na interface Scratch nem navegação SPA entre workspaces nesta fase. Uma futura navegação interna deverá preservar documentos em memória e montar apenas um workspace ativo, com descarte de eventos e foco previsível.

## Fronteiras e riscos

Blockly mantém registros globais de blocos, idioma, foco e tooltips. Nomes Python deverão usar prefixo próprio e não redefinir blocos Scratch. CSS do novo módulo deve ser local à sua página. Não compartilhar automaticamente catálogo, regras de conexão, descrições, controlador de execução ou palco.

Não mudar os contratos versionados Scratch para representar Python. Definir modelo Python próprio com IDs, campos, entradas de expressão, corpos e encadeamento explícito; o mesmo modelo alimentará acessibilidade, código e execução.

Referências: [componentes](SHARED_COMPONENTS.md), [Scratch](SCRATCH.md), [navegação](NAVIGATION.md), [acessibilidade](ACCESSIBILITY.md), [diagramas](../../../docs/diagrams/modules.md).
