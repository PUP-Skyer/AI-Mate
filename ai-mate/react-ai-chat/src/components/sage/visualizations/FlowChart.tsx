import React, { useState } from 'react';

interface FlowNode {
  id: string;
  label: string;
  color?: string;
  icon?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowChartProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  layout?: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
}

const FlowChart: React.FC<FlowChartProps> = ({ nodes, edges, layout = 'horizontal', width = 700, height = 160 }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 增大节点尺寸和间�?  const nodeWidth = 110;
  const nodeHeight = 50;
  const gap = 30;

  const nodePositions = layout === 'horizontal'
    ? nodes.map((node, index) => ({
        ...node,
        x: 60 + index * (nodeWidth + gap),
        y: height / 2,
      }))
    : nodes.map((node, index) => ({
        ...node,
        x: width / 2,
        y: 50 + index * (nodeHeight + gap),
      }));

  const getNodePos = (id: string) => nodePositions.find(n => n.id === id);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" opacity="0.6" />
        </marker>
      </defs>

      {/* 连接�?*/}
      {edges.map((edge, index) => {
        const from = getNodePos(edge.from);
        const to = getNodePos(edge.to);
        if (!from || !to) return null;

        const isHorizontal = layout === 'horizontal';
        const startX = isHorizontal ? from.x + nodeWidth / 2 : from.x;
        const startY = isHorizontal ? from.y : from.y + nodeHeight / 2;
        const endX = isHorizontal ? to.x - nodeWidth / 2 : to.x;
        const endY = isHorizontal ? to.y : to.y - nodeHeight / 2;

        return (
          <g key={index}>
            <path
              d={`M ${startX} ${startY} L ${endX} ${endY}`}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="5,3"
              opacity="0.5"
              markerEnd="url(#arrowhead)"
            />
            {edge.label && (
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight={500}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* 节点 */}
      {nodePositions.map((node) => {
        const isHovered = hoveredNode === node.id;
        const color = node.color || '#a855f7';

        return (
          <g
            key={node.id}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={node.x - nodeWidth / 2}
              y={node.y - nodeHeight / 2}
              width={nodeWidth}
              height={nodeHeight}
              rx={14}
              fill={isHovered ? color + '25' : color + '12'}
              stroke={color}
              strokeWidth={isHovered ? 2.5 : 1.5}
              style={{
                filter: isHovered ? `drop-shadow(0 0 10px ${color}40)` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
            {node.icon && (
              <text
                x={node.x - nodeWidth / 2 + 20}
                y={node.y + 5}
                textAnchor="middle"
                fill={isHovered ? '#f8fafc' : '#e2e8f0'}
                fontSize={14}
                style={{ pointerEvents: 'none' }}
              >
                {node.icon}
              </text>
            )}
            <text
              x={node.x + (node.icon ? 8 : 0)}
              y={node.y + 5}
              textAnchor="middle"
              fill={isHovered ? '#f8fafc' : '#e2e8f0'}
              fontSize={13}
              fontWeight={600}
              style={{ pointerEvents: 'none' }}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default FlowChart;
