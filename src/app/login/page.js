'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username.trim(), password);
      saveAuth(data);
      router.push('/lobby');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        <div className="glass-card animate-fade-in" style={styles.card}>
          <div style={styles.header}>
            <span style={styles.icon}>&gt;</span>
            <h1 style={styles.title}>Connexion</h1>
            <p style={styles.subtitle}>Retrouvez vos parties et rejoignez vos amis.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="input-group">
              <label htmlFor="username">Nom d’utilisateur</label>
              <input
                id="username"
                className="input"
                type="text"
                placeholder="Votre pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={styles.footer}>
            Pas encore de compte ?{' '}
            <button type="button" style={styles.link} onClick={() => router.push('/register')}>
              S’inscrire
            </button>
          </p>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  icon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 12px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontSize: '1.6rem',
    fontWeight: 900,
    color: '#0a0a1a',
    background: '#22d3ee',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'rgba(241,241,246,0.55)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '0.9rem',
    color: 'rgba(241,241,246,0.55)',
  },
  link: {
    color: '#22d3ee',
    fontWeight: '700',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    font: 'inherit',
  },
};
