# Versões da base técnica

Consulta em 4 de novembro de 2026 ao registro oficial npm (metadados `version`, `engines` e `peerDependencies`) e ao índice oficial de distribuições Node.js. Versões diretas fixadas sem `^`/`~`; resolução transitiva em `pnpm-lock.yaml`.

| Ferramenta | Versão escolhida | Motivo |
| --- | --- | --- |
| Node.js | 24.22.2 | Patch estável LTS 24 compatível com ferramentas e tipos. |
| pnpm | 12.16.1 | Release estável consultada; workspaces e lockfile único. |
| TypeScript | 6.0.3 | Faixa suportada pelo typescript-eslint; 7.0.2 foi descartado por incompatibilidade de peer. |
| React / React DOM | 19.3.1 | Releases estáveis alinhadas. |
| Vite / plugin-react | 8.3.5 / 6.2.1 | Plugin exige Vite 8; Node escolhido satisfaz engines. |
| Fastify / cors | 5.12.8 / 11.4.0 | Plugin da linha compatível com Fastify 5. |
| Prisma CLI / client / adapter-pg | 7.10.1 | Linha estável alinhada; latest da CLI apontava para 8.0.0-rc.30, rejeitada. |
| PostgreSQL | 18.6-alpine | Release estável da linha 18; sem adotar PostgreSQL 19 RC. |
| Vitest | 5.1.0 | Compatível com Node 24 e Vite 8. |
| ESLint / @eslint/js | 10.14.0 / 10.0.1 | Flat config, compatível com typescript-eslint. |
| typescript-eslint | 8.72.1 | Peer TypeScript >=4.8.4 e <6.1.0, ESLint 10 aceito. |
| Prettier / eslint-config-prettier | 3.9.10 / 10.1.8 | Formatação separada do lint. |
| tsx / dotenv | 4.23.15 / 18.0.9 | Watch da API e carregamento explícito de ambiente. |
| pg / @types/pg | 8.23.1 / 8.23.1 | Driver PostgreSQL utilizado pelo adapter. |
| @types/node | 24.19.2 | Mesma linha principal do runtime. |
| @types/react / react-dom | 19.3.0 / 19.3.0 | Tipagem compatível com React 19.3. |
| globals | 17.14.0 | Ambientes do ESLint. |

Não presumir que `latest` significa estável ou compatível. Instalação usa peers estritos. Configurações pnpm (incluindo storeDir e strictPeerDependencies) ficam em `pnpm-workspace.yaml`, pois versões 11+ não leem esses ajustes em `.npmrc`. Builds de dependências são autorizados individualmente no workspace; o cliente Prisma é gerado explicitamente, sem postinstall implícito do pacote client.

Fontes:

- [Distribuições Node.js](https://nodejs.org/dist/index.json), com SHA-256 oficial verificado para o runtime portátil usado nesta execução.
- [Registro npm](https://registry.npmjs.org/): metadados dos pacotes listados e versões fixadas.
- [Requisitos Vite](https://vite.dev/guide/).
- [Prisma 7](https://www.prisma.io/docs/orm/v7): ESM, configuração e adapter explícito.
- [Configuração de builds pnpm](https://github.com/pnpm/pnpm/blob/main/pnpm/docs/settings/build.md): `allowBuilds` na linha 12.
- [Releases PostgreSQL](https://www.postgresql.org/docs/current/release.html).

## Dependências da PoC do editor — 4 de novembro de 2026

- `blockly` **13.4.0** no frontend: teclado e leitores de tela no núcleo da linha 13; API e limitações verificadas na [documentação oficial](https://docs.blockly.com/guides/configure/screen-reader/).
- `@playwright/test` **1.64.1** na raiz: testes de integração no navegador com mouse, teclado e árvore de acessibilidade. Usa Edge instalado, sem servidor ou navegador de produção adicional.
- Frontend importa `@jyboia/block-engine/experimental` por dependência `workspace:*`. O motor não importa Blockly.

Versões exatas fixadas nos manifests e lockfile, instaladas com peers estritos. Evidências e condições de adoção em [EDITOR_POC](EDITOR_POC.md).

## Dependência da validação do backend

Ajv **8.20.0** (MIT), já presente na stack Fastify e agora declarado diretamente em block-engine, valida o JSON Schema persistível sem DOM, React ou banco. Não houve atualização das versões Fastify/Prisma/PostgreSQL. O validador é exportado por `block-engine/validation` e contratos por `shared/projects`, mantendo imports do health e do editor experimental sem carregar Ajv. PostgreSQL 18.6 portátil foi usado exclusivamente para testes reais; consulte BACKEND_VALIDATION.
