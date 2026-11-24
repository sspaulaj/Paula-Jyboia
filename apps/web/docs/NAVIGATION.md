# Rotas

| URL | Comportamento |
| --- | --- |
| `/` | Scratch, preservando a entrada pública anterior. |
| `/scratch` | Mesmo módulo Scratch. |
| `/python` | PoC de execução Python com exemplos predefinidos, Worker real e terminal; ainda sem editor de blocos ou gerador. |
| `/experiments/editor` | PoC somente em desenvolvimento. |
| Demais caminhos | Fallback Scratch preservado nesta etapa. |

Rotas são do frontend, não endpoints REST. O servidor estático precisa encaminhar caminhos de aplicação a `index.html`. Tanto `vercel.json` na raiz (build a partir do monorepo) quanto `apps/web/vercel.json` (Root Directory `apps/web`) precisam manter o mesmo rewrite e os mesmos cabeçalhos Python; a Vercel usa a configuração da raiz selecionada, não combina os dois arquivos. Os comandos de build e diretório de saída são específicos de cada configuração. Testar acesso direto e recarga na hospedagem, não somente no Vite dev.

A faixa superior comum contém a marca Jyboia e links Scratch/Python, com `aria-current="page"` no módulo atual. Os controles específicos continuam dentro de cada módulo. Entrar, cadastrar e tela inicial ficam para etapas futuras.

Os links usam navegação de documento, preservando também os cabeçalhos de isolamento exigidos pelo Python. O ciclo de memória é o mesmo do MVP: recarregar/navegar para outra página descarta o programa. Não há armazenamento nem promessa de recuperação. Quando houver navegação SPA, projetar snapshots em memória, cancelamento de execução, restauração de foco e desmontagem de listeners antes de montar outro workspace.
