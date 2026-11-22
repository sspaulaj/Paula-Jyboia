---
name: jyboia-scratch
description: Alterar ou revisar o editor Scratch do Jyboia, seu adaptador Blockly, palco e integração com o motor existente, preservando comportamento e acessibilidade.
---

# Editor Scratch

Leia [SCRATCH](../../../apps/web/docs/SCRATCH.md) e [ACCESSIBILITY](../../../docs/ACCESSIBILITY.md). O módulo está em `apps/web/src/modules/scratch`; o adaptador em `experiment` atende à produção, não é código descartável.

Preserve o catálogo e motor existentes. Movimento, reinício e limites seguem o contrato Jyboia, não suposições sobre o Scratch original. O módulo Python não importa este editor nem seu runtime.

Antes de alterar Iniciar/Parar, acompanhe preparação do editor, descarte de avisos, foco da sequência e estados verdadeiros dos controles. Não reintroduzir texto visual da sequência ou do aviso de ausência de início. Preserve uma publicação por entrada do ponteiro, sem mover foco ou repetir com mouse parado.

Para mudanças no modelo/motor, consulte `jyboia-block-engine`; para interação assistiva, `jyboia-accessibility`. Execute regressões de encaixe, parâmetros, palco, prioridade de anúncios, cancelamento e atualização em desenvolvimento. Não compartilhar componentes ligados ao catálogo sem separar sua responsabilidade primeiro.
