'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame, getMyRole, getWaitingGames, joinGame } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default function LobbyPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [waitingGames, setWaitingGames] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }

    loadWaitingGames();
  }, [router]);

  const rememberHost = (code, host) => {
    if (typeof window === 'undefined' || !host) return;
    localStorage.setItem(`game:${code}:host`, host);
  };

  const loadWaitingGames = async () => {
    setRefreshing(true);
    try {
      const games = await getWaitingGames();
      setWaitingGames(games || []);
    } catch (err) {
      console.warn('Impossible de charger les parties en attente:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const game = await createGame();
      rememberHost(game.code, game.hostUserName);
      router.push(`/game/${game.code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (codeToJoin) => {
    const code = codeToJoin.trim().toUpperCase();
    if (!code) return;

    setError('');
    setLoading(true);
    try {
      const details = await joinGame(code);
      rememberHost(code, details.hostname);
      router.push(`/game/${code}`);
    } catch (err) {
      const message = err.message || '';

      if (message.includes('already in game')) {
        router.push(`/game/${code}`);
        return;
      }

      if (message.includes('already started')) {
        try {
          await getMyRole(code);
          router.push(`/game/${code}`);
          return;
        } catch {
          setError('Cette partie a déjà commencé.');
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header} className="animate-fade-in">
          <span style={styles.kicker}>Salon</span>
          <h1 style={styles.pageTitle}>Préparez une partie</h1>
          <p style={styles.lead}>Créez un code, partagez-le, puis lancez la partie quand tout le monde est arrivé.</p>
        </header>

        {error && <div className="error-message" style={styles.error}>{error}</div>}

        <section style={styles.grid}>
          <div className="glass-card animate-fade-in" style={styles.card}>
            <div style={styles.cardIcon}>+</div>
            <h2 style={styles.cardTitle}>Créer une partie</h2>
            <p style={styles.cardDesc}>Le backend génère un code à six lettres et vous place comme hôte.</p>
            <button className="btn btn-primary" onClick={handleCreate} disabled={loading} style={styles.fullButton}>
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>

          <div className="glass-card animate-fade-in" style={{ ...styles.card, animationDelay: '0.08s' }}>
            <div style={{ ...styles.cardIcon, background: '#22d3ee' }}>#</div>
            <h2 style={styles.cardTitle}>Rejoindre une partie</h2>
            <p style={styles.cardDesc}>Entrez le code donné par l’hôte pour rejoindre la table.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoin(joinCode);
              }}
              style={styles.joinForm}
            >
              <input
                className="input"
                type="text"
                placeholder="ABCDEF"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={styles.codeInput}
              />
              <button className="btn btn-primary" type="submit" disabled={loading || !joinCode.trim()}>
                Rejoindre
              </button>
            </form>
          </div>
        </section>

        <section className="animate-fade-in" style={styles.waitingSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Parties en attente</h2>
            <button className="btn btn-secondary btn-sm" onClick={loadWaitingGames} disabled={refreshing}>
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>

          {waitingGames.length === 0 ? (
            <div className="glass-card" style={styles.empty}>
              Aucune partie en attente pour le moment.
            </div>
          ) : (
            <div style={styles.gamesList}>
              {waitingGames.map((game) => (
                <article key={game.code} className="glass-card" style={styles.gameItem}>
                  <div style={styles.gameInfo}>
                    <div style={styles.gameCode}>{game.code}</div>
                    <div style={styles.gameMeta}>
                      <span>Hôte: {game.host}</span>
                      <span>{game.players} joueur{game.players > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleJoin(game.code)} disabled={loading}>
                    Entrer
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

const styles = {
  main: {
    maxWidth: '980px',
    margin: '0 auto',
    padding: '42px 24px 80px',
  },
  header: {
    marginBottom: '30px',
  },
  kicker: {
    display: 'inline-flex',
    padding: '5px 12px',
    borderRadius: '999px',
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.22)',
    fontSize: '0.78rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '14px',
  },
  pageTitle: {
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    fontWeight: 900,
    lineHeight: 1.05,
    marginBottom: '12px',
  },
  lead: {
    maxWidth: '620px',
    color: 'rgba(241,241,246,0.58)',
    fontSize: '1rem',
    lineHeight: 1.65,
  },
  error: {
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '42px',
  },
  card: {
    padding: '28px',
    opacity: 0,
  },
  cardIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    background: '#f59e0b',
    color: '#0a0a1a',
    fontWeight: 900,
    fontSize: '1.35rem',
    marginBottom: '18px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    marginBottom: '10px',
  },
  cardDesc: {
    color: 'rgba(241,241,246,0.53)',
    fontSize: '0.92rem',
    lineHeight: 1.55,
    marginBottom: '22px',
  },
  fullButton: {
    width: '100%',
  },
  joinForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
    gap: '10px',
  },
  codeInput: {
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    textAlign: 'center',
    fontWeight: 800,
  },
  waitingSection: {
    opacity: 0,
    animationDelay: '0.16s',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
  },
  empty: {
    padding: '22px',
    color: 'rgba(241,241,246,0.48)',
    textAlign: 'center',
  },
  gamesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  gameItem: {
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  gameInfo: {
    minWidth: 0,
  },
  gameCode: {
    fontSize: '1.1rem',
    fontWeight: 900,
    letterSpacing: '0.18em',
    color: '#22d3ee',
    marginBottom: '5px',
  },
  gameMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '0.84rem',
    color: 'rgba(241,241,246,0.5)',
  },
};
