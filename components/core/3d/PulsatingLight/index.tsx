import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { PointLight, Vector3 } from 'three';

const PulsatingLight: React.FC<{
  position: Vector3;
  color: number;
  minIntensity?: number;
  maxIntensity?: number;
  pulseSpeed?: number;
}> = ({
  position,
  color,
  minIntensity = 0.75,
  maxIntensity = 3,
  pulseSpeed = 4,
}) => {
  const lightRef = useRef<PointLight>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (lightRef.current) {
      const intensityRange = maxIntensity - minIntensity;
      const intensity =
        minIntensity +
        ((Math.sin(timeRef.current * pulseSpeed) + 1) / 2) * intensityRange;
      lightRef.current.intensity = intensity;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={minIntensity}
      decay={5}
    />
  );
};

export default PulsatingLight;
