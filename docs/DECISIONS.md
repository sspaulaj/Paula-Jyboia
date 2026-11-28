# Decisões arquiteturais

## D-2026-11-22-PY-RUNTIME — Prova interativa no navegador

**Status:** implementada na Fase C. **Contexto:** validar input e cancelamento antes de construir editor/gerador. **Decisão:** Pyodide 314.0.8 em Worker de módulo, arquivos locais fixados e exemplos revisados selecionados por ID. Stdin usa SharedArrayBuffer/Atomics; somente o Worker espera. Cada execução recebe Worker novo; Parar termina o Worker e invalida mensagens antigas. UI mantém código e terminal acessíveis, sem voz própria.

**Alternativas:** Promise no callback síncrono stdin não resolve input; reexecutar com respostas acumuladas duplica efeitos; thread principal bloqueia a interface; execução remota contraria o MVP. SIGINT cooperativo permanece evolução possível, sem substituir o cancelamento definitivo desta PoC.

**Consequências:** requer HTTPS/localhost e COOP/COEP na rota Python/Worker, sem alterar Scratch. CSP restringe recursos à origem; há limites de tempo/entrada/saída, mas Worker não é sandbox perfeita nem há limite rígido de memória. Sem código arbitrário ou pacotes dos alunos. **Evidências e limites:** [PYTHON_RUNTIME](../apps/web/docs/PYTHON_RUNTIME.md) e [VALIDATION](../apps/web/docs/VALIDATION.md). Não houve deploy ou execução AWS.

## D-2026-11-22 — Módulos pedagógicos independentes

**Status:** adotada na Fase B. **Contexto:** expandir Jyboia sem reescrever Scratch ou prejudicar acessibilidade. **Alternativas:** editor genérico com condicionais de linguagem, reescrita do Scratch ou módulos separados. **Decisão:** encapsular `editor` e `experiment` juntos em `modules/scratch`, manter motor/documentos existentes, preparar `modules/python`, compor rotas em `app` e compartilhar inicialmente somente coordenação de anúncios. `/` continua Scratch; `/scratch` é explícita; `/python` é preparatória.

**Consequências:** regras e runtime não são compartilhados entre linguagens; CSS Python é local. Rotas atuais são entradas de documento, sem novo seletor ou mecanismo de persistência. Futuro roteamento SPA precisará tratar memória, foco e cancelamento. Docs por área e skills específicas complementam instruções globais; código e docs sem segredos deixam de ser ignorados. **Evidências:** [validação da Fase B](../apps/web/docs/VALIDATION.md).

## D-2026-11-22-PY — Python com terminal e execução no navegador

**Status:** arquitetura alvo aprovada; implementação não iniciada. **Contexto:** decisão posterior do produto exige print/input, condicionais/repetições, Iniciar/Parar, erros acessíveis e interrupção. Substitui a proposta anterior de somente gerar código.

**Alternativas:** execução remota, runtime na thread principal, ou Pyodide em Worker. **Decisão:** primeira opção Pyodide em Worker, independente de React e do motor Scratch; não executar no backend/AWS no MVP. Aproveitar gerador Blockly com adaptações de semântica Python. Modelo único por módulo alimenta geração e acessibilidade.

**Consequências:** input síncrono precisa de ponte comprovada; investigar espera no Worker com SharedArrayBuffer e formulário na UI, isolamento COOP/COEP, UTF-8 e cancelamento. Interrupção cooperativa deve ter fallback de término definitivo; Worker não é sandbox de código hostil. Somente geração de catálogo autorizado, com limites e nenhuma execução livre do texto. Não instalar runtime, criar Worker ou habilitar cabeçalhos nesta Fase B. **Evidências e gates:** [plano Python e fontes oficiais](../apps/web/docs/PYTHON.md).

## D-19 — Publicação estática na Vercel

Manter um único monorepo privado no GitHub, com projeto Vercel `jyboia` apontando para `apps/web`, preset Vite e saída `dist`. Instalar pelo lockfile na raiz com Corepack/pnpm e compilar apenas pacotes compartilhados e frontend. Permitir arquivos externos à raiz da aplicação para resolver os pacotes do workspace. API e infraestrutura ficam fora do artefato publicado; `infra/aws` está somente reservado, sem stacks ou comandos AWS. Usar rewrite SPA para `index.html`. Nenhuma variável `VITE_` é necessária. A criação do remoto, primeiro push e produção dependem da autorização explícita solicitada pelo usuário.

