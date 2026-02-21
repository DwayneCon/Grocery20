/* client/src/components/gamification/CookingHeatmap.tsx */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { useTheme } from '../../contexts/ThemeContext';

interface HeatmapDay {
  date: string;
  count: number;
}

interface CookingHeatmapProps {
  data: HeatmapDay[];
  /** Optional title displayed above the heatmap */
  title?: string;
}

const CELL_SIZE = 13;
const CELL_GAP = 3;
const DAY_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 18;

const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const CookingHeatmap: React.FC<CookingHeatmapProps> = ({
  data,
  title = 'Cooking Activity',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode, reducedMotion } = useTheme();
  const [tooltipInfo, setTooltipInfo] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  // Build a map of date -> count for quick lookup
  const dataMap = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.count));
    return map;
  }, [data]);

  // Generate all days for the last 52 weeks
  const weeks = React.useMemo(() => {
    const today = new Date();
    const allDays: { date: Date; count: number }[] = [];

    // Go back ~52 weeks from today, starting from the nearest past Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    // Align to start of the week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const current = new Date(startDate);
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      allDays.push({
        date: new Date(current),
        count: dataMap.get(dateStr) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Group into weeks (arrays of 7)
    const grouped: { date: Date; count: number }[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      grouped.push(allDays.slice(i, i + 7));
    }
    return grouped;
  }, [dataMap]);

  // Color scale
  const colorScale = useCallback(
    (count: number) => {
      if (count === 0) {
        return mode === 'dark' ? '#2B2D42' : '#ebedf0';
      }
      const scale = d3
        .scaleQuantize<string>()
        .domain([1, 5])
        .range(
          mode === 'dark'
            ? ['#0e4429', '#006d32', '#26a641', '#39d353']
            : ['#9be9a8', '#40c463', '#30a14e', '#216e39']
        );
      return scale(Math.min(count, 5));
    },
    [mode]
  );

  // Extract month labels from the weeks
  const monthLabels = React.useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIdx) => {
      // Use the first day of the week to determine the month
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: firstDay.date.toLocaleString('default', { month: 'short' }),
            weekIndex: weekIdx,
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  const totalWidth = DAY_LABEL_WIDTH + weeks.length * (CELL_SIZE + CELL_GAP);
  const totalHeight = MONTH_LABEL_HEIGHT + 7 * (CELL_SIZE + CELL_GAP);

  // Total activity
  const totalMeals = React.useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  const activeDays = React.useMemo(() => {
    return data.filter((d) => d.count > 0).length;
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0.01 } : { duration: 0.5 }}
    >
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'var(--text-secondary)' }}
          >
            {totalMeals} meals cooked across {activeDays} days
          </Typography>
        </Box>

        {/* Heatmap grid */}
        <Box
          ref={containerRef}
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 1,
            position: 'relative',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'var(--border)',
              borderRadius: 2,
            },
          }}
        >
          {/* Tooltip */}
          {tooltipInfo && (
            <Box
              sx={{
                position: 'absolute',
                left: tooltipInfo.x,
                top: tooltipInfo.y - 36,
                bgcolor: mode === 'dark' ? '#1A1D2E' : '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                px: 1,
                py: 0.5,
                zIndex: 20,
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-md)',
                whiteSpace: 'nowrap',
              }}
            >
              <Typography variant="caption" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {tooltipInfo.count} meal{tooltipInfo.count !== 1 ? 's' : ''} on{' '}
                {new Date(tooltipInfo.date + 'T12:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Typography>
            </Box>
          )}

          <svg
            ref={svgRef}
            width={totalWidth}
            height={totalHeight}
            style={{ display: 'block' }}
          >
            {/* Month labels */}
            {monthLabels.map((label, i) => (
              <text
                key={`month-${i}`}
                x={DAY_LABEL_WIDTH + label.weekIndex * (CELL_SIZE + CELL_GAP)}
                y={MONTH_LABEL_HEIGHT - 4}
                fontSize={10}
                fill={mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                fontFamily="Inter, sans-serif"
              >
                {label.month}
              </text>
            ))}

            {/* Day-of-week labels */}
            {dayLabels.map((label, i) => (
              <text
                key={`day-${i}`}
                x={0}
                y={MONTH_LABEL_HEIGHT + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                fontSize={10}
                fill={mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            ))}

            {/* Day cells */}
            {weeks.map((week, weekIdx) =>
              week.map((day, dayIdx) => {
                const x = DAY_LABEL_WIDTH + weekIdx * (CELL_SIZE + CELL_GAP);
                const y = MONTH_LABEL_HEIGHT + dayIdx * (CELL_SIZE + CELL_GAP);
                const dateStr = day.date.toISOString().split('T')[0];

                return (
                  <rect
                    key={`${weekIdx}-${dayIdx}`}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    ry={2}
                    fill={colorScale(day.count)}
                    stroke={mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    strokeWidth={0.5}
                    style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGRectElement).getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      if (containerRect) {
                        setTooltipInfo({
                          x: rect.left - containerRect.left + CELL_SIZE / 2,
                          y: rect.top - containerRect.top,
                          date: dateStr,
                          count: day.count,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltipInfo(null)}
                  />
                );
              })
            )}
          </svg>
        </Box>

        {/* Legend */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 0.5,
            mt: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'var(--text-tertiary)', mr: 0.5, fontSize: '0.7rem' }}
          >
            Less
          </Typography>
          {[0, 1, 2, 3, 4].map((val) => (
            <Box
              key={val}
              sx={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                borderRadius: '2px',
                bgcolor: colorScale(val),
                border: '0.5px solid',
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}
            />
          ))}
          <Typography
            variant="caption"
            sx={{ color: 'var(--text-tertiary)', ml: 0.5, fontSize: '0.7rem' }}
          >
            More
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

export default CookingHeatmap;
