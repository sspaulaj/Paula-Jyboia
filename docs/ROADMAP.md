# Roadmap do Jyboia

## Atualização modular — 22/11/2026

1. **Fase B concluída:** Scratch encapsulado, anúncios comuns, rotas, docs e skills. Evidências em [VALIDATION](../apps/web/docs/VALIDATION.md).
2. **Fase C — prova técnica Python:** Pyodide em Worker, terminal de exemplos, input com UI responsiva e cancelamento em laços/espera. Implementação, limites e roteiro em [PYTHON_RUNTIME](../apps/web/docs/PYTHON_RUNTIME.md); validar runtime real, isolamento de origem, falhas de carregamento e teclado antes de avançar.
3. **Modelo, catálogo e geração:** implementar o escopo pedagógico em [PYTHON](../apps/web/docs/PYTHON.md), com regras e semântica próprias, código válido e mapeamento bloco/linha. Aceitação: tipos, ordem, aninhamento, precedência e escapes testados; Scratch independente.
4. **Editor Python e terminal:** integrar código, execução, print/input, erros e controles acessíveis, sem backend. Aceitação: fluxo completo, limites, interrupção e ausência de mensagens de execuções anteriores.
5. **Validação assistiva/educacional:** NVDA/Firefox, NVDA/Chrome, VoiceOver/Safari e público-alvo; medir carregamento/execução em equipamentos escolares. Aprovação exige evidência real, não somente testes DOM.

Não antecipar etapas 3–5 durante a prova de execução. Autenticação, persistência e AWS continuam em escopo futuro separado. O objetivo Python inclui execução local, substituindo o plano anterior de apenas gerar código.

Atualização de 18/11/2026: escopo definitivo do MVP substitui a entrega pública de persistência. Editor e motor serão publicados como aplicação estática, sem contas, API, banco ou salvamento. A integração anterior é evidência histórica e seu código permanece preservado.

## Prioridades vigentes para o MVP

1. Isolar o frontend: comandos de desenvolvimento/build sem backend; aviso de memória temporária; nenhuma chamada de API ou gravação de programas. Critério: teste do build estático constrói, executa e recarrega vazio sem API/banco.
2. Validar acessibilidade e educação: preservar teclado, leitura de blocos, estruturas aninhadas, execução e foco; executar matriz de leitores de tela reais. Critério: tarefas essenciais validadas, com versões e limitações registradas.
3. Preparar publicação estática: artefato `apps/web/dist`, assets próprios e acesso direto ao editor. Critério: teste em servidor estático e documentação do processo. Hospedagem efetiva requer solicitação; esta fase não realiza deploy.
4. Evolução posterior, sem implementação nesta fase: login/cadastro, autenticação/autorização, persistência, REST, banco e AWS, com nova definição de acesso e privacidade.

As etapas abaixo registram o plano histórico. Em particular, a etapa 4 de persistência está suspensa no MVP e não é pré-requisito de publicação estática. Testes manuais seguem pendentes em [ACCESSIBILITY_VALIDATION](ACCESSIBILITY_VALIDATION.md).

As entregas são incrementais, sem datas assumidas. Cada etapa depende da aceitação da anterior e de solicitação para iniciar o trabalho correspondente. Este documento não autoriza implementação nesta tarefa.

## 0. Fundação documental — etapa atual

Entrega: README, instruções permanentes, visão de produto, requisitos e este roadmap, incluindo investigação documental inicial do Blockly.

Concluída quando os cinco documentos estiverem consistentes, com arquitetura, escopo, critérios verificáveis e pendências explícitas. Não inclui código, instalação de dependências ou infraestrutura.

## 1. Viabilidade do editor único acessível

Estado em 4 de novembro de 2026: [PoC implementada e automatizada](EDITOR_POC.md), com quatro blocos. Validação com leitores reais e pessoas com deficiência visual pendente; etapa não concluída. Palco e execução continuam fora do escopo desta experiência.

Entrega: protótipo isolado de avaliação do Blockly e relatório de acessibilidade, sem produto completo. Confirmar versão disponível e testar blocos e campos representativos com mouse, teclado e leitores de tela da matriz inicial.

Critérios de conclusão:

