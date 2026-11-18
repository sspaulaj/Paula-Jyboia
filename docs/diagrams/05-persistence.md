# Salvar e carregar projetos

```mermaid
sequenceDiagram
  actor Child as Criança
  participant Web as Frontend
  participant API as API REST
  participant Model as Validador de documento
  participant DB as PostgreSQL
  Child->>Web: Salvar
  Web->>Web: Capturar snapshot e revisão local
  Web->>API: POST novo ou PUT com If-Match
  API->>Model: Validar estrutura, versão e limites
  alt Documento inválido
    Model-->>API: Diagnósticos
    API-->>Web: 422 com issues
    Web-->>Child: Preservar trabalho e informar erro
  else Documento válido
    API->>DB: Criar ou atualizar com comparação de revisão
    alt Revisão conflitante em atualização
      DB-->>API: Comparação falhou
      API-->>Web: 412 REVISION_CONFLICT
      Web-->>Child: Preservar trabalho e permitir resolver conflito
    else Gravação confirmada
      DB-->>API: Recurso e nova revisão
      API-->>Web: 201 ou 200 com recurso e ETag
      Web-->>Child: Informar salvamento do snapshot enviado
    end
  end
  Child->>Web: Carregar projeto
  Web->>Web: Resolver alterações locais antes de substituir
  Web->>API: GET por projectId
  API->>DB: Consultar recurso
  DB-->>API: Recurso ou ausência
  API-->>Web: 200 com recurso e ETag, ou erro
  Web->>Web: Validar versão e estrutura recebidas
  alt Resposta válida
    Web->>Web: Substituir estado e sincronizar editor e semântica
    Web-->>Child: Informar carregamento
  else Falha ou incompatibilidade
    Web-->>Child: Preservar projeto anterior e informar erro
  end
```

Timeout pode deixar resultado de gravação desconhecido; não repetir criação automaticamente. Autorização por projeto é condição pendente antes da exposição a usuários reais, não representada como já implementada.
