import { Card } from '@mantine/core';
import { 
  ReactFlow,
  Node, 
  Edge,
  Background,
  Controls,
  MiniMap,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface ServiceDependency {
  name: string;
  critical: boolean;
  relationship: string;
}

interface Service {
  id: string;
  serviceName: string;
  displayName?: string;
  description?: string;
  ownerTeam: string;
  lifecycle: string;
  tier?: string;
  serviceType?: string;
  partOf?: string;
  dependencies?: ServiceDependency[];
}

interface DependencyGraphProps {
  services: Service[];
}

export function DependencyGraph({ services }: DependencyGraphProps) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const serviceNodeNames = new Set<string>(services.map(s => s.serviceName));
  const processedDepNodes = new Set<string>();
  let globalDepIndex = 0;

  // 1. First pass: Add all primary services as nodes
  services.forEach((service, serviceIndex) => {
    nodes.push({
      id: service.serviceName,
      data: { label: service.displayName || service.serviceName },
      position: { x: 50, y: 150 + (serviceIndex * 180) },
      style: {
        background: 'var(--mantine-color-violet-7)',
        color: 'white',
        border: '1px solid var(--mantine-color-violet-9)',
        borderRadius: '4px',
        padding: '10px 15px',
        width: 200,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // 2. Second pass: Add dependencies and relationship nodes
  services.forEach((service) => {
    if (service.dependencies) {
      service.dependencies.forEach((dep) => {
        // Create dependency node if it's not a primary service or already processed
        if (!serviceNodeNames.has(dep.name) && !processedDepNodes.has(dep.name)) {
          nodes.push({
            id: dep.name,
            data: { label: dep.name },
            position: { 
              x: 650, // Pushed further right for space
              y: 150 + (globalDepIndex * 100) 
            },
            style: {
              background: 'var(--mantine-color-gray-7)',
              color: 'white',
              border: `1px solid var(--mantine-color-gray-8)`,
              borderRadius: '4px',
              padding: '10px 15px',
              width: 200,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });
          processedDepNodes.add(dep.name);
          globalDepIndex++;
        }

        const sourceNode = nodes.find(n => n.id === service.serviceName)!;
        const targetNode = nodes.find(n => n.id === dep.name)!;
        
        if (!targetNode) return;

        const relationshipNodeId = `${sourceNode.id}-${targetNode.id}-rel`;

        // Add the relationship "box" node in the middle
        nodes.push({
          id: relationshipNodeId,
          data: { label: dep.relationship },
          position: {
            x: (sourceNode.position.x + targetNode.position.x) / 2,
            y: (sourceNode.position.y + targetNode.position.y) / 2,
          },
          style: {
            background: dep.critical ? 'var(--mantine-color-red-8)' : 'var(--mantine-color-dark-6)',
            color: 'white',
            border: `1px solid ${dep.critical ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-dark-4)'}`,
            borderRadius: '4px',
            padding: '5px 10px',
            fontSize: '11px',
            textAlign: 'center',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        
        // Edge from source to relationship
        edges.push({
          id: `${sourceNode.id}-${relationshipNodeId}`,
          source: sourceNode.id,
          target: relationshipNodeId,
          style: { stroke: 'var(--mantine-color-gray-6)' },
        });

        // Edge from relationship to target
        edges.push({
          id: `${relationshipNodeId}-${targetNode.id}`,
          source: relationshipNodeId,
          target: targetNode.id,
          style: { stroke: 'var(--mantine-color-gray-6)' },
          animated: dep.critical,
        });
      });
    }
  });

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <div style={{ height: Math.max(800, nodes.length * 70) }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </Card>
  );
} 
