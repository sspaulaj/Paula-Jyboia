import jyboiaMascote from '../../assets/jyboia-mascote.svg';
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
    <header className="top-bar" role="banner">
      <div className="top-bar__brand">
        <img
          src={jyboiaMascote}
          alt=""
          aria-hidden="true"
          className="top-bar__logo"
          width={36}
          height={36}
        />
        <span className="top-bar__name">Jyboia</span>
      </div>

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
    </header>
  );
}
