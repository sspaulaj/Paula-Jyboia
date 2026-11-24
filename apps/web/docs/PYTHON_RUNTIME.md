# Fase C — prova de execução Python

Rota: `/python`. Use `pnpm dev` e abra `http://localhost:5173/python`; para conferir o artefato estático, `pnpm build:web` e `pnpm preview`, em `http://localhost:4173/python`. Não exige API, banco ou variáveis de ambiente.

## Implementação

Pyodide **314.0.8**, fixado no pacote web e no lockfile, executa em Worker de módulo. Os cinco arquivos necessários do runtime são servidos localmente no desenvolvimento e copiados para `dist/python-runtime/314.0.8` no build. O preview usa os arquivos emitidos, não um runtime substituto. Scratch não importa nem baixa Pyodide. Licença declarada do pacote Pyodide: MPL-2.0; fontes e distribuição em [Pyodide](https://github.com/pyodide/pyodide).

- `programs.ts`: exemplos predefinidos revisados, incluindo os cenários de erro e limites. Não é catálogo de blocos nem gerador.
- `runtime/protocol.ts`: mensagens, limites e protocolo de resposta UTF-8 em memória compartilhada.
- `runtime/controller.ts`: ciclo de vida independente de React; início, watchdogs, resposta, cancelamento, descarte e proteção contra mensagens antigas.
- `runtime/python.worker.ts`: carregamento do Pyodide, stdin/stdout/stderr e execução de um exemplo por Worker.
- `PythonPage.tsx`: seleção de exemplo, código consultável, terminal, formulário e foco.
- `runtime-assets.ts`: integração de desenvolvimento/build e cabeçalhos. É importado somente pela configuração Vite, não pela aplicação.

O Worker recebe o identificador de um exemplo permitido, nunca código editável enviado pela interface. Cada início cria Worker e memória de entrada novos. Conclusão, erro, Parar ou saída da página encerram o Worker. Eventos carregam `runId`; entradas incluem `inputId`. Respostas duplicadas, fora de ordem e eventos antigos não alteram a execução atual.

## input e cancelamento

O `input()` real usa `setStdin`. O prompt escrito por Python sem quebra de linha é enviado à interface; um campo HTML com label recebe a resposta. O Worker aguarda com `Atomics.wait`, enquanto React continua responsivo. A thread principal grava tamanho e bytes, publica a flag atômica e chama `Atomics.notify`. A execução continua do ponto de espera, sem repetir o programa.

Resposta vazia é diferente de ausência de resposta. O protocolo aceita até 4096 bytes UTF-8, rejeita múltiplas linhas e NUL e preserva acentos/emoji. Antes de usar TextDecoder, copia a região compartilhada para um Uint8Array comum: o Edge rejeita decodificação direta de SharedArrayBuffer. Essa falha apareceu nos primeiros testes e foi corrigida.

Parar chama `Worker.terminate()` na thread da interface, sem depender de mensagem que um Worker preso em laço ou input não conseguiria processar. A PoC usa cancelamento definitivo, não SIGINT cooperativo; variáveis internas não sobrevivem ao reinício.

| Limite | Aplicação |
| --- | --- |
| Inicialização | 30 segundos |
| Execução ativa | 5 segundos acumulados, descontando espera por input |
| Espera por resposta | 120 segundos por pedido |
| Saída | 8000 unidades UTF-16 ou 200 quebras de linha, o primeiro limite atingido |
| Entrada | 4096 bytes UTF-8, uma linha |

Watchdogs ficam na thread principal. O navegador pode atrasar timers em abas suspensas; não são garantias de tempo real. Não há limite rígido de memória WASM implementado. A lista fechada de exemplos e o término do Worker delimitam a PoC; não liberar execução de texto arbitrário com essas garantias.

## Hospedagem e segurança

SharedArrayBuffer exige contexto seguro (HTTPS ou localhost) e isolamento de origem. Vite e configuração Vercel aplicam COOP `same-origin` e COEP `require-corp` apenas a `/python`, `/python/` e ao Worker. Scratch permanece sem esses cabeçalhos adicionais. O Worker recebe CSP com script e conexões na mesma origem e permissão específica de compilação WebAssembly (`wasm-unsafe-eval`), sem `unsafe-eval` para JavaScript.

Não há CDN em execução, importação de pacotes Python, chamadas ao backend, acesso a armazenamento ou ponte JS oferecida aos alunos. Não foi adicionado `eval`, `Function` ou `window.prompt` ao código do Jyboia. O Pyodide contém recursos gerais de interoperabilidade e sistema de arquivos virtual; Worker e CSP não são uma sandbox perfeita para programas hostis. A proteção desta etapa depende também de executar somente exemplos revisados. A configuração de hosting foi preparada, mas não houve deploy.

Sem isolamento compatível, a interface informa que a execução está indisponível e não cria Worker. Não usa fallback bloqueante ou execução remota. Ao hospedar fora do Vite/Vercel, reproduzir os cabeçalhos e servir os arquivos do runtime com os tipos MIME corretos.

## Interação acessível

Tab alcança seletor, consulta do código e Iniciar/Parar. Iniciar move o foco para o terminal antes de alterar disponibilidade; cada pergunta recebe foco em campo nativo identificado pelo prompt. Enter envia inclusive uma resposta vazia. Antes de remover o campo ou indisponibilizar Parar, o foco retorna ao terminal. Os controles mantêm estados verdadeiros e guardas contra acionamento indevido.

A saída fica em texto selecionável e consultável por teclado. Uma região de estado anuncia conclusão, interrupção ou erro; resultados curtos acompanham esse resumo. Saídas longas são consultadas no terminal, sem anunciar cada linha em laços. Perguntas são comunicadas pelo foco/label, sem duplicação em região viva. Não há voz própria nem tentativa de controlar a fila interna do leitor.

## Validação

Comandos: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e:static` e `pnpm test:e2e`, executados sequencialmente. Os testes de navegador executam Pyodide real; os unitários verificam relógios, limites, mensagens antigas e protocolo isoladamente.

O roteiro automatizado cobre print; input Unicode/vazio; dois inputs; int e float; sintaxe e divisão por zero; conversão inválida; condicional/repetição; limite de saída; watchdog; Parar em laço, input e carregamento; reinício; falha de download; falta de isolamento; foco e teclado. Resultados finais ficam em [VALIDATION](VALIDATION.md).

**Pendências manuais:** NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari não foram executados. Verificar a pergunta falada ao focar, leitura dos resultados, ausência de anúncios concorrentes de estados, dois inputs consecutivos, cancelamento, erros, navegação do código/saída e zoom. Testes DOM não provam a fala nem conformidade WCAG. A execução em Firefox/Safari e equipamentos escolares também exige medição real.

As fontes técnicas consultadas estão em [PYTHON](PYTHON.md). Editor de blocos, geração, autenticação, persistência, API e AWS não integram esta entrega.
