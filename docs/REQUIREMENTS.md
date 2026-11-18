# Requisitos do Jyboia

Status: MVP público estático definido em 18/11/2026. Requisitos de servidor são históricos/futuros, fora da aceitação do MVP. Testes automatizados não concluem aceitação assistiva; validação real pendente em [ACCESSIBILITY_VALIDATION](ACCESSIBILITY_VALIDATION.md).

## Requisitos funcionais

| ID | Requisito | Critério de aceitação |
| --- | --- | --- |
| RF-01 | Oferecer um único editor para todos os usuários. | Mouse, teclado e leitor de tela operam o mesmo programa e estado; não existe editor assistivo separado. |
| RF-02 | Inserir, conectar, desconectar, reorganizar e remover blocos. | Encaixes visuais seguem conexões tipadas inspiradas no Scratch; operações também podem ser realizadas por teclado e conexões inválidas são recusadas com explicação acessível. |
| RF-03 | Representar semanticamente cada bloco. | Leitor de tela identifica comando, parâmetros e valores, posição e relações relevantes; alterações são refletidas sem divergência da interface visual. |
| RF-04 | Permitir editar parâmetros e validar o programa. | Valores inválidos são associados ao campo/bloco, explicados em português e impedem execução até correção, sem perda do programa. |
| RF-05 | Permitir construir programas sem mouse. | É possível acessar paleta, inserir, conectar, editar, mover e remover blocos, chegar aos controles e sair do editor usando apenas teclado, sem armadilhas de foco. |
| RF-06 | Anunciar o programa ao selecionar “Iniciar programa”. | A sequência alcançável a partir do ponto de entrada é disponibilizada e anunciada, com comandos e valores na ordem de execução; permanece consultável. Blocos desconectados não são apresentados como executados. |
| RF-07 | Executar blocos no motor e controlar um personagem. | Um programa válido produz eventos ordenados e mudanças correspondentes de posição/orientação no palco, segundo regras documentadas. |
| RF-08 | Disponibilizar resultados e estado do palco de forma acessível. | Estado inicial, mudanças relevantes, resultado final e erros podem ser compreendidos sem observar o palco; o palco tem identificação e descrição textual atualizadas. |
| RF-09 | Parar e informar o estado da execução. | “Parar programa” cancela comandos pendentes; início, conclusão, interrupção e falha são identificáveis e anunciados sem mover o foco inesperadamente. |
| RF-10 | Persistência futura, fora do MVP. | Código e contratos preservados, sem botões de salvar/abrir/excluir projetos nem chamadas HTTP no fluxo público. |
| RF-11 | Disponibilizar ajuda de interação. | Ajuda de teclado e nomes acessíveis estão disponíveis em português brasileiro no próprio fluxo. |

RF-12: acesso direto ao editor por URL, sem contas ou autenticação. RF-13: programas somente em memória, sem gravação no servidor ou navegador; recarregar deve iniciar um workspace vazio. RF-14 (aviso visual de perda) foi retirado por solicitação posterior em 18/11/2026. RF-10 está suspenso no produto público, não apenas opcional. Os painéis de organização e consulta também foram retirados; anúncios de início, semântica dos blocos, teclado do Blockly e descrição do palco permanecem.

Na ampliação solicitada em 5/11/2026, múltiplos eventos são permitidos e executados em rodízio determinístico; ausência de evento continua inválida. RF-06 distingue descrição inicial de estrutura aninhada da trilha efetivamente executada: anunciar corpos e seus limites sem expandir repetições ou afirmar a execução de ramos falsos. Contratos da API v1 permanecem no escopo de persistência anterior.

## Requisitos não funcionais

