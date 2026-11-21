# Validação assistiva do editor

## Hover sem repetição — 21/11/2026

- `pnpm test`: 76 testes aprovados; inclui reentrada rápida com texto idêntico e
  bloqueio de hover durante execução.
- Playwright/Edge 158.0.4370.33: 14 cenários existentes de editor, acessibilidade e
  execução aprovados. Os 2 novos cenários de `pointer-hover.spec.ts` passaram na
  execução final: paleta e editor, 10 segundos parado, eventos repetidos sem
  deslocamento, passagem entre campos, saída/reentrada e preservação de foco.
- Lint e build de produção (incluindo TypeScript) aprovados. O aviso prévio de
  tamanho do bundle permanece. Servidores de teste encerrados manualmente após os
  cenários, devido à limitação de encerramento automático neste ambiente Windows.
- NVDA/Firefox e NVDA/Chrome: não executados nesta alteração. Confirmar fala única
  enquanto parado, nova fala ao retornar e ausência de interferência no teclado.
  Testes de DOM não comprovam silêncio nem controlam anúncios próprios do leitor.

## Correção de prioridade — 18/11/2026

Revisão do clique após atualização: reproduzida falha ao executar com objetos do
editor/coordenador anteriores à introdução de `prepareExecution`/`beginSequence`.
O início agora tolera essas instâncias mantidas em memória durante Fast Refresh,
sem exigir recarregar e perder os blocos. Erros na inicialização também liberam o
estado de execução para permitir nova tentativa. Os dois testes de contrato anterior
falharam antes da correção; depois, os 7 cenários de `execution-refresh.spec.ts` e
`execution-announcements.spec.ts` passaram. Isso reproduz uma causa possível do
relato do usuário; não confirma o estado da página que ele estava utilizando.

Verificação automatizada no Windows/Edge 157.0.4341.60:

- `pnpm test`: 75 testes aprovados em 15 arquivos.
- `pnpm test:e2e`: 25 cenários aprovados; após os ajustes finais de cancelamento
  de dicas e retomada por movimento, repetidos os 8 cenários de `accessibility.spec.ts`
  e `execution-announcements.spec.ts`, todos aprovados, incluindo captura de erros
  do navegador nos casos novos. A paleta também passou nas três larguras testadas.
- `pnpm exec playwright test --config playwright.static.config.ts`: 1 cenário aprovado
  no build estático, sem API ou persistência (antes dos dois ajustes finais acima).
- `pnpm lint`, `pnpm build:web` (inclui TypeScript) e `git diff --check`: aprovados.
  Permanece o aviso de tamanho do bundle Blockly, sem erro de compilação.

Os servidores Vite de teste precisaram de encerramento manual após os cenários,
pois o encerramento automático de processos não concluía neste ambiente Windows.
Falhas intermediárias foram tratadas: expectativa antiga de anúncio de categoria,
instalação tardia do relógio simulado deixando uma dica com temporizador real e
retomada indevida de avisos por `pointerover` na saída de `inert`.

Não executado com NVDA/Firefox, NVDA/Chrome ou VoiceOver/Safari nesta correção.
Executar cada cenário por clique com ponteiro imóvel sobre Iniciar e por teclado.
Registrar versões, modo do NVDA, rastreamento de mouse, apresentação de objetos,
fala literal e interrupções no Visualizador de fala. Inspeção de DOM não confirma fala.

1. Quando iniciar → Diga Olá: ouvir “Quando iniciar programa. Diga Olá.” por inteiro,
   ver Olá no palco e verificar que a indisponibilidade de Iniciar não interrompe.
2. Quando iniciar → Mover 10 → Diga Olá: ouvir os três comandos em ordem, sem
   coordenadas automáticas; consultar o palco e encontrar a descrição do movimento.
