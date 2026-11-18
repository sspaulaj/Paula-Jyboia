# Validação da base técnica

Data: 4 de novembro de 2026. Ambiente: Windows x64, Node.js 24.22.2 portátil e pnpm 12.16.1. O NVM disponível não tinha uma versão ativa; o runtime oficial foi baixado para `.tools/` e seu SHA-256 conferido. Nenhuma configuração global de Node foi alterada.

| Verificação | Resultado |
| --- | --- |
| Instalação pnpm com peers estritos | Aprovada; lockfile gerado, sem conflito de versões. |
| `pnpm install --frozen-lockfile --offline` | Aprovado após alinhar configurações ao pnpm 12; 326 pacotes reutilizados do cache local, sem download. |
| `pnpm peers check` | Nenhum problema de peer dependency encontrado. |
| `pnpm build` | Aprovado nos quatro pacotes/aplicações; Vite produziu assets e Prisma gerou cliente. |
| `pnpm typecheck` | Aprovado nos quatro pacotes/aplicações. |
| `pnpm lint` | Aprovado, zero warnings. |
| `pnpm format:check` | Aprovado no escopo configurado; documentos anteriores excluídos da formatação automática. |
| `pnpm test` | 3 arquivos, 7 testes aprovados. |
| `pnpm db:validate` | Schema Prisma válido. |
| `pnpm dev` | Vite, Fastify e watchers dos pacotes iniciaram fora do sandbox. |
| `GET http://127.0.0.1:3001/health` | HTTP 200, corpo `{"status":"ok","service":"jyboia-api"}`. |
| Frontend `http://localhost:5173/` | HTTP 200, HTML pt-BR; módulos main.tsx e App.tsx transformados pelo Vite com HTTP 200. |
| CORS real | Origem configurada aceita; origem externa não recebeu cabeçalho de permissão. |

## Limitações verificadas

- Docker não está instalado/disponível neste ambiente. Compose foi configurado e revisado, mas não foi possível executar `docker compose config`, iniciar o container, testar persistência do volume ou confirmar conexão Prisma/PostgreSQL. Executar `pnpm db:up` e `pnpm db:check` após instalar/iniciar Docker. Não considerar o banco local validado.
- O watcher tsx falhou inicialmente no sandbox ao consultar dados do usuário Windows (`uv_os_get_passwd`). A repetição fora do sandbox iniciou normalmente; não foi necessário alterar dependências ou código para contornar a restrição.
- A verificação do frontend foi HTTP e transformação de módulos, complementada pela renderização estática em teste; não houve teste em navegador gráfico ou com leitor de tela. Não se declara acessibilidade concluída.
- Nenhuma migração foi aplicada. O modelo Prisma apenas prepara a estrutura prevista; não há operações de projetos implementadas.
- Não há editor ou interpretação de blocos para validar nesta etapa. O protótipo de viabilidade Blockly continua pendente.

Nenhum erro conhecido de build, lint, tipos ou testes permanece. A infraestrutura de banco requer a verificação acima antes de trabalhos que dependam dela.

Os servidores e watchers temporários foram encerrados após a verificação HTTP. Para reiniciar, siga DEVELOPMENT.md. A configuração inicial em `.npmrc` foi corrigida para `pnpm-workspace.yaml`, e a reinstalação offline confirmou o cache local e o lockfile.
