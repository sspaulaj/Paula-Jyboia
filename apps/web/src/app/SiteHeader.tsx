import mascot from '../assets/jyboia-mascote.svg';
import './site-header.css';

export function SiteHeader({
  current,
}: {
  current: 'scratch' | 'python' | 'experiment';
}) {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <img src={mascot} alt="" width={36} height={36} />
        <span>Jyboia</span>
      </div>
      <nav aria-label="Navegação principal">
        <a
          href="/scratch"
          aria-current={current === 'scratch' ? 'page' : undefined}
        >
          Scratch
        </a>
        <a
          href="/python"
          aria-current={current === 'python' ? 'page' : undefined}
        >
          Python
        </a>
      </nav>
    </header>
  );
}
