# Rotas

| URL | Comportamento |
| --- | --- |
| `/` | Scratch, preservando a entrada pública anterior. |
| `/scratch` | Mesmo módulo Scratch. |
| `/python` | PoC de execução Python com exemplos predefinidos, Worker real e terminal; ainda sem editor de blocos ou gerador. |
| `/experiments/editor` | PoC somente em desenvolvimento. |
| Demais caminhos | Fallback Scratch preservado nesta etapa. |

Rotas são do frontend, não endpoints REST. O servidor estático precisa encaminhar caminhos de aplicação a `index.html`; `apps/web/vercel.json` contém o rewrite. Testar acesso direto e recarga no build de produção, não somente no Vite dev.

O link da página Python para Scratch é navegação de documento. O ciclo de memória é o mesmo do MVP: recarregar/navegar para outra página descarta o programa. Não há armazenamento, seletor adicional no Scratch ou promessa de recuperação. Quando houver navegação SPA, projetar snapshots em memória, cancelamento de execução, restauração de foco e desmontagem de listeners antes de montar outro workspace.
