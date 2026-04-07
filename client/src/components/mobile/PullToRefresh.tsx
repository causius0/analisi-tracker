import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  debounce?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  debounce = 500,
  className,
}) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const lastRefreshTime = useRef(0);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only trigger if at top of scrollable container
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;

    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    // Only allow pulling down (positive distance)
    if (distance > 0) {
      // Apply resistance to make it harder to pull further
      const resistance = 0.4;
      const adjustedDistance = distance * resistance;

      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));
      setCanRefresh(adjustedDistance >= threshold);

      // Prevent default scrolling when pulling
      if (adjustedDistance > 0) {
        e.preventDefault();
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    if (!pulling) return;

    setPulling(false);

    // Debounce refresh
    const now = Date.now();
    if (canRefresh && now - lastRefreshTime.current > debounce) {
      setRefreshing(true);
      lastRefreshTime.current = now;

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      // Reset without refreshing
      setPullDistance(0);
      setCanRefresh(false);
    }
  };

  // Reset if user cancels pull
  useEffect(() => {
    const handleTouchCancel = () => {
      setPulling(false);
      setPullDistance(0);
      setCanRefresh(false);
    };

    window.addEventListener('touchcancel', handleTouchCancel);
    return () => window.removeEventListener('touchcancel', handleTouchCancel);
  }, []);

  // Calculate indicator opacity and transform
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorTransform = Math.min(pullDistance, threshold);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-transform"
        style={{
          transform: `translateY(${indicatorTransform - threshold}px)`,
          opacity: indicatorOpacity,
          height: `${threshold}px`,
        }}
      >
        {refreshing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Refreshing...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn('transition-transform', canRefresh && 'rotate-180')}>
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: refreshing || pulling ? `translateY(${indicatorTransform}px)` : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
