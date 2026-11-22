# Infraestrutura

Consulte `docs/ARCHITECTURE.md` e a skill `jyboia-aws`. Não transportar regras de interface para stacks.

Esta área está reservada para CDK; nenhuma stack é necessária à modularização. Não executar comandos AWS nem provisionar recursos sem tarefa específica. Python executará no navegador no MVP.

Versionar código IaC, instruções e exemplos sem segredos. Excluir credenciais, `.aws`, `.env` real, `cdk.out` e contextos com dados resolvidos. Decisões de serviços/custos devem distinguir planejamento de recursos reais.
