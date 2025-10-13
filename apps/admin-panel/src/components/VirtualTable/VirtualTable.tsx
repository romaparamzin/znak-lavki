/**
 * Virtual Scrolling Table Component
 * Optimized for rendering large datasets (10,000+ rows)
 * Uses react-window for efficient virtualization
 */

import React, { useRef, useEffect, useState } from 'react';
import { Table, TableProps } from 'antd';
import { FixedSizeList as List } from 'react-window';
import { ColumnType } from 'antd/es/table';

interface VirtualTableProps<T> extends TableProps<T> {
  virtualRowHeight?: number;
  virtualListHeight?: number;
}

/**
 * Virtual Table Component
 * 
 * Features:
 * - Renders only visible rows (massive performance improvement)
 * - Smooth scrolling for large datasets
 * - Compatible with Ant Design Table API
 * - Supports sorting, filtering, and selection
 */
export function VirtualTable<T extends object>(props: VirtualTableProps<T>) {
  const {
    columns,
    dataSource = [],
    virtualRowHeight = 54,
    virtualListHeight = 600,
    scroll,
    ...restProps
  } = props;

  const [tableWidth, setTableWidth] = useState(0);
  const widthColumnCount = columns!.filter(({ width }) => !width).length;
  const mergedColumns = columns!.map((column) => {
    if (column.width) {
      return column;
    }

    return {
      ...column,
      width: Math.floor(tableWidth / widthColumnCount),
    };
  });

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, 'scrollLeft', {
      get: () => {
        if (gridRef.current) {
          return gridRef.current?.state?.scrollLeft;
        }
        return null;
      },
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });

    return obj;
  });

  const resetVirtualGrid = () => {
    gridRef.current?.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: true,
    });
  };

  useEffect(() => resetVirtualGrid, [tableWidth]);

  const renderVirtualList = (
    rawData: readonly T[],
    { scrollbarSize, ref, onScroll }: any,
  ) => {
    ref.current = connectObject;
    const totalHeight = rawData.length * virtualRowHeight;

    return (
      <List
        ref={gridRef}
        className="virtual-grid"
        height={virtualListHeight}
        itemCount={rawData.length}
        itemSize={virtualRowHeight}
        width={tableWidth}
        onScroll={({ scrollLeft }: any) => {
          onScroll({ scrollLeft });
        }}
      >
        {({ index, style }) => {
          const item = rawData[index] as any;
          return (
            <div
              className={`virtual-table-row ${index % 2 === 0 ? 'even' : 'odd'}`}
              style={{
                ...style,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              {mergedColumns.map((col: any, colIndex) => (
                <div
                  key={colIndex}
                  style={{
                    width: col.width,
                    padding: '16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.render
                    ? col.render(item[col.dataIndex], item, index)
                    : item[col.dataIndex]}
                </div>
              ))}
            </div>
          );
        }}
      </List>
    );
  };

  return (
    <div
      ref={(el) => {
        if (el) {
          setTableWidth(el.clientWidth);
        }
      }}
    >
      <Table
        {...restProps}
        className="virtual-table"
        columns={mergedColumns as ColumnType<T>[]}
        dataSource={dataSource}
        scroll={{ y: virtualListHeight, ...scroll }}
        components={{
          body: renderVirtualList,
        }}
      />
    </div>
  );
}

/**
 * Usage Example:
 * 
 * ```tsx
 * import { VirtualTable } from './components/VirtualTable/VirtualTable';
 * 
 * const MyComponent = () => {
 *   const columns = [
 *     { title: 'Name', dataIndex: 'name', width: 200 },
 *     { title: 'Age', dataIndex: 'age', width: 100 },
 *   ];
 * 
 *   const data = Array.from({ length: 100000 }).map((_, i) => ({
 *     key: i,
 *     name: `User ${i}`,
 *     age: 20 + (i % 50),
 *   }));
 * 
 *   return (
 *     <VirtualTable
 *       columns={columns}
 *       dataSource={data}
 *       virtualRowHeight={54}
 *       virtualListHeight={600}
 *     />
 *   );
 * };
 * ```
 */

// ============================================
// SIMPLIFIED VIRTUAL TABLE (without react-window)
// ============================================

interface SimpleVirtualTableProps<T> extends TableProps<T> {
  itemHeight?: number;
  visibleRows?: number;
}

/**
 * Simple Virtual Table without external dependencies
 * Good for datasets up to 10,000 rows
 */
export function SimpleVirtualTable<T extends object>({
  itemHeight = 54,
  visibleRows = 20,
  dataSource = [],
  ...props
}: SimpleVirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const containerHeight = visibleRows * itemHeight;
  const totalHeight = dataSource.length * itemHeight;
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + visibleRows + 5, // Render 5 extra rows for smooth scrolling
    dataSource.length
  );
  
  const visibleData = dataSource.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <Table
            {...props}
            dataSource={visibleData}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Performance Tips:
 * 
 * 1. Use VirtualTable for >1000 rows
 * 2. Set fixed column widths for better performance
 * 3. Memoize column definitions
 * 4. Use pagination for <1000 rows (simpler)
 * 5. Avoid complex renders in cells
 * 6. Use rowKey for proper React keying
 */

export default VirtualTable;

