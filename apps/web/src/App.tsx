import { useEffect, useState } from 'react';
import { getHealth } from './api';

export function App() {
  const [status, setStatus] = useState('Verificando conexão…');
  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001';
    void getHealth(apiUrl, controller.signal)
      .then(() => {
        setStatus('Conexão disponível.');
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStatus('Serviço indisponível no momento.');
      });
    return () => controller.abort();
  }, []);
  return (
    <main>
      <h1>Jyboia</h1>
      <p>Um espaço para aprender programação por blocos.</p>
      <p>A experiência de programação está em preparação.</p>
      <p>
        <a href="/experiments/editor">Experimentar o editor de blocos</a>
      </p>
      <p role="status">{status}</p>
    </main>
  );
}
