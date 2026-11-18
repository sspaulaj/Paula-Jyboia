# Prova de conceito do editor acessível

Data: 4 de novembro de 2026. Experiência local em `/experiments/editor`. Não implementa palco, execução, persistência ou editor completo. O botão **Iniciar atividade** anuncia a cadeia conectada; nesta PoC ainda não executa comandos no palco.

## Iniciar e verificar

Com Node e pnpm nas versões de [TOOLCHAIN](TOOLCHAIN.md):

```sh
pnpm install --frozen-lockfile
pnpm dev:web
# Abrir http://localhost:5173/experiments/editor
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

A experiência não exige API ou PostgreSQL. O teste E2E inicia e encerra Vite automaticamente; usa a porta 5174, que deve estar livre, preservando o desenvolvimento na 5173. A configuração usa Microsoft Edge instalado (`channel: msedge`), sem baixar Chromium implicitamente. Em ambiente sem Edge, instale esse navegador ou configure explicitamente outro canal compatível. Artefatos locais ficam em `test-results/`, ignorado pelo Git.

## Implementação e estrutura única

Blockly **13.4.0**, renderer Zelos, fornece encaixes, paleta, navegação nativa por teclado, campos e semântica SVG. React monta um único workspace. Não há lista editável paralela, modo assistivo alternativo ou sintetizador de voz.

Durante esta PoC, o grafo Blockly é a única estrutura **mutável** de edição. O adaptador em `apps/web/src/experiment/blockly-adapter.ts` extrai uma projeção imutável para consulta: IDs, tipo, parâmetros e conexão `next`. Descrições, seleção, cadeias consultáveis e ordem derivam dessa estrutura. Os controles de conexão modificam o mesmo workspace. A sequência é consultada pelo botão Iniciar atividade; não há painéis visíveis abaixo do editor.

`packages/block-engine/src/experimental.ts` valida e ordena esse modelo sem React, DOM, Blockly, rede ou banco. Valida IDs duplicados, ciclos, referências, predecessores múltiplos, encaixe inválido em evento, limites de parâmetros e 200 blocos. Não gera nem executa JavaScript. Este módulo não é desserializador de dados externos nem o contrato persistido `ProjectDocument v1`; não deve aceitar JSON não validado em produção. `say` permanece experimental; não se alterou silenciosamente o schema de persistência.

O modelo definitivo de domínio continua independente da biblioteca. A decisão de usar o grafo nativo como origem da edição nesta experiência é delimitada na D-11: importar, salvar e reconciliar transações com o domínio ainda exigirá trabalho específico antes da expansão.

## Interações e semântica

| Ação | Comportamento |
| --- | --- |
| Entrar/sair | Tab alcança controles; **Entrar no editor** transfere foco ao workspace. Tab sai para a página. |
| Paleta | **Escolher tipos de blocos** ou T dentro do editor; setas percorrem as quatro opções. |
| Inserir/conectar | Enter insere e entra em movimento; setas escolhem posição de encaixe; Enter confirma. Esc cancela movimento. |
| Percorrer | ↑/↓ percorrem blocos conectados; ←/→ entram e saem dos campos; Enter edita o campo. |
| Mover/excluir | M inicia movimento; Delete exclui. Atalhos e destino de foco são os nativos do Blockly. |
| Conectar | Use o encaixe por teclado ou o arraste no workspace. Os controles inferiores de conexão foram removidos por solicitação do usuário. |
| Desconectar | **Desconectar bloco**, na barra superior, solta o bloco selecionado, reconecta predecessor e sucessor quando compatíveis e devolve o foco ao bloco. Fica desabilitado quando não há predecessor. |
| Consultar | I repete a descrição nativa. **Iniciar atividade** publica a cadeia ordenada na região de estado e a mantém disponível em texto. |

O foco do bloco expõe descrições como “Bloco de movimento: mover 10 passos.”, acrescidas de conexão e posição lógica. Alterar passos, graus ou mensagem atualiza o nome acessível. Giro à direita é armazenado como graus negativos no modelo, mantendo a convenção arquitetural. Um bloco sem predecessor nem sucessor é **solto**; cadeias desconectadas do evento são identificadas como fora da sequência de início. Múltiplos eventos tornam a sequência ambígua, sem inventar uma ordem executável.

O adaptador usa `getAriaLabel`, `setAriaRoleDescriptionProvider`, nomes de campos e `getFocusableElement()` da biblioteca. Atualiza o elemento realmente focável, preservando papéis e gerenciamento nativo de tabulação. Não usa tooltip como substituto da semântica. A seleção é anunciada pelo foco; conexões, desconexões, alterações e exclusões atualizam uma região `status` educada. Blockly possui sua própria região para prévias de movimento. A coexistência pode causar repetição ou agrupamento de fala e precisa de avaliação humana.

Foi identificado que reparentear SVG ao confirmar encaixe pode deixar o foco no corpo da página no Edge. Há um reparo delimitado ao Enter sobre bloco do workspace: restaura o mesmo bloco no próximo quadro somente se o foco ficou no `body`. Não captura Tab nem desloca foco por hover. A regressão é exercitada no navegador.

## Evidências automatizadas e limites

Rodada local: build, lint, typecheck, formatação, **13 testes unitários** (incluindo os anteriores do monorepo) e **5 testes E2E no Edge** aprovados. O build emite aviso de chunk experimental acima de 500 kB: aproximadamente 730 kB minificado/201 kB gzip, carregado sob demanda pela rota. Isso é um risco de desempenho em dispositivos escolares, ainda sem medição nesses dispositivos; não houve supressão do aviso.

Confirmado pela automação: acesso à paleta por Tab, inserção dos quatro tipos, encaixe, edição de passos/graus/texto, percurso entre blocos, exclusão, movimentação por teclado, inserção por arraste, seleção por clique, conexão/desconexão pelos controles, atualização dos nomes acessíveis e da sequência, e presença dos anúncios de confirmação/desconexão na ordem das ações. Não houve erro JavaScript nos cinco cenários. Leitura efetiva, interrupções de fala e conformidade assistiva continuam pendentes.

Os testes unitários cobrem ordem lógica independente da ordem do array, cadeias soltas, ambiguidade, rejeição de conexões inválidas/ciclos/parâmetros e descrições dinâmicas. Os testes Playwright cobrem paleta, quatro tipos, edição numérica/textual, percurso, exclusão, movimentação, conexão/desconexão e inspeção de árvore de acessibilidade. Esses testes verificam eventos, nomes e estados, **não a fala efetiva**.

O teste de ponteiro registra a versão do navegador, nome do bloco, `aria-hidden` e nomes expostos pela API de acessibilidade Chromium, além de screenshot. No Edge 156.0.4314.58 foi encontrado o nome do bloco na árvore, sem `aria-hidden`, e mover o mouse não tomou o foco de um botão. Isso comprova exposição semântica nessa combinação de automação; não comprova hit-testing nem leitura de todas as partes do SVG por um leitor de tela.

## Ponteiro e leitores de tela

**Eventos de mouseover ou hover, isoladamente, não garantem leitura por leitores de tela.** Não há evento padronizado de “leitor terminou de falar”, e a aplicação não detecta com confiabilidade qual leitor está ativo.

- NVDA oferece rastreamento do mouse, alternável por NVDA+M. A leitura depende dessa configuração, dos provedores de acessibilidade do navegador e do elemento encontrado sob o ponteiro. Testar o contorno, o texto, o campo e o espaço vazio separadamente; um campo pode ser anunciado em vez do bloco inteiro.
- VoiceOver tem opções de acompanhamento do cursor e interação com grupos. Mover o ponteiro não garante mover o cursor VoiceOver; testar a configuração real no Safari.
- Seleção/foco e navegação pelos blocos são os caminhos explícitos de consulta. Não se força foco ao passar o mouse e não se reproduz voz própria.

Referências: [guia NVDA, mouse](https://download.nvaccess.org/releases/2025.2/documentation/userGuide.html), [acompanhamento do cursor VoiceOver](https://support.apple.com/en-ae/guide/voiceover/vo15534/mac). A versão do guia NVDA não constitui versão testada.

## Validação manual obrigatória — pendente

Nenhum leitor de tela foi executado nesta entrega. Preencher uma linha por combinação e cenário; não tratar ausência de resultado como aprovação.

| Combinação | Versões do SO/navegador/leitor e configurações | Resultado |
| --- | --- | --- |
| Windows + NVDA + Firefox | A registrar | Pendente |
| Windows + NVDA + Chrome | A registrar | Pendente |
| Windows + NVDA + Edge | A registrar | Pendente; apenas automação Edge disponível |
| macOS + VoiceOver + Safari | A registrar | Pendente |

Roteiro para cada combinação:

1. Entrar por Tab; verificar contexto de aplicação, nome da paleta e saída sem armadilha. Registrar necessidade de modo de foco/interação.
2. Percorrer e inserir os quatro tipos; transcrever comando, parâmetro, papel e instrução ouvidos.
3. Construir início → mover → girar → dizer. Verificar prévias, confirmação, foco visível e ausência de anúncios conflitantes.
4. Alterar 10 para 25, 15 para 45 e Olá para Oi; confirmar valor do campo e descrição do bloco atualizados.
5. Percorrer a cadeia, consultar sequência e conferir a ordem completa. Repetir a mesma mensagem e editar rapidamente para observar agrupamento de regiões vivas.
6. Separar uma cadeia, identificar condição solta/fora do início, reconectar por teclado e por controles de clique; cancelar movimento com Esc.
7. Excluir primeiro, intermediário e último bloco; conferir destino de foco, sequência restante e anúncio. Testar desfazer/refazer nativo.
8. Ativar/desativar rastreamento do mouse, passar sobre texto, campo, contorno e vazio. Registrar fala real e diferenças entre navegadores.
9. Verificar zoom 200%/400%, contraste, tamanho dos alvos, foco não encoberto, rolagem e uso com pessoas com deficiência visual.

Registrar por cenário: data, responsável, versões, configuração, passos, esperado, observado (incluindo transcrição), aprovação/falha e evidência. A meta WCAG 2.2 AA permanece **não certificada**.

## Recomendação

Continuar **condicionalmente** com Blockly: a linha 13 oferece teclado e leitores de tela no núcleo, e os quatro blocos usam os mesmos encaixes e campos para todos. Isso reduz a necessidade de manter navegação SVG própria. Fontes consultadas: [teclado](https://docs.blockly.com/guides/configure/keyboard-nav/), [leitores de tela](https://docs.blockly.com/guides/configure/screen-reader/) e [acessibilidade Blockly](https://blockly.com/accessibility).

Antes de expandir, resolver falhas encontradas na matriz manual, confirmar português das mensagens nativas e estabilidade do foco, avaliar experiência com crianças e pessoas com deficiência visual, e validar sincronização com o contrato persistido. Se falhas essenciais exigirem APIs privadas ou uma segunda interface, reavaliar um editor próprio com semântica integrada ao mesmo domínio. A automação desta PoC não autoriza declarar concluída a entrega de acessibilidade do roadmap.

## Ajuste de interação: ponteiro e início

Por solicitação do usuário, entrar com o ponteiro em um bloco da paleta ou do workspace publica sua descrição atual na região `status` e aplica contorno amarelo. Sair e voltar publica novamente, mesmo quando o texto é idêntico. Passar entre contorno, texto e campo do mesmo bloco não repete o anúncio; entrar em outro bloco conectado anuncia o bloco mais interno sob o ponteiro. O foco do teclado e a seleção de edição são preservados. O contorno indica o ponteiro, não o andamento da fala.

**Iniciar atividade** substitui **Ler sequência** e publica a sequência completa de uma vez, na ordem das conexões e com os parâmetros atuais. Sem início ou com múltiplos inícios, publica o diagnóstico correspondente. Acionamentos repetidos renovam o conteúdo da região. O anúncio é disponibilizado sempre, sem tentar detectar a presença de leitor de tela e sem sintetizador próprio.

O leitor recebe atualizações sem depender exclusivamente de seu rastreamento de mouse, mas pode agrupar, atrasar ou descartar anúncios conforme suas configurações. A sequência agora usa uma região de anúncio própria: o ponteiro atualiza somente a região de descrições e não substitui o texto da atividade. O leitor ainda pode agrupar ou interromper fala conforme sua política; a sequência pode ser anunciada novamente pelo botão. Testar manualmente com rastreamento ligado/desligado, entradas repetidas, passagem rápida entre blocos, campos, cadeias encaixadas e início repetido. Nenhuma fala efetiva foi validada automaticamente.

Validação do ajuste: build e lint aprovados; 13 testes unitários passaram. Os cinco cenários E2E anteriores passaram e a regressão de ponteiro/início passou após ajustar o alvo do teste para o texto visível do bloco (seis cenários cobertos, com reexecução direcionada dos dois de ponteiro). Inclui reentrada com mensagem idêntica, início repetido, programa sem início, cadeia ordenada e foco preservado. Leitores reais continuam pendentes.

## Simplificação da interface

A barra apresenta Entrar no editor → Escolher tipos de blocos → Desconectar bloco → Iniciar atividade. Foram removidos seleção textual, controles inferiores de conexão, resumo de cadeias e rodapé. A região de anúncios permanece montada e acessível, oculta visualmente por CSS, sem display:none, hidden ou aria-hidden. Não há conteúdo visível abaixo do workspace. Os relatos anteriores sobre os painéis e conexão por clique descrevem a versão anterior; essa operação por controles foi retirada a pedido do usuário. A sequência pode ser anunciada novamente por Iniciar atividade e os blocos continuam navegáveis no mesmo editor.

Validação da simplificação: build, lint e tipos aprovados; cinco cenários anteriores passaram e a regressão da nova barra passou em reexecução direcionada. A desconexão intermediária gera um único anúncio da ação, agrupando a reconexão automática dos vizinhos para não substituir a mensagem solicitada. A inspeção automatizada preserva acesso à região de status, mesmo sem conteúdo visual abaixo do editor. Fala com leitor real permanece pendente.

## Leitura sequencial ao iniciar

Iniciar atividade captura os blocos alcançáveis a partir de Quando iniciar, seguindo as conexões next e os parâmetros atuais. Publica toda a sequência em uma atualização atômica da região Sequência da atividade, separada da região Alterações do programa. Assim, não se tenta adivinhar por temporizador quando o leitor terminou um bloco. Blocos soltos não entram na lista de comandos; sem início ou com entradas ambíguas, anuncia-se o diagnóstico. O contorno continua identificando o ponteiro, sem simular sincronização com a fala.

Regressões verificam ordem dos quatro tipos, parâmetros editados, exclusão de bloco desconectado, início repetido e preservação do texto da sequência após hover. Validação de fala real permanece pendente.

## Categorias na página principal

A seleção de Movimento, Aparência ou Eventos atualiza a única paleta nativa do Blockly ao lado do painel de categorias. Controle, Operadores e Variáveis exibem estado vazio, sem criar blocos fictícios. Trocar categoria preserva o programa e o foco no botão acionado. O contêiner Blockly tem posicionamento relativo e a coluna central pode encolher sem sobrepor categorias ou palco. Em telas pequenas, mantém-se o empilhamento responsivo já existente.

Regressão automatizada cobre os limites geométricos em 1440, 900 e 600 pixels, filtragem, categoria vazia e inserção por teclado com preservação do programa. A leitura real com tecnologia assistiva segue pendente.
# Correção do palco na página principal — 2026-11-05

Na rota `/`, conecte “quando iniciar” a “mover 10 passos” e acione **Iniciar programa**: o personagem termina em x=10, y=0. Dez passos são unidades do palco lógico; o deslocamento visual é pequeno quando o palco está reduzido. A descrição acessível acompanha posição, direção e fala. Girar e dizer também usam o motor. Somente a cadeia ligada ao início é executada. Um novo início restaura a posição inicial; **Parar programa** cancela comandos pendentes. Não há salvamento automático nesta correção.

Validação automatizada: build e lint aprovados; regressão no Edge comprova deslocamento visual, estado acessível, reinício sem acumulação de posição, parada e erro de entrada vazia. Testes do motor cobrem sequência fora da ordem do array, comandos soltos, giro, bordas, fala, limites e cancelamento. A rota `/experiments/editor` preserva a PoC anterior de acessibilidade.

Validação manual pendente: NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari para sequência anunciada, resultado do palco, foco durante início/parada e reinício. As regiões vivas e o destaque visual não comprovam leitura completa nem sincronização com a fala. O intervalo visual de 300 ms não indica que o leitor terminou de falar.
