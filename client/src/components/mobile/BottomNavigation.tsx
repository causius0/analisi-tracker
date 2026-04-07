import React, { useState } from 'react';
import { Home, TrendingUp, FileText, Settings, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface BottomNavigationProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (item: NavItem) => void;
  showFloatingActionButton?: boolean;
  fabIcon?: React.ReactNode;
  fabAction?: () => void;
  className?: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard',
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '/trends',
  },
  {
    id: 'results',
    label: 'Results',
    icon: <FileText className="w-5 h-5" />,
    href: '/results',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings',
  },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items = DEFAULT_NAV_ITEMS,
  activeItem = 'home',
  onItemClick,
  showFloatingActionButton = true,
  fabIcon = <Plus className="w-6 h-6" />,
  fabAction,
  className,
}) => {
  const [currentRoute, setCurrentRoute] = useState(activeItem);

  const handleItemClick = (item: NavItem) => {
    setCurrentRoute(item.id);
    onItemClick?.(item);

    // Navigate to the route
    if (item.href && item.href !== window.location.pathname) {
      window.location.href = item.href;
    }
  };

  const handleFabClick = () => {
    // Vibrate on press
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    fabAction?.();
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900',
        'border-t border-slate-200 dark:border-slate-700',
        'safe-area-inset-bottom',
        className
      )}
    >
      <nav className="relative flex items-center justify-around h-16 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-w-0',
                'transition-all duration-200 ease-in-out',
                'active:scale-95',
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-600 dark:text-slate-400'
              )}
              style={{
                paddingTop: item.id === 'fab-placeholder' ? '0' : '8px',
                paddingBottom: item.id === 'fab-placeholder' ? '0' : '8px',
              }}
            >
              {item.id === 'fab-placeholder' ? (
                // Spacer for FAB
                <div className="w-16" />
              ) : (
                <>
                  <div className="relative mb-1">
                    {item.icon}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium truncate px-1">
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* Floating Action Button */}
        {showFloatingActionButton && (
          <button
            onClick={handleFabClick}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-6',
              'w-14 h-14 rounded-full shadow-lg',
              'bg-teal-600 hover:bg-teal-700 active:bg-teal-800',
              'text-white flex items-center justify-center',
              'transition-all duration-200 ease-in-out',
              'active:scale-95 hover:scale-105',
              'border-4 border-white dark:border-slate-900'
            )}
            aria-label="Add new result"
          >
            {fabIcon}
          </button>
        )}
      </nav>

      {/* Safe area for iOS home indicator */}
      <style>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
};

export default BottomNavigation;
