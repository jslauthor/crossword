import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export function useMatcapTextureAtlas(matcapTextures: THREE.Texture[]) {
  const size = matcapTextures[0]?.image?.width || 64;

  // Calculate the grid size (always a power of 2)
  const gridSize = Math.pow(
    2,
    Math.ceil(Math.log2(Math.sqrt(matcapTextures.length))),
  );

  // Create a single atlas texture (initially black)
  const atlasTexture = useMemo(() => {
    const atlasSize = size * gridSize;
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, atlasSize, atlasSize);
    } else {
      console.error('Failed to get 2D context');
    }

    return new THREE.CanvasTexture(canvas);
  }, [size, gridSize]);

  // Update the atlas texture when individual textures are loaded
  useEffect(() => {
    const canvas = atlasTexture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === matcapTextures.length) {
        matcapTextures.forEach((texture, index) => {
          const x = (index % gridSize) * size;
          const y = Math.floor(index / gridSize) * size;
          ctx.drawImage(texture.image, x, y, size, size);
        });
        atlasTexture.needsUpdate = true;
      }
    };

    matcapTextures.forEach((texture) => {
      if (texture.image?.complete) {
        onLoad();
      } else {
        texture.addEventListener('load', onLoad);
      }
    });

    return () => {
      matcapTextures.forEach((texture) => {
        texture.removeEventListener('load', onLoad);
      });
    };
  }, [atlasTexture, matcapTextures, size, gridSize]);

  return { atlasTexture, gridSize };
}
