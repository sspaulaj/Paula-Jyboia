# Fluxo Python alvo — ainda não implementado

```mermaid
flowchart TD
  Blocks["Blocos e conexões"] --> Model["PythonProgram"]
  Model --> Semantics["Descrições acessíveis"]
  Model --> Validation["Validação e diagnósticos por bloco"]
  Validation --> Generator["Adaptador do gerador Blockly"]
  Generator --> Code["Python válido e mapa de linhas"]
  Code --> View["Consulta e cópia"]
  Code --> Controller["Iniciar: controlador com runId"]
  Controller --> Worker["Pyodide em Worker"]
  Worker --> Output["stdout, stderr, término"]
  Output --> Terminal["Terminal acessível"]
  Worker --> Input["Pedido inputId"]
  Input --> Form["Campo e botão Enviar na UI"]
  Form --> Buffer["Resposta: buffer compartilhado a validar"]
  Buffer --> Worker
  Stop["Parar ou watchdog"] --> Cancel["Interrupção e término definitivo"]
  Cancel --> Worker
```

O caminho de entrada depende de prova com isolamento de origem e espera somente no Worker. A UI não bloqueia. Mensagens antigas são descartadas por runId/inputId. Consulte [limitações e segurança](../../apps/web/docs/PYTHON.md).
