import { useCallback } from 'react';
import {
  Euler,
  InstancedMesh,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import {
  AnimationResult,
  SpringValue,
  easings,
  useSpring,
} from '@react-spring/core';

const tempObject = new Object3D();

export const applyScaleAnimation = ({
  mesh,
  index,
  value,
}: {
  mesh: InstancedMesh;
  index: number;
  value: number;
}) => {
  if (mesh == null) {
    return;
  }

  const matrix: Matrix4 = new Matrix4();
  mesh.getMatrixAt(index, matrix);
  const position: Vector3 = new Vector3();
  const rotation: Quaternion = new Quaternion();
  const scale: Vector3 = new Vector3();
  matrix.decompose(position, rotation, scale);
  tempObject.position.copy(position);
  tempObject.rotation.copy(new Euler().setFromQuaternion(rotation));
  tempObject.scale.set(value, value, value);
  tempObject.updateMatrix();
  mesh.setMatrixAt(index, tempObject.matrix);
  mesh.instanceMatrix.needsUpdate = true;
};

const SCALE = 1.75;

export const useScaleRippleAnimation = (
  width: number,
  height: number,
  totalPerSide: number,
  size: number,
  ref: InstancedMesh | null,
  onComplete?: () => void,
) => {
  const { scale: scaleAnimation } = useSpring({
    scale: SCALE,
    delay: 100,
    config: {
      duration: 200,
      easing: easings.easeInBack,
    },
  });

  const { scale: scaleDownAnimation } = useSpring({
    scale: 1,
    delay: 200,
    config: {
      duration: 200,
      easing: easings.easeOutBack,
    },
  });

  // Animation effect
  const showRippleAnimation = useCallback(() => {
    if (ref == null) return;

    // Holy quadratic batman!
    // This creates an array of arrays that hold each "ring"
    const rings: number[][] = [];
    for (let h = 0; h < height; h++) {
      if (rings[h] == null) {
        rings[h] = [];
      }
      for (let x = 0; x < size; x += totalPerSide) {
        for (let y = 1; y < width; y++) {
          rings[h].push(x + y + h * height);
        }
      }
    }

    const animationFn = async (
      props: AnimationResult<SpringValue<number>>,
      spring: SpringValue<number>,
    ) => {
      const value = spring.get();
      rings.forEach((ring, idx) => {
        setTimeout(() => {
          ring.forEach((index) => {
            applyScaleAnimation({
              mesh: ref,
              value,
              index,
            });
          });
        }, idx * 75);
      });
    };

    scaleAnimation.start({
      from: { scale: 1 },
      to: { scale: SCALE },
      onChange: animationFn,
      // onStart: () => {},
      onRest: () => {
        scaleDownAnimation.start({
          from: { scale: SCALE },
          to: { scale: 1 },
          onChange: animationFn,
          // onStart: () => {},
          onRest: () => {
            if (onComplete) {
              onComplete();
            }
          },
        });
      },
    });
  }, [
    height,
    onComplete,
    ref,
    scaleAnimation,
    scaleDownAnimation,
    size,
    totalPerSide,
    width,
  ]);

  return showRippleAnimation;
};
