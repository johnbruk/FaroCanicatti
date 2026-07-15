// Prefisso per gli asset in public/ (immagini, manifest, service worker):
// in produzione il sito è sotto /FaroCanicatti su GitHub Pages.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const asset = (p) => `${BASE}${p.startsWith('/') ? '' : '/'}${p}`;
