# Arquitetura de acessibilidade

Ao tentar iniciar sem um bloco de início (editor vazio ou somente comandos soltos),
o aviso é publicado apenas na região de estado visualmente oculta, mantendo o foco
em Iniciar. Não há cópia desse aviso abaixo do palco. Os demais diagnósticos e os
atalhos para localizar blocos com erro permanecem disponíveis.

## Leitura única por entrada do ponteiro — 21/11/2026

Na paleta e no editor, o adaptador acompanha o bloco inteiro e a posição do
ponteiro. Permanecer no bloco, cruzar seus textos/campos ou receber novos eventos
de fronteira sem mudar a posição não agenda outra leitura. Sair efetivamente
cancela a leitura pendente e permite anunciar novamente ao retornar, inclusive
antes do intervalo de deduplicação de outras mensagens. Arrastar não anuncia
hover; foco e descrições por teclado continuam independentes.

Os testes verificam atualizações da região de estado, permanência, reentrada e
preservação do foco. Ainda é necessário validar com NVDA/Firefox e NVDA/Chrome:
parar sobre cada bloco por 10 segundos, cruzar seus campos e sair/voltar rapidamente.
O resultado esperado é uma leitura por entrada, sem loop. Esta regra controla os
anúncios do Jyboia; não comprova nem suprime falas próprias do rastreamento do NVDA.

## Prioridade da leitura ao iniciar — revisão de 18/11/2026

O fluxo anterior mantinha o foco em Iniciar ao mudar `aria-disabled` e publicava
a sequência na mesma região `status` das alterações de edição. Esses são canais
concorrentes: a prioridade `polite` não controla os anúncios de foco/estado do NVDA.
O nome dinâmico do palco também continha coordenadas, mesmo sem região viva no palco.
Esta análise identifica fontes no código; a ordem real da fala depende de teste assistivo.

Após validar o programa, a aplicação limpa os avisos de edição e renderiza a sequência
conectada em uma área de leitura junto aos controles. O foco vai para essa sequência
antes de Iniciar receber `aria-disabled="true"`. A atualização síncrona do DOM
(`flushSync`) garante essa ordem, sem aguardar um tempo estimado de fala. A sequência
não é uma região viva e não é publicada novamente em `status`: seu nome acessível
contém, por exemplo, “Quando iniciar programa. Diga Olá.”. Por solicitação de
21/11/2026, o texto permanece visualmente oculto, inclusive com foco, sem `hidden`,
`display: none` ou `aria-hidden`. O foco de teclado é indicado no grupo de controles;
permanece consultável e não é um segundo editor. O foco não retorna automaticamente
ao concluir; Tab a partir da leitura leva a Parar. Uma nova ativação repete a leitura
por foco, mesmo se o texto for idêntico. Programas inválidos mantêm foco em Iniciar
e comunicam o diagnóstico na região de estado.

Ambos os botões mantêm `aria-disabled` verdadeiro e guardas contra ativação indevida.
Parar continua focável e identificável como indisponível antes/depois da execução.
Mensagens de edição pendentes são descartadas e eventos tardios ficam bloqueados até
novo movimento do ponteiro, clique ou tecla. `pointerover` não reativa esses avisos:
o navegador pode emiti-lo quando o editor deixa de estar `inert`, sem movimento
do mouse. Erros e interrupção continuam comunicados; não há anúncio por quadro.
O adaptador cancela também dicas do Blockly e restaurações de foco pendentes da
inserção ao preparar a execução. Isso evita uma dica atrasada e impede que a última
inserção volte a tomar o foco da leitura.
As categorias têm nomes “Escolher blocos de movimento”, etc., com `aria-current`
para a categoria atual, sem duplicação por `aria-pressed` nem aviso adicional de paleta.

O palco mantém coordenadas internas, mas seu nome acessível apresenta ações como
“O personagem avançou 10 passos” e a fala atual. O deslocamento é calculado a partir
do resultado real, inclusive nos limites do palco. Ir para X/Y descreve a mudança
de posição sem narrar coordenadas de resultado. Os parâmetros explícitos de Ir para
X/Y continuam disponíveis nos blocos e na descrição do programa.

