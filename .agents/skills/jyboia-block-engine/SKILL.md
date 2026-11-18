---
name: jyboia-block-engine
description: Definir ou alterar o modelo e o interpretador de blocos do Jyboia, incluindo parâmetros, conexões, árvore de execução, validação, sequenciamento, estados dos personagens e serialização. Usar também para condicionais e repetições quando essas funcionalidades forem solicitadas.
---

# Motor de blocos do Jyboia

Siga a separação interna entre `model` e `runtime` em `packages/block-engine`, conforme [ARCHITECTURE](../../../docs/ARCHITECTURE.md), o contrato em [BLOCK_MODEL](../../../docs/BLOCK_MODEL.md) e as regras do [AGENTS.md](../../../AGENTS.md). Consulte o [escopo do produto](../../../docs/PRODUCT.md): condicionais e repetições são capacidades futuras, não autorização para adicioná-las ao incremento sequencial.

## Modelar e validar

- Defina blocos com identificadores estáveis, discriminador de tipo, parâmetros tipados e conexões explícitas. Separe metadados de layout da semântica executável.
- Para cada tipo, especifique parâmetros obrigatórios, domínio de valores, entradas, saídas e conexões permitidas. Faça a mesma regra de compatibilidade servir à edição e à validação do programa recebido.
- Valide versão, tipos conhecidos, unicidade de IDs, referências existentes, parâmetros finitos e dentro dos limites, ponto de entrada e estrutura de conexões. Rejeite ciclos estruturais e vínculos ambíguos; diferencie blocos desconectados de blocos alcançáveis.
- Construa a árvore ou representação intermediária de execução a partir do ponto de entrada e das relações lógicas, nunca da posição visual ou da ordem incidental de propriedades JSON. Preserve IDs de origem para localizar erros e eventos.
- Produza diagnósticos estruturados com código e referência ao bloco/campo. Deixe tradução e apresentação para as camadas consumidoras.

## Interpretar com segurança

Despache somente tipos conhecidos para operações explícitas. Não use `eval`, `Function`, importação dinâmica de conteúdo do projeto ou geração de JavaScript para executar o programa. Trate dados desserializados como entrada não confiável.

Defina estado inicial e transições dos personagens, unidades, orientação, coordenadas e comportamento nos limites do palco. Para a mesma entrada e estado inicial, mantenha resultados determinísticos. Injete relógio ou agendamento quando necessário à testabilidade; não vincule a semântica à animação.

Emita eventos ordenados de início, comando, alteração de estado e término/interrupção/erro, conforme o contrato vigente. Inclua associação ao bloco e à execução para que consumidores descartem eventos de execuções anteriores. Não emita eventos ARIA ou controle foco dentro do motor.

Imponha limites de tamanho, profundidade, passos e duração definidos para o projeto. Verifique cancelamento entre passos e preserve capacidade de interromper programas longos sem bloquear a interface.

## Condicionais e repetições, quando autorizadas

Defina tipos de condição, seleção de ramo, número de iterações, escopo e semântica de zero iterações. Represente repetição como estrutura explícita, não como ciclo arbitrário entre conexões. Avalie expressões por operações permitidas e limite estruturas aninhadas.

Diferencie descrição estrutural e trilha efetivamente executada: ramos não percorridos não podem aparecer como comandos executados. Combine o contrato de eventos com a estratégia de anúncios antes de integrar essas estruturas; não expanda repetições ilimitadamente para montar uma lista de fala.

## Serializar e verificar

Use formato de projeto versionado e independente do Blockly, com programa e estado inicial definidos pelo contrato; exclua referências de DOM, funções e estado transitório do interpretador. Valide antes de executar e após importar. Migre versões suportadas explicitamente ou rejeite versões incompatíveis sem corromper o projeto original.

Teste preservação semântica ao serializar e desserializar, ordem dos comandos, mudanças de estado, erros estruturais, limites e cancelamento. Para novas estruturas de controle, inclua ramos e iterações de fronteira. A mesma trilha de eventos deve sustentar palco e apresentação acessível.
