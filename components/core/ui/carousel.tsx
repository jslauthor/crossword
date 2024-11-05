import { useSpring, animated } from '@react-spring/web';

interface CarouselProps {
  children: React.ReactNode[];
  currentIndex: number;
}

export function Carousel({ children, currentIndex }: CarouselProps) {
  const springs = useSpring({
    from: { transform: 'translateX(0%)' },
    to: { transform: `translateX(-${currentIndex * 100}%)` },
    config: { tension: 280, friction: 30, mass: 1.5 },
  });

  return (
    <div className="relative w-full h-full overflow-hidden">
      <animated.div className="flex h-full" style={springs}>
        {children.map((child, index) => (
          <div key={index} className="w-full h-full flex-shrink-0">
            {child}
          </div>
        ))}
      </animated.div>
    </div>
  );
}
