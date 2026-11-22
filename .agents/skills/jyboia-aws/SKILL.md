---
name: jyboia-aws
description: Planejar ou revisar infraestrutura AWS CDK, segurança, custos e deploy do Jyboia em infra/aws quando houver tarefa específica de infraestrutura.
---

# Infraestrutura AWS

Leia [arquitetura AWS](../../../infra/aws/docs/ARCHITECTURE.md). A área atualmente contém planejamento; não há stack implantada. Esta skill não autoriza comandos AWS, criação de recursos ou deploy por si só.

Mantenha IaC separada do frontend/backend e não crie uma infraestrutura por editor sem necessidade demonstrada. O runtime Python do MVP pertence ao navegador, não ao backend AWS. Mudanças de interface não exigem recursos AWS.

Em tarefas futuras autorizadas, documente região, identidade, menor privilégio, exposição, retenção, orçamento, rollback e recursos afetados. Identifique custos estimados e premissas; não tratar planejamento como implantação confirmada.

Versione CDK e configurações não sensíveis; preserve exclusões de credenciais, tokens locais, ambientes reais e artefatos/contextos resolvidos. Nunca inserir credenciais em `VITE_`, assets, instruções ou exemplos. Não aplicar padrões de React/Blockly às decisões internas de infraestrutura.
