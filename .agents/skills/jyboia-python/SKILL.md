---
name: jyboia-python
description: Projetar ou implementar o módulo Python por blocos do Jyboia, seu modelo, geração de código, terminal acessível e execução local com Pyodide em Worker, conforme a etapa autorizada.
---

# Python por blocos

Leia [PYTHON](../../../apps/web/docs/PYTHON.md) antes de atuar. A Fase B prepara somente módulo/rota; o escopo alvo inclui geração **e execução** com terminal, não apenas código. Verifique a entrega solicitada antes de instalar runtime ou ampliar catálogo.

- Mantenha modelo, gerador, controlador/Worker e apresentação separados. Não importar Scratch ou `block-engine`; não converter seus blocos de personagens em regras Python.
- Use a mesma estrutura lógica para descrições, geração e execução. Preserve IDs e mapeamento de erros; ordem vem de conexões, não de coordenadas.
- Investigue o gerador Blockly instalado antes de criar outro. Valide precedência, indentação, literais, nomes, `input()` e limite exclusivo de `range()`; blocos padrão não garantem a semântica pedagógica desejada.
- Primeira opção de runtime: Pyodide em Worker de módulo, carregado sob demanda. Nunca Python no backend/AWS no MVP. Não concatenar código em React nem oferecer execução livre fora do catálogo aprovado.
- `setStdin` síncrono não aceita uma Promise como solução automática. Investigue buffer compartilhado/espera somente no Worker, isolamento de origem e formulário na thread principal. Não repetir execução para simular continuação de input.
- Planeje `runId`/`inputId`, limites de saída/entrada/tempo, descarte de mensagens antigas, interrupção e término definitivo do Worker. Parar deve funcionar durante input e laço infinito. Worker não é sandbox suficiente para código hostil.
- Valide geração, execução, cancelamento/reinício, campos acessíveis e fala real separadamente. Não declarar Pyodide ou input homologados somente com documentação. Use a skill de acessibilidade para foco, terminal e anúncios concorrentes.
