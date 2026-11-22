# Frontend

Consulte `docs/ARCHITECTURE.md`, `docs/SHARED_COMPONENTS.md` e o documento do módulo. Use as skills locais pertinentes; não duplique regras globais.

- `src/app` compõe módulos; Scratch e Python não se importam. `src/shared` não depende dos módulos.
- Preserve `/` e `/scratch`, interface Scratch, foco, sequência oculta e estados Iniciar/Parar. Não extrair regras de personagens para atender ao Python.
- Python está preparatório. Geração e terminal/runtime em Worker seguem `docs/PYTHON.md` e serão implementados somente em etapa solicitada.
- Frontend estático sem API/banco obrigatórios. Não persistir programas, entradas ou dados de autenticação.
- Antes de alterar navegação, avaliar descarte de memória, listeners, instâncias globais Blockly e foco.
- Execute testes de navegador sem builds concorrentes. Validação manual de fala permanece distinta da inspeção DOM.
