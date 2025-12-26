import { useMemo, useState } from 'react';
import './App.css';

import { apiLogin, apiMe, type TokenPair } from './api';

export default function App() {
  const [tokens, setTokens] = useState<TokenPair | null>(() => {
    const raw = localStorage.getItem('tokens');
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  });
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('ChangeMe123!');
  const [status, setStatus] = useState<string>('');

  const hasSession = useMemo(() => Boolean(tokens?.accessToken), [tokens]);

  async function onLogin() {
    setStatus('Connexion...');
    try {
      const t = await apiLogin(username, password);
      setTokens(t);
      localStorage.setItem('tokens', JSON.stringify(t));
      setStatus('Connecté.');
    } catch (e: any) {
      setStatus(e?.message ?? 'Échec connexion.');
    }
  }

  async function onMe() {
    if (!tokens) return;
    setStatus('Appel /me...');
    try {
      const me = await apiMe(tokens.accessToken);
      setStatus(`OK: ${JSON.stringify(me)}`);
    } catch (e: any) {
      setStatus(e?.message ?? 'Échec /me.');
    }
  }

  function onLogout() {
    localStorage.removeItem('tokens');
    setTokens(null);
    setStatus('Déconnecté.');
  }

  return (
    <div className="container">
      <h1>Plateforme Microfinance</h1>
      <p className="muted">Socle UI (login + tests API). Étendre en modules métier.</p>

      {!hasSession ? (
        <div className="card">
          <h2>Connexion</h2>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
          <button onClick={onLogin}>Se connecter</button>
          <p className="muted">
            Si la base est vide: appeler d’abord <code>/iam/bootstrap</code> via Swagger.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2>Session</h2>
          <button onClick={onMe}>Tester /me</button>
          <button onClick={onLogout} className="secondary">
            Déconnexion
          </button>
          <pre className="pre">{JSON.stringify(tokens, null, 2)}</pre>
        </div>
      )}

      <div className="card">
        <h2>État</h2>
        <pre className="pre">{status || '(vide)'}</pre>
      </div>
    </div>
  );
}
