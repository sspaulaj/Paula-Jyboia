# Blocos e conexões v1

```mermaid
flowchart LR
  doc["ProjectDocument: schemaVersion 1"] --> program["program: entryBlockId e blocks"]
  doc --> actor["actors: estado inicial"]
  doc --> layout["layout: posição visual por blockId"]
  program -->|"entryBlockId"| start["start1: start"]
  start -->|"next"| move["move1: move, steps 20"]
  move -->|"next"| turn["turn1: turn, degrees 90"]
  turn -->|"next"| endNode["null: fim"]
  move -.->|"actorId"| actor
  turn -.->|"actorId"| actor
  program --> loose["Bloco desconectado: preservado, não executado"]
```

Este desenho ilustra referências, não a ordem física da lista. `start` não recebe predecessor; comandos têm no máximo um. Proibir ciclos e referências inexistentes. A cadeia alcançável torna-se o plano linear de execução; `layout` nunca define a ordem. O bloco desconectado é ilustrativo, não pertence ao exemplo JSON de BLOCK_MODEL.
