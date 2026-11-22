# MVP estático — 18/11/2026

Atualização modular de 22/11/2026: `/` e `/scratch` mantêm o editor; `/python` apresenta página preparatória. Build e uso continuam sem API, banco ou persistência. Pyodide/terminal são planejamento futuro, sem runtime instalado nesta fase. Rotas e evidências atuais: [NAVIGATION](../apps/web/docs/NAVIGATION.md) e [VALIDATION](../apps/web/docs/VALIDATION.md). Os resultados abaixo são históricos.

Atualização posterior de interface: removidos por solicitação os dois painéis completos (“Organizar blocos sem arrastar” e “Programa e resultado”) e a mensagem sobre perda do trabalho. O teste estático atual verifica a ausência desses elementos e constrói Quando iniciar → Mover 10 passos diretamente pela paleta, esperando x=10. Memória temporária, ausência de API/armazenamento e editor vazio após recarga permanecem. As referências abaixo ao aviso e ao exemplo automático descrevem a entrega anterior.

## Escopo e publicação

A aplicação pública abre o editor diretamente, sem contas, API ou banco. Programas ficam somente na memória da página, sem localStorage, sessionStorage, IndexedDB, cookies de projeto ou envio ao servidor. Recarregar/fechar perde o trabalho; a interface informa isso permanentemente. Cache HTTP de assets estáticos não salva programas.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

Desenvolvimento: `http://localhost:5173`. Preview: `http://localhost:4173`. Artefato publicável: **somente `apps/web/dist`**. Não há variáveis de ambiente obrigatórias nem migrações para este fluxo. A URL raiz serve `index.html`; CSS, JavaScript, fontes e imagens são servidos como arquivos estáticos. Para hospedar sob subdiretório, configurar `base` do Vite e validar novamente os caminhos antes de publicar. O preview é uma ferramenta local de conferência, não uma infraestrutura de produção. Nenhum deploy ou recurso AWS foi criado nesta fase.

## Impacto avaliado

- Removido o vínculo da página principal com `useProjects` e `ProjectActions`; seus arquivos, cliente HTTP, API, Prisma, migrações e contratos permanecem preservados para evolução futura.
- Nenhum fluxo de autenticação existia. A tela antiga de health não era roteada e continua fora do bundle público.
- A PoC só é roteada em desenvolvimento. O build público contém o editor principal único.
- `dev` e `build` passam a trabalhar somente no frontend e pacotes; `dev:all`/`build:all` preservam a manutenção opcional da stack anterior.
- Testes de persistência no navegador foram mantidos com suspensão explícita. Não devem ser contados como aprovados no MVP. Testes unitários de contratos e adaptadores continuam úteis.
- Não foram apagados dados, tabelas ou código de motor/acessibilidade. Login, REST, persistência, banco e AWS só podem ser reativados mediante novo escopo.
- A validação encontrou perda intermitente de foco ao inserir operadores. O adaptador agora foca o bloco após o layout do Blockly terminar, cancelando foco adiado quando outra inserção o substitui ou o usuário já mudou o destino. O teste de teclado aguarda as transições observáveis de foco e fechamento de campos.

## Validação

`pnpm test:e2e:static` compila e serve o build real, bloqueia requisições externas/API e tentativas de gravação via Storage/IndexedDB, constrói o exemplo por teclado, verifica anúncio e resultado x=40 com Olá, recarrega e confirma editor vazio. `pnpm test:e2e` cobre regressões de categorias, encaixes, teclado, ponteiro, semântica e execução.

Resultados executados em Windows com Node 24.22.2, pnpm 12.16.1 e Edge 157.0.4341.60:

| Verificação | Resultado |
| --- | --- |
| `pnpm test` | 65 testes passaram, 14 arquivos |
| `pnpm lint` | Passou sem avisos |
| `pnpm build` / `build:web` | Passou, incluindo TypeScript do frontend; nenhum Prisma/API/banco iniciado |
| `pnpm test:e2e` | 19 testes passaram na rodada final |
| `pnpm test:e2e:static` | 1 teste passou com build real, sem requisições externas/API ou gravação de programas |
| Repetição do cenário de foco corrigido | 5 execuções consecutivas passaram |
| Prettier dos arquivos de código/configuração alterados | Passou |

A rodada inicial identificou perda intermitente de foco; a correção foi validada antes dos resultados finais acima. O bundle público não contém referências aos endpoints `/api/projects`, `/health` ou ao servidor local, nem chunk da PoC. Permanece um aviso de tamanho do bundle do editor (~881 kB minificado); não é erro de build.

Testes de banco não foram executados nesta fase: a API preservada não foi alterada e não compõe o MVP. Os quatro E2E históricos de persistência estão suspensos, não aprovados. Nenhum deploy foi realizado.

NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari permanecem pendentes; incluir leitura do aviso de perda, construção, execução e interrupção na validação manual. Não declarar conformidade WCAG somente com automação.
