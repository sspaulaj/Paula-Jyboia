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

Python tem somente página preparatória. Sem evidências de execução Pyodide, input ou terminal até a prova técnica futura.

Os testes históricos de persistência no navegador continuam explicitamente suspensos, conforme o MVP; não foram contados como aprovados nem reativados para esta fase.