| ID | Requisito | Critério de verificação |
| --- | --- | --- |
| RNF-01 | Monorepo modular com MVP estático React/TypeScript. | Build e uso do editor sem executar API, Prisma ou banco. Backend Node.js/PostgreSQL preservado fora do MVP. |
| RNF-02 | Motor independente do frontend. | Testes do motor rodam sem navegador, DOM, React, Blockly, API ou banco; o mesmo programa e estado inicial produzem os mesmos eventos na semântica inicial. |
| RNF-03 | Modelo e regras compartilhados. | Motor, adaptador do editor e API usam tipos e regras consistentes; dados externos recebem validação em tempo de execução. Serialização do Blockly não é contrato público. |
| RNF-04 | Contratos REST preservados para evolução. | OpenAPI pertence ao backend inativo; nenhum endpoint é necessário para construir ou executar no MVP. |
| RNF-05 | Acessibilidade nativa, com meta WCAG 2.2 nível AA. | Semântica, nome/papel/valor, contraste, zoom, foco, ordem de leitura e operação por teclado são avaliados; testes automáticos são complementados por inspeção manual e leitores de tela. Não declarar conformidade sem auditoria de escopo definido. |
| RNF-06 | Interoperabilidade assistiva verificável. | Matriz registra navegador, sistema, leitor de tela, versões, data e resultados; validar inicialmente NVDA com Firefox e Chrome no Windows e VoiceOver com Safari no macOS. Suporte só é declarado para combinações testadas. |
| RNF-07 | Anúncios compreensíveis e sem voz própria obrigatória. | Usar semântica e regiões de anúncio apropriadas, sem depender de Web Speech ou áudio gravado; testar anúncios longos, repetidos e interrupções, mantendo sequência e resultados consultáveis. |
| RNF-08 | Segurança e limites de execução. | Interpretar apenas comandos conhecidos, sem `eval` ou código arbitrário; validar entradas na API e limitar tamanho do programa, quantidade de passos e duração antes de disponibilizar execução/persistência. Valores dos limites devem ser documentados e testados. |
| RNF-09 | Qualidade automatizada. | Novas funcionalidades têm testes pertinentes de unidade, integração e ponta a ponta; fluxos críticos incluem teclado e verificações semânticas; verificações disponíveis passam antes de declarar entrega concluída. |
| RNF-10 | Privacidade e cuidado com o público infantil. | Não exigir dados pessoais infantis no escopo inicial; revisar acesso, retenção e exclusão antes de disponibilizar persistência a usuários reais. Não publicar programas por padrão. |
| RNF-11 | Interface responsiva à interação. | Execução permite acionar “Parar programa” e não bloqueia a navegação; testar com o maior programa permitido. Metas quantitativas de desempenho serão definidas com o protótipo e registradas antes da entrega funcional. |
| RNF-12 | Consistência de idioma. | Textos e mensagens acessíveis em português brasileiro; identificadores de código em inglês. |

## Investigação inicial do Blockly

Consulta documental em **4 de novembro de 2026**, sem protótipo ou testes locais nesta etapa:

- A [página oficial de acessibilidade](https://blockly.com/accessibility) informa que o Blockly v13 incorpora navegação por teclado e suporte a leitores de tela por padrão. Isso o torna um candidato à interface única, sem provar a acessibilidade do Jyboia.
- O [guia oficial de teclado](https://docs.blockly.com/guides/configure/keyboard-nav/) descreve um cursor no workspace para leitura e manipulação de blocos, edição de campos, inserção e remoção. Essa interação deve ser avaliada com os blocos e a linguagem do projeto.

A documentação de teclado ainda contém uma referência prospectiva ao lançamento da v13, apesar da apresentação atual na página de acessibilidade. Na avaliação técnica, confirmar versão efetivamente publicada, notas de versão, dependências e necessidade de plugins; não copiar instruções de versões antigas sem verificar compatibilidade.

Antes de adotar Blockly, testar criação e edição completas por teclado, leitura de parâmetros e conexões, recuperação de foco, conflitos de atalhos com leitores de tela, anúncios em português, blocos personalizados, integração React e sincronização com o modelo independente. Registrar resultados e limitações em decisão arquitetural. Se houver barreiras essenciais, avaliar adaptações ou outra base mantendo um único editor.

## Evidências de aceitação

Cada entrega deve relacionar requisitos atendidos, testes automatizados, roteiros manuais, versões utilizadas, problemas encontrados e limitações abertas. Ausência de violações automáticas ou presença de ARIA não demonstra que uma criança consegue concluir a atividade.
