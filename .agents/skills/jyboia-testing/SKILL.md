---
name: jyboia-testing
description: Planejar, implementar ou executar testes do Jyboia para regras e motor, integração, API REST, fluxos end-to-end do editor, acessibilidade e regressões. Usar para verificar mouse, teclado, ordem dos anúncios e registrar testes manuais com leitores de tela.
---

# Testes do Jyboia

Associe a alteração aos critérios de [REQUIREMENTS](../../../docs/REQUIREMENTS.md) e à entrega de [ROADMAP](../../../docs/ROADMAP.md). Siga o [AGENTS.md](../../../AGENTS.md) e utilize as ferramentas já adotadas; não instale uma stack de testes apenas para revisar documentação.

## Escolher a camada de teste

Execute builds/unitários/tipos antes das suítes Playwright, nunca simultaneamente: recompilar pacotes observados pelo Vite pode provocar recargas e invalidar precondições de hover/interceptação. Ao investigar intermitência, registre execução completa repetida, não somente sucesso isolado. Consulte [VALIDATION](../../../apps/web/docs/VALIDATION.md).

Cubra `/`, `/scratch`, `/python` e acesso direto no build estático. Verifique que a página Python preparatória não carrega Scratch, API nem runtime. Nas etapas futuras, teste geração e runtime Python separadamente: input vazio/Unicode, conversão inválida, cancelamento em espera/laço, limites de saída e mensagens antigas. Esses cenários planejados não são testes já executados.

No MVP estático, teste editor e motor sem exigir API, banco, autenticação ou persistência. Testes de API/PostgreSQL da tabela abaixo se aplicam quando esses componentes forem alterados; não reative serviços para validar uma mudança exclusivamente visual ou assistiva. Consulte os comandos existentes no `package.json` e [STATIC_MVP](../../../docs/STATIC_MVP.md).

| Camada | Evidência a produzir |
| --- | --- |
| Unidade | Regras de conexão e parâmetros, validação estrutural, ordem e resultados do motor, limites e cancelamento, sem navegador ou banco. |
| Integração | Adaptador do editor para o modelo, eventos para palco/anúncios e API com PostgreSQL isolado para testes. |
| Contrato | Requisições, respostas, códigos HTTP e erros reais da API compatíveis com OpenAPI, incluindo entradas inválidas e versões incompatíveis. |
| End-to-end | Construir, editar, conectar, executar, interromper e, quando disponível, salvar/reabrir programas na interface. |
| Acessibilidade | Verificações automáticas de semântica, teclado e foco, complementadas por leitura manual com tecnologia assistiva real. |

Use programas pequenos com resultados esperados calculados independentemente da implementação. Controle relógio, estado e dados de teste; espere condições observáveis em vez de pausas arbitrárias. Não substitua o componente central sob teste por mocks nem use snapshots como única evidência semântica.

## Exercitar o editor

Execute cenários equivalentes com mouse e somente teclado, comparando modelo e resultado. Cubra inserir, conectar, desconectar, reorganizar, editar parâmetros e remover, além da alternativa ao arraste por clique. Verifique destino do foco após operações, saída do workspace e recuperação após erros.

Inclua conexão incompatível, parâmetro inválido, bloco desconectado, ponto de entrada inválido e cancelamento seguido de reinício. Para regressões, reproduza o comportamento que falhava e registre a expectativa corrigida.

## Verificar anúncios em duas camadas

Ao alterar anúncios, cubra as regressões pertinentes:

- Mouse parado por tempo prolongado, passagem entre campos, eventos sem deslocamento e saída/reentrada rápida: uma publicação por entrada, sem mover foco.
- Ativar Iniciar por clique com ponteiro imóvel e por teclado: sequência conectada em ordem, foco previsível, estados verdadeiros de Iniciar/Parar e ausência de avisos antigos concorrentes.
- Editor vazio ou comandos sem início: aviso acessível sem texto abaixo do palco, foco preservado e possibilidade de nova tentativa. Sequência válida permanece acessível mesmo visualmente oculta.
- Movimento seguido de fala: resultado visual correto, texto de Diga preservado e ausência de coordenadas nos anúncios automáticos; parâmetros de blocos X/Y continuam acessíveis.
- Ao mudar objetos mantidos em memória pelo React/editor, testar também a compatibilidade durante atualização em desenvolvimento, além da página recém-aberta. Não exigir recarga que perca o programa para contornar uma regressão.

Instale relógios simulados antes de agendar eventos de hover do Blockly; misturar temporizadores reais pendentes e relógio simulado pode gerar falhas artificiais. Espere o anúncio específico que está sendo testado, não qualquer mensagem anterior que contenha parte do mesmo texto.

1. Automatize a verificação da sequência de eventos e atualizações acessíveis: comandos e valores em ordem, ausência de blocos não executados, coerência com o palco, término e cancelamento, descarte de mensagens de execuções anteriores.
2. Teste manualmente o anúncio percebido pelo leitor de tela. Inspecionar o DOM ou disparar eventos de foco/hover não comprova a fala. Cubra mensagens repetidas, sequência longa, reinício rápido e interrupções; confirme que a sequência continua consultável.

Não confunda a ordem de atualização de uma região viva com garantia de ordem ou completude da fala. Relate separadamente o resultado automatizado e a observação com leitor de tela.

## Registrar testes manuais

Use a matriz NVDA com Firefox e Chrome no Windows e VoiceOver com Safari no macOS prevista no projeto; outros leitores podem complementar a cobertura quando solicitados ou disponíveis. Registre para cada execução:

- Data, versão do projeto, sistema operacional, navegador e leitor de tela com versões e configurações relevantes.
- Requisito, programa inicial, passos e teclas usadas, incluindo modo de navegação do leitor quando relevante.
- Foco esperado, conteúdo e ordem esperados; resultado observado e anúncios percebidos.
- Aprovação, falha ou não executado; evidência, limitação e referência ao defeito quando existente.

Para problemas de interação, consulte [jyboia-accessibility](../jyboia-accessibility/SKILL.md). Avaliação com pessoas com deficiência visual complementa a matriz técnica conforme o roadmap.

## Concluir a verificação

Informe comandos executados, resultados, cobertura relevante e cenários indisponíveis. Ferramentas automáticas não certificam WCAG AA nem substituem leitores de tela. Uma correção de barreira deve ter regressão na camada adequada e nova validação manual quando afetar a interação assistiva.
