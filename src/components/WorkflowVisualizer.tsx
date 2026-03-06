import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WorkflowNode, WorkflowEdge } from '../types';

interface Props {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const WorkflowVisualizer: React.FC<Props> = ({ nodes, edges }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4');

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 28)
      .attr('fill', (d) => {
        if (d.status === 'active') return '#00FF94';
        if (d.status === 'done') return '#00E0FF';
        if (d.status === 'error') return '#EF4444';
        return '#1E293B';
      })
      .attr('fill-opacity', 0.1)
      .attr('stroke', (d) => {
        if (d.status === 'active') return '#00FF94';
        if (d.status === 'done') return '#00E0FF';
        return '#334155';
      })
      .attr('stroke-width', 2)
      .attr('class', (d) => d.status === 'active' ? 'animate-pulse' : '');

    node.append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono')
      .attr('letter-spacing', '1px')
      .text((d) => d.label.toUpperCase());

    node.append('foreignObject')
      .attr('x', -12)
      .attr('y', -12)
      .attr('width', 24)
      .attr('height', 24)
      .html((d) => {
        const icons: Record<string, string> = {
          planner: '🧠',
          executor: '⚡',
          knowledge: '🗄️',
          voice: '🎙️'
        };
        return `<div style="display: flex; justify-content: center; align-items: center; height: 100%; font-size: 16px; filter: drop-shadow(0 0 8px rgba(0,255,148,0.3));">${icons[d.type]}</div>`;
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [nodes, edges]);

  return (
    <div className="w-full h-full min-h-[300px] glass rounded-2xl overflow-hidden relative">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
        <span className="text-[10px] font-display uppercase tracking-widest text-slate-400">Live Workflow Engine</span>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
