# De Iniciar programa ao palco e leitor de tela

```mermaid
sequenceDiagram
  actor Child as Criança
  participant UI as Editor único
  participant Control as Controlador no navegador
  participant Engine as Motor
  participant A11y as Semântica e anúncios
  participant Stage as Palco
  participant AT as Navegador e leitor de tela
  Child->>UI: Selecionar Iniciar programa
  UI->>Control: Snapshot do ProjectDocument
  Control->>Engine: Validar e preparar plano
  alt Programa inválido
    Engine-->>Control: Diagnósticos por bloco e campo
    Control->>UI: Preservar documento e exibir erros
    UI->>A11y: Associar erros e informar estado
    A11y-->>AT: Atualização acessível
  else Programa executável
    Engine-->>Control: Plano ordenado
    Control->>A11y: Publicar sequência consultável e início
    A11y-->>AT: Solicitar anúncio pela API de acessibilidade
    Note over Control,AT: Não há confirmação de conclusão da fala
    Control->>Engine: Criar runId e estado inicial
    Engine-->>Control: runStarted
    Control->>Stage: Restaurar estado inicial
    loop Até terminal, com devolução de controle ao navegador
      Control->>Engine: Avançar passo ou cancelar
      Engine-->>Control: Eventos ordenados ou terminal
      Control->>Stage: Aplicar estado da execução atual
      Control->>A11y: Atualizar descrição e estados relevantes
      A11y-->>AT: Anúncios conforme política validada
    end
    Control->>UI: Liberar edição e manter resultado consultável
  end
```

Parar cancela antes do próximo passo; eventos e mensagens de `runId` anterior são descartados. A ordem de eventos é verificável; a fala efetiva requer testes manuais e não é garantida por este diagrama.
