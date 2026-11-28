# Modelo de blocos e execução

Atualização do MVP em 18/11/2026: o controlador fornece ao motor a posição e direção atuais do personagem a cada início. Executar novamente ou retomar após parar não centraliza o palco. As descrições históricas abaixo de reinício em (0, 0) foram substituídas para o editor atual; esse continua sendo o padrão de uma página nova.

Status: versões 1 (legada, abaixo) e 2 (editor integrado) aceitas pela API. Modelo v1 em `packages/block-engine/model`, modelo v2 em `packages/block-engine/editor-document`; interpretação independente em `packages/block-engine/runtime`.

## Documento do editor integrado — versão 2

`EditorDocument` contém `schemaVersion: 2`, `program`, `initialState` e `layout`. `program` contém todos os blocos (inclusive soltos) e `entryBlockIds`, lista explícita dos eventos ativos. Cada bloco tem `id`, `kind`, `next` e parâmetros tipados conforme o catálogo em [EDITOR](EDITOR.md). Controles possuem `body`; `if` possui também `condition`, que referencia um operador booleano. Campos sem conexão usam `null`.

IDs têm de 1 a 128 caracteres imprimíveis e são preservados na importação, inclusive IDs gerados por Blockly. A ordem dos comandos segue as conexões; a posição no array não substitui `next`/`body`/`condition`. Múltiplas entradas são executadas pelo agendamento cooperativo do motor. `initialState` contém x, y e heading do único personagem. `layout` armazena posições dos blocos raiz; filhos são posicionados pelo encaixe, sem influenciar a execução.

O schema rejeita campos extras, tipos desconhecidos e referências inválidas. Limites: 200 blocos, 20 níveis internos e corpo HTTP de 256 KiB. Giro no domínio usa graus negativos para direita (de -360 a 0); a interface apresenta magnitude positiva. O domínio não contém SVG, HTML, dependências de Blockly ou código executável.

Ao abrir v1, `upgradeDocument` converte explicitamente os quatro tipos legados, preservando IDs, parâmetros, estado inicial e entrada ativa. A orientação final do giro é mantida. Identidade/nome do personagem legado não fazem parte do formato v2 de personagem único. A API só recebe a versão convertida quando o usuário salva. O carregamento valida o documento e testa a reconstrução em workspace temporário antes de alterar o editor; se um campo for coercido pela biblioteca, a importação é rejeitada para evitar perda silenciosa.

## Documento persistível

`ProjectDocument` contém exatamente `schemaVersion`, `program`, `actors` e `layout`. Título, revisão e metadados de servidor pertencem ao recurso da API. IDs locais seguem `[A-Za-z][A-Za-z0-9_-]{0,63}`; blocos e personagens têm IDs únicos nas respectivas coleções.

| Campo | Contrato v1 |
| --- | --- |
| `schemaVersion` | Inteiro literal `1`; versões desconhecidas são rejeitadas. |
| `program.entryBlockId` | ID de bloco `start` ou `null` em rascunho. |
| `program.blocks` | Lista incluindo blocos desconectados; ordem da lista não determina execução. |
| `actors` | Exatamente um personagem v1 com `id`, `name` (1–80 caracteres) e `initialState` contendo `x`, `y`, `heading`. |
| `layout` | Lista de `{blockId, x, y}`; posição opcional para cada bloco, sem IDs duplicados ou inexistentes. Não muda execução. |

Cada bloco tem `id`, `type`, `parameters`, `next`. `next` é ID ou `null`; não persistir `previous`, que é derivado. Rejeitar campos desconhecidos na v1. Texto é dado, nunca HTML. Números são finitos; strings não aceitam NUL ou sequências Unicode inválidas.

### Exemplo completo

```json
{
  "schemaVersion": 1,
  "program": {
    "entryBlockId": "start1",
    "blocks": [
      {"id": "start1", "type": "start", "parameters": {}, "next": "move1"},
      {"id": "move1", "type": "move", "parameters": {"actorId": "actor1", "steps": 20}, "next": "turn1"},
      {"id": "turn1", "type": "turn", "parameters": {"actorId": "actor1", "degrees": 90}, "next": null}
    ]
  },
  "actors": [
    {"id": "actor1", "name": "Jyboia", "initialState": {"x": 0, "y": 0, "heading": 0}}
  ],
  "layout": [{"blockId": "start1", "x": 24, "y": 24}]
}
```

## Tipos e conexões

