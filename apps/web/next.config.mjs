// Next.js — export statico per GitHub Pages (stesso URL del sito attuale).
// Il repo è servito sotto /FaroCanicatti, quindi in produzione servono
// basePath e assetPrefix.
const isProd = process.env.NODE_ENV === 'production';
const repo = 'FaroCanicatti';

/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  basePath: isProd ? `/${repo}` : '',
  assetPrefix: isProd ? `/${repo}/` : '',
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: isProd ? `/${repo}` : '' }
};
