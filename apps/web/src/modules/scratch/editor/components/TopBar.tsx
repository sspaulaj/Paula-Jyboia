interface TopBarProps {
  isDisconnectEnabled: boolean;
  onEnterEditor: () => void;
  onOpenPalette: () => void;
  onDisconnect: () => void;
}

export function TopBar({
  isDisconnectEnabled,
  onEnterEditor,
  onOpenPalette,
  onDisconnect,
}: TopBarProps) {
  return (
    <div className="top-bar">
      <nav className="top-bar__actions" aria-label="Controles do editor">
        <button
          type="button"
          className="top-bar__action-btn"
          onClick={onEnterEditor}
        >
          Entrar no editor
        </button>
        <button
          type="button"
          className="top-bar__action-btn"
          onClick={onOpenPalette}
        >
          Escolher tipos de blocos
        </button>
        <button
          type="button"
          className="top-bar__action-btn"
          disabled={!isDisconnectEnabled}
          aria-disabled={!isDisconnectEnabled}
          onClick={onDisconnect}
        >
          Desconectar bloco
        </button>
      </nav>
    </div>
  );
}
