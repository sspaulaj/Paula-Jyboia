---
name: jyboia-accessibility
description: Projetar, implementar ou revisar acessibilidade no editor e palco do Jyboia, incluindo semântica dos blocos, teclado, foco, alternativas ao arraste, WAI-ARIA e anúncios para leitores de tela, com meta WCAG 2.2 AA.
---

# Acessibilidade do Jyboia

Consulte RF-01 a RF-09, RF-11 e RNF-05 a RNF-07 em [REQUIREMENTS](../../../docs/REQUIREMENTS.md). As regras gerais estão no [AGENTS.md](../../../AGENTS.md).

## Desenhar a interação acessível

Cada linguagem oferece um editor único para todos; dois módulos pedagógicos não são dois modos assistivos. Para o terminal Python futuro, consulte [acessibilidade frontend](../../../apps/web/docs/ACCESSIBILITY.md): código consultável, saída limitada, formulários de input, interrupção e erros. Compartilhe mecanismos, não descrições/regras de linguagens diferentes. Não declarar terminal validado enquanto ele estiver apenas planejado.

Antes de alterar interações existentes, consulte a estratégia vigente em [ACCESSIBILITY](../../../docs/ACCESSIBILITY.md) e as evidências em [ACCESSIBILITY_VALIDATION](../../../docs/ACCESSIBILITY_VALIDATION.md). As correções recentes têm cobertura automatizada, mas a leitura real com NVDA permanece pendente conforme essa matriz; não trate a implementação atual como aceitação assistiva concluída.

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

Ao revisar anúncios, preserve estas distinções:

- Separe mensagens da aplicação, anúncios do Blockly e informações nativas de foco/estado do leitor. `aria-live` não controla todos esses canais. Preserve estados verdadeiros de disponibilidade; não oculte controles nem falsifique estados para silenciá-los.
- Ao iniciar, descarte avisos de edição pendentes e evite publicar a mesma sequência por foco e região viva simultaneamente. Mudanças de foco devem ter destino relacionado à ação; preserve a saída por teclado e valide a transição com o leitor real.
- No hover, anuncie uma vez por entrada no bloco inteiro. Permanecer parado, cruzar campos internos ou receber eventos de fronteira causados por renderização não deve repetir a leitura. Sair e voltar deve permitir nova leitura, inclusive rapidamente; isso não substitui navegação por teclado.
- Respeite os conteúdos que o produto mantém apenas para leitores de tela: sequência inicial e aviso de ausência de início não devem reaparecer visualmente. Não use `display: none`, `hidden` ou `aria-hidden` nesses conteúdos. Mantenha indicação de foco apropriada e evite rótulos de regiões que acrescentem fala sem informação útil.
- Nos resultados do palco, prefira linguagem de ação sem narrar coordenadas automaticamente. Preserve os parâmetros acessíveis dos blocos que trabalham explicitamente com X/Y. Não acrescente anúncios por quadro que concorram com a sequência.

Percorra o fluxo inteiro sem mouse e com NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari conforme a matriz do projeto. Inspecione nome, papel, valor, relações, ordem de foco e o que é efetivamente anunciado. Se uma combinação não estiver disponível, registre a lacuna; não a declare aprovada.

Para Blockly, confirme versão e comportamento dos campos personalizados no editor integrado. A declaração de suporte da biblioteca não substitui testes do Jyboia. Use [jyboia-testing](../jyboia-testing/SKILL.md) quando precisar estruturar evidências e regressões.

## Referências pontuais

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): consultar critérios normativos ao avaliar conformidade; incluir teclado, foco, mensagens de estado e movimentos de arrastar.
- [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/): consultar padrões de widgets, nomes acessíveis e comportamento de teclado ao definir componentes personalizados.
