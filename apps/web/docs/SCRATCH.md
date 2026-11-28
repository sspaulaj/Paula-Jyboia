# Módulo Scratch

O módulo encapsula o editor existente, sem reescrita, em `src/modules/scratch`. A interface pública do módulo é `index.ts`; rotas não devem importar seus componentes internos, exceto a PoC de desenvolvimento.

## Fluxo de categorias e encaixe automático — 28/11/2026

“Escolher tipos de blocos” foca a categoria atual na região “Tipos de blocos”. Tab continua disponível; setas percorrem categorias e Home/End alcançam os extremos. Enter/Espaço ou clique confirmam a categoria e levam o foco diretamente ao primeiro bloco da lista correspondente, inclusive ao confirmar a categoria já ativa. Setas percorrem a lista; Enter inicia a inserção e Enter confirma o destino conforme o teclado nativo Blockly. O atalho T do editor continua abrindo diretamente a lista.

Ao soltar com o ponteiro numa área livre do editor, um comando ainda desconectado é encaixado automaticamente após o destino de referência, preservando a cadeia existente. A referência é a seleção anterior ao arraste; se ausente ou pertencente à cadeia arrastada, usa-se o último bloco da última sequência iniciada. Para um contêiner como Repetir/Se escolhido como destino, usa-se seu corpo, acrescentando ao final se já houver comandos. Um encaixe explícito feito perto de uma conexão sempre prevalece, inclusive para continuar depois de um loop. Eventos criam sequências próprias; operadores só entram em condições compatíveis e livres. Sem destino compatível, não se inventa um evento nem se conecta uma estrutura inválida.

O encaixe automático usa `canConnect` do motor e as conexões nativas, sem segundo programa ou confirmação adicional. Aplica-se somente à soltura efetiva dentro do editor, fora da paleta; não ao cancelar com Escape, sair da área, pressionar Desconectar ou apenas mover o ponteiro. Revalida a existência dos blocos após o encerramento do arraste e preserva conexões já confirmadas. Esta regra substitui a orientação anterior de deixar o bloco solto ao largar no espaço vazio.

Preservar catálogo, múltiplas sequências, encaixes, parâmetros, exclusão, teclado, descrições, hover uma vez por entrada e controles Iniciar/Parar. O início parte da posição atual do personagem; mover altera X conforme a decisão do produto, mesmo após giro.

O adaptador em `experiment/blockly-adapter.ts` ainda é usado em produção. A PoC em `/experiments/editor` só existe no servidor de desenvolvimento. O motor e os documentos v1/v2 continuam inalterados em `packages/block-engine`.

Prioridade assistiva: limpar mensagens pendentes, apresentar a sequência conectada e focá-la antes de indisponibilizar Iniciar; não publicar a mesma sequência também em região viva. Sequência e aviso de programa sem início permanecem visualmente ocultos. Parar mantém estado verdadeiro e cancela comandos pendentes. Não alterar esse fluxo para atender ao Python.

Contratos detalhados e evidências existentes: [editor](../../../docs/EDITOR.md), [modelo](../../../docs/BLOCK_MODEL.md), [acessibilidade](../../../docs/ACCESSIBILITY.md).

## Ponteiro e arraste — 27/11/2026

Atualização de 28/11/2026: a superfície SVG inteira da paleta recebe o nome “Lista de blocos”, incluindo o fundo vazio e a área ao redor da rolagem. Hover em espaço vazio anuncia “Lista de blocos”; sobre um bloco, mantém sua descrição específica. O palco recebe o nome “Palco” e anuncia esse texto uma vez ao entrar sem arrastar. Cruzar o personagem não repete; sair e voltar permite nova leitura. A descrição semântica do resultado continua no canvas e a sequência de execução mantém prioridade.

Categorias anunciam o nome ao entrar em qualquer parte do botão, sem clicar nem mover foco. Cruzar texto/ícone dentro do mesmo botão não repete; sair e voltar permite nova leitura. Na paleta, o adaptador trata também retângulos de captura SVG que não são filhos do bloco, e observa eventos na fase de captura. Pares de saída/entrada internos não consomem a coordenada antes da entrada real. Mantém uma descrição por entrada, sem repetição com o mouse parado.

Durante arraste, o anunciador informa mudanças entre paleta, área de edição, palco, categorias e fora da edição. Na edição distingue espaço sem encaixe de um destino válido. Um previewer complementa os marcadores nativos do Blockly; o anúncio usa a mesma conexão candidata que o encaixe visual, não aproximações geométricas próprias. Se uma substituição desconectar outro bloco, informa esse efeito. Não conecta automaticamente ao bloco mais próximo fora das regras da biblioteca. Mensagens são deduplicadas por destino/área e continuam subordinadas à sequência de execução.

