'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        <section style={styles.hero} className="animate-fade-in">
          <div style={styles.kicker}>Jeu de déduction sociale</div>
          <h1 style={styles.title}>Qui est l’Espion&nbsp;?</h1>
          <p style={styles.subtitle}>
            Un groupe partage le même mot. Les espions reçoivent un mot différent et doivent se fondre dans la discussion.
          </p>

          <div style={styles.buttons}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/register')}>
              Commencer
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push('/login')}>
              Se connecter
            </button>
          </div>
        </section>

        <section style={styles.steps} className="animate-fade-in">
          {[
            ['1', 'Créez ou rejoignez une partie avec un code.'],
            ['2', 'Lancez la manche et mémorisez votre mot secret.'],
            ['3', 'Donnez un indice court sans révéler le mot.'],
            ['4', 'Votez pour démasquer les espions.'],
          ].map(([number, text]) => (
            <article key={number} className="glass-card" style={styles.step}>
              <span style={styles.stepNumber}>{number}</span>
              <p style={styles.stepText}>{text}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

const styles = {
  main: {
    maxWidth: '1040px',
    margin: '0 auto',
    padding: '78px 24px 90px',
  },
  hero: {
    maxWidth: '760px',
    marginBottom: '58px',
  },
  kicker: {
    display: 'inline-flex',
    padding: '6px 14px',
    borderRadius: '999px',
    background: 'rgba(34, 211, 238, 0.1)',
    border: '1px solid rgba(34, 211, 238, 0.22)',
    color: '#22d3ee',
    fontSize: '0.8rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '20px',
  },
  title: {
    fontSize: 'clamp(3rem, 8vw, 5.8rem)',
    lineHeight: 0.95,
    fontWeight: 900,
    marginBottom: '22px',
    maxWidth: '760px',
  },
  subtitle: {
    maxWidth: '590px',
    color: 'rgba(241,241,246,0.62)',
    fontSize: '1.08rem',
    lineHeight: 1.7,
    marginBottom: '32px',
  },
  buttons: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '14px',
    opacity: 0,
    animationDelay: '0.12s',
  },
  step: {
    padding: '20px',
    minHeight: '150px',
  },
  stepNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    background: '#f59e0b',
    color: '#0a0a1a',
    fontWeight: 900,
    marginBottom: '18px',
  },
  stepText: {
    color: 'rgba(241,241,246,0.68)',
    lineHeight: 1.5,
    fontWeight: 600,
  },
};