## D-18 — Movimento no eixo X independente do giro (18/11/2026)

**Contexto e decisão:** após esclarecimento, o usuário definiu que Mover N passos deve alterar somente X, mesmo depois de girar. Substituir a projeção trigonométrica por `x + steps`, mantendo Y e orientação. Valores negativos continuam recuando e as bordas permanecem em [-240, 240]. Girar continua alterando a orientação visual.

**Alternativa:** seguir a direção atual foi explicitamente descartada para este bloco. **Consequências:** giro e deslocamento são independentes; a mudança é de semântica de execução, sem alteração do formato estrutural. O MVP é efêmero e não migra dados persistidos. Antes de reativar persistência, considerar esta diferença ao interpretar projetos antigos. **Evidências:** regressões do motor com ângulos variados, passos negativos e limites; cenário real de paleta com giro de 90 graus seguido de movimento horizontal.

## D-17 — MVP público estático e efêmero (18/11/2026)

**Contexto:** o escopo definitivo remove contas e persistência do MVP, substituindo a integração pública prevista na D-16. **Decisão:** retirar `useProjects` e `ProjectActions` da página principal, manter programas apenas em memória e exibir aviso permanente de perda ao recarregar/fechar. Editor, semântica e motor existentes continuam juntos. A rota experimental fica disponível somente no servidor de desenvolvimento, sem integrar o build público.

`pnpm dev` inicia somente o frontend; `pnpm build` gera o frontend estático. Backend, cliente HTTP, modelos versionados, migrações e testes históricos permanecem preservados, sem importação pelo fluxo público. Não há login implementado a remover, nem armazenamento local a migrar. Os dados eventualmente existentes no PostgreSQL não são apagados ou modificados. A suíte E2E histórica de persistência fica explicitamente suspensa, pois seus controles foram retirados.

**Alternativas:** armazenamento local violaria o requisito de memória apenas; apagar o backend eliminaria trabalho útil sem necessidade; deixar os botões disponíveis criaria expectativa incorreta de salvamento. **Consequências:** não há recuperação de programas, aviso é parte essencial da interface e publicação deve conter apenas `apps/web/dist`. Autenticação/autorização, REST, persistência, banco e AWS exigem nova solicitação. **Evidências:** testes do build estático sem API, gravação de Storage/IndexedDB bloqueada, execução e recarga vazia, além da regressão de teclado e semântica; ver [STATIC_MVP](STATIC_MVP.md). Não equivale a validação real com leitores de tela ou deploy realizado.

## D-16 — Integração de projetos e formato v2 (17/11/2026)

**Contexto:** o editor ampliado possui controles, operadores e variáveis que o contrato v1 de quatro blocos não representava. **Decisão:** adicionar `EditorDocument` v2 ao motor e reutilizar sua validação em `shared/projects`, servidor e cliente HTTP. Manter leitura/escrita v1 na API; o editor converte explicitamente ao abrir e salva v2 sob ação do usuário. Migração SQL apenas amplia a restrição de versão.

O cliente `apps/web/src/api/projects.ts` encapsula HTTP, timeout e erros. `useProjects` controla identidade, revisão e alterações não salvas; PUT/DELETE enviam If-Match, sem repetição automática. O adaptador reconstrói blocos num workspace temporário, verifica IDs/valores/conexões e só então substitui o editor único, com rollback em caso de erro. Execução continua local e independente da API. Anúncios reutilizam a região de estado existente.

**Alternativas:** persistir JSON Blockly acoplaria o contrato à biblioteca; sobrescrever v1 perderia compatibilidade; gravação sem revisão perderia alterações concorrentes. **Consequências:** existem dois formatos versionados, conversão testável e custo de validação no bundle web. V2 representa um único personagem e não preserva nome/ID de personagem legado; preserva seu estado inicial e o resultado dos comandos. O grafo de edição permanece no Blockly, com projeção de domínio; não foi introduzido segundo editor. **Evidências:** testes de round-trip de todos os tipos, integração com PostgreSQL e fluxo real no navegador em [INTEGRATION_VALIDATION](INTEGRATION_VALIDATION.md). Leitores de tela reais seguem pendentes.

## D-14 — Editor estruturado e execução cooperativa (5/11/2026)

