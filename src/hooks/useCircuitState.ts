import { useState, useCallback } from 'react';
import type { ElectricalComponent, Connection, PaletteComponentFirebaseData, Point } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import { useToast } from "@/hooks/use-toast";

export const useCircuitState = () => {
    const [components, setComponents] = useState<ElectricalComponent[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const { toast } = useToast();

    const addComponent = useCallback((paletteItem: PaletteComponentFirebaseData) => {
        const newId = `${paletteItem.id.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
        const newComponent: ElectricalComponent = {
            id: newId,
            type: paletteItem.type,
            firebaseComponentId: paletteItem.id,
            x: 150,
            y: 150,
            label: `${paletteItem.defaultLabelPrefix}${components.filter(c => c.type === paletteItem.type).length + 1}`,
            displayPinLabels: { ...(paletteItem.initialPinLabels || {}) },
            scale: 1.0,
        };
        setComponents(prev => [...prev, newComponent]);
    }, [components]);

    const updateComponent = useCallback((id: string, updates: Partial<ElectricalComponent>) => {
        setComponents(prev => prev.map(comp => (comp.id === id ? { ...comp, ...updates } : comp)));
    }, []);
    
    const removeComponent = useCallback((id: string) => {
        setComponents(prev => prev.filter(comp => comp.id !== id));
        setConnections(prev => prev.filter(conn => conn.startComponentId !== id && conn.endComponentId !== id));
    }, []);

    const addConnection = useCallback((newConnection: Omit<Connection, 'id' | 'waypoints'>) => {
         const isStartPinUsed = connections.some(conn =>
            (conn.startComponentId === newConnection.startComponentId && conn.startPinName === newConnection.startPinName) ||
            (conn.endComponentId === newConnection.startComponentId && conn.endPinName === newConnection.startPinName)
        );
        const isEndPinUsed = connections.some(conn =>
            (conn.startComponentId === newConnection.endComponentId && conn.startPinName === newConnection.endPinName) ||
            (conn.endComponentId === newConnection.endComponentId && conn.endPinName === newConnection.endPinName)
        );

        if (isStartPinUsed || isEndPinUsed) {
            toast({ title: "Pin bereits belegt", variant: "destructive" });
            return;
        }
        setConnections(prev => [...prev, {id: `conn-${Date.now()}`, waypoints:[], ...newConnection}]);
    }, [connections, toast]);

    const updateConnection = useCallback((id: string, updates: Partial<Connection>) => {
        setConnections(prev => prev.map(conn => (conn.id === id ? { ...conn, ...updates } : conn)));
    }, []);
    
    const removeConnection = useCallback((id: string) => {
        setConnections(prev => prev.filter(conn => conn.id !== id));
    }, []);

    const addWaypoint = useCallback((connectionId: string, clickCoords: Point) => {
         setConnections(prev => prev.map(conn => {
            if (conn.id === connectionId) {
                const start = getAbsolutePinCoordinates(conn.startComponentId, conn.startPinName);
                const end = getAbsolutePinCoordinates(conn.endComponentId, conn.endPinName);
                if (!start || !end) return conn;

                const existingWaypoints = conn.waypoints || [];
                const segments = [start, ...existingWaypoints, end];
                let closestSegmentIndex = 0;
                let minDistance = Infinity;

                for (let i = 0; i < segments.length - 1; i++) {
                    const p1 = segments[i];
                    const p2 = segments[i+1];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const lenSq = dx * dx + dy * dy;
                    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((clickCoords.x - p1.x) * dx + (clickCoords.y - p1.y) * dy) / lenSq));
                    const closestPoint = { x: p1.x + t * dx, y: p1.y + t * dy };
                    const distSq = (clickCoords.x - closestPoint.x)**2 + (clickCoords.y - closestPoint.y)**2;
                    
                    if (distSq < minDistance) {
                        minDistance = distSq;
                        closestSegmentIndex = i;
                    }
                }
                const newWaypoints = [...existingWaypoints];
                newWaypoints.splice(closestSegmentIndex, 0, clickCoords);
                return { ...conn, waypoints: newWaypoints };
            }
            return conn;
        }));
    }, [components]);
    
    const removeWaypoint = useCallback((connectionId: string, waypointIndex: number) => {
        setConnections(prev => prev.map(conn => {
            if (conn.id === connectionId) {
                const newWaypoints = [...(conn.waypoints || [])];
                newWaypoints.splice(waypointIndex, 1);
                return { ...conn, waypoints: newWaypoints };
            }
            return conn;
        }));
    }, []);
    
    const getAbsolutePinCoordinates = useCallback((componentId: string, pinName: string): Point | null => {
        const component = components.find(c => c.id === componentId);
        if (!component) return null;
        const definition = COMPONENT_DEFINITIONS[component.type];
        if (!definition) return null;
        const scale = component.scale || 1;
        if (definition.pins && definition.pins[pinName]) {
            const pinDef = definition.pins[pinName];
            return {
                x: component.x + pinDef.x * scale,
                y: component.y + pinDef.y * scale
            };
        }
        return null;
    }, [components]);

    return {
        components, setComponents, addComponent, updateComponent, removeComponent,
        connections, setConnections, addConnection, updateConnection, removeConnection, addWaypoint, removeWaypoint,
        getAbsolutePinCoordinates,
    };
};
