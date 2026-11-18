---
name: jyboia-accessibility
description: Projetar, implementar ou revisar acessibilidade no editor e palco do Jyboia, incluindo semântica dos blocos, teclado, foco, alternativas ao arraste, WAI-ARIA e anúncios para leitores de tela, com meta WCAG 2.2 AA.
---

# Acessibilidade do Jyboia

Consulte RF-01 a RF-09, RF-11 e RNF-05 a RNF-07 em [REQUIREMENTS](../../../docs/REQUIREMENTS.md). As regras gerais estão no [AGENTS.md](../../../AGENTS.md).

## Desenhar a interação acessível

- Para cada operação, descreva como encontrá-la, acioná-la, conhecer o resultado e recuperar-se de erro. Use o mesmo estado e comandos do editor para mouse e teclado.
- Exponha comando, parâmetros e valores, seleção, relações de conexão e posição lógica de cada bloco. Derive esses dados do modelo, não apenas de coordenadas visuais.
- Prefira controles HTML nativos. Ao usar widgets compostos, escolha um padrão WAI-ARIA compatível com a interação e implemente seu comportamento de teclado; não atribua papéis somente para provocar anúncios.
- Diferencie foco, seleção e bloco em execução. Defina entrada e saída do workspace, edição de campo, confirmação, cancelamento e destino do foco após exclusão. Preserve foco visível e não encoberto; evite deslocá-lo para anunciar resultados.
- Ofereça inserção, conexão e movimentação por comandos de teclado. Para arrastar e soltar, ofereça também operação por ponteiro sem arraste, como selecionar bloco e escolher destino. Teclado e alternativa por clique atendem necessidades distintas.
- **Eventos de `mouseover` ou hover, isoladamente, não garantem leitura por leitores de tela.** Informações essenciais devem estar disponíveis na árvore de acessibilidade e ser alcançáveis por navegação e foco apropriados. Dicas acionadas por hover precisam de tratamento equivalente por foco e possibilidade de dispensar o conteúdo.
- Verifique contraste, ampliação, informação além de cor e tamanho dos alvos, além da leitura de tela. Revise os critérios A e AA aplicáveis ao fluxo completo.

## Anunciar mudanças

Defina quais eventos exigem anúncio, conteúdo, prioridade e relação com a sequência consultável. Use regiões de estado adequadas, evitando anunciar cada quadro da animação. Reserve interrupções assertivas para situações que realmente exigem atenção imediata.

Ao iniciar, disponibilize a sequência conectada em ordem, com parâmetros. Durante a execução, mantenha coerência entre eventos, descrição do palco e resultado final. Teste reinício, cancelamento e mensagens idênticas consecutivas. Não suponha que alterações rápidas em uma região viva serão todas lidas, nem use temporizadores como prova de que a fala terminou.

## Validar

Percorra o fluxo inteiro sem mouse e com NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari conforme a matriz do projeto. Inspecione nome, papel, valor, relações, ordem de foco e o que é efetivamente anunciado. Se uma combinação não estiver disponível, registre a lacuna; não a declare aprovada.

Para Blockly, confirme versão e comportamento dos campos personalizados no editor integrado. A declaração de suporte da biblioteca não substitui testes do Jyboia. Use [jyboia-testing](../jyboia-testing/SKILL.md) quando precisar estruturar evidências e regressões.

## Referências pontuais

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): consultar critérios normativos ao avaliar conformidade; incluir teclado, foco, mensagens de estado e movimentos de arrastar.
- [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/): consultar padrões de widgets, nomes acessíveis e comportamento de teclado ao definir componentes personalizados.
