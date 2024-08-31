import { InstancedMesh } from 'three';
import { useCallback, useState } from 'react';
import { applyScaleAnimation } from './useScaleRippleAnimation';
import anime, { AnimeInstance } from 'animejs';

export const useScaleAnimation = (
  refs: (InstancedMesh | null)[], // Change to accept an array of potentially null InstancedMesh
  onComplete?: () => void,
) => {
  const [animations] = useState<Record<number, AnimeInstance>>({});

  const showScaleAnimation = useCallback(
    (index: number) => {
      const validRefs = refs.filter(
        (ref): ref is InstancedMesh => ref !== null,
      );
      if (validRefs.length === 0) return;

      if (animations[index] != null) {
        animations[index].restart();
        return;
      }

      const animationFn = (anim: AnimeInstance) => {
        applyScaleAnimation({
          meshes: validRefs,
          value: anim.animations[0].currentValue as unknown as number,
          index,
        });
      };

      animations[index] = anime({
        targets: { scale: 1 },
        scale: [
          {
            value: 1.05,
            duration: 100,
            easing: 'easeInBack',
          },
          {
            value: 1,
            duration: 100,
            easing: 'easeOutBack',
          },
        ],
        update: animationFn,
        complete: onComplete,
      });
    },
    [animations, refs, onComplete],
  );

  return showScaleAnimation;
};
