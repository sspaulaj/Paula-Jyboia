# Infraestrutura AWS: planejamento

**Estado:** nenhuma stack CDK ou recurso AWS implementado/provisionado nesta fase. `infra/aws` é a fronteira reservada para IaC futura. O frontend continua publicável como arquivos estáticos, com configuração Vercel preservada.

## Responsabilidades

O eventual código CDK TypeScript, documentação e exemplos sem segredos serão versionados aqui. Não criar infraestrutura independente por editor: avaliar serviços comuns com isolamento lógico quando houver requisitos de servidor aprovados. Não executar Python no backend AWS no MVP; o plano é Pyodide no navegador.

Serviços concretos de autenticação, API, banco e hospedagem AWS ainda não estão selecionados. Não apresentar recursos planejados como implantados nem estimar custos sem região, tráfego, retenção e disponibilidade definidos.

## Segurança, custos e deploy futuros

- Credenciais ficam fora do Git e do frontend; usar identidades temporárias e menor privilégio quando a integração for autorizada.
- Não versionar `.aws`, tokens locais, `.env` real, chaves, contextos CDK resolvidos ou `cdk.out`.
- Revisar acesso público, retenção, dados infantis e custos antes de aprovar stacks.
- Documentar orçamento, alertas, ambientes, rollback e limpeza antes de deploy. Nenhum comando AWS é necessário à Fase B.
- Cabeçalhos COOP/COEP para eventual Pyodide são uma decisão de hospedagem estática, não motivo para provisionar AWS. Ver [Python](../../../apps/web/docs/PYTHON.md).

Diagrama global: [frontend, backend e infraestrutura](../../../docs/diagrams/platform-boundaries.md).
