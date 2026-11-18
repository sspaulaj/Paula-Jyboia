# Vercel

- Projeto: `jyboia`; repositório monorepo `Paula-Jyboia`, privado; produção na branch `main`.
- Root Directory: `apps/web`; incluir arquivos fora da Root Directory para os pacotes compartilhados.
- Framework: Vite; Node: `24.x`; configuração versionada em `apps/web/vercel.json`.
- Instalação: `cd ../.. && corepack pnpm install --frozen-lockfile`.
- Build: `cd ../.. && corepack pnpm build:web`; saída: `dist` relativa a `apps/web`.
- Sem variáveis de aplicação, banco ou API. Não publicar `apps/api` ou `infra/aws`.
- Git e produção serão ativados após autorização. Login Vercel utiliza o fluxo oficial pelo navegador, sem tokens versionados.

Referências: [monorepos](https://vercel.com/docs/monorepos), [Vite e SPA](https://vercel.com/docs/frameworks/frontend/vite), [gerenciador de pacotes](https://vercel.com/docs/package-managers).
