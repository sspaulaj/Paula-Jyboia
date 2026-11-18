# Editor local de blocos

Atualização de interface em 18/11/2026: por solicitação explícita, foram removidos os painéis “Organizar blocos sem arrastar” e “Programa e resultado”, com todos os controles e textos internos, além do aviso visual de perda do trabalho. Use a paleta, o teclado nativo do Blockly e a barra superior para editar/desconectar. O anúncio ao iniciar e a descrição acessível do palco permanecem. As instruções históricas de exemplo automático/painéis abaixo não correspondem mais à interface atual.

## MVP sem salvamento (18/11/2026)

Mover N passos altera somente X, independentemente do giro. Y permanece igual. Passos positivos movem à direita e negativos à esquerda, respeitando as bordas do palco. Girar altera a orientação visual da cobra; Ir para X, Y continua posicionando nos dois eixos.

Iniciar programa usa a posição e direção atuais do personagem, inclusive após uma execução anterior ou interrupção. Por exemplo, executar Mover 10 passos duas vezes leva de x=0 a x=10 e depois x=20; iniciar não centraliza o personagem. Recarregar a página inicia uma nova sessão no estado padrão.

A URL pública abre diretamente o editor. Blocos, parâmetros e execuções vivem somente na memória da página. O aviso Sobre seu trabalho explica que recarregar/fechar perde o programa. Não há botões de salvar, abrir, excluir projetos ou contas. Editor, palco, teclado e anúncios continuam operando sem API ou banco. `pnpm dev` inicia apenas o frontend; `pnpm build` gera arquivos estáticos.

## Histórico: projetos integrados — retirados do fluxo do MVP

Na página principal, use Nome do projeto, Novo projeto, Salvar projeto, Abrir projeto e Excluir projeto. A lista contém projetos da instalação, com paginação. O salvamento usa a API REST e preserva IDs, parâmetros, conexões externas/internas e posições das raízes no formato v2. Abrir restaura o mesmo workspace e suas descrições acessíveis; Iniciar programa executa o grafo recuperado no navegador.

O indicador de alterações considera nome, estrutura, parâmetros e layout. Novo/abrir pedem confirmação antes de descartar alterações; fechar/recarregar a página usa o aviso nativo do navegador. Excluir sempre pede confirmação. Falhas de rede, documentos inválidos e conflitos de revisão mantêm o programa local. Não há salvamento automático ou repetição automática de requisições. Instruções e evidências: [INTEGRATION_VALIDATION](INTEGRATION_VALIDATION.md).

Incremento de 5/11/2026. Abra `/` com `pnpm dev:web`. O editor mantém Blockly 13.4.0, categorias, arraste, encaixes e navegação por teclado. Não houve instalação de dependências. A antiga rota `/experiments/editor` preserva a PoC para regressão; o palco fica na página principal.

## Catálogo

| Categoria | Blocos | Parâmetros |
| --- | --- | --- |
| Eventos | Quando iniciar | Início de sequência, sem conexão anterior. |
| Movimento | Mover, Girar, Ir para | Passos inteiros de -480 a 480; giro à direita de 0 a 360 graus; x de -240 a 240, y de -180 a 180. |
| Aparência | Dizer, Mostrar, Esconder | Texto até 120 caracteres; visibilidade do personagem. |
| Controle | Esperar, Repetir, Sempre, Se | Espera de 0 a 30 segundos em décimos; repetição inteira de 0 a 1.000; corpo interno e condição booleana. |
| Operadores | Maior que, Menor que, Igual a | Dois números ou nomes de variáveis numéricas; saída booleana. |
| Variáveis | Definir, Alterar | Nome iniciado por letra/sublinhado, até 32 caracteres; valor entre -1 bilhão e 1 bilhão. Alterar soma ao valor anterior. |

Variáveis são globais ao programa local e começam vazias a cada execução. Defina antes de alterar ou consultar. Operandos aceitam números ou nomes, não fórmulas nem JavaScript. Referências automáticas à posição do personagem não integram o catálogo atual; o exemplo de descrição de posição em ACCESSIBILITY é ilustrativo. Esconder mantém a posição e sua representação semântica; não interrompe movimento.