**Status:** implementado localmente por solicitação explícita; aceitação assistiva pendente. **Contexto:** ampliar os quatro blocos sem perder edição, IDs, teclado ou execução. **Decisão:** manter Blockly 13.4.0 e ampliar a projeção de domínio com conexões por ID para corpo e condição. Entradas tipadas separam comando e booleano. Descrições e motor usam a mesma floresta. Múltiplos eventos executam em rodízio determinístico por ID; limites de passos/tempo impedem Sempre de bloquear a interface. Controles nativos de organização atuam sobre o workspace existente.

**Alternativas:** gerar JavaScript reduziria controle de execução; outro editor duplicaria estado; expandir repetições em uma lista consumiria recursos sem limite. **Consequências:** o escopo linear de D-05/D-11/D-13 é ampliado, mas a API v1 não muda. Persistência do novo catálogo ainda requer versão e integração explícitas. Testes de domínio, conexões Blockly e navegador são evidências técnicas; não certificam acessibilidade. Detalhes: [EDITOR](EDITOR.md).

## D-15 — Coordenação de anúncios e consulta persistente (5/11/2026)

**Status:** implementada; fala real requer validação manual. **Contexto:** anúncios independentes de palco, ponteiro e execução disputavam leitura. **Decisão:** uma região de status própria do Jyboia, separada dos anúncios nativos de foco do Blockly. Agrupar alterações rápidas, descartar mensagens pendentes ao iniciar, suprimir edição durante execução e não anunciar cada frame. Descrição inicial numerada explicita corpos e limites; texto de consulta permanece disponível junto ao resultado, sem controles de edição. Ponteiro tem espera curta e não modifica foco.

**Alternativas:** voz própria ou temporizadores que presumem término da fala violariam a arquitetura assistiva; leitores de tela não fornecem confirmação de fala concluída à aplicação. **Consequências:** conclusão visual não sobrescreve o anúncio inicial; parada/erros são novas mensagens importantes. A região de consulta permite recuperar informações mesmo quando a tecnologia assistiva omite uma atualização. Não se garante ausência de sobreposição com anúncios nativos do leitor. Fontes, roteiro e evidências: [ACCESSIBILITY](ACCESSIBILITY.md).

Registro central em 4 de novembro de 2026. “Adotada para projeto” significa orientação documental, não implementação ou validação concluída. Documentos anteriores fornecem contexto; não havia ADRs em `docs/decisions/`. Este arquivo passa a concentrar decisões, substituindo a orientação anterior de criar esse diretório.

## D-01 — Monorepo com dois pacotes de domínio e contratos

**Status:** adotada para projeto por definição do usuário.

Consolidar `packages/program` e `packages/engine` em `packages/block-engine`; substituir `packages/contracts` por `packages/shared`. Manter separação interna entre modelo e runtime. Alternativa anterior tinha três pacotes; a estrutura solicitada reduz fronteiras físicas sem reunir responsabilidades de interface ou servidor no motor.

`shared` reutiliza `block-engine/model`; não há dependência inversa. Aplicações dependem de pacotes e comunicam-se entre si apenas por API. Consequência: cuidar para que `shared` não vire depósito de serviços e para que importar schemas não carregue runtime. Atualizar README, AGENTS e skills afetadas; nenhum código ou dado existente precisa de migração nesta etapa.

## D-02 — Blockly como candidato preferencial

**Status:** condicional à prova de acessibilidade; versão exata não fixada.

