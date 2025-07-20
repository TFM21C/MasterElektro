import type { ElectricalComponent, Connection, ProjectType } from '@/types/circuit';

export interface ViewRenderResult {
  components: ElectricalComponent[];
  connections: Connection[];
}

export function renderView(components: ElectricalComponent[], connections: Connection[], type: ProjectType): ViewRenderResult {
  switch (type) {
    case 'Übersichtsschaltplan':
      const grouped = new Map<string, { base: Connection; total: number }>();

      connections.forEach(conn => {
        const wires = conn.numberOfWires ?? 1;
        const keyA = `${conn.startComponentId}|${conn.endComponentId}`;
        const keyB = `${conn.endComponentId}|${conn.startComponentId}`;
        const key = grouped.has(keyA) ? keyA : grouped.has(keyB) ? keyB : keyA;

        if (grouped.has(key)) {
          const g = grouped.get(key)!;
          g.total += wires;
        } else {
          grouped.set(key, { base: { ...conn }, total: wires });
        }
      });

      return {
        components: components.map(c => ({ ...c })),
        connections: Array.from(grouped.values()).map(g => ({ ...g.base, totalWires: g.total }))
      };
    case 'Stromlaufplan in zusammenhängender Darstellung':
      return { components, connections };
    case 'Stromlaufplan in aufgelöster Darstellung':
      return { components, connections };
    default:
      return { components, connections };
  }
}
