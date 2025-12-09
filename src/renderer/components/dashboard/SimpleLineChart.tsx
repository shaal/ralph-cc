import React, { useRef, useEffect, useState } from 'react';

export interface DataPoint {
  timestamp: Date;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
  color?: string;
  gradientColor?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  className = '',
  height = 256,
  color = '#3b82f6',
  gradientColor = '#3b82f6',
  showGrid = true,
  showTooltip = true,
  animate = true,
  yAxisLabel = '',
  formatValue = (v) => v.toFixed(2),
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string; timestamp: string } | null>(null);
  const [width, setWidth] = useState(800);
  const animationProgress = useRef(0);
  const animationFrame = useRef<number>();

  // Handle resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate padding
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Helper function to map data to canvas coordinates
    const getX = (index: number) => {
      return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    const getY = (value: number) => {
      return padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    };

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (i / gridLines) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        // Y-axis labels
        const value = maxValue - (i / gridLines) * valueRange;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatValue(value), padding.left - 10, y + 4);
      }

      // Vertical grid lines
      const timePoints = 5;
      for (let i = 0; i <= timePoints; i++) {
        const x = padding.left + (i / timePoints) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();

        // X-axis labels (timestamps)
        if (i < data.length) {
          const index = Math.floor((i / timePoints) * (data.length - 1));
          const timestamp = data[index]?.timestamp;
          if (timestamp) {
            const timeStr = formatTime(timestamp);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(timeStr, x, padding.top + chartHeight + 20);
          }
        }
      }
    }

    // Y-axis label
    if (yAxisLabel) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.translate(15, padding.top + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // Animate drawing
    const drawChart = (progress: number) => {
      ctx.clearRect(padding.left, padding.top, chartWidth, chartHeight);

      // Draw gradient fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, `${gradientColor}40`);
      gradient.addColorStop(1, `${gradientColor}00`);

      // Create path for fill
      ctx.beginPath();
      const endIndex = Math.floor(data.length * progress);

      data.slice(0, endIndex).forEach((point, i) => {
        const x = getX(i);
        const y = getY(point.value);

        if (i === 0) {
          ctx.moveTo(x, padding.top + chartHeight);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      if (endIndex > 0) {
        const lastX = getX(endIndex - 1);
        ctx.lineTo(lastX, padding.top + chartHeight);
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      data.slice(0, endIndex).forEach((point, i) => {
        const x = getX(i);
        const y = getY(point.value);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw data points
      data.slice(0, endIndex).forEach((point, i) => {
        const x = getX(i);
        const y = getY(point.value);

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    // Animation logic
    if (animate && animationProgress.current < 1) {
      const animateFrame = () => {
        animationProgress.current = Math.min(animationProgress.current + 0.02, 1);
        drawChart(animationProgress.current);

        if (animationProgress.current < 1) {
          animationFrame.current = requestAnimationFrame(animateFrame);
        }
      };

      animateFrame();
    } else {
      animationProgress.current = 1;
      drawChart(1);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [data, width, height, color, gradientColor, showGrid, animate, yAxisLabel, formatValue]);

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showTooltip || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;

    // Find nearest data point
    const relativeX = x - padding.left;
    const dataIndex = Math.round((relativeX / chartWidth) * (data.length - 1));

    if (dataIndex >= 0 && dataIndex < data.length) {
      const point = data[dataIndex];
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        value: formatValue(point.value),
        timestamp: formatTimestamp(point.timestamp),
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="rounded-lg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && showTooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="font-semibold text-white">{tooltip.value}</div>
          <div className="text-gray-400 text-xs">{tooltip.timestamp}</div>
        </div>
      )}
    </div>
  );
};

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
