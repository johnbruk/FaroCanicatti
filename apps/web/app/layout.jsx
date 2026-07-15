import './globals.css';
import { BASE } from '@/lib/config';

export const metadata = {
  title: 'Il Faro 1 di Canicattì | Centro Segnalazioni',
  description: 'Portale civico di Canicattì per inviare e seguire le segnalazioni dei cittadini, con accesso SPID e CIE.',
  manifest: `${BASE}/manifest.webmanifest`,
  icons: { icon: `${BASE}/icons/logo02.png` }
};

export const viewport = {
  themeColor: '#d42e12',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
