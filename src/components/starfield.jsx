import { useMemo } from 'react';

export default function Starfield({ count = 600 }) {
  // useMemo ensures the stars aren't re-generated on every single render pass
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const rand = Math.random();
      let size = 1;
      if (rand > 0.92) size = 3;
      else if (rand > 0.75) size = 2;

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,           
        duration: 3.0 + Math.random() * 3.5,      
        delay: Math.random() * 4,
      };
    });
  }, [count]);

  return (
    <div className="starfield-layer" aria-hidden="true">
      {stars.map(star => (
        <div
          key={star.id}
          className="individual-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            boxShadow: star.size > 1 ? '0 0 6px #fff, 0 0 2px rgba(0, 255, 255, 0.8)' : 'none',
          }}
        />
      ))}
    </div>
  );
}