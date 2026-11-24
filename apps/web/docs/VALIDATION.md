# Validação da modularização — 22/11/2026

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
