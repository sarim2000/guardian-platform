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
  // Transform all services and their dependencies into nodes and edges
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const processedNodes = new Set<string>();
  let globalDepIndex = 0; // Global counter for dependency positioning

  // Add all services as nodes first
  services.forEach((service, serviceIndex) => {
    if (!processedNodes.has(service.serviceName)) {
      nodes.push({
        id: service.serviceName,
        data: { label: service.displayName || service.serviceName },
        position: { x: 100, y: 100 + (serviceIndex * 150) },
        style: {
          background: '#228be6',
          color: 'white',
          border: '1px solid #1c7ed6',
          borderRadius: '4px',
          padding: '10px',
          width: 180,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      processedNodes.add(service.serviceName);
    }

    // Add dependencies as nodes and create edges
    if (service.dependencies) {
      service.dependencies.forEach((dep) => {
        if (!processedNodes.has(dep.name)) {
          nodes.push({
            id: dep.name,
            data: { 
              label: dep.name,
              relationship: dep.relationship,
            },
            position: { 
              x: 400,
              y: 100 + (globalDepIndex * 120) // Use global index
            },
            style: {
              background: dep.critical ? '#fa5252' : '#40c057',
              color: 'white',
              border: `1px solid ${dep.critical ? '#e03131' : '#37b24d'}`,
              borderRadius: '4px',
              padding: '10px',
              width: 180,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });
          processedNodes.add(dep.name);
          globalDepIndex++; // Increment global counter
        }

        edges.push({
          id: `${service.serviceName}-${dep.name}`,
          source: service.serviceName,
          target: dep.name,
          label: dep.relationship,
          style: { stroke: dep.critical ? '#fa5252' : '#228be6' },
          labelStyle: { fill: '#868e96', fontSize: 12 },
          animated: dep.critical,
        });
      });
    }
  });

  console.log('Fixed nodes:', nodes);
  console.log('Fixed edges:', edges);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <div style={{ height: Math.max(600, nodes.length * 70) }}>
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
