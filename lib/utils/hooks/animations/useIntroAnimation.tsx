import { useCallback } from 'react';
import {
  Euler,
  InstancedMesh,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import { useSpring } from '@react-spring/core';
import { rangeOperation } from '../../math';
import { CubeSidesEnum } from '../../../../components/core/3d/LetterBoxes';
import { Clue, SolutionCell } from '../../../../types/types';

const tempObject = new Object3D();

const yAxis = new Vector3(0, 1, 0);
const applyFlipAnimation = ({
  mesh,
  index,
  elapsed,
  rotations,
}: {
  mesh: InstancedMesh;
  index: number;
  elapsed: number;
  rotations: Euler[];
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
  tempObject.rotation.copy(
    new Euler().setFromQuaternion(
      rotation.setFromAxisAngle(
        yAxis,
        elapsed * (Math.PI * 2) + (rotations[index]?.y ?? 0)
      )
    )
  );

  tempObject.scale.copy(scale);
  tempObject.updateMatrix();
  mesh.setMatrixAt(index, tempObject.matrix);
  mesh.instanceMatrix.needsUpdate = true;
};

export const useIntroAnimation = (
  selectedSide: number,
  width: number,
  height: number,
  totalPerSide: number,
  size: number,
  initialRotations: Euler[],
  cubeSideDisplayArray: Float32Array,
  record: {
    solution: SolutionCell[];
    clues: {
      across: Clue[];
      down: Clue[];
    };
  },
  ref: InstancedMesh | null,
  onComplete?: () => void
) => {
  const { flipAnimation } = useSpring({
    flipAnimation: 1,
    config: {
      mass: 2,
      tension: 15,
      friction: 7,
      precision: 0.001,
    },
  });

  // Animation effect
  const showIntroAnimation = useCallback(
    (show = true) => {
      if (ref == null) return;

      flipAnimation.start({
        from: { flipAnimation: show ? 0 : 1 },
        to: { flipAnimation: show ? 1 : 0 },
        onChange: async (props, spring) => {
          const elapsed = spring.get();
          const previousSide = rangeOperation(0, 3, selectedSide, 1, '-');
          const start = previousSide * (width * height) + width - 1;
          let indices = [];
          for (let index = 0; index <= totalPerSide + width; index++) {
            indices[index] =
              index < width
                ? rangeOperation(0, size, start, index * width, '+')
                : rangeOperation(
                    0,
                    size,
                    totalPerSide * selectedSide,
                    index - width + 1,
                    '+'
                  );
          }
          // We must normalize the position of the first row
          const firstRow = indices.slice(0, width);
          const elements = [];
          for (let x = 0; x < firstRow.length; x++) {
            const subset = indices.slice(
              firstRow.length + x * width,
              firstRow.length + x * width + width
            );
            elements[x] = [firstRow[x], ...subset];
          }
          indices = elements.flat();

          indices.forEach((next, index) => {
            setTimeout(() => {
              applyFlipAnimation({
                mesh: ref,
                elapsed,
                index: next,
                rotations: initialRotations,
              });
            }, index * 5);

            // Show all sides while animating
            cubeSideDisplayArray[next * 2] =
              CubeSidesEnum.six |
              CubeSidesEnum.two |
              CubeSidesEnum.one |
              CubeSidesEnum.five;
          });
          ref.geometry.attributes.cubeSideDisplay.needsUpdate = true;
        },
        // onStart: () => {},
        onRest: () => {
          // Restore which sides we show
          for (let j = 0; j < record.solution.length; j++) {
            cubeSideDisplayArray[j * 2] =
              CubeSidesEnum.six |
              (j % width === width - 1 ? CubeSidesEnum.two : 0);
          }
          ref.geometry.attributes.cubeSideDisplay.needsUpdate = true;

          if (onComplete) {
            onComplete();
          }
        },
      });
    },
    [
      ref,
      flipAnimation,
      selectedSide,
      width,
      height,
      totalPerSide,
      size,
      cubeSideDisplayArray,
      initialRotations,
      onComplete,
      record.solution.length,
    ]
  );

  return showIntroAnimation;
};
