'use client';

import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AtlasType, buildSvgTextureAtlasLookup } from '../atlas';
import { encode } from 'js-base64';
import { trimLeadingZeros } from 'lib/utils';

const ATLAS_SIZE = 2048;
const SVG_BASE_PATH = '/noto/svg/emoji_';
const MAX_RETRIES = 3;
const RETRY_DELAY = 200;
const SCALE_FACTOR = 0.7; // Scale the emoji to 80% of its bounding box
const VERTICAL_OFFSET_FACTOR = 0.1; // Move the emoji down by 10% of its bounding box

// Fallback emoji SVG
const FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#eb073b"/>
  <text x="50" y="20" font-family="Arial" font-size="10" fill="white" text-anchor="middle">EMOJI ERROR</text>
  <circle cx="50" cy="50" r="22.5" fill="#FF0000" stroke="#FFFFFF" stroke-width="2"/>
  <path d="M40 40 L60 60 M60 40 L40 60" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  <text x="50" y="90" font-family="Arial" font-size="10" fill="white" text-anchor="middle">PLEASE RELOAD</text>
</svg>
`;

function useSvgAtlas(unicodeValues?: string[]) {
  const [progress, setProgress] = useState(0);
  const [svgTextureAtlas, setSvgTextureAtlas] = useState<THREE.Texture>(
    new THREE.Texture(),
  );
  const [svgTextureAtlasLookup, setSvgTextureAtlasLookup] = useState<AtlasType>(
    {},
  );
  const [error, setError] = useState(false);
  const [svgContentMap, setSvgContentMap] = useState<Record<string, string>>(
    {},
  );

  const { svgSize, svgGridSize } = useMemo(() => {
    if (unicodeValues == null) return { svgSize: 0, svgGridSize: 0 };

    const totalEmojis = unicodeValues.length;
    const svgGridSize = Math.ceil(Math.sqrt(totalEmojis));
    const svgSize = Math.floor(ATLAS_SIZE / svgGridSize);

    return { svgSize, svgGridSize };
  }, [unicodeValues]);

  useEffect(() => {
    if (unicodeValues == null) return;

    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    const ctx = canvas.getContext('2d');

    if (ctx == null) {
      throw new Error('Could not create 2d canvas!');
    }

    let loadedCount = 0;
    const totalCount = unicodeValues.length;

    const updateProgress = () => {
      loadedCount++;
      setProgress(Math.min(loadedCount / totalCount, 1));
    };

    const loadSVG = async (
      unicodeValue: string,
      index: number,
      total: number,
      retries = 0,
    ): Promise<HTMLImageElement> => {
      try {
        const url = `${SVG_BASE_PATH}${unicodeValue.toLowerCase()}.svg`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const svgText = await response.text();
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            updateProgress();
            resolve(img);
          };
          img.onerror = reject;
          const base64 = 'data:image/svg+xml;base64,' + encode(svgText);
          setSvgContentMap((prev) => ({ ...prev, [unicodeValue]: base64 }));
          img.src = base64;
        });
      } catch (err) {
        if (retries < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return loadSVG(unicodeValue, index, total, retries + 1);
        }
        console.error(
          `Failed to load emoji ${unicodeValue} after ${MAX_RETRIES} retries`,
        );
        setError(true); // Set error to true when fallback is used
        updateProgress();
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          const base64 = 'data:image/svg+xml;base64,' + encode(FALLBACK_SVG);
          setSvgContentMap((prev) => ({ ...prev, [unicodeValue]: base64 }));
          img.src = base64;
        });
      }
    };

    const drawEmojis = async () => {
      try {
        const loadPromises = unicodeValues.map((value, index) => {
          return loadSVG(trimLeadingZeros(value), index, unicodeValues.length);
        });
        const loadedImages = await Promise.all(loadPromises);

        // Build the lookup table
        setSvgTextureAtlasLookup(buildSvgTextureAtlasLookup(unicodeValues));

        loadedImages.forEach((img, i) => {
          const x = (i % svgGridSize) * svgSize;
          const y = Math.floor(i / svgGridSize) * svgSize;

          // Calculate scaled dimensions
          const scale =
            Math.min(svgSize / img.width, svgSize / img.height) * SCALE_FACTOR;
          const width = img.width * scale;
          const height = img.height * scale;

          // Calculate offsets to center the emoji and move it slightly lower
          const offsetX = (svgSize - width) / 2;
          const offsetY =
            (svgSize - height) / 2 + svgSize * VERTICAL_OFFSET_FACTOR;

          // Ensure the emoji stays within its bounding box
          const adjustedOffsetY = Math.min(offsetY, svgSize - height);
          ctx.drawImage(img, x + offsetX, y + adjustedOffsetY, width, height);
          ctx.drawImage(img, x + offsetX, y + offsetY, width, height);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        setSvgTextureAtlas(texture);
      } catch (err) {
        console.error('Failed to draw emojis:', err);
        setError(true);
      }
    };

    drawEmojis();
  }, [unicodeValues, svgSize, svgGridSize]);

  const svgSizeNormalized = useMemo(
    () => ({
      width: svgSize,
      height: svgSize,
    }),
    [svgSize],
  );

  // This means the puzzle doesn't have any emojis
  if (unicodeValues == null) {
    return {
      progress: 1,
      svgTextureAtlas: undefined,
      svgTextureAtlasLookup: undefined,
      svgSize: undefined,
      svgGridSize: undefined,
      error: undefined,
      svgContentMap,
    };
  }

  return {
    progress,
    svgTextureAtlas,
    svgTextureAtlasLookup,
    svgSize: svgSizeNormalized,
    svgGridSize,
    error,
    svgContentMap,
  };
}

export default useSvgAtlas;
