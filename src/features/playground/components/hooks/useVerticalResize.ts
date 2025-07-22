import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVerticalResizeOptions {
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  storageKey?: string;
}

interface UseVerticalResizeResult {
  height: number;
  isResizing: boolean;
  startResize: (event: React.MouseEvent) => void;
  resizeHandleProps: {
    onMouseDown: (event: React.MouseEvent) => void;
    style: {
      cursor: string;
    };
  };
}

export const useVerticalResize = ({
  defaultHeight = 300,
  minHeight = 120,
  maxHeight = 600,
  storageKey = 'historyPanel-height',
}: UseVerticalResizeOptions = {}): UseVerticalResizeResult => {
  // Load initial height from localStorage or use default
  const getInitialHeight = useCallback((): number => {
    if (typeof window !== 'undefined' && storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedHeight = parseInt(stored, 10);
        if (parsedHeight >= minHeight && parsedHeight <= maxHeight) {
          return parsedHeight;
        }
      }
    }
    return defaultHeight;
  }, [defaultHeight, minHeight, maxHeight, storageKey]);

  const [height, setHeight] = useState<number>(getInitialHeight);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);

  // Save height to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, height.toString());
    }
  }, [height, storageKey]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    event.preventDefault();
    const deltaY = startY.current - event.clientY; // Inverted because we want to grow upward
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, startHeight.current + deltaY)
    );
    setHeight(newHeight);
  }, [minHeight, maxHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const startResize = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    startY.current = event.clientY;
    startHeight.current = height;
    
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  const resizeHandleProps = {
    onMouseDown: startResize,
    style: {
      cursor: 'row-resize' as const,
    },
  };

  return {
    height,
    isResizing,
    startResize,
    resizeHandleProps,
  };
};