3. Confirmar foco na leitura da sequência antes da mudança de estado de Iniciar,
   sem mover o ponteiro. Ao terminar, Iniciar disponível, Parar indisponível e foco
   ainda na sequência. Nenhum deslocamento do mouse deve ser necessário.
4. Navegar até Parar antes de iniciar: ouvir seu nome e indisponibilidade. Durante
   a execução, Tab da sequência deve chegar a Parar; ativar deve interromper de fato.
5. Reiniciar duas vezes, executar sequência longa/aninhada, interromper, tentar
   programa inválido e inserir bloco solto. Sem repetição por dois canais nem leitura
   de blocos desconectados; comandos internos com limites compreensíveis.
6. Voltar à paleta/edição: leitura sob ponteiro e teclado continua disponível.
   Categorias anunciam o nome solicitado e o estado atual conforme o leitor.
   Ir para X/Y preserva parâmetros acessíveis; mover junto à borda descreve apenas
   o deslocamento efetivo, sem inventar passos que não ocorreram.

Se houver interrupção pelo estado do botão mesmo com foco na sequência, registrar
como falha do cenário, sem declarar o problema resolvido. Não remover estados reais
nem ocultar controles para mascarar o resultado. Ver estratégia e limitações em
[ACCESSIBILITY](ACCESSIBILITY.md#prioridade-da-leitura-ao-iniciar--revisão-de-18112026).

## MVP estático — verificação manual pendente em 18/11/2026

Confirmar com NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari que o aviso Sobre seu trabalho é encontrado e compreendido antes da edição. Construir, editar, percorrer e executar pelo teclado; verificar sequência anunciada e resultados do palco. Recarregar deve apresentar editor vazio e o mesmo aviso. Não existem controles de login ou salvamento no MVP. Registrar versões e fala observada; nenhum teste real com esses leitores foi executado nesta fase.

## Histórico: integração de projetos — fora do MVP

Em NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari, registrar versões e executar somente com teclado: nomear, salvar, abrir lista, paginar, carregar, editar parâmetros, salvar novamente, executar e excluir. Confirmar foco após cada ação, anúncio único de resultado, leitura dos blocos recuperados e das conexões internas. Simular API indisponível e conflito de revisão; confirmar erro compreensível e preservação do trabalho. Testar aceitar/cancelar os diálogos nativos de descarte/exclusão e o aviso de saída com alterações. Nenhuma dessas combinações foi validada com leitor de tela real nesta integração; evidências automáticas estão em [INTEGRATION_VALIDATION](INTEGRATION_VALIDATION.md).

Data: 5/11/2026. Escopo: página `/`, catálogo completo e [exemplo estruturado](EDITOR.md). Nenhum teste com leitor de tela real foi executado nesta entrega. Não confundir observação de DOM/árvore acessível com fala percebida.

## Evidência automatizada desta entrega

| Comando | Resultado observado |
| --- | --- |
| `pnpm test` | 59 testes em 11 arquivos aprovados: regras, interpretação, conexões reais do Blockly, descrições e coordenação de anúncios. |
| `pnpm test:e2e` | 19 cenários aprovados no Edge 156.0.4314.58, via Playwright no Windows. Inclui regressão da PoC e do editor principal. |
| `pnpm exec playwright test apps/web/e2e/accessibility.spec.ts` | 3 cenários aprovados novamente após incluir anúncio explícito de estado/resultado. |
| `pnpm build` | Monorepo compilado; build do frontend repetido após o último ajuste. Aviso de bundle Blockly acima de 500 kB permanece, sem erro de compilação. |
| `pnpm lint` | Aprovado após as alterações finais. |

As evidências do ponteiro inspecionam nome, árvore acessível e foco. Não houve execução de NVDA, JAWS ou VoiceOver nesses testes. PostgreSQL não foi necessário para os cenários locais; integração de persistência não foi alterada nem revalidada nesta entrega.

## Matriz manual

| Ambiente | Versões/configuração | Resultado |
| --- | --- | --- |
| Windows + Firefox + NVDA | Preencher versões reais, voz/velocidade, modo de interação, rastreamento de mouse, informações de objeto e complementos. | Não executado |
| Windows + Chrome + NVDA | Preencher os mesmos dados; testar independentemente do Firefox. | Não executado |
| macOS + Safari + VoiceOver | Preencher versões, verbosidade, interação com grupos e acompanhamento de cursores. | Não executado; ambiente macOS não usado nesta entrega |
| Participantes com deficiência visual | Planejar mediação, tarefas e registro sem dados pessoais infantis. | Não executado |

## Preparação

Execute `pnpm dev:web`, abra a página principal e inicie o leitor. Registre revisão/arquivo da versão avaliada, data, sistema, navegador, leitor, configurações e teclado. Use o visualizador de fala quando disponível para registrar o que foi realmente dito; a gravação de DOM não substitui esse registro. Repita com rastreamento de mouse ligado e desligado e com modos de leitura/interação pertinentes.

## Cenários obrigatórios — todos pendentes

1. Percorrer categorias e paleta por teclado; identificar nome, seleção e descrição de cada um dos 16 tipos.
2. Construir o exemplo sem mouse: evento → movimento → repetição (movimento interno) → condição (operador e Dizer interno). Confirmar foco e ordem.
3. Percorrer campos, conexão booleana e corpo de cada controle; voltar ao pai e sair do workspace com Tab.
4. Alterar passos, giro, coordenadas, texto, contagem, espera, nome/valor de variável e operandos. Confirmar que bloco, campo e pai condicional comunicam os novos valores.
5. Conectar por teclado e por cliques sem arraste. Tentar colocar evento no corpo ou operador em sequência; confirmar que o destino não é oferecido.
6. Mover uma sequência com filhos, desconectar bloco interno e operador, excluir um contêiner. Confirmar continuidade do programa e destino do foco.
7. Fixar foco em “Iniciar programa” e mover apenas o ponteiro sobre corpo, texto, parâmetro e bloco interno. Registrar qual bloco foi anunciado, repetições e manutenção do foco. Distinguir leitura nativa por coordenadas da mensagem de status da aplicação.
8. Passar rapidamente por vários blocos e sair do editor; confirmar que não resta longa fila de anúncios obsoletos. Reentrar no mesmo bloco após uma pausa.
9. Iniciar o exemplo: ouvir início, numeração, níveis internos e finais. O bloco solto não deve ser enumerado como executado. Conferir programa e resultado de x=40, y=0, fala Olá.
10. Executar repetição zero, condição falsa e Sempre. A descrição inicial explica a estrutura; o palco segue somente os comandos executados. A sequência não é expandida infinitamente.
11. Construir dois eventos; conferir anúncio de rodízio e que uma espera/Sempre não impede outra sequência.
12. Parar e reiniciar rapidamente, inclusive programa idêntico. Foco permanece no controle acionado; mensagens antigas de edição não substituem início/parada.
13. Condição vazia e variável indefinida: mensagem compreensível, programa preservado, ação “Ir ao bloco com erro” alcança o alvo correto.
14. Consultar descrição inicial e resultado após a execução. Não deve haver leitura de cada quadro nem substituição imediata da sequência pelo término.
15. Ampliar a página a 200%/400%, avaliar contraste e foco visível; verificar operação sem cor, sem mouse e sem visão. Registrar barreiras separadamente da cobertura automatizada.

## Ficha de execução

Para cada combinação/cenário registrar: ID, ambiente e versões; programa inicial; teclas/cliques; foco esperado/observado; transcrição esperada/percebida; resultado (aprovado, falhou, não executado); evidência; limitação; responsável e correção necessária. Não preencher aprovação por inferência de testes automáticos. Anúncios concorrentes do navegador/leitor podem exigir revisão dos intervalos e da política antes de aceitação.
