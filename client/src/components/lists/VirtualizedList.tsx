/**
 * Virtualized list component for rendering large datasets efficiently
 * Uses react-virtuoso for optimal performance
 */

'use client';

import { Virtuoso } from 'react-virtuoso';
import { useState, useCallback } from 'react';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  height?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingComponent?: React.ReactNode;
  endMessage?: string;
  className?: string;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight = 60,
  height = 600,
  onLoadMore,
  hasMore = false,
  loadingComponent,
  endMessage = 'End of list',
  className = '',
}: VirtualizedListProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore || !onLoadMore) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, onLoadMore]);

  return (
    <div
      className={`border rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <Virtuoso
        style={{ height: '100%' }}
        data={data}
        itemContent={(index, item) => renderItem(item, index)}
        endReached={() => {
          if (hasMore) {
            handleLoadMore();
          }
        }}
        overscan={200} // Render 200px extra buffer
        increaseViewportBy={{ top: 200, bottom: 200 }}
        components={
          isLoading || hasMore
            ? {
                Footer: () => (
                  <div
                    className="p-4 text-center text-sm text-muted-foreground"
                    style={{ height: itemHeight }}
                  >
                    {isLoading
                      ? loadingComponent || 'Loading more...'
                      : hasMore
                      ? ''
                      : endMessage}
                  </div>
                ),
              }
            : undefined
        }
        defaultItemHeight={itemHeight}
      />
    </div>
  );
}

/**
 * Virtualized table component
 */
interface VirtualizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    width?: number;
    render?: (value: any, item: T, index: number) => React.ReactNode;
  }>;
  rowHeight?: number;
  height?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 50,
  height = 600,
  onLoadMore,
  hasMore = false,
  className = '',
}: VirtualizedTableProps<T>) {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="flex bg-muted font-medium text-sm border-b"
        style={{ height: rowHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 flex items-center"
            style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      <div style={{ height: height - rowHeight }}>
        <Virtuoso
          style={{ height: '100%' }}
          data={data}
          itemContent={(index, item) => (
            <div
              className="flex border-b hover:bg-muted/50 transition-colors"
              style={{ height: rowHeight }}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="px-4 flex items-center text-sm"
                  style={{
                    width: column.width || 'auto',
                    flex: column.width ? undefined : 1,
                  }}
                >
                  {column.render
                    ? column.render(item[column.key], item, index)
                    : item[column.key]}
                </div>
              ))}
            </div>
          )}
          endReached={() => {
            if (hasMore && onLoadMore) {
              onLoadMore();
            }
          }}
          overscan={200}
          increaseViewportBy={{ top: 200, bottom: 200 }}
          defaultItemHeight={rowHeight}
        />
      </div>
    </div>
  );
}

export default VirtualizedList;
