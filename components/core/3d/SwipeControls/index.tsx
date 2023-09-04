'use client';

import * as React from 'react';
import { MathUtils } from 'three';
import { useThree } from '@react-three/fiber';
import { a, useSpring } from '@react-spring/three';
import { useGesture } from '@use-gesture/react';
import { SpringConfig } from '@react-spring/core';

export type SwipeControlProps = {
  snap?: Boolean | SpringConfig;
  global?: boolean;
  cursor?: boolean;
  speed?: number;
  zoom?: number;
  rotation?: [number, number, number];
  polar?: [number, number];
  azimuth?: [number, number];
  config?: any;
  dragEnabled?: boolean;
  children?: React.ReactNode;
  domElement?: HTMLElement;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function SwipeControls({
  dragEnabled = true,
  snap,
  global,
  domElement,
  cursor = true,
  children,
  speed = 1,
  rotation = [0, 0, 0],
  zoom = 1,
  polar = [0, Math.PI / 2],
  azimuth = [-Infinity, Infinity],
  config = { mass: 1, tension: 170, friction: 26 },
  onSwipeLeft,
  onSwipeRight,
}: SwipeControlProps) {
  const events = useThree((state) => state.events);
  const gl = useThree((state) => state.gl);
  const explDomElement = domElement || events.connected || gl.domElement;

  const { size } = useThree();
  const rPolar = React.useMemo(
    () => [rotation[0] + polar[0], rotation[0] + polar[1]],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotation[0], polar[0], polar[1]]
  ) as [number, number];
  const rAzimuth = React.useMemo(
    () => [rotation[1] + azimuth[0], rotation[1] + azimuth[1]],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotation[1], azimuth[0], azimuth[1]]
  ) as [number, number];
  const rInitial = React.useMemo(
    () => [
      MathUtils.clamp(rotation[0], ...rPolar),
      MathUtils.clamp(rotation[1], ...rAzimuth),
      rotation[2],
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotation[0], rotation[1], rotation[2], rPolar, rAzimuth]
  );
  const [spring, api] = useSpring(() => ({
    scale: 1,
    rotation: rInitial,
    config,
  }));
  React.useEffect(
    () => void api.start({ scale: 1, rotation: rInitial, config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rInitial]
  );
  React.useEffect(() => {
    if (global && cursor && dragEnabled) {
      explDomElement.style.cursor = 'grab';
      gl.domElement.style.cursor = '';
      return () => {
        explDomElement.style.cursor = 'default';
        gl.domElement.style.cursor = 'default';
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global, cursor, explDomElement, dragEnabled]);
  const bind = useGesture(
    {
      onDrag: ({
        down,
        delta: [x, y],
        memo: [oldY, oldX] = spring.rotation.animation.to || rInitial,
        swipe,
      }) => {
        if (swipe[0] === 1 && onSwipeLeft) {
          onSwipeLeft();
        }
        if (swipe[0] === -1 && onSwipeRight) {
          onSwipeRight();
        }

        // Leave in ability to drag
        if (!dragEnabled) return [y, x];
        if (cursor) explDomElement.style.cursor = down ? 'grabbing' : 'grab';
        x = MathUtils.clamp(
          oldX + (x / size.width) * Math.PI * speed,
          ...rAzimuth
        );
        y = MathUtils.clamp(
          oldY + (y / size.height) * Math.PI * speed,
          ...rPolar
        );
        const sConfig =
          snap && !down && typeof snap !== 'boolean' ? snap : config;
        api.start({
          scale: down && y > rPolar[1] / 2 ? zoom : 1,
          rotation: snap && !down ? rInitial : [y, x, 0],
          config: (n) =>
            n === 'scale'
              ? { ...sConfig, friction: sConfig.friction * 3 }
              : sConfig,
        });
        return [y, x];
      },
    },
    { target: global ? explDomElement : undefined }
  );
  return (
    <a.group {...bind?.()} {...(spring as any)}>
      {children}
    </a.group>
  );
}