**Limite:** não existe API web para suprimir seletivamente uma fala do NVDA ou
confirmar o término da leitura. A solução reduz concorrência por foco, mas não
garante silêncio de anúncios nativos sob o ponteiro. Não usa `aria-hidden` nos
botões, estado falso, sintetizador próprio, atraso artificial ou foco em elemento
sem relação com a ação. Se o rastreamento de mouse ainda interromper a leitura em
uma combinação específica, registrar a fala e versões antes de alterar a estratégia;
a sequência permanece disponível para leitura pelo cursor virtual. Não exigir mover
o mouse nem desativar o rastreamento como condição de uso.

Referências: [WAI-ARIA: status e foco](https://www.w3.org/TR/wai-aria/#status),
[guia NVDA: configurações do mouse](https://api.nvaccess.org/documentation/userGuide.html#MouseSettings).
Os trechos históricos abaixo sobre foco permanecer em Iniciar e leitura inicial via
`status` são substituídos por esta revisão. Validação real ainda pendente.

## MVP em memória

Atualização posterior em 18/11/2026: o usuário solicitou remover o aviso de perda e os dois painéis completos, incluindo controles de organização e consulta de resultado. A interface atual não contém esses elementos. A descrição do palco e os anúncios de execução continuam acessíveis; os testes foram adaptados para operar diretamente pela paleta e pelo teclado do Blockly. Os parágrafos abaixo sobre o aviso e os painéis registram o comportamento anterior, não a interface vigente. Reavaliar manualmente as alternativas de conexão e consulta após esta remoção; a automação não comprova aceitação assistiva.

O aviso permanente Sobre seu trabalho fica antes do editor, visível e exposto semanticamente, associado à região principal por `aria-describedby`. Explica que o trabalho não será salvo e será perdido ao recarregar/fechar. Não usa alertas repetidos ou deslocamento de foco. Testar sua leitura com NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari; testes automatizados não confirmam fala. Teclado, nomes dos blocos e anúncios de execução permanecem no mesmo editor.

A inserção pelos controles nativos transfere o foco ao bloco após a renderização pendente do Blockly. Isso evita que o reposicionamento do SVG perca o foco durante a edição por teclado. A transferência adiada é descartada após desmontagem, nova inserção ou mudança do foco para outro controle.

## Histórico: operações de projetos integradas (fora do MVP)

A região Gerenciar projeto oferece campo Nome do projeto e botões nativos para novo, salvar, abrir e excluir, alcançáveis por Tab e acionáveis por Enter/Espaço. A lista de projetos usa botões com nomes individuais e paginação; ao abrir a lista, o foco vai ao primeiro botão disponível, e retorna a Abrir projeto após carregar ou fechar. Novo projeto move o foco ao nome. Salvar mantém o foco no botão durante a requisição. Operações ficam indisponíveis enquanto há outra requisição ou execução.

Resultados usam a mesma região de estado do editor: “Projeto salvo com sucesso.”, “Projeto carregado.”, “Projeto excluído.” ou mensagem de falha. Não anunciar cada digitação do nome. Indicador persistente informa alterações não salvas; confirmações nativas protegem descarte/exclusão. Carregar reconstrói descrições a partir dos valores e conexões recuperados, sem editor adicional. Testes automatizados verificam essas mensagens, foco e nomes; a fala real ainda depende da matriz manual.

Status: estratégia proposta, com meta WCAG 2.2 AA; não constitui declaração de conformidade. Requisitos: RF-01 a RF-09, RF-11 e RNF-05 a RNF-07 de [REQUIREMENTS](REQUIREMENTS.md).

## Um editor e um modelo

Editor, representação semântica e motor consomem o mesmo [ProjectDocument](BLOCK_MODEL.md). IDs identificam blocos e conexões em todos os componentes. Nome acessível, parâmetros, posição lógica e relações são derivados do documento, não de coordenadas ou hover. Alterações por teclado e mouse passam pelo mesmo controlador e regras.

O adaptador Blockly deverá integrar a semântica aos blocos do próprio workspace. Não criar uma segunda árvore de edição navegável em paralelo. Uma sequência textual somente para consulta pode complementar a orientação e os anúncios, sem constituir outro editor. Evitar duplicar leitura do mesmo bloco por duas representações expostas simultaneamente.

Priorizar HTML semântico em controles, formulários, regiões e mensagens. No workspace, usar as APIs de acessibilidade e foco suportadas pela biblioteca, verificando o resultado na árvore de acessibilidade do navegador. Não impor `role="application"` globalmente ou papéis ARIA sem implementar a interação esperada. Os padrões do [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) orientam widgets personalizados; a meta normativa é [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Semântica mínima do bloco

Expor comando, valores/unidades, estado selecionado, erros e conexão relevante. Exemplo: “Mover 20 passos, personagem Jyboia, comando 1 de 2, depois de Início, antes de Girar 90 graus”. A frase é ilustrativa; adaptar granularidade conforme navegação e testes para evitar repetição excessiva. Campos possuem rótulos e valores editáveis próprios; mensagem de erro é associada ao campo e ao bloco.

Blocos desconectados são identificados como fora da execução. Foco, seleção e bloco em execução são estados distintos. O palco tem nome e descrição de posição/orientação do personagem, sem depender da imagem ou da cor.

**Eventos de `mouseover` ou hover, isoladamente, não garantem leitura por leitores de tela.** Conteúdo essencial deve estar exposto semanticamente e alcançável por navegação apropriada. Dicas por hover também devem estar disponíveis por foco, ser dispensáveis e permanecer acessíveis conforme necessário.

## Teclado, arraste e foco

| Ação | Comportamento esperado |
| --- | --- |
| Entrar/sair do editor | Tab/Shift+Tab alcançam regiões e controles, sem prender o usuário no workspace. |
| Navegar blocos e parâmetros | Navegação estrutural da biblioteca, documentada em ajuda e testada com leitores. |
| Inserir/conectar/mover | Selecionar bloco e destino compatível por teclado; confirmar ou cancelar. |
| Alternativa ao arraste | Também permitir selecionar e escolher destino por cliques sem manter botão pressionado. |
| Editar campo | Abrir, alterar, confirmar/cancelar e retornar ao bloco de origem. |
| Excluir | Foco no sucessor disponível, predecessor ou workspace vazio; nunca no documento sem contexto. |
| Iniciar/parar | Controles nativos; manter foco e anunciar estado, sem saltar ao palco. |
| Carregar | Concluir atualização do documento antes de restaurar foco em destino válido; informar resultado. |

Atalhos de caractere ficam restritos ao contexto pertinente; verificar conflitos com leitores de tela. Definir combinações exatas após o protótipo Blockly, sem inventar uma camada incompatível com a biblioteca. Foco visível e não encoberto; campos e ajuda não podem depender apenas de cor. Revisar contraste, zoom/reflow e alvos de ponteiro como parte da interface completa, sem assumir que a natureza espacial do editor isenta todos os controles.

## Sequência e anúncios

Ao iniciar um programa válido, derivar do plano validado uma sequência com comandos e parâmetros, persistente e consultável. Publicar mensagem de início e sequência em região de anúncio apropriada, antes de avançar o motor. O leitor de tela recebe atualizações via navegador/sistema operacional; não chamar sintetizador próprio.

O navegador não confirma conclusão da fala. Não condicionar execução a suposta duração de áudio nem sobrescrever a sequência a cada frame. Separar conteúdo consultável, descrição atual do palco e mensagens de estado. O controlador de anúncios deve ordenar eventos relevantes e evitar que término imediato substitua a sequência ainda não percebida; a política concreta de agrupamento requer experimento com leitores reais. Enquanto não demonstrada leitura íntegra nos cenários aceitos, RF-06 permanece não atendido.

Durante execução, não anunciar todos os frames. Informar alterações relevantes e resultado final, permitindo consultar a sequência e o estado. Regiões de status não roubam foco; usar prioridade assertiva apenas para erros urgentes, não para cada passo. Reinício invalida mensagens pendentes da execução anterior. Testar mensagens idênticas, sequências longas, parar/iniciar e erros rápidos. Não presumir que várias mutações DOM serão todas faladas.

Programa inválido não anuncia uma execução fictícia. Exibir diagnóstico associado ao bloco/campo e fornecer ação para alcançá-lo. Falhas de salvamento preservam o programa e são anunciadas separadamente dos eventos de execução.

## Critérios de validação

Matriz inicial: NVDA/Firefox e NVDA/Chrome no Windows; VoiceOver/Safari no macOS. Registrar versões, sistema, configurações, passos, foco e anúncios observados. Combinação indisponível é “não executada”, nunca aprovada por inferência.

Validar construir, conectar, desconectar, editar, reorganizar, excluir, iniciar, parar e compreender resultado sem mouse e sem visão. Incluir alternativa por clique ao arraste. Combinar testes automáticos, inspeção semântica, testes manuais assistivos e avaliação com pessoas com deficiência visual conforme o roadmap.

Blockly só será adotado após evidências de RF-01 a RF-06 no protótipo integrado, inclusive campos personalizados e português brasileiro. Se não atender, registrar barreiras e avaliar adaptação ou outra base sem duplicar editor. Ver [decisão D-02](DECISIONS.md) e [sequência](diagrams/04-execution.md).

## Experiência implementada

Consulte [EDITOR_POC](EDITOR_POC.md) para comportamento dos quatro blocos, evidências automatizadas, limitações de leitura sob o ponteiro e roteiro manual ainda pendente. A existência dessa experiência não certifica conformidade WCAG nem conclui a matriz assistiva deste documento.

## Integração do editor principal — 5/11/2026

O editor `/` foi ampliado conforme [EDITOR](EDITOR.md). A representação implementada é a projeção local `block-engine/experimental`, não o documento persistido v1 citado na arquitetura alvo. Há somente um workspace mutável, com descrições e interpretação derivadas de seus IDs, parâmetros e conexões. O catálogo inteiro recebe nome acessível; campos possuem rótulos de tipo/unidade; Se incorpora os valores do operador conectado. Parâmetros confirmados atualizam também a descrição do bloco pai. Os controles “Organizar blocos sem arrastar” operam sobre esse mesmo workspace, sem outro documento ou modo assistivo.

### Teclado implementado

| Tarefa | Interação |
| --- | --- |
| Categorias | Tab/Shift+Tab entre botões; Enter/Espaço seleciona. A categoria comunica `aria-pressed`. |
| Paleta | Botão “Escolher tipos de blocos”; no editor, T. Setas escolhem bloco. |
| Inserir | Enter na paleta, setas escolhem encaixe, Enter confirma; Esc cancela. Também há seletor nativo e “Adicionar bloco”. |
| Percorrer/selecionar | “Entrar no editor”; setas percorrem blocos, entradas internas e campos conforme Blockly; I repete a descrição. |
| Conectar/mover | M inicia movimentação, setas escolhem destino e Enter confirma. Alternativa: selecionar bloco e encaixe em “Organizar blocos sem arrastar”, depois “Conectar sequência”. |
| Desconectar | Botão “Desconectar bloco” para seleção do workspace; ou “Soltar bloco escolhido” nos controles de organização. |
| Alterar parâmetros | Setas até campo, Enter abre, editar, Enter confirma, Esc cancela; retornar ao bloco pelas setas. |
| Excluir | Delete no bloco ou “Excluir bloco escolhido”. Contêiner exclui também seu corpo; continuação é preservada quando possível. |
| Sair | Tab/Shift+Tab; não há captura global de teclas. |
| Iniciar/parar | Botões nativos mantêm foco ao mudar estado, com `aria-disabled` e bloqueio da ação indisponível. Não deslocam foco ao palco. |
| Rever sequência e resultado | “Consultar programa e resultado”, ao lado do palco, contém texto de consulta da última execução e estado atual. Não edita o programa. |

Modos de navegação do leitor podem interceptar atalhos; verificar alternância entre leitura e interação na matriz manual. Não alterar atalhos nativos para impor outra navegação sem evidência.

### Quatro conceitos distintos de cursor

| Conceito | Responsabilidade |
| --- | --- |
| Ponteiro do mouse | Posição física sobre SVG, campos ou texto. O adaptador encontra o bloco mais interno e agenda seu nome sem selecionar ou focar. |
| Foco do teclado | Elemento ativo do navegador, usado por Tab e edição. Hover não altera `document.activeElement`. |
| Cursor virtual/revisão do leitor | Navegação própria da tecnologia assistiva; não é controlado pelo Jyboia e pode divergir do foco. |
| Cursor do editor | Nó estrutural mantido pelo Blockly para blocos, conexões e campos. Usa seu gerenciador de foco, não a posição do ponteiro. |

O nome completo existe na árvore acessível antes do hover. O ponteiro espera 180 ms no bloco; sair cancela a mensagem. Cruzar filhos SVG do mesmo bloco não repete anúncio. Arraste não provoca leitura contínua. Isso é uma solicitação via região viva, não garantia de fala ou de identificação nativa por coordenadas. Tooltips não são a solução de acesso.

O [manual do NVDA](https://download.nvaccess.org/documentation/en/userGuide.html#MouseSettings) documenta rastreamento de mouse (`NVDA+M`) e opções de informação do objeto; a experiência depende dessas opções e da exposição do navegador. O [guia VoiceOver](https://support.apple.com/en-mt/guide/voiceover/vo15534/mac) permite configurar relações entre ponteiro, cursor VoiceOver e foco. Fontes consultadas em 5/11/2026; são comportamento documentado dos produtos, **não testes executados no Jyboia**. Firefox/Chrome com NVDA e Safari com VoiceOver permanecem pendentes.

### Política de anúncios

- Uma região `role=status`, `aria-live=polite`, `aria-atomic=true` reúne mensagens próprias da página principal. O status nativo do Blockly continua responsável pelo foco/navegação; não foi removido nem substituído.
- Alterações em rajada são agrupadas por 150 ms; repetição imediata da mesma mensagem é suprimida por 600 ms. Esses tempos reduzem ruído, não estimam duração da fala. A última alteração da rajada prevalece.
- Iniciar cancela mensagens pendentes, anuncia início e descrição ordenada da cópia validada usada pelo motor. Blocos soltos não são enumerados como executados. A contagem de blocos fora da sequência pode ser informada separadamente.
- Estruturas aninhadas têm marcadores “Dentro da repetição/condição” e “Fim da repetição/condição”, com “Fim da sequência”. Repetições não são expandidas. A descrição inicial é explicitamente estrutural: não afirma que um ramo condicional será executado. Múltiplas sequências informam execução em rodízio.
- Durante execução, mensagens de edição/ponteiro são suprimidas. Alterações visuais do palco e destaque não disparam anúncios por quadro. A descrição atual do palco permanece acessível.
- Conclusão visual não sobrescreve a descrição inicial. O resultado pode ser consultado junto ao palco e anunciado explicitamente por “Anunciar estado e resultado”, inclusive o estado de conclusão. Parar e erros importantes publicam novas mensagens; iniciar novamente republica a sequência mesmo quando idêntica. Não há confirmação de término da fala nem controle sobre a fila nativa da tecnologia assistiva.
- Erros também são visíveis, preservam o programa e oferecem “Ir ao bloco com erro” quando há associação. Não há sintetizador de voz, detecção presumida de leitor, modo separado ou editor adicional.

### Evidência e aceitação

Testes automatizados verificam DOM, relações, foco, estados dos controles, atualizações da região viva, cancelamento de mensagens pendentes, ausência de anúncios por quadro e consulta persistente. Não comprovam pronúncia, ordem efetivamente falada nem ausência de duplicação com anúncios nativos. Roteiro e registro manual: [ACCESSIBILITY_VALIDATION](ACCESSIBILITY_VALIDATION.md). A integração de código está implementada, mas a aceitação assistiva e a conformidade WCAG AA permanecem abertas até testes reais e avaliação com usuários.
