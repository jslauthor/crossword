'use client';

import * as THREE from 'three';
import React, { useRef, useMemo, RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh } from 'three';

type ParticlesProps = {
  count: number;
  mouse: RefObject<Array<number>>;
};

const Particles: React.FC<ParticlesProps> = ({ count, mouse }) => {
  const mesh = useRef<InstancedMesh | null>(null);
  const light = useRef<THREE.PointLight | null>(null);
  const { size, viewport } = useThree();
  const aspect = useMemo(() => size.width / viewport.width, [size, viewport]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.005 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  // The innards of this hook will run every frame
  useFrame((state) => {
    if (
      count === 0 ||
      light.current == null ||
      mesh.current == null ||
      mouse.current == null
    ) {
      return;
    }

    // Makes the light follow the mouse
    light.current.position.set(
      mouse.current[0] / aspect,
      -mouse.current[1] / aspect,
      0,
    );
    // Run through the randomized data to calculate some movement
    particles.forEach((particle, i) => {
      if (mesh.current == null || mouse.current == null) {
        return;
      }

      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      // There is no sense or reason to any of this, just messing around with trigonometric functions
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      particle.mx += (mouse.current[0] - particle.mx) * 0.01;
      particle.my += (mouse.current[1] * -1 - particle.my) * 0.01;
      // Update the dummy object
      dummy.position.set(
        (particle.mx / 10) * a +
          xFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b +
          yFactor +
          Math.sin((t / 10) * factor) +
          (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b +
          zFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 3) * factor) / 10,
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      // And apply the matrix to the instanced item
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) {
    return null;
  }

  return (
    <>
      <pointLight ref={light} distance={40} intensity={1} color="lightblue" />
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[0.12, 0]} />
        <meshPhongMaterial color="#708d91" />
      </instancedMesh>
    </>
  );
};

export default Particles;