## Construção e conexões

Selecione a categoria e arraste blocos da paleta ao centro. Comandos encaixam depois de eventos/comandos ou dentro de controles. Operadores encaixam somente na condição do Se; eventos nunca são filhos. O Blockly ajusta a posição ao conectar. Mover uma sequência preserva seus sucessores e filhos.

**Organizar blocos sem arrastar** expõe controles nativos sobre o mesmo workspace: adicionar um bloco da categoria, escolher bloco para organizar, escolher encaixe e conectar. Destinos indicam número, descrição e relação “Depois”, “Dentro” ou “Na condição”. Destinos ocupados, incompatíveis ou circulares não são oferecidos. Não existe outro programa editável nessa área.

**Conectar sequência** move o bloco com corpo e sucessores. **Soltar bloco escolhido** desconecta apenas o bloco, mantendo seu corpo e reconectando a continuação ao predecessor quando possível. **Excluir bloco escolhido** remove também comandos internos, preservando a continuação quando possível. Após conexão/desconexão, foco no bloco; após exclusão, no sucessor, pai ou workspace. O roteiro de teclado completo está em [ACCESSIBILITY](ACCESSIBILITY.md).

## Demonstração

Em um editor vazio, abra **Organizar blocos sem arrastar** e clique em **Adicionar exemplo com repetição e condição**. O botão adiciona sete blocos sem apagar os existentes:

```text
Quando iniciar
  Mover 10 passos
  Repetir 3 vezes
    Mover 10 passos
  Se (1 maior que 0), então
    Dizer Olá
```

Ao iniciar, o resultado é **x=40, y=0**, dizendo **Olá**. Monte também manualmente: “Depois” liga a sequência externa; “Dentro” recebe o movimento repetido e Dizer; “Na condição” recebe Maior que. O fluxo completo tem teste de navegador.

## Modelo e execução

`block-engine/experimental` contém `id`, `kind`, parâmetros e conexões por ID: `next`, `body` em controles e `condition` no Se. Operadores são blocos identificáveis, sem sucessor. A floresta preserva sequências soltas e múltiplos eventos. Layout não define ordem. Descrições e motor usam a mesma projeção independente de Blockly.

Esta extensão é **local**: não altera ProjectDocument v1 nem API. O editor ainda não grava novos tipos no backend; salvar/carregar esta ampliação requer evolução explícita do formato e migração em outra entrega.

Cada início captura uma cópia validada. Sequências de eventos são ordenadas por ID e escalonadas em rodízio, um comando por avanço, compartilhando personagem e variáveis. Blocos soltos não executam. Esperar não bloqueia outras sequências. Repetir zero ignora o corpo. Se avalia a condição ao ser alcançado e só executa o corpo quando verdadeira. Sempre repete até parar ou atingir limites; sua continuação é editável, mas inalcançável nessa sequência.

Limites: 200 blocos, 20 níveis internos, 1.000 passos e 30 segundos. Controles e laços vazios contam como passos. O relógio é injetado no motor; avanços são agendados pelo frontend a cada 300 ms. Espera pode ultrapassar o tempo solicitado por causa do agendamento, nunca executa o sucessor antes dele. Parar cancela avanços pendentes. Reiniciar restaura posição, direção, visibilidade, fala e variáveis. Erros têm mensagem em português e, quando associado a bloco, ação **Ir ao bloco com erro**.

## Verificação

Testes automatizados cobrem regras, execução, conexões Blockly reais, corpos, operadores, desconexão, exclusão, movimento de sequências, arraste da paleta, construção sem arraste, foco, nomes acessíveis e anúncios. Execute `pnpm test`, `pnpm test:e2e`, `pnpm build` e `pnpm lint`.

Documentação oficial consultada em 5/11/2026: [conexões tipadas](https://docs.blockly.com/guides/create-custom-blocks/inputs/connection-checks/) e [estrutura JSON e rótulos](https://docs.blockly.com/guides/create-custom-blocks/define/structure-json/). A [declaração da biblioteca](https://www.blockly.com/accessibility) não substitui avaliação do Jyboia. Matriz assistiva e limites de evidência: [ACCESSIBILITY](ACCESSIBILITY.md).
