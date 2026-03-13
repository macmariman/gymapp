import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gym App',
    short_name: 'Gym App',
    description: 'Rutina de gimnasio con asistencia, pesos por serie e historial.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8f5',
    theme_color: '#0f172a',
    lang: 'es-UY',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      },
      {
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
