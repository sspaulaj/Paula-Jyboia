# Python por blocos e palco terminal

**Estado em 22/11/2026:** arquitetura aprovada; Fase B prepara somente módulo e rota. Não há catálogo Python, gerador, Pyodide ou execução implementados. A decisão atual substitui a proposta anterior de apenas geração.

## Responsabilidades futuras

O módulo terá editor Blockly próprio, modelo estrutural, geração Python válida, visualização acessível do código e palco terminal. O usuário poderá iniciar/parar, observar `print`, responder a `input`, executar condicionais/repetições e compreender erros. Tudo ocorrerá no navegador; nenhuma execução Python no backend ou AWS.

Catálogo inicial: textos/inteiros/decimais/booleanos; atribuição e consulta de variáveis; `print`, `input`, `int`, `float`; `+`, `-`, `*`, `/`, comparações, `and`, `or`, `not`; `if`/`elif`/`else`, `for range`, `while`. Excluídos: classes, funções do aluno, imports/pacotes, arquivos, rede, sistema operacional e coleções avançadas.

## Modelo e geração

Definir `PythonProgram` independente de React/Blockly: IDs, parâmetros tipados, referências de variáveis, conexão seguinte, corpos/ramificações e entradas de valores. Uma sequência principal explícita determina a ordem; blocos soltos não são gerados silenciosamente. Validar referências, tipos, identificadores, profundidade e tamanho; diagnósticos referenciam bloco/campo. Não reutilizar o documento de personagens Scratch.

Investigar `PythonGenerator` de `blockly/python` como primeira opção, atrás de `generatePython(program): GenerationResult`. O resultado deverá incluir código, diagnósticos e mapeamento de linhas/blocos. Reutilizar precedência, indentação e escape de literais; adaptar `input()` e `range()` para semântica Python 3. A versão Blockly atual gera helper de compatibilidade no prompt e usa limite inclusivo no laço padrão; não apresentá-los como equivalentes diretos a `input`/`range`. Configurar quatro espaços. O grafo usado para descrição acessível é o mesmo da geração.

## Execução: Pyodide em Worker como primeira opção

Usar Worker de módulo dedicado, inicialização lazy, controlador TypeScript sem React e protocolo de mensagens versionado. React apresenta estado e formulários; não executa Python nem monta código por concatenação nos componentes. Pyodide não depende do motor Scratch. Fixar versão e assets somente depois da prova técnica; nenhum download de runtime ao abrir Scratch.

Contrato a validar na próxima etapa:

| Direção | Mensagens propostas |
| --- | --- |
| UI → runtime | iniciar com `runId`/código validado, responder `inputId`, parar, descartar |
| runtime → UI | pronto, saída, pedido de entrada, concluído, interrompido, erro |

Todas as mensagens de execução carregam `runId`; pedidos/respostas incluem `inputId`. Ignorar mensagens de execução anterior. Estados propostos: carregando, pronto, executando, aguardando entrada, interrompendo, concluído, interrompido, erro. Iniciar indisponível durante execução/entrada; Parar disponível durante carregamento e execução. A política de foco e prioridade precisa ser validada, sem copiar dependências de palco Scratch.

## Investigação de input sem bloquear a interface

A API `setStdin` é síncrona: uma Promise entregue ao callback não resolve automaticamente o `input()` Python. Proposta preferencial para o spike: Worker publica o pedido, espera em buffer compartilhado e a thread principal continua atendendo formulário e Parar. `Atomics.wait` somente no Worker, com espera limitada e checagem de interrupção. Definir protocolo UTF-8, tamanho máximo, entrada vazia, EOF/cancelamento, sinalização e identificação para não consumir respostas antigas. Não repetir todo o programa após cada resposta, pois duplicaria efeitos.

Esse caminho requer contexto seguro, `SharedArrayBuffer` e isolamento entre origens, normalmente COOP/COEP. Avaliar cabeçalhos e todos os assets no hosting estático sem quebrar Scratch; não habilitá-los globalmente nesta fase. Caso indisponíveis, não bloquear a thread principal nem recorrer a execução remota: apresentar execução indisponível e manter edição/geração, até alternativa aprovada. Uma ponte assíncrona via transformação de código só poderá ser adotada após prova de equivalência, não por substituição textual de `input`.

## Parar, limites e segurança

Investigar buffer de interrupção Pyodide para encerramento cooperativo. Manter `Worker.terminate()` como cancelamento definitivo/timeout, recriando runtime limpo; também cancelar input pendente e ignorar mensagens tardias. Não depender exclusivamente de `postMessage('stop')` em Worker ocupado por laço síncrono.

Worker evita bloquear o DOM, mas **não é sandbox suficiente para código hostil**: Pyodide possui interoperabilidade JavaScript, acesso a capacidades do Worker e sistema de arquivos virtual. O MVP deverá executar somente código derivado do catálogo permitido, sem edição livre executável, imports ou pacotes do aluno. Validar modelo, gerar literais escapados e não oferecer ponte genérica JS. Revisar CSP, origens de assets, rede e limites antes de liberar runtime.

Definir e medir limites de blocos/profundidade, tempo ativo, tamanho de entrada e volume de saída; impor orçamento de saída e watchdog na thread principal. Memória do WASM também exige medição e política de recriação, sem prometer limite rígido que o navegador não oferece. Não incluir segredos nem dados de autenticação no Worker. Não persistir programas ou entradas; cache de assets do runtime é distinto de armazenamento de projetos.

## Gates antes da entrega funcional

1. Spike isolado de Worker: `print`, dois inputs, Unicode/vazio, erro de conversão, laço infinito, parar durante input/carregamento e reinício; verificar cabeçalhos em hospedagem estática.
2. Modelo/catálogo/geração: ordem explícita, aninhamento, precedência, nomes e escapes, testes de sintaxe e mapeamento de erros.
3. Terminal e integração: logs limitados, formulários acessíveis, descarte de eventos antigos e estado verdadeiro dos controles.
4. Leitores reais e dispositivos escolares: teclado, fala, responsividade, latência de inicialização e cancelamento. Não declarar viabilidade antes dessas evidências.

## Fontes consultadas em 22/11/2026

- [Blockly: geração por bloco](https://docs.blockly.com/guides/create-custom-blocks/code-generation/block-code/).
- [Pyodide: Worker](https://pyodide.org/en/stable/usage/webworker.html): execução fora da thread da interface e Worker de módulo.
- [Pyodide: streams](https://pyodide.org/en/stable/usage/streams.html): stdin/stdout/stderr e espera interrompível no Worker.
- [Pyodide: interrupção](https://pyodide.org/en/stable/usage/keyboard-interrupts.html): buffer compartilhado e sinais.
- [MDN: SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer): restrições de isolamento/contexto seguro.

Essas fontes fundamentam a proposta; não substituem prova local de compatibilidade. Nenhuma versão Pyodide foi instalada ou homologada nesta fase.
