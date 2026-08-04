import React, { useState } from 'react';

interface MindMapNode {
  id: string;
  label: string;
  color?: string;
  children?: MindMapNode[];
}

interface MindMapProps {
  data: MindMapNode;
  width?: number;
  height?: number;
}

const MindMap: React.FC<MindMapProps> = ({ data, width = 700, height = 420 }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 计算节点位置 - 使用放射状布局，增大间�?  const calculatePositions = (node: MindMapNode, cx: number, cy: number, level: number = 0, angle?: number, parentPos?: { x: number; y: number }) => {
    const positions: Record<string, { x: number; y: number; level: number; node: MindMapNode; parentPos?: { x: number; y: number } }> = {};

    positions[node.id] = { x: cx, y: cy, level, node, parentPos };

    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      // 增大半径，让节点更分�?      const radius = level === 0 ? 180 : 120;
      const startAngle = level === 0 ? -Math.PI / 2 : (angle || 0) - Math.PI / 2.5;
      const angleSpan = level === 0 ? Math.PI * 1.6 : Math.PI / 1.3;

      node.children.forEach((child, index) => {
        const childAngle = startAngle + (index / Math.max(childCount - 1, 1)) * angleSpan;
        const childX = cx + Math.cos(childAngle) * radius;
        const childY = cy + Math.sin(childAngle) * radius * 0.65;

        const childPositions = calculatePositions(
          child,
          childX,
          childY,
          level + 1,
          childAngle,
          { x: cx, y: cy }
        );

        Object.assign(positions, childPositions);
      });
    }

    return positions;
  };

  const positions = calculatePositions(data, width / 2, height / 2);

  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    Object.values(positions).forEach((pos) => {
      if (pos.parentPos) {
        const isHovered = hoveredNode === pos.node.id || hoveredNode === data.id;
        const color = pos.node.color || '#a855f7';

        connections.push(
          <path
            key={`conn-${pos.node.id}`}
            d={`M ${pos.parentPos.x} ${pos.parentPos.y} Q ${(pos.parentPos.x + pos.x) / 2} ${(pos.parentPos.y + pos.y) / 2} ${pos.x} ${pos.y}`}
            fill="none"
            stroke={color + (isHovered ? '80' : '40')}
            strokeWidth={isHovered ? 2.5 : 1.5}
            style={{ transition: 'all 0.3s ease' }}
          />
        );
      }
    });

    return connections;
  };

  const renderNodes = () => {
    return Object.values(positions).map((pos) => {
      const isHovered = hoveredNode === pos.node.id;
      const isRoot = pos.level === 0;
      const color = pos.node.color || '#a855f7';
      // 增大节点尺寸
      const nodeWidth = isRoot ? 140 : 110;
      const nodeHeight = isRoot ? 48 : 38;

      return (
        <g
          key={pos.node.id}
          onMouseEnter={() => setHoveredNode(pos.node.id)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x={pos.x - nodeWidth / 2}
            y={pos.y - nodeHeight / 2}
            width={nodeWidth}
            height={nodeHeight}
            rx={isRoot ? 24 : 19}
            fill={isHovered ? color + '30' : color + '15'}
            stroke={color}
            strokeWidth={isHovered ? 2.5 : 1.5}
            style={{
              filter: isHovered ? `drop-shadow(0 0 10px ${color}50)` : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          <text
            x={pos.x}
            y={pos.y + (isRoot ? 6 : 5)}
            textAnchor="middle"
            fill={isHovered ? '#f8fafc' : '#e2e8f0'}
            fontSize={isRoot ? 15 : 13}
            fontWeight={isRoot ? 700 : 500}
            style={{ transition: 'all 0.3s ease', pointerEvents: 'none' }}
          >
            {pos.node.label}
          </text>
        </g>
      );
    });
  };

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {renderConnections()}
      {renderNodes()}
    </svg>
  );
};

export default MindMap;
