import type { MetadataRoute } from 'next';
import telliIcon from '@/assets/telli.svg';
import appleTouchIcon from '@/assets/apple-touch-icon.png';
import iconMaskable from '@/assets/icon-maskable.png';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'telli',
    short_name: 'telli',
    description: 'Der datenschutzkonforme KI-Chatbot für die Schule',
    categories: ['education'],
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: telliIcon.src,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: appleTouchIcon.src,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: iconMaskable.src,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
