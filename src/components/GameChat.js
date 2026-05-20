'use client';

import { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '@/lib/websocket';

function getSender(message) {
  return message.sender || message.senderUsername || 'Joueur';
}

export default function GameChat({ gameCode, messages, username }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      sendChatMessage(gameCode, username, input.trim());
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Chat de partie</h2>
          <p style={styles.subtitle}>Messages publics entre joueurs.</p>
        </div>
        <span style={styles.count}>{messages.length}</span>
      </div>

      <div style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>Aucun message pour le moment.</div>
        )}

        {messages.map((msg, index) => {
          const sender = getSender(msg);
          const isMe = sender === username;

          return (
            <div
              key={`${sender}-${msg.sentAt || index}-${msg.content}`}
              style={{ ...styles.message, ...(isMe ? styles.messageMe : {}) }}
            >
              <div style={styles.messageTop}>
                <span style={{ ...styles.messageSender, color: isMe ? '#22d3ee' : '#f59e0b' }}>
                  {isMe ? 'Vous' : sender}
                </span>
                <span style={styles.messageTime}>
                  {msg.sentAt
                    ? new Date(msg.sentAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <span style={styles.messageContent}>{msg.content}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && <div style={styles.inlineError}>{error}</div>}

      <form onSubmit={handleSend} style={styles.inputArea}>
        <input
          type="text"
          className="input"
          placeholder="Écrire un message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={280}
          style={styles.inputField}
        />
        <button className="btn btn-primary" type="submit" disabled={!input.trim() || sending}>
          Envoyer
        </button>
      </form>
    </section>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '420px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '18px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'rgba(241,241,246,0.48)',
  },
  count: {
    minWidth: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(34, 211, 238, 0.12)',
    color: '#22d3ee',
    fontWeight: 800,
    fontSize: '0.82rem',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyState: {
    textAlign: 'center',
    color: 'rgba(241,241,246,0.35)',
    fontSize: '0.9rem',
    padding: '56px 20px',
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.045)',
    maxWidth: '86%',
    alignSelf: 'flex-start',
    animation: 'fadeIn 0.25s ease',
  },
  messageMe: {
    alignSelf: 'flex-end',
    background: 'rgba(34, 211, 238, 0.1)',
    border: '1px solid rgba(34, 211, 238, 0.18)',
  },
  messageTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  messageSender: {
    fontSize: '0.74rem',
    fontWeight: 800,
  },
  messageContent: {
    fontSize: '0.92rem',
    lineHeight: '1.45',
    color: 'rgba(241,241,246,0.92)',
    wordBreak: 'break-word',
  },
  messageTime: {
    fontSize: '0.68rem',
    color: 'rgba(241,241,246,0.32)',
  },
  inlineError: {
    padding: '0 18px 10px',
    color: '#fca5a5',
    fontSize: '0.82rem',
  },
  inputArea: {
    display: 'flex',
    gap: '10px',
    padding: '14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  inputField: {
    flex: 1,
    minWidth: 0,
  },
};
