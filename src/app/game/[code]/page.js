'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { castVote, getChatMessages, getGameState, getMyRole, sendClue, startGame } from '@/lib/api';
import { getAuth, isLoggedIn } from '@/lib/auth';
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket';
import GameChat from '@/components/GameChat';
import Navbar from '@/components/Navbar';

function normalizeMessages(messages) {
  return (messages || []).map((message) => ({
    ...message,
    sender: message.sender || message.senderUsername,
  }));
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || '').toUpperCase();

  const [auth, setAuth] = useState({ token: null, username: null });
  const [host, setHost] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [roleInfo, setRoleInfo] = useState(null);
  const [knownPlayers, setKnownPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [clue, setClue] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const updateKnownPlayers = useCallback((players = []) => {
    setKnownPlayers((current) => Array.from(new Set([...current, ...players])));
  }, []);

  const loadRole = useCallback(async () => {
    try {
      const role = await getMyRole(code);
      setRoleInfo(role);
    } catch {
      setRoleInfo(null);
    }
  }, [code]);

  const applyGameState = useCallback(
    (state) => {
      setGameState(state);
      updateKnownPlayers(state?.alivePlayers || []);
      if (state?.status === 'IN_PROGRESS' || state?.status === 'FINISHED') {
        loadRole();
      }
    },
    [loadRole, updateKnownPlayers],
  );

  const loadGame = useCallback(async () => {
    try {
      const state = await getGameState(code);
      applyGameState(state);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [applyGameState, code]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }

    const currentAuth = getAuth();
    setAuth(currentAuth);
    setHost(localStorage.getItem(`game:${code}:host`));

    loadGame();
    getChatMessages(code)
      .then((history) => setMessages(normalizeMessages(history)))
      .catch(() => setMessages([]));

    connectWebSocket(code, {
      onGameState: applyGameState,
      onChatMessage: (message) => {
        setMessages((current) => [...current, { ...message, sentAt: message.sentAt || new Date().toISOString() }]);
      },
    });

    return () => {
      disconnectWebSocket();
    };
  }, [applyGameState, code, loadGame, router]);

  useEffect(() => {
    if (loading) return undefined;

    const interval = window.setInterval(() => {
      loadGame();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [loadGame, loading]);

  const phase = gameState?.phase;
  const status = gameState?.status;
  const alivePlayers = useMemo(() => gameState?.alivePlayers || [], [gameState?.alivePlayers]);
  const clues = gameState?.clues || {};
  const votes = gameState?.votes || {};
  const isWaiting = status === 'WAITING' || !phase;
  const isFinished = status === 'FINISHED' || Boolean(gameState?.winner);
  const username = auth.username || '';
  const isHost = host && username === host;
  const hasSentClue = Boolean(clues[username]);
  const isCurrentPlayerEliminated =
    Boolean(username) &&
    !isWaiting &&
    knownPlayers.includes(username) &&
    !alivePlayers.includes(username);

  const roster = useMemo(() => {
    const names = Array.from(new Set([...knownPlayers, ...alivePlayers]));
    return names.map((name) => ({
      name,
      alive: alivePlayers.includes(name),
      isMe: name === username,
      isHost: name === host,
    }));
  }, [alivePlayers, username, host, knownPlayers]);

  const submitClue = async (e) => {
    e.preventDefault();
    if (!clue.trim()) return;

    setActionLoading(true);
    setError('');
    try {
      await sendClue(code, clue.trim());
      setClue('');
      await loadGame();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitVote = async () => {
    if (!selectedTarget) return;

    setActionLoading(true);
    setError('');
    try {
      await castVote(code, selectedTarget);
      setSelectedTarget('');
      await loadGame();
      window.setTimeout(loadGame, 600);
      window.setTimeout(loadGame, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    setError('');
    try {
      await startGame(code);
      await loadGame();
      await loadRole();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={styles.main}>
          <div style={styles.loading}>Chargement de la partie...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header} className="animate-fade-in">
          <div>
            <span style={styles.kicker}>Partie</span>
            <button type="button" onClick={copyCode} style={styles.codeButton} title="Copier le code">
              {code}
              <span style={styles.copyText}>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>
          <div style={styles.statusStack}>
            <span className={`badge ${isFinished ? 'badge-spy' : isWaiting ? 'badge-waiting' : 'badge-playing'}`}>
              {isFinished ? 'Terminée' : isWaiting ? 'En attente' : `Manche ${gameState?.roundNumber || 1}`}
            </span>
            {phase && !isFinished && <span style={styles.phase}>{phase === 'VOTING' ? 'Vote' : 'Description'}</span>}
          </div>
        </header>

        {error && <div className="error-message" style={styles.error}>{error}</div>}

        {isWaiting ? (
          <section className="glass-card animate-fade-in" style={styles.waitingPanel}>
            <div>
              <h1 style={styles.title}>En attente des joueurs</h1>
              <p style={styles.description}>
                Partagez le code de partie. Le backend demande au moins deux joueurs pour lancer.
              </p>
            </div>
            <div style={styles.waitingActions}>
              {host && <span style={styles.hostInfo}>Hôte: {host}</span>}
              {isHost ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleStart}
                  disabled={actionLoading || alivePlayers.length < 2}
                >
                  {actionLoading ? 'Lancement...' : 'Lancer'}
                </button>
              ) : (
                <p style={styles.waitingText}>Seul l’hôte peut lancer la partie.</p>
              )}
            </div>
          </section>
        ) : (
          <section style={styles.playGrid}>
            <div className="glass-card animate-fade-in" style={styles.roleCard}>
              <span style={styles.cardLabel}>Votre rôle</span>
              <h1 style={{ ...styles.roleTitle, color: roleInfo?.role === 'SPY' ? '#f87171' : '#34d399' }}>
                {roleInfo?.role === 'SPY' ? 'Espion' : roleInfo?.role === 'CIVILIAN' ? 'Civil' : 'Caché'}
              </h1>
              <p style={styles.word}>{roleInfo?.word || 'Mot indisponible'}</p>
              <p style={styles.description}>
                {roleInfo?.role === 'SPY'
                  ? 'Votre mot est différent. Restez crédible.'
                  : 'Votre mot est commun aux autres civils.'}
              </p>
            </div>

            <div className="glass-card animate-fade-in" style={styles.roundCard}>
              <span style={styles.cardLabel}>Progression</span>
              <div style={styles.metricGrid}>
                <div>
                  <strong style={styles.metric}>{alivePlayers.length}</strong>
                  <span style={styles.metricLabel}>vivants</span>
                </div>
                <div>
                  <strong style={styles.metric}>{Object.keys(clues).length}</strong>
                  <span style={styles.metricLabel}>indices</span>
                </div>
                <div>
                  <strong style={styles.metric}>{Object.values(votes).reduce((sum, value) => sum + value, 0)}</strong>
                  <span style={styles.metricLabel}>votes</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {gameState?.winner && (
          <section className="glass-card animate-fade-in" style={styles.resultPanel}>
            <h2 style={styles.sectionTitle}>
              {gameState.winner === 'CIVILIANS' ? 'Victoire des civils' : 'Victoire des espions'}
            </h2>
            {gameState.eliminatedPlayer && (
              <p style={styles.description}>Dernier joueur éliminé : {gameState.eliminatedPlayer}</p>
            )}
          </section>
        )}

        {isCurrentPlayerEliminated && !isFinished && (
          <section className="glass-card animate-fade-in" style={styles.eliminatedPanel}>
            <h2 style={styles.sectionTitle}>Vous êtes éliminé</h2>
            <p style={styles.description}>Vous pouvez continuer à suivre la partie et discuter dans le chat.</p>
          </section>
        )}

        {!isWaiting && phase === 'DESCRIPTION' && !isFinished && !isCurrentPlayerEliminated && (
          <section className="glass-card animate-fade-in" style={styles.panel}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Donner un indice</h2>
                <p style={styles.description}>Un seul indice par manche. Quand tous les joueurs vivants ont joué, le vote commence.</p>
              </div>
              {hasSentClue && <span className="badge badge-civilian">Envoyé</span>}
            </div>

            <form onSubmit={submitClue} style={styles.clueForm}>
              <input
                className="input"
                type="text"
                placeholder={hasSentClue ? clues[username] : 'Votre indice'}
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                disabled={hasSentClue || actionLoading}
                maxLength={80}
              />
              <button className="btn btn-primary" type="submit" disabled={hasSentClue || actionLoading || !clue.trim()}>
                Envoyer
              </button>
            </form>
          </section>
        )}

        {!isWaiting && Object.keys(clues).length > 0 && (
          <section style={styles.cluesGrid}>
            {Object.entries(clues).map(([player, playerClue]) => (
              <article className="glass-card" key={player} style={styles.clueItem}>
                <span style={styles.cluePlayer}>{player}</span>
                <strong style={styles.clueText}>{playerClue}</strong>
              </article>
            ))}
          </section>
        )}

        {!isWaiting && phase === 'VOTING' && !isFinished && !isCurrentPlayerEliminated && (
          <section className="glass-card animate-fade-in" style={styles.panel}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Vote</h2>
                <p style={styles.description}>Sélectionnez le joueur que vous pensez être l’espion.</p>
              </div>
              <button className="btn btn-danger" onClick={submitVote} disabled={actionLoading || !selectedTarget}>
                {selectedTarget ? `Voter ${selectedTarget}` : 'Choisir'}
              </button>
            </div>
            <div style={styles.voteGrid}>
              {alivePlayers
                .filter((player) => player !== username)
                .map((player) => (
                  <button
                    type="button"
                    key={player}
                    style={{
                      ...styles.voteOption,
                      ...(selectedTarget === player ? styles.voteOptionSelected : {}),
                    }}
                    onClick={() => setSelectedTarget(player)}
                  >
                    <span>{player}</span>
                    <small>{votes[player] || 0} vote(s)</small>
                  </button>
                ))}
            </div>
          </section>
        )}

        <section style={styles.contentGrid}>
          <section className="glass-card animate-fade-in" style={styles.playersPanel}>
            <h2 style={styles.sectionTitle}>Joueurs</h2>
            <div style={styles.playersList}>
              {roster.map((player) => (
                <div key={player.name} style={{ ...styles.playerRow, ...(!player.alive ? styles.playerOut : {}) }}>
                  <span style={styles.avatar}>{player.name.charAt(0).toUpperCase()}</span>
                  <div style={styles.playerText}>
                    <strong>{player.name}{player.isMe ? ' (vous)' : ''}</strong>
                    <small>{player.isHost ? 'Hôte' : player.alive ? 'En jeu' : 'Éliminé'}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <GameChat gameCode={code} messages={messages} username={username} />
        </section>
      </main>
    </>
  );
}

const styles = {
  main: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '30px 24px 80px',
  },
  loading: {
    display: 'grid',
    placeItems: 'center',
    minHeight: '60vh',
    color: 'rgba(241,241,246,0.55)',
    animation: 'pulse 1.5s infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '18px',
    marginBottom: '22px',
    flexWrap: 'wrap',
  },
  kicker: {
    display: 'block',
    color: 'rgba(241,241,246,0.45)',
    fontSize: '0.76rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  codeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid rgba(34, 211, 238, 0.26)',
    background: 'rgba(34, 211, 238, 0.08)',
    borderRadius: '14px',
    padding: '10px 14px',
    color: '#22d3ee',
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '0.18em',
    cursor: 'pointer',
  },
  copyText: {
    letterSpacing: 0,
    fontSize: '0.76rem',
    color: 'rgba(241,241,246,0.55)',
  },
  statusStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  phase: {
    color: 'rgba(241,241,246,0.58)',
    fontWeight: 700,
  },
  error: {
    marginBottom: '18px',
  },
  waitingPanel: {
    padding: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 'clamp(1.8rem, 4vw, 3rem)',
    fontWeight: 900,
    lineHeight: 1.08,
    marginBottom: '10px',
  },
  description: {
    color: 'rgba(241,241,246,0.55)',
    lineHeight: 1.55,
    fontSize: '0.92rem',
  },
  waitingActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  waitingText: {
    color: 'rgba(241,241,246,0.55)',
    fontSize: '0.95rem',
    fontWeight: 700,
  },
  hostInfo: {
    color: '#fbbf24',
    fontSize: '0.9rem',
    fontWeight: 700,
  },
  playGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: '18px',
    marginBottom: '18px',
  },
  roleCard: {
    padding: '28px',
  },
  roundCard: {
    padding: '28px',
  },
  cardLabel: {
    color: 'rgba(241,241,246,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.74rem',
    fontWeight: 800,
  },
  roleTitle: {
    fontSize: '2.4rem',
    fontWeight: 900,
    margin: '8px 0 2px',
  },
  word: {
    color: '#f1f1f6',
    fontSize: '1.4rem',
    fontWeight: 800,
    marginBottom: '12px',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '18px',
  },
  metric: {
    display: 'block',
    fontSize: '1.8rem',
    color: '#22d3ee',
  },
  metricLabel: {
    color: 'rgba(241,241,246,0.45)',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  resultPanel: {
    padding: '22px',
    marginBottom: '18px',
    borderColor: 'rgba(245, 158, 11, 0.28)',
    background: 'rgba(245, 158, 11, 0.08)',
  },
  eliminatedPanel: {
    padding: '22px',
    marginBottom: '18px',
    borderColor: 'rgba(239, 68, 68, 0.34)',
    background: 'rgba(239, 68, 68, 0.1)',
  },
  panel: {
    padding: '24px',
    marginBottom: '18px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '18px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 900,
    marginBottom: '5px',
  },
  clueForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    gap: '12px',
  },
  cluesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  clueItem: {
    padding: '16px',
  },
  cluePlayer: {
    display: 'block',
    color: 'rgba(241,241,246,0.48)',
    fontSize: '0.8rem',
    fontWeight: 800,
    marginBottom: '6px',
  },
  clueText: {
    fontSize: '1.05rem',
  },
  voteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  voteOption: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f1f1f6',
    cursor: 'pointer',
    fontWeight: 800,
  },
  voteOptionSelected: {
    borderColor: 'rgba(239, 68, 68, 0.65)',
    background: 'rgba(239, 68, 68, 0.12)',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: '18px',
    alignItems: 'start',
  },
  playersPanel: {
    padding: '22px',
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
  },
  playerOut: {
    opacity: 0.42,
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
    fontWeight: 900,
  },
  playerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
};
