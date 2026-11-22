# Acessibilidade dos módulos

As regras e evidências atuais do Scratch permanecem em [ACCESSIBILITY](../../../docs/ACCESSIBILITY.md) e [ACCESSIBILITY_VALIDATION](../../../docs/ACCESSIBILITY_VALIDATION.md). Esta página define a aplicação dessas regras à arquitetura modular, sem duplicar o histórico.

Cada módulo oferece um único editor. Compartilhar mecanismos não significa compartilhar descrições de linguagens diferentes. Foco do teclado, ponteiro, cursor virtual do leitor e cursor Blockly são distintos. Hover isolado não garante fala; não tratar tooltip como descrição acessível.

O coordenador compartilhado mantém prioridade da sequência sobre edição, cancela pendências e não confirma término de fala. Sua extração não autoriza alterar os estados de Iniciar/Parar ou reapresentar mensagens ocultas visualmente.

## Terminal Python futuro

- Código gerado consultável e copiável por controles nativos, com rótulo e foco visível; não ler o código inteiro a cada alteração.
- Saída como histórico textual limitado e consultável. Agrupar anúncios novos, sem reler histórico inteiro ou inundar a região viva em laços.
- `input()` abre campo com label correspondente ao prompt, botão Enviar e associação ao pedido atual. Entrada é texto, inclusive vazio; `int`/`float` são conversões do programa, não validação imposta indiscriminadamente ao formulário.
- Direcionar foco ao pedido de entrada apenas como consequência da execução solicitada; preservar acesso a Parar. Não apagar saída anterior nem perder texto digitado por atualizações do log.
- Separar descrição inicial do programa, solicitações de entrada, resultados e erros. Erro precisa de mensagem em português e associação ao bloco/linha quando disponível.
- Parar deve funcionar durante carregamento, laço e espera de entrada, invalidando o formulário e respostas tardias.

Validar futuramente NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari: início, leitura, dois inputs consecutivos, entrada vazia, erro de conversão, laço com muita saída, interrupção e reinício. Automação DOM não equivale à fala observada. A Fase B não valida um terminal ainda inexistente.
