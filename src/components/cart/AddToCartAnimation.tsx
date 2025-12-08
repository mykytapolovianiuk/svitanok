import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AddToCartAnimationProps {
  isAnimating: boolean;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  productImage?: string;
  onComplete: () => void;
}

export default function AddToCartAnimation({
  isAnimating,
  startPosition,
  endPosition,
  productImage,
  onComplete,
}: AddToCartAnimationProps) {
  const [position, setPosition] = useState(startPosition);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isAnimating) return;

    // Reset position
    setPosition(startPosition);
    setOpacity(1);
    setScale(1);

    // Animation timeline
    const duration = 600; // 600ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      // Calculate current position
      const currentX = startPosition.x + (endPosition.x - startPosition.x) * easeOut;
      const currentY = startPosition.y + (endPosition.y - startPosition.y) * easeOut;

      // Scale and opacity changes
      if (progress < 0.3) {
        // Scale up at the beginning
        setScale(1 + progress * 0.5);
      } else if (progress > 0.7) {
        // Scale down and fade out at the end
        setScale(1 - (progress - 0.7) * 2);
        setOpacity(1 - (progress - 0.7) * 3.33);
      }

      setPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, startPosition, endPosition, onComplete]);

  if (!isAnimating) return null;

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacity,
        transition: 'none',
      }}
    >
      {productImage ? (
        <img
          src={productImage}
          alt=""
          className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-lg"
        />
      ) : (
        <div className="w-16 h-16 bg-gray-900 rounded-lg border-2 border-white shadow-lg flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
      )}
    </div>,
    document.body
  );
}