| Tipo | Parâmetros | Entrada de sequência | Saída |
| --- | --- | --- | --- |
| `start` | Objeto vazio | Nenhuma | `next` para `move` ou `turn` |
| `move` | `actorId`, `steps` inteiro de -480 a 480 | Uma no máximo | `next` para `move` ou `turn` |
| `turn` | `actorId`, `degrees` inteiro de -360 a 360 | Uma no máximo | `next` para `move` ou `turn` |

Referências devem existir. Proibir autorreferência, dois predecessores e ciclos, inclusive em cadeias desconectadas. Encaixes refletem essas regras. A API aceita rascunho vazio ou sem entrada executável, mas não tipos, parâmetros ou conexões estruturalmente inválidos.

`validateDocument` verifica estrutura persistível; `validateExecutable` exige adicionalmente exatamente um `start`, identificado por `entryBlockId`. `start` sem comandos é válido sem efeitos. Blocos desconectados são preservados e geram aviso, sem execução. Múltiplos `start` podem existir num rascunho estrutural, mas bloqueiam execução.

Criar índice por ID, verificar referências/ciclos e percorrer `next` desde a entrada. A representação intermediária v1 é uma sequência imutável, caso linear de uma árvore de execução. Preservar IDs para diagnósticos e eventos. Não ordenar por coordenadas ou ordem de chaves JSON.

## Estado e semântica

Palco lógico de 480 × 360 unidades, origem central: x entre -240 e 240, y entre -180 e 180. `heading` inicial em [0, 360); 0 aponta à direita, 90 para cima, giro positivo anti-horário. Estado inicial tem valores finitos dentro dos limites.

`move`: soma `steps` à posição X, limitada a [-240, 240], mantendo Y e a direção atuais. Passos positivos avançam para X positivo; negativos recuam. O giro não altera esse eixo de movimento, conforme solicitação de 18/11/2026. O limite refere-se ao centro do personagem. `turn`: soma degrees e normaliza para [0, 360), alterando a orientação visual. Após o movimento, arredondar X para seis casas decimais e normalizar -0 para 0. O renderer adapta ao eixo vertical da tela. Movimento é transição lógica atômica com interpolação visual opcional.

O exemplo termina em x=20, y=0, heading=90. Resultado final é transitório: salvar não substitui `initialState` automaticamente.

## Contrato de execução

Operações conceituais: validar, preparar plano, criar execução, avançar um passo e cancelar. Nomes concretos de funções serão definidos na implementação.

Eventos possuem `runId`, `sequence` inteiro crescente desde 1 e `type`. Eventos de comando têm `blockId`; alterações de personagem têm também `actorId` e estado completo posterior. Ordem: `runStarted`; para cada `move`/`turn`, `commandStarted` e `actorStateChanged`; exatamente um terminal `runCompleted`, `runCancelled` ou `runFailed`. Nenhum evento após terminal. `start` define entrada, não movimento. O plano inclui entrada e comandos para descrição acessível; a trilha registra o que ocorreu.

Cancelamento é observado antes do próximo passo, preservando estado produzido. Falha devolve diagnóstico e último estado válido. Relógio injetado mede duração; agendamento fica no frontend. Mesmas entradas produzem mesmas transições, exceto interrupções externas e limites de tempo.

## Limites e segurança

Proposta inicial: até 200 blocos, 1.000 passos e 30 segundos por execução, checando cancelamento entre passos. Na v1 linear, o limite de blocos já restringe passos; os demais são defesa adicional. Documento e envelope de gravação devem caber em 256 KiB HTTP. Coordenadas de layout ficam entre -100000 e 100000. Valores serão revisados com evidências de desempenho; não são resultados de benchmark.

Interpretar somente operações conhecidas; proibir `eval`, `Function`, scripts, imports e URLs executáveis vindos de projetos. Reconstruir objetos com campos permitidos após parsing; não mesclar entradas arbitrárias em protótipos ou configurações. O servidor valida, mas não executa para aceitar um documento.

## Serialização e evolução

JSON UTF-8 sem funções, objetos Blockly, foco, seleção, execução ativa ou caches. Round-trip preserva IDs, parâmetros, conexões, estado inicial e layout; não exige igualdade de espaços ou ordem de propriedades.

`schemaVersion` difere de revisão de salvamento e versão da API. Migrações serão explícitas e testadas, preservando o original em falha. Versão desconhecida não é convertida silenciosamente.

