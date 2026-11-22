# Instruções para trabalhos no Jyboia

## Antes de alterar

- Consulte `README.md`, `docs/PRODUCT.md`, `docs/REQUIREMENTS.md`, `docs/ROADMAP.md` e `docs/DECISIONS.md`; para trabalhos técnicos, leia também `docs/ARCHITECTURE.md` e os contratos de domínio, API e acessibilidade pertinentes.
- Execute apenas o escopo solicitado. A existência de uma próxima entrega no roadmap não autoriza iniciá-la.
- Examine o estado do repositório e preserve alterações do usuário. Antes de substituir uma implementação, avalie contratos, dependências, dados persistidos, testes e impactos na acessibilidade; justifique mudanças relevantes.
- Se houver conflito entre requisitos, registre-o e solicite esclarecimento antes de tomar uma decisão que altere o produto.

## Arquitetura

- Fase B (22/11/2026): Scratch encapsulado em `apps/web/src/modules/scratch`, Python preparado em `modules/python`, rotas em `src/app` e utilitários comuns em `src/shared`. Consulte `apps/web/docs/ARCHITECTURE.md`. Cada linguagem tem um editor único para todas as formas de interação; os módulos não importam um ao outro.
- Python terá geração e execução local com palco terminal, `print`/`input`, Iniciar/Parar e erros acessíveis. Pyodide em Worker é a primeira opção a investigar; não usar o motor Scratch nem executar Python no backend/AWS. Nesta fase somente estrutura/rotas/documentação: catálogo, gerador e runtime exigem etapas posteriores.

- Escopo vigente do MVP (18/11/2026): frontend público estático, sem login, API ou banco em execução e sem persistência no servidor ou navegador. Programas existem somente em memória. As estruturas de backend e contratos abaixo são preservadas para evolução futura, não são dependências do MVP. Não reativá-las no fluxo público sem nova solicitação.

- Preserve o monorepo com React e TypeScript no frontend, Node.js e TypeScript no backend, API REST documentada e PostgreSQL.
- Preserve `apps/web`, `apps/api`, `packages/block-engine`, `packages/shared` e `docs`. Separe modelo e interpretação internamente no motor e contratos HTTP no pacote compartilhado, conforme `docs/ARCHITECTURE.md`.
- Mantenha o motor independente de React, DOM, Blockly, rede e banco de dados. Ele deve receber um programa validado e produzir eventos/resultados de execução testáveis.
- Mantenha persistência e credenciais de banco no backend. Compartilhe contratos e regras sem acoplar o frontend à implementação do servidor.
- Trate Blockly como candidato até a avaliação documentada. Não acople o modelo de domínio à serialização da biblioteca.
- Registre decisões arquiteturais relevantes em `docs/DECISIONS.md` com contexto, alternativas, decisão, consequências e evidências. Atualize a documentação afetada.

## Acessibilidade como requisito de implementação

- Preserve um único editor para todos os usuários. “Compartilhado” significa a mesma interface e capacidades, não colaboração simultânea em um programa.
- Priorize acessibilidade desde o desenho da interação. Toda operação essencial deve funcionar sem mouse no mesmo editor.
- Use HTML semântico e controles nativos sempre que possível; complemente com APIs de acessibilidade, foco e WAI-ARIA quando apropriado.
- Mantenha representações visual e semântica sincronizadas, incluindo conteúdo, parâmetros, conexões, seleção e ordem de execução.
- Não crie editor assistivo paralelo e não use sintetizador de voz próprio como solução principal.
- Não considere acessibilidade concluída apenas pela presença de atributos ARIA, por ferramentas automáticas ou pela declaração de suporte de uma biblioteca.
- Valide teclado, foco, leitura de blocos e parâmetros, erros, anúncios de execução e resultados do palco com leitores de tela reais. Registre versões, cenários, resultados e limitações. Inclua avaliação com pessoas com deficiência visual nas entregas previstas.

## Código, testes e linguagem

- Use português brasileiro nos textos exibidos aos usuários, incluindo nomes acessíveis, ajuda e mensagens de erro.
- Use inglês nos nomes de variáveis, funções, tipos e demais estruturas de código.
- Implemente testes para novas funcionalidades: regras e motor, contratos/API, integração e fluxos essenciais conforme o impacto. Correções devem incluir testes de regressão quando aplicável.
- Combine testes automatizados de acessibilidade com validação manual. Testes visuais não substituem verificação semântica.
- Execute as verificações disponíveis e pertinentes; informe o que passou, o que não foi executado e limitações. Não declare verificações inexistentes como concluídas.
- Não introduza funcionalidades fora do escopo nem ferramentas e dependências sem necessidade demonstrável. Documente contratos REST e mantenha-os alinhados à implementação.

## Skills locais do projeto

As skills ficam em `.agents/skills/<nome>/SKILL.md`. Leia a skill pertinente antes de atuar em sua especialidade; combine apenas as necessárias para a tarefa. Elas complementam estas instruções e não autorizam avançar o escopo ou o roadmap.

- [jyboia-architecture](.agents/skills/jyboia-architecture/SKILL.md): organização do monorepo, fronteiras, contratos, APIs, dependências e decisões arquiteturais.
- [jyboia-accessibility](.agents/skills/jyboia-accessibility/SKILL.md): semântica, teclado, foco, alternativas ao arraste e interação com leitores de tela.
- [jyboia-block-engine](.agents/skills/jyboia-block-engine/SKILL.md): modelo de blocos, conexões, validação, interpretação, estados e serialização.
- [jyboia-testing](.agents/skills/jyboia-testing/SKILL.md): testes automatizados, contratos, regressões e evidências manuais de acessibilidade.
- [jyboia-scratch](.agents/skills/jyboia-scratch/SKILL.md): editor Scratch, adaptador e integração do palco existente.
- [jyboia-python](.agents/skills/jyboia-python/SKILL.md): modelo Python, geração e futuro terminal/runtime em Worker.
- [jyboia-backend](.agents/skills/jyboia-backend/SKILL.md): API, contratos e persistência preservados fora do MVP.
- [jyboia-aws](.agents/skills/jyboia-aws/SKILL.md): planejamento e IaC AWS, sem autorização implícita para provisionar.

Os nomes e descrições no frontmatter permitem seleção por tarefa. Também é possível solicitar uma skill pelo nome, por exemplo, `$jyboia-accessibility`.

## Versionamento e validação

Versione instruções, skills, documentação, IaC e configurações sem segredos. Não versionar ambientes reais, credenciais, tokens, autenticação local nem artefatos sensíveis. Exemplos devem conter somente placeholders. Não fazer push sem solicitação.

Execute builds, testes unitários, tipos e suítes de navegador sequencialmente: todos podem recompilar pacotes observados pelo Vite. Não recompilar durante Playwright nem considerar uma falha intermitente resolvida por uma repetição isolada. Preserve o registro de evidências em `apps/web/docs/VALIDATION.md`.
