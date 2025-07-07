"use client";

import { cn } from "@/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
}

export const FlickeringGrid = React.memo(({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}: FlickeringGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const frameCountRef = useRef(0);
  const gridParamsRef = useRef<{
    cols: number;
    rows: number;
    squares: Float32Array;
    dpr: number;
  } | null>(null);

  const memoizedColor = useMemo(() => {
    if (typeof window === "undefined") return "rgba(0, 0, 0,";
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "rgba(0, 0, 0,";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return `rgba(${r}, ${g}, ${b},`;
  }, [color]);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance
      const scaledWidth = width * dpr;
      const scaledHeight = height * dpr;
      
      // Only update canvas dimensions if they've changed
      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const cols = Math.floor(width / (squareSize + gridGap));
      const rows = Math.floor(height / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);
      
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity],
  );

  const updateSquares = useCallback(
    (squares: Float32Array) => {
      // Update fewer squares per frame for better performance
      const updateCount = Math.ceil(squares.length * flickerChance * 0.1);
      for (let i = 0; i < updateCount; i++) {
        const idx = Math.floor(Math.random() * squares.length);
        squares[idx] = Math.random() * maxOpacity;
      }
    },
    [flickerChance, maxOpacity],
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, width, height);

      // Batch similar opacity squares together to reduce state changes
      const opacityGroups: { [key: string]: { x: number; y: number }[] } = {};
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j;
          const opacity = squares[idx];
          if (typeof opacity !== 'undefined') {
            // Round opacity to reduce number of unique fillStyle calls
            const roundedOpacity = Math.round(opacity * 10) / 10;
            const key = `${memoizedColor}${roundedOpacity})`;
            
            if (!opacityGroups[key]) {
              opacityGroups[key] = [];
            }
            
            opacityGroups[key].push({
              x: i * (squareSize + gridGap) * dpr,
              y: j * (squareSize + gridGap) * dpr,
            });
          }
        }
      }

      // Draw squares grouped by opacity
      for (const [style, squares] of Object.entries(opacityGroups)) {
        ctx.fillStyle = style;
        for (const { x, y } of squares) {
          ctx.fillRect(x, y, squareSize * dpr, squareSize * dpr);
        }
      }
    },
    [memoizedColor, squareSize, gridGap],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth;
      const newHeight = height || container.clientHeight;
      
      // Only update if size has changed
      if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
        setCanvasSize({ width: newWidth, height: newHeight });
        gridParamsRef.current = setupCanvas(canvas, newWidth, newHeight);
      }
    };

    updateCanvasSize();

    const animate = () => {
      if (!isInView || !gridParamsRef.current) return;

      // Only update every 3rd frame for better performance
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0) {
        updateSquares(gridParamsRef.current.squares);
        drawGrid(
          ctx,
          canvas.width,
          canvas.height,
          gridParamsRef.current.cols,
          gridParamsRef.current.rows,
          gridParamsRef.current.squares,
          gridParamsRef.current.dpr,
        );
      }

      requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry!.isIntersecting);
      },
      { threshold: 0, rootMargin: '50px' },
    );

    intersectionObserver.observe(canvas);

    let animationFrameId: number;
    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView, canvasSize]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
});

FlickeringGrid.displayName = "FlickeringGrid";
