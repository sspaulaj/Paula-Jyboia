# Produto Jyboia

## Visão

Permitir que crianças aprendam pensamento computacional criando programas por blocos com autonomia, inclusive quando utilizam leitores de tela. O resultado visual e sua descrição acessível devem representar a mesma execução.

## Público e contexto

O público principal são crianças de 8 a 11 anos, incluindo crianças cegas e com baixa visão, em atividades de introdução à computação relacionadas ao Projeto Jyboia. Educadores são mediadores das atividades; essa participação não pressupõe um painel administrativo ou contas com perfis especiais.

## Objetivos

- Ensinar sequência de instruções, parâmetros e relação entre comando e resultado.
- Permitir construir, compreender, corrigir e executar programas sem depender do mouse ou da visão.
- Oferecer a mesma experiência de programação a usuários com diferentes formas de interação.
- Tornar compreensíveis tanto a estrutura do programa quanto os efeitos sobre um personagem.

O sucesso será avaliado por tarefas completas: inserir, conectar e editar blocos; compreender sua ordem; iniciar e interromper a execução; identificar o resultado e corrigir um erro. A avaliação incluirá teclado, leitores de tela e participação do público com deficiência visual, com mediação adequada à idade.

## Experiência central

1. A criança encontra os comandos na paleta do editor.
2. Insere e conecta blocos por encaixes visuais compatíveis com a lógica do Scratch, usando mouse ou teclado.
3. Consulta e altera parâmetros. O leitor de tela identifica o comando, os valores e sua posição/conexões no programa.
4. Seleciona **Iniciar programa**. Uma representação textual acessível da sequência conectada, na ordem de execução, é atualizada e anunciada pelo leitor de tela.
5. O motor executa os comandos e atualiza o personagem no palco. Estado, resultados e erros relevantes também são disponibilizados semanticamente.

O anúncio não depende de áudio próprio nem deve ser tratado como confirmação de que o leitor de tela terminou de falar: o navegador não fornece esse controle. A sequência permanece consultável e os anúncios durante a execução devem evitar sobreposição e perda de informação.

## Escopo inicial de produto

- Um único editor, com paleta, área de programação e parâmetros acessíveis.
- Catálogo já implementado de eventos, movimento, aparência, controle, operadores e variáveis, incluindo múltiplas sequências e estruturas aninhadas.
- Validação de conexões e parâmetros, com erros compreensíveis.
- Iniciar e parar execução; sequência anunciada e resultado visual e semântico.
- Acesso público direto ao editor pela URL, sem login, cadastro, recuperação de senha ou gerenciamento de usuários.
- Construção e execução inteiramente no navegador, com programas somente na memória da página. Recarregar ou fechar pode perder todo o trabalho, sem recuperação.
- Não armazenar programas no servidor, localStorage, sessionStorage, IndexedDB, cookies ou outro mecanismo de persistência. O aviso visual de perda do trabalho foi retirado por solicitação posterior em 18/11/2026; o comportamento somente em memória permanece.
- Publicação como arquivos estáticos, sem API ou banco obrigatórios.

As unidades, os limites dos parâmetros e a convenção de coordenadas estão em [BLOCK_MODEL](BLOCK_MODEL.md), sujeitos à validação educacional e técnica. O escopo definitivo de 18/11/2026 substitui a entrega de persistência no produto público.

A ampliação local de 5/11/2026 é preservada. Semântica, limites e demonstração estão em [EDITOR](EDITOR.md). A validação manual com leitores de tela permanece necessária.

## Evolução futura, fora do MVP

Login, cadastro, autenticação, autorização, persistência, APIs REST, banco e integração AWS exigem escopo próprio. O backend, contratos e código de persistência existentes ficam preservados e desconectados da interface pública. Nenhuma dessas funcionalidades deve ser implementada ou publicada nesta fase.

## Limites

Não fazem parte do escopo inicial: colaboração em tempo real, rede social, publicação pública de projetos, autenticação e perfis, painel de professores, inteligência artificial, execução de código arbitrário, aplicativos nativos ou reprodução completa do Scratch. O sistema ter um editor compartilhado significa uma única interface de edição para todos os usuários; não implica um documento global compartilhado.

## Princípios de interação

Linguagem em português brasileiro, instruções curtas, foco visível, informação que não dependa apenas de cor, recuperação de erros e ajuda de teclado acessível. A representação semântica integra o mesmo editor e o mesmo estado; não constitui um segundo modo de programação.
