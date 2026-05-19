import './globals.css';

export const metadata = {
  title: 'Qui est l Espion ?',
  description: 'Jeu de deduction sociale en ligne.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div className="page-container">{children}</div>
      </body>
    </html>
  );
}
