# Módulo Scratch

O módulo encapsula o editor existente, sem reescrita, em `src/modules/scratch`. A interface pública do módulo é `index.ts`; rotas não devem importar seus componentes internos, exceto a PoC de desenvolvimento.

Preservar catálogo, múltiplas sequências, encaixes, parâmetros, exclusão, teclado, descrições, hover uma vez por entrada e controles Iniciar/Parar. O início parte da posição atual do personagem; mover altera X conforme a decisão do produto, mesmo após giro.

O adaptador em `experiment/blockly-adapter.ts` ainda é usado em produção. A PoC em `/experiments/editor` só existe no servidor de desenvolvimento. O motor e os documentos v1/v2 continuam inalterados em `packages/block-engine`.

Prioridade assistiva: limpar mensagens pendentes, apresentar a sequência conectada e focá-la antes de indisponibilizar Iniciar; não publicar a mesma sequência também em região viva. Sequência e aviso de programa sem início permanecem visualmente ocultos. Parar mantém estado verdadeiro e cancela comandos pendentes. Não alterar esse fluxo para atender ao Python.

Contratos detalhados e evidências existentes: [editor](../../../docs/EDITOR.md), [modelo](../../../docs/BLOCK_MODEL.md), [acessibilidade](../../../docs/ACCESSIBILITY.md).
