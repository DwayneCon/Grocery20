import { useRef, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import * as d3 from 'd3';

export interface RadarAxis {
  axis: string;
  value: number;
  /** Maximum/recommended value for this axis (used for normalization) */
  max: number;
}

interface NutritionRadarProps {
  data: RadarAxis[];
  /** Target zone values (recommended ranges) -- normalized 0-1 values */
  targets?: RadarAxis[];
  size?: number;
  color?: string;
  targetColor?: string;
}

const NutritionRadar = ({
  data,
  targets,
  size = 280,
  color = '#4ECDC4',
  targetColor = 'rgba(255, 230, 109, 0.3)',
}: NutritionRadarProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      inViewRef(node);
    },
    [inViewRef],
  );

  const levels = 5; // concentric rings
  const radius = size / 2 - 40;

  useEffect(() => {
    if (!svgRef.current || !inView || data.length === 0) return;
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cx = size / 2;
    const cy = size / 2;
    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    const angleSlice = (Math.PI * 2) / data.length;

    // Normalize values: value / max, clamped to [0, 1.2] to allow slight overflow
    const normalized = data.map((d) => Math.min(d.value / d.max, 1.2));

    // --- Glass morphism background circle ---
    const defs = svg.append('defs');
    const bgGradient = defs
      .append('radialGradient')
      .attr('id', 'radar-bg-gradient');
    bgGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255,255,255,0.08)');
    bgGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255,255,255,0.02)');

    g.append('circle')
      .attr('r', radius + 10)
      .attr('fill', 'url(#radar-bg-gradient)')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1);

    // --- Concentric grid rings ---
    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      g.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 0.5);
    }

    // --- Axis lines + labels ---
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Axis line
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.1)')
        .attr('stroke-width', 0.5);

      // Label
      const labelOffset = 18;
      const lx = Math.cos(angle) * (radius + labelOffset);
      const ly = Math.sin(angle) * (radius + labelOffset);

      g.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(d.axis);
    });

    // --- Target zone polygon (recommended ranges) ---
    if (targets && targets.length === data.length) {
      const targetNormalized = targets.map((t) =>
        Math.min(t.value / t.max, 1.2),
      );

      const targetLine = d3
        .lineRadial<number>()
        .radius((d) => d * radius)
        .angle((_d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

      g.append('path')
        .datum(targetNormalized)
        .attr('d', targetLine)
        .attr('fill', targetColor)
        .attr('stroke', 'rgba(255, 230, 109, 0.5)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');
    }

    // --- Data polygon ---
    const lineRadial = d3
      .lineRadial<number>()
      .radius((d) => d * radius)
      .angle((_d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Data area fill
    const areaPath = g
      .append('path')
      .datum(normalized)
      .attr('fill', `${color}25`)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .style('filter', `drop-shadow(0 0 6px ${color}40)`);

    if (prefersReducedMotion) {
      areaPath.attr('d', lineRadial);
    } else {
      // Animate: polygon expands from center
      const zeroData = normalized.map(() => 0);
      areaPath
        .attr('d', lineRadial(zeroData))
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attrTween('d', () => {
          const interpolator = d3.interpolateArray(
            zeroData,
            normalized,
          ) as (t: number) => number[];
          return (t: number) => lineRadial(interpolator(t)) || '';
        });
    }

    // --- Data point dots ---
    const dots = g
      .selectAll('.data-dot')
      .data(normalized)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', color)
      .attr('stroke', 'rgba(0,0,0,0.3)')
      .attr('stroke-width', 1)
      .style('filter', `drop-shadow(0 0 4px ${color}80)`);

    if (prefersReducedMotion) {
      dots
        .attr('cx', (d, i) => Math.cos(angleSlice * i - Math.PI / 2) * radius * d)
        .attr('cy', (d, i) => Math.sin(angleSlice * i - Math.PI / 2) * radius * d);
    } else {
      dots
        .attr('cx', 0)
        .attr('cy', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('cx', (d, i) => Math.cos(angleSlice * i - Math.PI / 2) * radius * d)
        .attr('cy', (d, i) => Math.sin(angleSlice * i - Math.PI / 2) * radius * d);
    }

    // --- Hover labels for data points ---
    g.selectAll('.hover-area')
      .data(data)
      .enter()
      .append('circle')
      .attr(
        'cx',
        (_d, i) =>
          Math.cos(angleSlice * i - Math.PI / 2) * radius * normalized[i],
      )
      .attr(
        'cy',
        (_d, i) =>
          Math.sin(angleSlice * i - Math.PI / 2) * radius * normalized[i],
      )
      .attr('r', 14)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        const pct = Math.round((d.value / d.max) * 100);
        d3.select(this.parentNode as Element)
          .selectAll('.tooltip-text')
          .remove();

        const i = data.indexOf(d);
        const tx =
          Math.cos(angleSlice * i - Math.PI / 2) * radius * normalized[i];
        const ty =
          Math.sin(angleSlice * i - Math.PI / 2) * radius * normalized[i] - 18;

        (d3.select(this.parentNode as Element) as d3.Selection<Element, unknown, null, undefined>)
          .append('text')
          .attr('class', 'tooltip-text')
          .attr('x', tx)
          .attr('y', ty)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .text(`${d.value}${d.axis === 'Calories' ? '' : 'g'} (${pct}%)`);
      })
      .on('mouseleave', function () {
        d3.select(this.parentNode as Element)
          .selectAll('.tooltip-text')
          .remove();
      });
  }, [data, targets, inView, size, radius, color, targetColor, prefersReducedMotion]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Box
      ref={setRefs}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
      />

      {/* Legend row */}
      <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 3, bgcolor: color, borderRadius: 1 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Your Intake
          </Typography>
        </Box>
        {targets && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 3,
                bgcolor: 'rgba(255, 230, 109, 0.5)',
                borderRadius: 1,
                borderStyle: 'dashed',
              }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Recommended
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NutritionRadar;
