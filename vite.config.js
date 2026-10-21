import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Foto que muestran WhatsApp y Facebook al compartir el link. Se sube desde el
// admin a una ruta fija (ver SHARE_PHOTO_PATH en src/lib/adminApi.js). Va
// escrita en el HTML porque esas apps no ejecutan JavaScript.
function sharePhoto(env) {
  const base = String(env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');

  return {
    name: 'dulcemae-share-photo',
    transformIndexHtml() {
      if (!base) return [];
      const url = `${base}/storage/v1/object/public/productos/sitio/compartir.jpg`;
      return [
        { tag: 'meta', attrs: { property: 'og:image', content: url }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
      ];
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), sharePhoto(loadEnv(mode, process.cwd(), 'VITE_'))],
}))
