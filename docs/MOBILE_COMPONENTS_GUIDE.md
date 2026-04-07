# Mobile Components Quick Reference

This guide provides quick usage examples for all mobile components in the Analisi Tracker PWA.

## Table of Contents
- [Bottom Navigation](#bottom-navigation)
- [Mobile Chart](#mobile-chart)
- [Pull to Refresh](#pull-to-refresh)
- [Swipeable Card](#swipeable-card)
- [PWA Utilities](#pwa-utilities)
- [Performance Tools](#performance-tools)

## Bottom Navigation

### Basic Usage

```tsx
import { BottomNavigation } from '@/components/mobile';

function App() {
  return (
    <div>
      <YourContent />
      <BottomNavigation activeItem="home" />
    </div>
  );
}
```

### Custom Navigation Items

```tsx
import { BottomNavigation, NavItem } from '@/components/mobile';
import { Home, TrendingUp, FileText, Settings } from 'lucide-react';

const customItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard',
    badge: 3, // Show notification badge
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

function App() {
  const [activeItem, setActiveItem] = useState('home');

  return (
    <BottomNavigation
      items={customItems}
      activeItem={activeItem}
      onItemClick={(item) => setActiveItem(item.id)}
    />
  );
}
```

### Custom FAB (Floating Action Button)

```tsx
import { Plus } from 'lucide-react';

function App() {
  const handleAdd = () => {
    console.log('Add new result');
  };

  return (
    <BottomNavigation
      showFloatingActionButton
      fabIcon={<Plus className="w-6 h-6" />}
      fabAction={handleAdd}
    />
  );
}
```

## Mobile Chart

### Basic Usage

```tsx
import { MobileChart } from '@/components/mobile';
import { DataPoint } from '@/types/charts';

const data: DataPoint[] = [
  { id: '1', date: '2026-01-01', value: 1.2 },
  { id: '2', date: '2026-02-01', value: 1.1 },
  { id: '3', date: '2026-03-01', value: 1.0 },
];

function Dashboard() {
  return (
    <MobileChart
      data={data}
      labTestName="Creatinine"
      unit="mg/dL"
      referenceRange={{ min: 0.7, max: 1.3 }}
    />
  );
}
```

### With Custom Styling

```tsx
function Dashboard() {
  return (
    <MobileChart
      data={data}
      labTestName="Creatinine"
      unit="mg/dL"
      referenceRange={{ min: 0.7, max: 1.3 }}
      className="shadow-lg rounded-xl"
    />
  );
}
```

## Pull to Refresh

### Basic Usage

```tsx
import { PullToRefresh } from '@/components/mobile';

function Dashboard() {
  const [data, setData] = useState([]);

  const handleRefresh = async () => {
    const newData = await fetchLabResults();
    setData(newData);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <YourContent data={data} />
    </PullToRefresh>
  );
}
```

### Custom Threshold and Debounce

```tsx
function Dashboard() {
  const handleRefresh = async () => {
    await fetchLabResults();
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      threshold={100} // Pull distance in pixels
      debounce={1000} // Debounce time in ms
    >
      <YourContent />
    </PullToRefresh>
  );
}
```

## Swipeable Card

### Basic Swipe Actions

```tsx
import { SwipeableCard } from '@/components/mobile';
import { Trash2, Edit, Archive } from 'lucide-react';

function LabResultList() {
  const handleDelete = () => {
    console.log('Delete item');
  };

  const handleEdit = () => {
    console.log('Edit item');
  };

  const leftActions = [
    {
      icon: <Edit className="w-5 h-5" />,
      label: 'Edit',
      color: '#3b82f6',
      action: handleEdit,
    },
    {
      icon: <Archive className="w-5 h-5" />,
      label: 'Archive',
      color: '#8b5cf6',
      action: () => console.log('Archive'),
    },
  ];

  const rightActions = [
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: 'Delete',
      color: '#ef4444',
      action: handleDelete,
    },
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipe={(direction) => console.log(`Swiped ${direction}`)}
    >
      <div className="p-4">
        <h3>Lab Result Item</h3>
        <p>Swipe left or right to see actions</p>
      </div>
    </SwipeableCard>
  );
}
```

### Single Swipe Action

```tsx
function SimpleSwipe() {
  return (
    <SwipeableCard
      rightActions={[
        {
          icon: <Trash2 className="w-5 h-5" />,
          label: 'Delete',
          color: '#ef4444',
          action: () => console.log('Deleted'),
        },
      ]}
    >
      <div className="p-4">Swipe right to delete</div>
    </SwipeableCard>
  );
}
```

## PWA Utilities

### Service Worker Registration

```tsx
import { initPWA, usePWA } from '@/utils/pwa';

// Initialize PWA in app root
function App() {
  useEffect(() => {
    initPWA().then(({ registration, deviceInfo }) => {
      console.log('PWA initialized', deviceInfo);
    });
  }, []);

  return <YourApp />;
}
```

### Use PWA Hook

```tsx
import { usePWA } from '@/utils/pwa';

function StatusBar() {
  const { isOnline, canInstall, install } = usePWA();

  return (
    <div>
      {!isOnline && <p>You're offline</p>}
      {canInstall && (
        <button onClick={install}>Install App</button>
      )}
    </div>
  );
}
```

### Show Notification

```tsx
import { showNotification, requestNotificationPermission } from '@/utils/pwa';

async function notifyUser() {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    await showNotification('New Lab Result', {
      body: 'Your creatinine levels have been updated',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    });
  }
}
```

### Vibrate Device

```tsx
import { vibrate } from '@/utils/pwa';

function handleAction() {
  // Vibrate for 100ms
  vibrate(100);

  // Or use vibration pattern
  vibrate([100, 50, 100]); // Vibrate, pause, vibrate
}
```

### Detect Device

```tsx
import { isMobile, isIOS, isAndroid, isInstalled } from '@/utils/pwa';

function Component() {
  if (isMobile()) {
    if (isIOS()) {
      console.log('Running on iOS');
    } else if (isAndroid()) {
      console.log('Running on Android');
    }

    if (isInstalled()) {
      console.log('Running as installed app');
    }
  }

  return <YourComponent />;
}
```

### Clear Cache

```tsx
import { clearAllCaches, getCacheSize, formatBytes } from '@/utils/pwa';

async function showCacheInfo() {
  const size = await getCacheSize();
  console.log(`Cache size: ${formatBytes(size)}`);
}

async function clearCache() {
  await clearAllCaches();
  console.log('Cache cleared');
}
```

## Performance Tools

### Lazy Load Images

```tsx
import { lazyLoadImages } from '@/utils/performance';

useEffect(() => {
  // Auto lazy load images with data-src attribute
  lazyLoadImages('img[data-src]');
}, []);
```

### Debounce Input

```tsx
import { debounce } from '@/utils/performance';

function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Debounce search function
  const debouncedSearch = debounce(async (q) => {
    const data = await searchAPI(q);
    setResults(data);
  }, 300);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

### Throttle Scroll

```tsx
import { throttle } from '@/utils/performance';

function ScrollComponent() {
  const handleScroll = throttle(() => {
    console.log('Scroll position', window.scrollY);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <div style={{ height: '200vh' }}>Scroll me</div>;
}
```

### Measure Performance

```tsx
import { measurePerformance } from '@/utils/performance';

function loadData() {
  measurePerformance('loadLabResults', async () => {
    const data = await fetchLabResults();
    processData(data);
  });
}
```

### Detect Device Capabilities

```tsx
import { isLowEndDevice, getOptimizationLevel } from '@/utils/performance';

function Component() {
  const optimizationLevel = getOptimizationLevel();

  if (isLowEndDevice()) {
    // Use minimal animations
    // Reduce cache size
    // Disable non-critical features
  }

  switch (optimizationLevel) {
    case 'high':
      // Full features
      break;
    case 'medium':
      // Balanced
      break;
    case 'low':
      // Minimal
      break;
  }

  return <YourComponent />;
}
```

### Monitor FPS

```tsx
import { monitorFPS } from '@/utils/performance';

useEffect(() => {
  const cleanup = monitorFPS((fps) => {
    console.log(`Current FPS: ${fps}`);

    if (fps < 30) {
      console.warn('Performance is poor!');
    }
  });

  return cleanup;
}, []);
```

### Optimize Images

```tsx
import { optimizeImage } from '@/utils/performance';

function ImageComponent() {
  const src = optimizeImage('/images/chart.png', {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp',
  });

  return <img src={src} alt="Chart" />;
}
```

### Batch DOM Updates

```tsx
import { batchUpdates } from '@/utils/performance';

function updateMultipleItems() {
  const updates = [
    () => (document.getElementById('a').textContent = 'A'),
    () => (document.getElementById('b').textContent = 'B'),
    () => (document.getElementById('c').textContent = 'C'),
  ];

  batchUpdates(updates); // Single reflow
}
```

## Complete Example: Mobile Dashboard

```tsx
import { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/mobile';
import { MobileChart } from '@/components/mobile';
import { PullToRefresh } from '@/components/mobile';
import { SwipeableCard } from '@/components/mobile';
import { initPWA, usePWA } from '@/utils/pwa';
import { debounce } from '@/utils/performance';
import { Trash2 } from 'lucide-react';

function MobileDashboard() {
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isOnline } = usePWA();

  // Initialize PWA
  useEffect(() => {
    initPWA();
  }, []);

  // Load data with debounce
  const loadData = debounce(async () => {
    setLoading(true);
    try {
      const data = await fetchLabResults();
      setLabResults(data);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    await loadData();
  };

  // Delete handler
  const handleDelete = async (id) => {
    await deleteLabResult(id);
    await loadData();
  };

  return (
    <div className="pb-16">
      {/* Pull to refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-4">
          {/* Status bar */}
          {!isOnline && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg">
              You're offline - showing cached data
            </div>
          )}

          {/* Charts */}
          {labResults.map((result) => (
            <MobileChart
              key={result.id}
              data={result.data}
              labTestName={result.name}
              unit={result.unit}
              referenceRange={result.referenceRange}
            />
          ))}

          {/* Swipeable list */}
          {labResults.map((result) => (
            <SwipeableCard
              key={result.id}
              rightActions={[
                {
                  icon: <Trash2 className="w-5 h-5" />,
                  label: 'Delete',
                  color: '#ef4444',
                  action: () => handleDelete(result.id),
                },
              ]}
            >
              <div className="p-4">
                <h3 className="font-semibold">{result.name}</h3>
                <p className="text-sm text-gray-600">{result.date}</p>
              </div>
            </SwipeableCard>
          ))}
        </div>
      </PullToRefresh>

      {/* Bottom navigation */}
      <BottomNavigation activeItem="dashboard" />
    </div>
  );
}

export default MobileDashboard;
```

## Tips and Best Practices

### 1. Always Use Safe Areas
```tsx
// Bottom navigation automatically handles safe areas
<BottomNavigation />
```

### 2. Provide Feedback
```tsx
// Vibrate on actions
import { vibrate } from '@/utils/pwa';

function handleAction() {
  vibrate(50); // Short vibration
  // ... do action
}
```

### 3. Handle Offline State
```tsx
const { isOnline } = usePWA();

useEffect(() => {
  if (!isOnline) {
    showNotification('You\'re offline', {
      body: 'Some features may be unavailable',
    });
  }
}, [isOnline]);
```

### 4. Optimize Performance
```tsx
// Use debounce for user input
const handleChange = debounce((value) => {
  // Handle input
}, 300);
```

### 5. Lazy Load Content
```tsx
import { lazy } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

**Last Updated:** April 2026
**Version:** 1.0.0
