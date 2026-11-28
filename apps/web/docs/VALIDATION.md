# Validação da modularização — 22/11/2026

## Encaixe automático e fluxo de tipos — 28/11/2026

`pnpm test`: 85 testes aprovados. TypeScript, ESLint e build de produção aprovados. `pnpm exec playwright test automatic-drop.spec.ts categories.spec.ts palette-label.spec.ts drag-feedback.spec.ts structured-editor.spec.ts execution.spec.ts execution-announcements.spec.ts --repeat-each=2`: **54 aprovações**, 27 cenários repetidos sem retries. Inclui soltar dois comandos longe dos encaixes e executar em ordem; repetição selecionada com corpo automático; Escape sem conexão; eventos independentes; botão → categorias → Enter → lista → setas → inserção; lista ao reconfirmar categoria; encaixe explícito, desconexão, foco, anúncios e palco preservados.

Na primeira rodada de nove cenários, seis passaram e três testes antigos de categorias falharam porque exigiam região de anúncios vazia após hover. Essa expectativa era anterior ao anúncio de categoria solicitado; foi atualizada para o nome de Controle. Os helpers também passaram a usar a entrada automática na lista, em vez de acionar novamente o botão que agora leva aos tipos. A rodada final acima verifica as novas expectativas. Não equivale a repetir toda a suíte nem resolver intermitências históricas fora dos cenários exercitados. Fala real com NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari permanece pendente. Sem commit, push ou deploy.

## Área completa da lista e anúncio do palco — 28/11/2026

Superfície SVG da paleta nomeada “Lista de blocos”; fundo vazio anuncia a área e blocos preservam suas descrições. Palco anuncia “Palco” ao entrar sem arrastar, mantendo o resultado semântico do canvas e prioridade da sequência. ESLint e build com TypeScript aprovados.

`pnpm exec playwright test palette-label.spec.ts pointer-hover.spec.ts execution-announcements.spec.ts --repeat-each=2`: **17 aprovações e uma falha**. Os dois cenários da lista/palco passaram nas duas repetições, incluindo espaços vazios, movimento dentro da área, personagem, reentrada, troca de categoria e teclado. Também passaram os testes de prioridade de execução nas duas repetições. Reapareceu no segundo ciclo a falha histórica de hover no editor (`pointer-hover.spec.ts`): esperava descrição completa do bloco conectado, recebeu “Conexão confirmada. Bloco de movimento: mover 10 passos.” O resultado não é considerado inteiramente aprovado nem a intermitência resolvida. Trace em `test-results`. NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari não executados. Sem commit, push ou deploy.

## Nome acessível da paleta — 27/11/2026

Paleta nomeada “Lista de blocos” pela mensagem nativa `WORKSPACE_LABEL_FLYOUT_WORKSPACE`. Removido o rótulo “Editor de blocos” do contêiner externo que englobava paleta e workspace; a região própria do workspace preserva esse nome. ESLint, build com TypeScript e o teste `palette-label.spec.ts` passaram: nome após trocar categorias, ausência de ancestral rotulado como editor e foco na primeira opção ao abrir pelo teclado. Fala real com NVDA ainda não verificada. Sem push.

## Hover, áreas de arraste e encaixes Scratch — 27/11/2026

