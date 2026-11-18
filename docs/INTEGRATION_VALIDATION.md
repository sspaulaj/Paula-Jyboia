# Validação da integração — 17/11/2026

Registro histórico anterior à D-17: o MVP de 18/11/2026 retirou persistência da interface pública. Este fluxo e seus resultados não descrevem a versão atual; consulte [STATIC_MVP](STATIC_MVP.md). O código foi preservado e os quatro cenários E2E de persistência estão suspensos.

## Entrega

Frontend → cliente HTTP tipado → API Fastify → Prisma/PostgreSQL. O motor executa no navegador, sem conhecer servidor ou banco. O editor único exporta o grafo independente v2, valida importações e restaura IDs, tipos, parâmetros, conexões e raízes. A API aceita v1 e v2; projetos legados só são regravados em v2 ao salvar.

Implementados: criar projeto local, nomear, salvar por POST/PUT, listar/abrir, recuperar e executar, excluir com confirmação, indicar alterações não salvas e explicar falhas. PUT/DELETE usam revisão otimista. Falhas não apagam o programa local; não há repetição automática de gravações. O nome e as alterações ficam no navegador até Salvar projeto.

## Fluxo reproduzível

Com Node/pnpm disponíveis e `.env` configurado conforme [DEVELOPMENT](DEVELOPMENT.md):

```sh
pnpm db:up
pnpm db:generate
pnpm db:deploy
pnpm dev
```

1. Abra `http://localhost:5173`, escolha Novo projeto e preencha Nome do projeto.
2. Em Organizar blocos sem arrastar, adicione o exemplo com repetição e condição.
3. Salve. Aguarde “Projeto salvo com sucesso.” e o indicador “Projeto salvo.”.
4. Crie outro projeto vazio, abra a lista e carregue o anterior.
5. Confira evento → mover 10 → repetir 3 {mover 10} → se 1 > 0 {dizer Olá}.
6. Inicie: o personagem termina em x=40, y=0, dizendo Olá.
7. Altere o primeiro movimento para 25, salve novamente e reabra. O valor 25 e as conexões devem permanecer.
8. Exclua e confirme; o recurso deixa de existir na API.

## Resultados executados

Ambiente: Windows, Node 24.22.2, pnpm 12.16.1, Edge 157.0.4341.60. PostgreSQL local real em porta de testes, schemas aleatórios isolados; dados de desenvolvimento não foram apagados.

| Verificação | Resultado |
| --- | --- |
| `pnpm build` | Passou; aviso de bundle do editor acima de 500 kB |
| `pnpm lint` | Passou |
| `pnpm typecheck` | Passou |
| `pnpm test` | 65 testes passaram, 14 arquivos |
| `pnpm test:integration` | 18 testes passaram com PostgreSQL |
| `pnpm test:e2e` | 19 testes passaram |
| `pnpm exec playwright test --config playwright.persistence.config.ts` | 4 testes passaram com navegador, API e PostgreSQL reais |

Os quatro cenários de persistência cobrem: ciclo completo com edição de parâmetro e revisão; erro de rede e cancelamento de descarte; conversão v1 com estado inicial preservado; conflito 412 e resposta inválida sem perder alterações locais. O fluxo verifica nomes acessíveis após carregar, mensagens de estado e foco ao salvar. Teste do adaptador reconstrói os 16 tipos com os mesmos IDs, valores e relações; API rejeita corpo interno incompatível e divergência de versão.

Para repetir testes de banco, defina `TEST_DATABASE_URL` para um banco PostgreSQL local exclusivo de testes, com permissão para criar schemas. Execute as suítes de navegador sequencialmente. A configuração de persistência usa portas 3002 e 5175; a regressão usa 5174. `pnpm test:e2e:persistence` também prepara o build antes dos quatro cenários.

## Limitações explícitas

- NVDA/Firefox, NVDA/Chrome e VoiceOver/Safari não foram executados. Roteiro pendente em [ACCESSIBILITY_VALIDATION](ACCESSIBILITY_VALIDATION.md); testes de DOM/foco não certificam acessibilidade.
- Sem autenticação ou isolamento por usuário: somente desenvolvimento local, sem exposição pública.
- Fechar página sem salvar depende do aviso nativo do navegador; não há recuperação automática de rascunhos.
- Conflitos preservam o trabalho local, mas não fazem mesclagem automática. POST com resposta perdida pode ter criado o projeto; consulte a lista antes de repetir.
- Bundle do editor ainda gera aviso de tamanho. Não houve instalação de novas dependências nesta integração.