Preferir avaliar Blockly por oferecer conexões visuais, edição de campos e navegação estrutural. A [fonte oficial](https://blockly.com/accessibility), consultada nesta data, informa teclado e leitores de tela integrados na v13. Isso não prova compatibilidade dos blocos personalizados, React ou português do Jyboia.

Alternativa é construir editor próprio ou adotar outra base; ambas exigem avaliação equivalente e maior trabalho de conexões/semântica. Executar o protótipo do roadmap, registrar versões e testes; adotar somente se tarefas essenciais forem concluídas. Barreiras impeditivas levam a adaptação ou nova decisão, nunca a um editor assistivo separado. O adaptador e o formato independente limitam o custo de substituição.

## D-03 — Acessibilidade derivada do mesmo documento

**Status:** adotada para projeto, interação a validar.

Editor, semântica e motor usam o mesmo grafo e IDs. Integrar representação acessível ao editor, com HTML nativo ao redor, foco e ARIA apropriados. Rejeitar editor paralelo e voz própria como soluções principais: criariam divergência de capacidades e estado. Consequência: testar a experiência completa, não somente atributos. Anúncios longos e atualizações concorrentes são risco explícito em [ACCESSIBILITY](ACCESSIBILITY.md).

## D-04 — JSON versionado e conexões por ID

**Status:** adotada para projeto; v1 definida em [BLOCK_MODEL](BLOCK_MODEL.md).

Persistir documento de domínio com blocos, conexões, estado inicial e layout separado. IDs e `next` explícitos preservam blocos desconectados sem depender da ordem da lista. Alternativas: serialização nativa Blockly acoplaria persistência à biblioteca; código JavaScript perderia semântica editável e ampliaria riscos; árvore totalmente aninhada dificultaria manter peças desconectadas e identidade estável.

Consequência: validar referências, ciclos e predecessores e manter adaptador de importação/exportação. Versão de schema exige migração explícita; revisão de salvamento é outro conceito.

## D-05 — Interpretador incremental no navegador

**Status:** adotada para o incremento sequencial.

Preparar plano imutável e interpretar passo a passo, com estado inicial conhecido e eventos ordenados. O frontend agenda passos e desenha; o backend somente persiste e valida. Alternativa de execução remota aumentaria dependência de rede e latência sem necessidade inicial. Geração/execução de JavaScript tornaria mais difícil controlar a linguagem.

Consequência: limites, cancelamento e devolução de controle ao navegador são obrigatórios. Worker permanece opção mediante medição. Não adicionar condições/repetições nesta versão. Convenções de palco e limites são propostas iniciais revisáveis, não achados de pesquisa educacional.

## D-06 — PostgreSQL com documento JSONB e revisão otimista

**Status:** adotada para persistência; exposição a usuários reais pendente.

Guardar documento inteiro em JSONB, metadados em colunas e revisão na mesma transação. Alternativa relacional por bloco acrescentaria joins e complexidade para a unidade de trabalho atual; texto opaco dificultaria inspeção e validações básicas. JSONB é estruturado e não preserva ordem de chaves, portanto a semântica usa referências explícitas, conforme a [documentação PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html).

Controle de revisão evita sobrescrita por duas abas; não oferece colaboração nem histórico. Identidade, autorização e retenção precisam de decisão antes da publicação. Autenticação não é implicitamente adicionada ao escopo, e projeto não se torna público por ter UUID.

## D-07 — Contratos HTTP separados da implementação

**Status:** adotada para projeto.

DTOs e schemas em `shared`; tipos de domínio pertencem ao motor. Frontend não importa serviços de `apps/api`. Contratos documentados em [API_CONTRACTS](API_CONTRACTS.md), a materializar em OpenAPI com verificação de conformidade. Alternativa de inferir contrato de entidades ORM vazaria detalhes do banco; duplicar manualmente tipos entre aplicações geraria divergência.

Consequência: mudanças incompatíveis exigem evolução explícita da API e testes de consumidores. Biblioteca concreta de schemas e ferramenta OpenAPI serão escolhidas em implementação autorizada.

## D-08 — Diagnósticos estruturados e preservação do trabalho

**Status:** adotada para projeto.

Motor retorna códigos e referências de bloco/campo; API os traduz em erros HTTP; frontend apresenta português e mantém foco/contexto. Diferenciar erro estrutural, ausência de entrada executável, falha de execução, conflito e erro de rede. Alternativa de strings livres impediria comportamento estável e associação de erros ao editor.

Consequência: definir códigos por contrato, não analisar texto para lógica. Falhas de carregamento/salvamento preservam documento local. Exceções internas são registradas com correlação e sem exposição ao usuário. Resposta perdida de criação continua risco de duplicata, explicitado no contrato.

## D-09 — Linguagem fechada, sem JavaScript arbitrário

**Status:** adotada para projeto.

Interpretar catálogo permitido, validar entradas e impor limites. Não usar `eval`, `Function` ou executar conteúdo importado como código. Alternativa de geração de JavaScript não é necessária aos comandos iniciais e amplia superfície de execução.

Consequência: cada novo bloco exige semântica, validação e testes. Importação deve rejeitar versões/tipos desconhecidos e proteger montagem de objetos. Limites iniciais: 200 blocos, 1.000 passos, 30 segundos, envelope HTTP de 256 KiB; revisar somente com decisão documentada e medições. Segurança do motor não substitui autorização da API.

## D-10 — Base técnica de desenvolvimento

**Data:** 4 de novembro de 2026. **Status:** base de aplicações validada; execução do banco pendente por ausência de Docker no ambiente.

Adotar pnpm workspaces, Vite/React, Fastify, Prisma com adapter PostgreSQL, Vitest, ESLint flat config e Prettier. Versões verificadas e fixadas em [TOOLCHAIN](TOOLCHAIN.md). Usar TypeScript 6.0.3 para respeitar o peer do linter e Prisma 7.10.1 para evitar a versão candidata marcada como latest.

Pacotes internos compilam para ESM com declarações e exportações públicas; builds seguem o grafo do pnpm. Alternativa de exportar TypeScript diretamente exigiria loaders também em produção. Manter modelo/runtime separados no motor; nesta etapa só existe marcador da versão do modelo e entrada vazia do runtime, sem regras ou execução.

Health em `/health` é liveness e não depende do banco, permitindo desenvolvimento da interface mesmo com PostgreSQL parado. O schema Prisma prepara a estrutura Project, sem migração automática ou endpoints de persistência. API carrega ambiente no servidor; Vite expõe somente valores públicos. Docker Compose limita a porta do banco ao loopback.

A inicialização foi solicitada explicitamente antes do protótipo Blockly. Isso autoriza somente a infraestrutura básica e não satisfaz a etapa de viabilidade acessível do roadmap. Resultados e limites: [BOOTSTRAP_VALIDATION](BOOTSTRAP_VALIDATION.md).

## D-11 — Blockly 13 em experiência delimitada

**Data:** 4 de novembro de 2026. **Status:** implementada para PoC; adoção definitiva condicionada à validação manual.

**Contexto:** testar quatro tipos de bloco no mesmo editor, com encaixes, teclado e semântica. A linha 13 do Blockly incorpora suporte nativo de teclado e leitores, conforme [documentação oficial](https://docs.blockly.com/guides/configure/screen-reader/).

**Alternativas:** editor SVG próprio exigiria reconstruir conexões e navegação; lista assistiva separada violaria o produto. Plugins antigos de teclado não são necessários nesta versão.

**Decisão:** fixar Blockly 13.4.0 e usar seu workspace como única origem mutável de edição **somente nesta PoC**, com projeção de consulta independente em `block-engine/experimental`. Compartilhar essa projeção entre descrições, validação e ordem de comandos. Não implementar execução nem serializar Blockly como contrato do projeto. O bloco `say` fica experimental, sem alterar o modelo v1 persistido. Uma página experimental separada da página inicial não é um segundo editor: há apenas um workspace de edição, igual para todos.

**Consequências:** a futura autoridade do domínio e reconciliação transacional descritas na arquitetura não estão concluídas. Antes de salvar/importar, implementar adaptação bidirecional validada e preservação de foco, ou revisar esta decisão. O adaptador atual não recebe dados externos. Foi necessário reparar foco perdido ao reparentear SVG em confirmação por Enter; reparo usa APIs públicas e é restrito ao alvo da ação por teclado. Controles contextuais de conexão atuam sobre o mesmo grafo e permitem clique sem arraste.

**Evidências:** testes unitários e de navegador descritos em [EDITOR_POC](EDITOR_POC.md), incluindo descrições dinâmicas, ordem lógica, edição e árvore de acessibilidade. Não houve teste com NVDA/VoiceOver. Mantém-se a condição da D-02 e do roadmap: não declarar viabilidade assistiva completa sem leitores reais e avaliação com pessoas com deficiência visual.

## Atualização do registro

Novas decisões recebem ID, data, status, contexto/alternativas, justificativa e consequências. Para substituir decisão, manter histórico e indicar a sucessora. Validar decisões condicionais com evidências antes de marcar sua condição satisfeita.

## D-13 — Execução incremental do palco na página principal (2026-11-05)

**Status:** implementada para os quatro blocos da PoC. **Contexto:** iniciar na página principal apenas alterava mensagens; o personagem permanecia estático. **Decisão:** interpretar uma cópia validada do grafo experimental no pacote independente `block-engine/runtime`, emitir eventos de execução e projetar o estado no palco React. A interface agenda os passos e bloqueia edição durante execução; parar cancela os próximos passos. Reiniciar restaura o estado inicial, tornando os resultados reproduzíveis.

**Alternativas:** lógica de movimento no componente React duplicaria regras do motor; JavaScript gerado exigiria execução arbitrária; integrar salvamento agora ampliaria o escopo. **Consequências:** o formato experimental continua distinto do documento persistido, sem conversões implícitas. Semântica de coordenadas, limites, eventos e cancelamento seguem BLOCK_MODEL. O destaque acompanha execução, não a fala efetiva. **Evidências:** testes de motor e `e2e/execution.spec.ts` verificam conexões, deslocamento real, reinício e cancelamento; leitores de tela ainda requerem verificação manual.

## D-12 — API local de projetos e primeiro contrato persistido

**Status:** implementada; validação registrada em BACKEND_VALIDATION. **Contexto:** a solicitação de backend amplia a proposta anterior com listagem/exclusão e define nomes e rotas diferentes. **Decisão:** adotar `/api/projects`, `name`, `description`, `workspaceData` e `formatVersion`; manter revisão/ETag de D-06 e exigir If-Match em PUT/DELETE. `say` entra no primeiro documento v1 efetivamente persistido, com actorId/text. Não há mudança automática do modelo experimental do editor.

**Alternativas:** aceitar JSON Blockly opaco impediria validar conexões e acoplaria persistência ao editor; sobrescrita incondicional perderia edições concorrentes; paginação sem limite permitiria resposta não limitada. **Consequências:** DTOs e schemas públicos em shared/projects, OpenAPI gerado dos mesmos schemas, validação pura em block-engine/validation com Ajv 8.20.0 já presente na stack. Exportações separadas mantêm Ajv fora do caminho de importação do health/frontend. JSONB preserva a estrutura; serialização visual não é contrato.

A migração inicial cria tabela; o schema de bootstrap não havia sido migrado. Se houver aplicação manual antiga, exige plano de migração específico sem reset. Listagem sem proprietário é global à instalação. Sem autenticação, serviço aceita apenas host loopback e não deve ser exposto por proxy/túnel. Política de acesso continua pré-requisito para uso público. Testes de integração criam um schema aleatório próprio e removem somente esse namespace.

## D-2026-11-28-CATALOG — Extensão local do catálogo Scratch

**Contexto:** solicitação de novos comandos e de áudio exclusivamente pelo leitor de tela. **Decisão:** ampliar o modelo local/v2 de forma aditiva com alteração de eixos, direção absoluta, fala temporizada e condicional com dois ramos. Manter v1 e Python intactos. A espera usa o relógio injetado do interpretador; um identificador de fala impede que uma espera antiga apague uma fala posterior de outra sequência.

**Alternativas:** representar senão como um segundo Se duplicaria a avaliação; temporizadores no componente visual acoplariam a semântica ao frontend. Áudio Web Audio ou voz da aplicação não atendem ao requisito confirmado de áudio exclusivo do leitor e não foram implementados.

**Consequências:** clientes antigos do documento v2 rejeitam os novos tipos; não há persistência ativa no MVP. Ambos os ramos são descritos estruturalmente, mas só um executa. Limites globais do motor permanecem. **Evidências:** testes de motor, round-trip do adaptador, descrições e navegação em navegador, registrados em apps/web/docs/VALIDATION.md. Leitores de tela reais ainda exigem validação manual.

## D-2026-11-28-ACTOR-EVENT — Personagem acionável e gatilho explícito

**Contexto:** identificar palco/personagem separadamente e executar comandos ao clicar no personagem. **Decisão:** personagem como botão HTML no palco, acionável também por Enter/Espaço; descrição do resultado separada do botão, sem role=img no seu ancestral. O motor recebe um gatilho tipado start/actorClick e filtra pontos de entrada. **Alternativas:** listeners apenas na imagem não garantiriam teclado; executar todos os eventos ao iniciar confundiria os gatilhos. **Consequências:** mantém uma execução por vez e Parar; cliques durante execução não são enfileirados. O gatilho de clique preserva o estado atual do personagem. Sem novas dependências, persistência ou áudio. **Evidência:** testes de motor, serialização, clique/teclado, identificação e regressões registrados em apps/web/docs/VALIDATION.md; leitores reais pendentes.
