import { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import * as d3 from 'd3';

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface AnimatedDonutProps {
  data: DonutDatum[];
  size?: number;
  innerRadius?: number;
  /** Show total value in center; if false, shows percentage of hovered slice */
  showTotal?: boolean;
}

const AnimatedDonut = ({
  data,
  size = 220,
  innerRadius: innerRadiusProp,
  showTotal = true,
}: AnimatedDonutProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const [centerText, setCenterText] = useState<{ label: string; value: string }>({
    label: 'Total',
    value: '',
  });

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  // Combine refs for the wrapper element
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      inViewRef(node);
    },
    [inViewRef],
  );

  const outerRadius = size / 2 - 10;
  const innerRadius = innerRadiusProp ?? outerRadius * 0.6;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Set initial center text
  useEffect(() => {
    setCenterText({
      label: 'Total',
      value: showTotal ? `$${total.toFixed(0)}` : '100%',
    });
  }, [total, showTotal]);

  useEffect(() => {
    if (!svgRef.current || !inView || data.length === 0) return;
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);

    const pie = d3
      .pie<DonutDatum>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<DonutDatum>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<DonutDatum>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(outerRadius + 8)
      .cornerRadius(4);

    const arcs = pie(data);

    // Build each arc path
    const paths = g
      .selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'rgba(0,0,0,0.2)')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

    // Animate arcs growing from 0 to target
    if (prefersReducedMotion) {
      paths.attr('d', arc);
    } else {
      paths
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attrTween('d', (d) => {
          const interpolateStart = d3.interpolate(
            { startAngle: d.startAngle, endAngle: d.startAngle },
            d,
          );
          return (t: number) => arc(interpolateStart(t)) || '';
        });
    }

    // Hover interactions
    paths
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum) => arcHover(datum as d3.PieArcDatum<DonutDatum>) || '');

        const pct = ((d.data.value / total) * 100).toFixed(1);
        setCenterText({
          label: d.data.label,
          value: showTotal ? `$${d.data.value.toFixed(0)}` : `${pct}%`,
        });

        // Show tooltip
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.textContent = `${d.data.label}: $${d.data.value.toFixed(2)} (${pct}%)`;
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current) {
          const svgRect = svgRef.current?.getBoundingClientRect();
          if (svgRect) {
            tooltipRef.current.style.left = `${event.clientX - svgRect.left}px`;
            tooltipRef.current.style.top = `${event.clientY - svgRect.top - 40}px`;
          }
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum) => arc(datum as d3.PieArcDatum<DonutDatum>) || '');

        setCenterText({
          label: 'Total',
          value: showTotal ? `$${total.toFixed(0)}` : '100%',
        });

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      });
  }, [data, inView, size, innerRadius, outerRadius, total, showTotal, prefersReducedMotion]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Box
      ref={setRefs}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg
          ref={svgRef}
          width={size}
          height={size}
          style={{ overflow: 'visible' }}
        />
        {/* Center text overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: 'white', lineHeight: 1.2 }}
          >
            {centerText.value}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}
          >
            {centerText.label.toUpperCase()}
          </Typography>
        </Box>
        {/* Tooltip */}
        <Box
          ref={tooltipRef}
          sx={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
            transition: 'opacity 0.15s ease',
            zIndex: 10,
            backdropFilter: 'blur(8px)',
          }}
        />
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1.5,
          mt: 2,
        }}
      >
        {data.map((d) => (
          <Box
            key={d.label}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: d.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {d.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AnimatedDonut;