Implementação: [SCRATCH](SCRATCH.md#ponteiro-e-arraste--27112026). `pnpm test`: 85 aprovados; `pnpm typecheck`, ESLint e build de produção aprovados. Build mantém o aviso conhecido de chunk Scratch acima de 500 kB.

Rodada final: `pnpm exec playwright test drag-feedback.spec.ts pointer-hover.spec.ts execution-announcements.spec.ts structured-editor.spec.ts --repeat-each=2`: **32 aprovações**, 16 cenários repetidos, sem retries, Edge/Chromium. Cobertura nova: região inteira de categoria e seus filhos; reentrada; retomada de hover após execução; paleta antes de clicar; arraste sobre edição e palco; anúncio de conexão sequencial antes de soltar; diferença entre corpo e continuação de repetição com confirmação estrutural após soltar. Regressões: hover parado, sequência prioritária, teclado de inserção, desconexão, exclusão e preservação de relações durante arraste.

As primeiras rodadas falharam no novo teste de loop porque as coordenadas estimadas e depois as coordenadas do banco de conexões não representavam a posição visual do bloco durante o arraste. O teste passou a ler o offset público da conexão e a matriz SVG atual; o encaixe continua feito por mouse real, sem conexão programática. Houve também erro de tipo no teste (`Connection` versus `RenderedConnection`), corrigido com verificação de instância. As rodadas finais acima ocorreram depois dessas correções.

Não foi repetida toda a suíte de navegador; a falha histórica de foco em parâmetros permanece fora desta correção, sem alegação de resolução. Testes reais NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari continuam pendentes. Conferir fala de áreas/encaixes, campos internos do loop e eventual anúncio nativo de papel do botão; DOM não prova fala. Não houve commit, push ou deploy.

## Faixa compartilhada de navegação — 24/11/2026

Marca transferida para `src/app/SiteHeader.tsx`, comum a Scratch e Python, com links nativos e página atual indicada por `aria-current`. Navegação de documento preserva COOP/COEP do Python e o descarte de memória já existente. Controles e execução permanecem nos módulos; sem autenticação ou tela inicial antecipadas.

ESLint, TypeScript e build de produção aprovados. Dez testes de navegador direcionados aprovados: três da faixa (troca por teclado e dimensões 360/1440), dois de rotas/execução, quatro de categorias e um do fluxo Python por teclado/input. Capturas inspecionadas para a faixa em 360 e 1440 pixels. A verificação responsiva nova cobre a faixa; não representa homologação de todo o editor em celular. Sem repetição da suíte completa ou de testes unitários para esta mudança de composição visual. Falhas intermitentes históricas abaixo permanecem abertas. Leitura real da navegação com NVDA/VoiceOver ainda exige validação manual. Nenhum push ou deploy nesta alteração.

## Baseline antes de mover arquivos

Na Fase A: 76 testes Vitest passaram; navegador completo apresentou 26 sucessos e 3 falhas, seguidas de sucesso isolado. Falhas: hover em `accessibility.spec.ts`, hover da PoC em `editor.spec.ts` e precondição de interceptação `prepareExecution` em `execution-refresh.spec.ts`.

Os dois primeiros mantiveram a mensagem anterior de conexão em vez da descrição esperada por hover. O terceiro falhou antes de iniciar: `servedPreviousContract` continuou falso. Isso não comprova falha de execução do programa.

Investigação Fase B: 15 cenários direcionados (cinco, repetidos três vezes) passaram; em seguida **58/58** passaram em duas execuções completas consecutivas, sem alterações no runtime. Na Fase A, `pnpm test`/`typecheck` recompilavam os mesmos `packages/*/dist` observados pelo Vite enquanto Playwright rodava. Essa interferência pode causar recarga e invalidar referências/eventos. É hipótese sustentada pela sequência de comandos e repetição controlada, não causa comprovada por captura de todos os eventos da falha.

Mitigação: executar verificações que compilam pacotes e suítes de navegador sequencialmente, sem alterar fontes durante os testes. A interceptação do teste HMR agora usa pathname (aceita query de cache do Vite) e conserva evidência de qualquer resposta transformada, em vez de sobrescrever o booleano. Não alterar código de hover/foco/execução para acomodar intermitência não reproduzida.

## Verificação após modularização

Testes adicionados cobrem resolução de rotas, execução em `/scratch`, isolamento da página `/python`, retorno por teclado e acesso direto/recarga no build estático. Testes existentes de hover, sequência, cancelamento e estados dos botões permanecem.

Verificação dos arquivos movidos contra o estado inicial: 23 mantêm o conteúdo e seis têm somente ajustes de imports. O CSS compilado Scratch manteve o hash `P_7EOQPF`. O motor e o adaptador funcional não foram reescritos.

| Verificação | Resultado |
| --- | --- |
| `pnpm test` | 78 testes aprovados, 16 arquivos |
| `pnpm test:integration` | 18 testes aprovados com PostgreSQL real em cluster local exclusivo, porta 55433; schemas isolados e sem alteração do banco anterior |
| `pnpm lint` | Aprovado |
| `pnpm typecheck` | Aprovado em todos os pacotes/aplicações |
| `pnpm build:web` | Aprovado; permanece aviso de chunk Scratch acima de 500 kB |
| `pnpm test:e2e:static` | 3 aprovados: acesso direto/recarga em ambas as rotas e construção/execução sem API ou persistência |
| `pnpm exec playwright test --repeat-each=2` | 62 aprovados: 31 cenários em duas execuções completas consecutivas após modularização, zero falhas e sem retries |
| `quick_validate.py` oficial | Oito skills válidas; PyYAML instalado somente em `.tools` para validação, sem dependência nova no produto |

As verificações acima foram executadas sequencialmente. A rodada longa de navegador da sessão interrompida não é contabilizada como concluída; seu resultado final não foi recuperado. A nova rodada completa repetida passou em 22/11/2026, com Edge 158.0.4370.33, Node 24.22.2 e pnpm 12.16.1. Nenhuma falha de asserção na rodada final. As três falhas anteriores permanecem registradas no baseline, sem alegação de eliminação universal da intermitência.

## Versionamento

Regras do `.gitignore` corrigidas para permitir instruções, oito skills, documentação por área, IaC futura, `.env.example` e configuração estática Vercel. Ambientes reais, `.aws`, `.vercel`, `.codex`, ferramentas/dados locais, chaves e artefatos CDK continuam excluídos. O exemplo de ambiente contém placeholder explícito.

Revisão de 176 arquivos candidatos: nenhum padrão de credencial/token/chave privada detectado; nenhum caminho sensível incluído. Links locais das novas instruções/docs verificados. Isso não constitui garantia absoluta de ausência de segredos. Não houve commit, push, deploy ou provisionamento AWS.

As suítes de navegador usam Edge/Chromium. O encerramento do servidor Vite pelo Playwright neste Windows pode ficar pendente após todos os resultados: finalizar somente o processo iniciado pela própria rodada permite obter o resumo, sem confundir mensagens do teardown com falhas de asserção.

## Limites de evidência

Repetições automatizadas reduzem incerteza, não provam ausência universal de intermitência. Se reaparecer, coletar trace, requisições/HMR e cronologia de anúncios antes de atribuir causa. Não habilitar retries para mascarar falhas.

NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari **não executados** nesta entrega. Permanecem pendentes: hover parado/reentrada, prioridade de sequência, foco antes de estados dos botões, interrupção, navegação de rotas e consulta pelo cursor virtual. Matriz canônica em [ACCESSIBILITY_VALIDATION](../../../docs/ACCESSIBILITY_VALIDATION.md).

Ao concluir a Fase B, Python tinha somente página preparatória. As evidências da execução implementada depois estão na seção Fase C abaixo.

Os testes históricos de persistência no navegador continuam explicitamente suspensos, conforme o MVP; não foram contados como aprovados nem reativados para esta fase.

## Fase C — execução Python em 22/11/2026

Implementação e limites: [PYTHON_RUNTIME](PYTHON_RUNTIME.md). Testes usam Pyodide 314.0.8 real em Worker, Edge 158.0.4370.33, Node 24.22.2 e pnpm 12.16.1. Não usam execução Python simulada nos cenários de navegador.

| Verificação | Resultado |
| --- | --- |
| `pnpm test` | 85 testes aprovados em 17 arquivos, incluindo sete novos testes de controlador/protocolo Python |
| `pnpm lint` | Aprovado |
| `pnpm typecheck` | Aprovado em todos os pacotes/aplicações |
| `pnpm build:web` | Aprovado; cinco assets Pyodide emitidos localmente (~13,5 MB antes de compressão); aviso anterior de chunk Scratch acima de 500 kB permanece |
| Build estático: `pnpm exec playwright test --config playwright.static.config.ts` | 21 aprovados: 18 cenários Python e três de rotas/MVP estático, sem retries |
| `pnpm test:e2e` | 47 aprovados e duas falhas Scratch em 49 testes; os 18 cenários Python passaram também em desenvolvimento |

Os dez cenários obrigatórios estão cobertos: print, input seguido de print, dois inputs, int, float, erro de sintaxe, erro de execução, Parar em laço infinito, Parar aguardando input e reinício. Também foram exercitados Unicode, resposta vazia, conversão inválida, condicionais/repetições, limite de saída, timeout de execução/entrada, cancelamento durante carregamento, falha de download, falta de isolamento e navegação por teclado/foco.

### Falhas investigadas, sem mascarar com retries

- A primeira rodada Python apresentou seis falhas de input em 13 testes. O TextDecoder do navegador rejeita views sobre SharedArrayBuffer; copiar os bytes após a sinalização atômica resolveu a causa. Os 13 testes passaram depois com Python real.
- Ao ampliar a suíte, o teste de teclado tentava Tab antes de a rota lazy estar renderizada. Agora espera o seletor visível. A interceptação de download passou a usar o contexto do navegador para atingir requisições do Worker, em cenário independente para não reutilizar módulo em cache.
- Uma rodada estática de 21 testes teve 19 sucessos e duas falhas: reinício ainda em carregamento após cinco segundos e falha de download ainda aguardando o watchdog. As asserções estavam desalinhadas com o prazo de inicialização de 30 segundos da aplicação. A suíte Python espera até 35 segundos nesses estados; Parar continua exigindo estado interrompido em até dois segundos. O download WASM abortado pode depender do watchdog de 30 segundos para encerrar; isso está coberto, não é recuperação imediata garantida pelo loader.
- A rodada estática completa seguinte passou 21/21. Isso confirma os cenários nessa execução, não ausência universal de intermitência. Não foram habilitados retries.
- Na regressão completa de desenvolvimento reapareceram duas falhas Scratch: `accessibility.spec.ts:27` esperava foco no campo (`role=button`) após ArrowRight, mas permaneceu no bloco operador (`role=figure`); `pointer-hover.spec.ts` esperava a descrição completa ao entrar no bloco, mas recebeu o anúncio anterior de conexão. O trace e o contexto de erro foram produzidos em `test-results`. O código Scratch, seu motor e versões de Blockly não mudaram; isso não comprova por si só a causa das falhas. Permanecem pendentes, sem reescrita ou alteração de comportamento fora do escopo Python.
- Rechecagem direcionada desses dois cenários, com `--repeat-each=3` e saída em `test-results/phase-c-recheck`: seis aprovações sem alterações. Esse resultado caracteriza a reprodução como intermitente nesta sessão; não elimina as duas falhas da suíte completa nem comprova correção. A investigação posterior deve comparar foco/frames de renderização e avisos pendentes no trace antes de alterar Scratch.

Scratch, `packages/block-engine` e backend permanecem sem alterações de código. Não houve persistência, novos endpoints, infraestrutura AWS, commit, push ou deploy. Testes PostgreSQL não foram repetidos nesta fase porque o backend não foi alterado.

**Validação manual pendente:** NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari. Confirmar pergunta pelo label/foco, dois inputs, consulta de código e saída, resultados falados, cancelamento/reinício e ausência de anúncios concorrentes dos botões. Testes automatizados de DOM/foco não comprovam a fala. Medir também inicialização e consumo de memória em equipamentos escolares. Esta entrega não declara conformidade assistiva homologada.

## Novos blocos Scratch — 28/11/2026

- `pnpm test`: 93 testes aprovados em 19 arquivos. Inclui limites de coordenadas/direção, ambos os ramos, continuação, conexões inválidas, espera/cancelamento da fala, concorrência entre falas, round-trip dos novos tipos e descrições atualizadas.
- `pnpm lint`, `pnpm typecheck` e `pnpm build`: aprovados. Permanece o aviso de chunk Scratch maior que 500 kB.
- `pnpm exec playwright test catalog-extension.spec.ts categories.spec.ts structured-editor.spec.ts automatic-drop.spec.ts execution-announcements.spec.ts --repeat-each=2`: 38 aprovações, 19 cenários em duas rodadas sem retries. Inclui inserção por teclado, execução dos movimentos, fala temporizada, novo condicional, categorias em três larguras, encaixe automático, desconexão e prioridade dos anúncios.
- Primeira rodada: 26 passaram e duas execuções do teste novo falharam ao tentar editar antes de o programa terminar. O teste aguardava apenas o desaparecimento do balão; agora aguarda também Iniciar disponível. As duas rodadas finais acima passaram com essa condição observável. As contagens da paleta foram atualizadas para o catálogo ampliado.
- O servidor Vite iniciado pelo Playwright precisou ser encerrado após todas as asserções, devido ao encerramento pendente no Windows; o resumo final da rodada corrigida teve saída 0.

Não foi repetida a suíte completa; intermitências históricas de hover/foco fora destes cenários não são declaradas resolvidas. Sem mudanças no Python/backend, sem áudio próprio, commit, push ou deploy. Pendente: NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari, especialmente navegação pelos dois corpos, edição de duração/direção e leitura da sequência. DOM e testes automatizados não comprovam fala real.

## Evento do personagem e identificação separada — 28/11/2026

`pnpm test`: 95 testes aprovados em 20 arquivos. `pnpm typecheck`, `pnpm lint` e `pnpm build`: aprovados; permanece o aviso de tamanho do chunk Scratch. Testes do motor distinguem início/clique, respeitam eventos desativados, impedem conexão anterior a evento e preservam a posição no clique. Round-trip inclui o novo tipo.

Navegador: actor-click, palette-label, categories, execution e execution-announcements executados com duas repetições. Os quatro cenários novos (clique/Enter/Espaço, fundo sem execução e Parar) passaram em ambas; também passaram identificação por hover, categorias, prioridade da sequência e estado dos botões. A primeira rodada teve 32 aprovações e quatro falhas de expectativa antiga: descrição do resultado mudou do canvas para uma imagem semântica separada, preservando o personagem como botão. O teste passou a consultar essa imagem, mantendo a exigência da descrição de movimento.

A rodada seguinte teve 35 aprovações e uma falha no teste antigo de Parar: `pauseAt(new Date())` tentou voltar ao passado. A primeira tentativa de ajuste pausava antes do carregamento e bloqueou o lazy loading (34 aprovações, dois timeouts). O ajuste final instala o relógio após navegação e pausa somente após construir o programa, usando o horário do navegador mais um segundo. Rechecagem final `pnpm exec playwright test execution.spec.ts --repeat-each=3`: **9 aprovações**, três cenários por três rodadas sem retries. Nenhuma alteração de produção foi necessária para essas falhas de teste. A suíte completa não foi repetida nem as intermitências históricas fora deste escopo declaradas resolvidas.

Vite foi encerrado por PID após concluir as asserções devido ao teardown pendente no Windows; a rechecagem final terminou com código 0. Manual pendente: NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari para identificação separada, Tab/Enter/Espaço, foco, ocultação do personagem, estados verdadeiros e leitura da sequência. Sem commit, push ou deploy.
