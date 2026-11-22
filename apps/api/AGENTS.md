# Backend

Consulte `docs/ARCHITECTURE.md` e os contratos globais. Use `jyboia-backend` e `jyboia-testing` quando pertinente.

Preserve transporte, validação, serviço e repositório separados. Não importar componentes web nem adicionar requisitos de banco ao frontend público. Não executar Python no servidor. Autenticação e persistência pública não estão autorizadas pela modularização.

Testes PostgreSQL usam banco local e schema isolado; nunca resetar dados de desenvolvimento. Sem política de acesso, manter API restrita ao desenvolvimento local.
