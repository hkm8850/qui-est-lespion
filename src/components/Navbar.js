'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, isLoggedIn, logout } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setUser(isLoggedIn() ? getAuth() : null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <button
          type="button"
          style={styles.logo}
          onClick={() => router.push(isLoggedIn() ? '/lobby' : '/')}
        >
          <span style={styles.logoMark}>?</span>
          <span style={styles.logoText}>Qui est l’Espion</span>
        </button>

        <div style={styles.right}>
          {user ? (
            <>
              <span style={styles.username}>{user.username}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => router.push('/login')}>
                Connexion
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => router.push('/register')}>
                S’inscrire
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10, 10, 26, 0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    color: 'inherit',
    minWidth: 0,
  },
  logoMark: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
    color: 'white',
    fontWeight: 900,
  },
  logoText: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#f1f1f6',
    whiteSpace: 'nowrap',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  username: {
    fontSize: '0.9rem',
    color: 'rgba(241,241,246,0.65)',
    fontWeight: '600',
  },
};
