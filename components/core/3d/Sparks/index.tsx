'use client';

import * as THREE from 'three';
import React, { useRef, useMemo, RefObject } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline';

type SparksProps = {
  count: number;
  mouse: RefObject<Array<number>>;
  colors: Array<string>;
  radius?: number;
};

type FatLineProps = {
  curve: Array<THREE.Vector3>;
  width: number;
  color: string;
  speed: number;
};

extend({ MeshLineGeometry, MeshLineMaterial });

const r = () => Math.max(0.2, Math.random());

const Fatline: React.FC<FatLineProps> = ({ curve, width, color, speed }) => {
  const material = useRef<MeshLineMaterial>();
  useFrame(() => {
    if (material.current == null) return;
    material.current.uniforms.dashOffset.value -= speed;
  });
  return (
    <mesh raycast={raycast}>
      <meshLineGeometry attach="geometry" points={curve} />
      <meshLineMaterial
        ref={material}
        transparent
        depthTest={false}
        lineWidth={width}
        color={color}
        dashArray={0.1}
        dashRatio={0.95}
        toneMapped={false}
      />
    </mesh>
  );
};

const Sparks: React.FC<SparksProps> = ({
  mouse,
  count,
  colors,
  radius = 10,
}) => {
  const lines = useMemo(
    () =>
      new Array(count).fill(0).map((_, index) => {
        const pos = new THREE.Vector3(
          Math.sin(0) * radius * r(),
          Math.cos(0) * radius * r(),
          0
        );
        const points = new Array(30).fill(0).map((_, index) => {
          const angle = (index / 20) * Math.PI * 2;
          return pos
            .add(
              new THREE.Vector3(
                Math.sin(angle) * radius * r(),
                Math.cos(angle) * radius * r(),
                0
              )
            )
            .clone();
        });
        const curve = new THREE.CatmullRomCurve3(points).getPoints(1000);
        return {
          color: colors[Math.floor(colors.length * Math.random())],
          width: Math.max(0.05, (0.1 * index) / 10),
          speed: Math.max(0.0002, 0.001 * Math.random()),
          curve,
        };
      }),
    [colors, count, radius]
  );

  const ref = useRef<THREE.Group | null>(null);
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;
  useFrame(() => {
    if (ref.current && mouse.current != null) {
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        0 + mouse.current[1] / aspect / 200,
        0.1
      );
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        0 + mouse.current[0] / aspect / 400,
        0.1
      );
    }
  });

  return (
    <group ref={ref}>
      <group position={[-radius * 2, -radius, 0]} scale={[1, 1.3, 1]}>
        {lines.map((props, index) => (
          <Fatline key={index} {...props} />
        ))}
      </group>
    </group>
  );
};

export default Sparks;
