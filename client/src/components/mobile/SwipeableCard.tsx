import React, { useState, useRef, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  action: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right') => void;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  className,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const actionWidth = 80; // Width of each action button
  const maxSwipe = rightActions.length * actionWidth;
  const minSwipe = -(leftActions.length * actionWidth);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX - translateX;
    setIsDragging(true);
  };

  // Handle mouse start
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX - translateX;
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Apply resistance at boundaries
    let newTranslateX = diff;
    if (diff > maxSwipe) {
      newTranslateX = maxSwipe + (diff - maxSwipe) * 0.3;
    } else if (diff < minSwipe) {
      newTranslateX = minSwipe + (diff - minSwipe) * 0.3;
    }

    setTranslateX(newTranslateX);
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;

    let newTranslateX = diff;
    if (diff > maxSwipe) {
      newTranslateX = maxSwipe + (diff - maxSwipe) * 0.3;
    } else if (diff < minSwipe) {
      newTranslateX = minSwipe + (diff - minSwipe) * 0.3;
    }

    setTranslateX(newTranslateX);
  };

  // Handle touch/mouse end
  const handleEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Determine which action to trigger
    if (translateX > actionWidth / 2 && rightActions.length > 0) {
      // Snap to first right action
      const actionIndex = Math.min(
        Math.floor(translateX / actionWidth),
        rightActions.length - 1
      );

      // Trigger action
      rightActions[actionIndex].action();

      // Vibrate feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      // Reset position
      setTranslateX(0);
      onSwipe?.('right');
    } else if (translateX < -actionWidth / 2 && leftActions.length > 0) {
      // Snap to first left action
      const actionIndex = Math.min(
        Math.floor(Math.abs(translateX) / actionWidth),
        leftActions.length - 1
      );

      // Trigger action
      leftActions[actionIndex].action();

      // Vibrate feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      // Reset position
      setTranslateX(0);
      onSwipe?.('left');
    } else {
      // Reset to center
      setTranslateX(0);
    }
  };

  // Calculate which actions are visible
  const visibleRightActions = translateX > actionWidth / 2
    ? rightActions.slice(0, Math.ceil(translateX / actionWidth))
    : [];

  const visibleLeftActions = translateX < -actionWidth / 2
    ? leftActions.slice(0, Math.ceil(Math.abs(translateX) / actionWidth))
    : [];

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Right actions (swipe left to see) */}
      {rightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{
            width: `${rightActions.length * actionWidth}px`,
            transform: `translateX(${Math.max(0, translateX - maxSwipe)}px)`,
          }}
        >
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                setTranslateX(0);
              }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                'transition-opacity duration-200',
                visibleRightActions.includes(action) ? 'opacity-100' : 'opacity-0'
              )}
              style={{ backgroundColor: action.color }}
            >
              <div className="text-white">{action.icon}</div>
              <span className="text-xs text-white font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Left actions (swipe right to see) */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-stretch"
          style={{
            width: `${leftActions.length * actionWidth}px`,
            transform: `translateX(${Math.min(0, translateX - minSwipe)}px)`,
          }}
        >
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                setTranslateX(0);
              }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                'transition-opacity duration-200',
                visibleLeftActions.includes(action) ? 'opacity-100' : 'opacity-0'
              )}
              style={{ backgroundColor: action.color }}
            >
              <div className="text-white">{action.icon}</div>
              <span className="text-xs text-white font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative bg-white dark:bg-slate-800 shadow-sm touch-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