Condicionais e repetições não integram v1. Exigirão decisão de formato com filhos tipados para corpo/ramos, limites de profundidade e expressões permitidas; não serão ciclos arbitrários de `next`. Descrição estrutural não é trilha executada. Ver [diagrama](diagrams/03-blocks.md).

## Implementação da persistência inicial

A API armazena este documento em `workspaceData`, acompanhado de `formatVersion: 1`. A validação JSON Schema e de grafo foi implementada em `block-engine/validation`; tipos continuam acessíveis em `block-engine/model`. Não há implementação de interpretação nova nesta etapa.

O primeiro formato efetivamente persistido inclui também `say`, para preservar o bloco já presente na PoC: parâmetros `{actorId, text}`, com personagem existente e texto de até 120 caracteres (sem NUL/Unicode inválido). `say` possui as mesmas conexões de sequência de `move`/`turn`; `next` de qualquer bloco pode apontar para `move`, `turn` ou `say`, nunca `start`. Essa extensão da proposta v1 foi feita antes da primeira migração/persistência implementada; não é conversão silenciosa de projetos gravados.

O grafo experimental Blockly ainda requer um adaptador frontend para este documento: a API não recebe o formato interno da biblioteca. Preservar IDs de domínio estáveis ao implementar essa integração, sem usar coordenadas como ordem. A gravação pelo editor não está implementada nesta etapa de backend.

## Execução do editor principal

**Evolução em 5/11/2026:** a descrição abaixo registra o incremento linear anterior. A solicitação posterior ampliou o modelo local com `goto`, `show`, `hide`, `wait`, `repeat`, `forever`, `if`, `gt`, `lt`, `eq`, `set` e `change`; conexões `body`/`condition`; múltiplos eventos e execução cooperativa. Semântica atual em [EDITOR](EDITOR.md), decisão D-14. ProjectDocument v1 e seu contrato REST permanecem inalterados. Não usar a projeção ampliada como documento v1.

O módulo `block-engine/runtime` interpreta agora o grafo experimental já produzido pelo editor, com eventos ordenados conforme o contrato acima, incluindo `say`. Não recebe JSON Blockly nem documentos persistidos diretamente. Cada início captura um plano validado, exige exatamente um `start`, ignora comandos soltos e reinicia o personagem em (0, 0), direção 0 e fala vazia. Conexões definem a ordem; até 200 blocos sem ciclos limitam os passos. Há também verificação de 1.000 passos e 30 segundos com relógio injetado.

O frontend agenda avanços a cada 300 ms e interpreta os eventos para atualizar o palco lógico 480 × 360 e destacar o bloco corrente. Parar preserva o último estado produzido e cancela avanços pendentes. O intervalo é uma apresentação visual, não sincronização com fala de leitores de tela. A rota experimental antiga continua destinada à avaliação de navegação/anúncios; o palco está na página principal `/`.

## Catálogo local ampliado — 28/11/2026

O modelo local/v2 aceita `changeX` e `changeY` com `amount` inteiro (-480…480), `direction` com `degrees` inteiro (-360…360), `sayFor` com `text` (até 120 caracteres) e `seconds` (0…30), e `ifElse` com `condition`, `body` e `elseBody` anuláveis. `next` mantém a continuação. Os dois corpos aceitam comandos; somente a condição aceita operadores booleanos. A validação aplica as mesmas regras de ciclos, profundidade e múltiplos pais a `elseBody`.

A extensão é aditiva no documento local v2; o documento v1 não muda. Leitores anteriores rejeitam tipos desconhecidos. Não há persistência no MVP. O round-trip do adaptador cobre IDs, valores e os dois ramos. O motor permanece sem dependência de DOM, Blockly ou áudio. Consulte as unidades, limites e regras de fala temporizada em [SCRATCH](../apps/web/docs/SCRATCH.md).

### Evento do personagem — 28/11/2026

`actorClick` é um evento sem parâmetros, com `id` e `next`, sem entrada anterior. O documento local v2 e o adaptador preservam o tipo e seus IDs. `isEvent` identifica start/actorClick; `selectEvent` filtra pontos de entrada habilitados por tipo. O runtime recebe o gatilho explícito, com start como padrão, e nunca executa automaticamente o outro tipo. Não depende de DOM: clique/teclado são convertidos em gatilho pelo frontend. Clique preserva o estado atual completo do personagem; o início comum preserva seu comportamento anterior. Mantidos limites, cancelamento, anúncios derivados das conexões e execução local.