- Inserir, conectar, desconectar, mover, editar e remover blocos pelo teclado no mesmo editor visual.
- Ler comandos, parâmetros e conexões; recuperar o foco após mudanças; entrar e sair do editor sem bloqueios.
- Avaliar descrição do palco e anúncio de uma sequência em português, incluindo sequência longa e acionamentos repetidos.
- Registrar evidências, versões, limitações e avaliação com pessoas com deficiência visual, com mediação adequada ao público infantil quando houver crianças participantes.
- Registrar decisão arquitetural sobre adoção, adaptações ou alternativa ao Blockly. Barreiras essenciais sem solução impedem avançar com a base avaliada.

## 2. Base técnica e semântica de programação

Entrega: monorepo React/Node.js/TypeScript, pacotes de modelo/regras, contratos e motor, ferramentas de qualidade e primeiros contratos REST documentados. Não exige banco provisionado nesta etapa.

Critérios de conclusão:

- Dependências entre pacotes preservam separação de responsabilidades.
- Modelo versionado define ponto de entrada, sequência, conexões, parâmetros, coordenadas e unidades de movimento/giro.
- Motor interpreta comandos conhecidos e emite eventos sem dependências de interface; validação rejeita programas inválidos.
- Testes cobrem ordem, parâmetros inválidos, comandos desconhecidos, limites e cancelamento; comandos de desenvolvimento e teste são documentados e executáveis.
- Limites de tamanho/passos/duração e metas de desempenho são registrados; contratos têm exemplos e erros definidos.

## 3. Primeiro fluxo educacional completo, local

Entrega: editor único integrado ao motor, um personagem no palco, comandos sequenciais de movimento e giro, controles “Iniciar programa” e “Parar programa”.

Critérios de conclusão:

- Uma criança pode construir e executar um programa válido, consultar a sequência e compreender o resultado sem mouse e sem depender da visão.
- RF-01 a RF-09 e RF-11 têm evidências no escopo inicial; blocos desconectados e ponto de entrada inválido recebem tratamento explícito.
- Anúncios e sequência consultável correspondem aos eventos do motor e ao estado visual; erros e cancelamento preservam foco e programa.
- Testes de integração e ponta a ponta passam; validação manual com teclado e matriz de leitores de tela não apresenta barreiras que impeçam as tarefas essenciais.

## 4. Persistência por API REST e PostgreSQL — futura, fora do MVP

Entrega: backend com operações para salvar e recuperar programas, migrações de banco e integração com o frontend.

Critérios de conclusão:

- RF-10 é verificado por testes de integração com PostgreSQL e por salvar/reabrir na interface, preservando semântica e conexões.
- Contrato OpenAPI corresponde à API; entradas inválidas e falhas de rede/banco recebem respostas e mensagens acessíveis verificadas.
- Acesso aos programas, retenção e exclusão têm política e mecanismo definidos antes de exposição a usuários reais. Não presumir autenticação ou links públicos; registrar a decisão de acesso dentro do escopo autorizado.
- Migrações, configuração sem segredos versionados e procedimentos locais de execução/teste estão documentados.

## 5. Validação educacional e de acessibilidade

Entrega: piloto acompanhado com crianças do público-alvo, incluindo participantes com deficiência visual, e educadores; auditoria do fluxo entregue e correções prioritárias.

Critérios de conclusão:

- Registrar procedimentos de participação adequados à idade e privacidade antes do piloto.
- Avaliar construir, compreender, executar e corrigir programas; registrar dificuldades e evidências sem exposição de dados pessoais.
- Revisar WCAG 2.2 AA no escopo entregue e executar novamente a matriz assistiva; documentar cobertura e limitações sem alegações além das evidências.
- Corrigir barreiras às tarefas essenciais e executar regressão automatizada e manual das correções.
- Registrar resultados e propostas futuras separadamente. Repetições, condições, múltiplos personagens ou outras expansões dependem de nova definição e autorização de escopo.

## Evidência parcial da entrega de persistência

Backend local implementado e testado com PostgreSQL real: CRUD, JSONB versionado, revisão otimista, validação e OpenAPI. Ver BACKEND_VALIDATION. Isso não conclui a entrega 4: integração de salvar/reabrir no editor, política para usuários reais e aceitação assistiva continuam pendentes; nenhuma dessas etapas é autorizada implicitamente por este registro.