Lógica de repetição: encaixe **dentro** do bloco coloca comandos no corpo repetido; encaixe **depois** coloca comandos na continuação, executada após terminar o loop. Novos comandos podem ser encaixados depois dos anteriores dentro do corpo. `Sempre` não chega à continuação durante execução normal, apenas permite interrupção. O campo de condição continua reservado a operadores compatíveis. Teclado preservado: Enter na paleta, setas para escolher destino e Enter para confirmar; M para mover, Esc para cancelar. Não há editor paralelo.

O plugin utiliza a API pública [Connection previewers do Blockly](https://docs.blockly.com/guides/create-custom-blocks/inputs/connection-previews/), mantendo o preview padrão. Mouseover não garante fala nativa: NVDA pode acrescentar papel/estado conforme suas configurações; não se remove a semântica de botão para silenciá-lo. Validar manualmente NVDA/Firefox e NVDA/Chrome: borda do botão versus texto, paleta antes de clicar, mouse parado, troca de áreas segurando bloco, corpo/continuação da repetição e prioridade de Iniciar. A inspeção DOM não homologa fala real.

Decisão técnica: estender `InsertionMarkerPreviewer` por workspace em vez de calcular proximidade ou modificar métodos privados do arrastador. Isso preserva compatibilidade de conexões, inserção sequencial e estrutura única, e vincula anúncio/preview ao mesmo destino. O plugin remove listeners e timers no descarte. Revalidar esse contrato ao atualizar Blockly.

## Ampliação do catálogo — 28/11/2026

Adicionados Alterar X, Alterar Y, Apontar direção, Dizer por N segundos e Se… então… senão, nas categorias existentes. Sem categoria de sons. Todos usam os mesmos blocos Blockly, modelo e motor, com parâmetros e descrições acessíveis atualizados.

Alterar X/Y aceita inteiros entre -480 e 480 e limita o resultado ao palco (X: -240…240, Y: -180…180). Apontar direção aceita -360…360 graus, normalizados para 0…359; zero aponta para a direita. Mover continua alterando X independentemente da direção, conforme decisão anterior.

Dizer por N segundos aceita 0…30 segundos e até 120 caracteres. Mostra a fala, aguarda sem bloquear a interface, limpa o balão e continua. Uma fala posterior de outra sequência não é apagada pelo temporizador anterior. Parar cancela a espera. O limite global de execução de 30 segundos continua valendo.

Se… então… senão contém uma entrada booleana e dois corpos: BODY (verdadeiro) e ELSE (falso). Só o ramo escolhido executa; depois segue a continuação. O anúncio inicial descreve ambos como estrutura, com marcadores Então, Senão e Fim da condição. O espaço Senão possui rótulo próprio e anúncio de encaixe por arraste. Use a navegação nativa por setas/M/Enter para escolher esse destino; o encaixe automático em espaço vazio continua escolhendo o primeiro corpo, sem adivinhar o ramo desejado.

Não foi adicionado áudio da aplicação: o requisito confirmado é som exclusivo do leitor de tela, sem aceitar bipes ou síntese da aplicação. A interface web não oferece canal para emitir áudio exclusivamente pelo NVDA. Permanecem as descrições e os anúncios semânticos existentes; não há detecção presumida de leitor nem voz própria. Testar manualmente leitura dos parâmetros, navegação pelos dois corpos e prioridade da sequência com NVDA/Firefox e NVDA/Chrome.

## Palco e evento do personagem — 28/11/2026

O palco é a região “Palco”; o personagem é um botão separado chamado “Personagem Jyboia”, com foco visível, acessível por Tab e acionável por clique, Enter ou Espaço. O canvas não usa mais role=img envolvendo o controle (isso ocultaria a semântica dos descendentes). A descrição atual do resultado continua disponível como imagem semântica somente para leitura. Hover distingue fundo do palco e personagem; atravessar a imagem interna não repete a identificação. Esconder remove o personagem também da navegação enquanto estiver invisível.

A categoria Eventos inclui “Quando o personagem for clicado”. Esse bloco inicia uma sequência, não aceita predecessor e pode ser inserido por teclado. Clique/Enter/Espaço seleciona somente as sequências desse evento; Iniciar programa seleciona somente Quando iniciar. Clicar no fundo do palco não executa. Sem evento de clique, o personagem não inicia comandos. O evento usa a mesma apresentação acessível da sequência, destaque e controles Iniciar/Parar. Repetir o clique após concluir parte do estado atual do personagem.

Mantida a política atual de uma execução por vez: durante execução o botão do personagem informa indisponibilidade e não inicia outra execução. Parar interrompe também sequências de clique. Não há fila de cliques nem concorrência nova com um programa já em execução. NVDA/Firefox e NVDA/Chrome precisam validar identificação separada, foco, acionamento e prioridade da sequência; nenhum teste automatizado comprova a fala real.
