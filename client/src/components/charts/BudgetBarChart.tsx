import { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import * as d3 from 'd3';

export interface BudgetBarDatum {
  category: string;
  spent: number;
  budget: number;
}

interface BudgetBarChartProps {
  data: BudgetBarDatum[];
  height?: number;
}

const BudgetBarChart = ({ data, height = 260 }: BudgetBarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      inViewRef(node);
    },
    [inViewRef],
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !inView || data.length === 0) return;
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const width = Math.max(containerWidth, 280);
    const margin = { top: 20, right: 40, bottom: 20, left: 90 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const maxVal = d3.max(data, (d) => Math.max(d.spent, d.budget)) || 100;
    const xScale = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.category))
      .range([0, innerHeight])
      .padding(0.35);

    // Color helper: green under budget, orange near limit (>80%), red over
    const getBarColor = (d: BudgetBarDatum): string => {
      const ratio = d.spent / d.budget;
      if (ratio > 1) return '#FF6B6B';
      if (ratio > 0.8) return '#FFE66D';
      return '#4ECDC4';
    };

    // Y axis labels
    g.selectAll('.category-label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', (d) => (yScale(d.category) || 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'rgba(255,255,255,0.7)')
      .attr('font-size', '12px')
      .text((d) => d.category);

    // Background track bars
    g.selectAll('.track-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.category) || 0)
      .attr('width', innerWidth)
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', 'rgba(255,255,255,0.05)');

    // Spent bars (animated)
    const bars = g
      .selectAll('.spent-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.category) || 0)
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', (d) => getBarColor(d))
      .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))');

    if (prefersReducedMotion) {
      bars.attr('width', (d) => xScale(d.spent));
    } else {
      bars
        .attr('width', 0)
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .delay((_d, i) => i * 120)
        .attr('width', (d) => xScale(d.spent));
    }

    // Budget target lines
    g.selectAll('.budget-line')
      .data(data)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d.budget))
      .attr('x2', (d) => xScale(d.budget))
      .attr('y1', (d) => (yScale(d.category) || 0) - 4)
      .attr('y2', (d) => (yScale(d.category) || 0) + yScale.bandwidth() + 4)
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3');

    // Budget label on target line
    g.selectAll('.budget-label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d) => xScale(d.budget))
      .attr('y', (d) => (yScale(d.category) || 0) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('font-size', '9px')
      .text((d) => `$${d.budget}`);

    // Value labels on bars
    const valueLabels = g
      .selectAll('.value-label')
      .data(data)
      .enter()
      .append('text')
      .attr('y', (d) => (yScale(d.category) || 0) + yScale.bandwidth() / 2)
      .attr('dominant-baseline', 'central')
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    if (prefersReducedMotion) {
      valueLabels
        .attr('x', (d) => xScale(d.spent) + 6)
        .text((d) => `$${d.spent.toFixed(0)}`);
    } else {
      valueLabels
        .attr('x', 6)
        .text('')
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .delay((_d, i) => i * 120)
        .attr('x', (d) => xScale(d.spent) + 6)
        .tween('text', (d) => {
          const interpolator = d3.interpolateNumber(0, d.spent);
          return function (t: number) {
            d3.select(this).text(`$${interpolator(t).toFixed(0)}`);
          };
        });
    }
  }, [data, inView, height, prefersReducedMotion]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Box ref={setRefs} sx={{ width: '100%', overflow: 'hidden' }}>
      <svg ref={svgRef} style={{ width: '100%', overflow: 'visible' }} />
    </Box>
  );
};

export default BudgetBarChart;
