# Componentes compartilhados

| Elemento | Destino e limite |
| --- | --- |
| `createAnnouncements` e testes | `src/shared/accessibility`; temporização, deduplicação e prioridade mantidas, instância por consumidor. Não controla a fila de fala do leitor. |
| Assets de marca | `src/assets`, sem alteração visual. |
| Faixa de navegação | `src/app/SiteHeader.tsx`: marca, links entre módulos e página atual; composta por `AppRoutes`, sem importar os módulos. |
| Categorias e barra de ações | Permanecem Scratch; dependem de seu catálogo e operações. Extração futura exige um segundo consumidor real. |
| Foco, hover e teclado Blockly | Permanecem no adaptador Scratch nesta fase; dependem de ciclo de vida, seleção e descrições. Reutilização futura por adaptadores, sem copiar regras da linguagem. |
| Palco, personagens, Iniciar/Parar | Scratch, com controlador atual intacto. Terminal Python terá outro controlador. |
| Clientes HTTP e persistência antigos | Preservados fora do fluxo público; não são infraestrutura obrigatória dos editores. |

Não existe uma abstração genérica de workspace nesta fase. Antes de extrair: identificar dependências, manter API pequena, verificar foco e anúncios, provar equivalência por regressões. Não introduzir `if editor === 'python'` em controles Scratch.
