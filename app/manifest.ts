import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crosscube: Crossword puzzles in three dimensions',
    short_name: 'Crosscube',
    description: 'Crossword puzzles in three dimensions',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/general_icon@192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/general_icon@512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
