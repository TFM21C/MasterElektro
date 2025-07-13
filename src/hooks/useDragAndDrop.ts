import { useState, useCallback } from 'react';
import type { Point } from '@/types/circuit';

export const useDragAndDrop = (
    isSimulating: boolean,
    setComponents: React.Dispatch<React.SetStateAction<any[]>>,
    setConnections: React.Dispatch<React.SetStateAction<any[]>>
) => {
    const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
    const [draggingWaypoint, setDraggingWaypoint] = useState<{connectionId: string, waypointIndex: number} | null>(null);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
    
    const handleMouseDownComponent = useCallback((e: React.MouseEvent<SVGGElement>, id: string) => {
        if (isSimulating) return;
        const component = document.getElementById(id); // Simple example, better to get from state
        if (component) {
            setDraggingComponentId(id);
            // Offset logic can be refined here
        }
    }, [isSimulating]);

    const handleWaypointMouseDown = useCallback((connectionId: string, waypointIndex: number) => {
        if (isSimulating) return;
        setDraggingWaypoint({ connectionId, waypointIndex });
    }, [isSimulating]);
    
    const handleMouseMove = useCallback((e: MouseEvent, svgRef: React.RefObject<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return;
        const pointInSvg = svgRef.current.createSVGPoint();
        pointInSvg.x = e.clientX;
        pointInSvg.y = e.clientY;
        const { x, y } = pointInSvg.matrixTransform(CTM.inverse());

        if (draggingComponentId) {
            setComponents(prev => prev.map(comp => comp.id === draggingComponentId ? { ...comp, x: x - offset.x, y: y - offset.y } : comp));
        } else if (draggingWaypoint) {
            setConnections(prev => prev.map(conn => {
                if (conn.id === draggingWaypoint.connectionId) {
                    const newWaypoints = [...(conn.waypoints || [])];
                    newWaypoints[draggingWaypoint.waypointIndex] = { x, y };
                    return { ...conn, waypoints: newWaypoints };
                }
                return conn;
            }));
        }
    }, [draggingComponentId, draggingWaypoint, offset, setComponents, setConnections]);

    const handleMouseUpGlobal = useCallback(() => {
        setDraggingComponentId(null);
        setDraggingWaypoint(null);
    }, []);

    return {
        handleMouseDownComponent,
        handleWaypointMouseDown,
        handleMouseMove,
        handleMouseUpGlobal,
    };
};
