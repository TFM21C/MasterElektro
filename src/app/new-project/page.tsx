"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info, ChevronLeft, Play, Gauge, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

import type { ElectricalComponent, Connection, Point, PaletteComponentFirebaseData, ProjectType, SimulatedComponentState, SimulatedConnectionState } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import { MOCK_PALETTE_COMPONENTS, getPaletteComponentById } from '@/config/mock-palette-data';

import DraggableComponent from '@/components/circuit/DraggableComponent';
import ComponentEditDialog from '@/components/modals/ComponentEditDialog';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import PropertiesSidebar from '@/components/sidebars/PropertiesSidebar';
import ComponentPalette from '@/components/sidebars/ComponentPalette';
import CircuitCanvas from '@/components/canvas/CircuitCanvas';
import AiSuggestionDialog from '@/components/modals/AiSuggestionDialog';
import { exportSvg } from '@/lib/svg-export';


const DesignerPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const projectName = searchParams.get('projectName') || "Unbenanntes Projekt";
  const projectType = searchParams.get('projectType') as ProjectType | null || "Steuerstromkreis";

  const [components, setComponents] = useState<ElectricalComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<{connectionId: string, waypointIndex: number} | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [connectingPin, setConnectingPin] = useState<{ componentId: string; pinName: string, coords: Point } | null>(null);
  const [currentMouseSvgCoords, setCurrentMouseSvgCoords] = useState<Point | null>(null);
  const [snapLines, setSnapLines] = useState<{x: number | null; y: number | null}>({x: null, y: null});
  const svgRef = useRef<SVGSVGElement>(null);

  // States for group selection
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{x:number; y:number; width:number; height:number} | null>(null);
  const dragStartPositionsRef = useRef<{[id:string]: Point}>({});
  const draggingIdsRef = useRef<string[]>([]);

  // Constant for rail types
  const RAIL_TYPES = ['24V', '0V', 'L1', 'L2', 'L3', 'N', 'PE'];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<ElectricalComponent | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'component' | 'connection' | 'waypoint'; id: string, waypointIndex?: number } | null>(null);

  const [selectedComponentForSidebar, setSelectedComponentForSidebar] = useState<ElectricalComponent | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isPropertiesSidebarOpen, setIsPropertiesSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);

  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [viewBoxSize, setViewBoxSize] = useState({ width: 800, height: 700 });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedComponentStates, setSimulatedComponentStates] = useState<{ [key: string]: SimulatedComponentState }>({});
  const [simulatedConnectionStates, setSimulatedConnectionStates] = useState<{ [key: string]: SimulatedConnectionState }>({});
  const [connectionVoltages, setConnectionVoltages] = useState<{ [key: string]: '24V' | '0V' | 'L' | 'N' | 'PE' }>({});
  const activeTimerTimeouts = useRef<{compId: string, timerId: NodeJS.Timeout}[]>([]);
  const [pressedComponentId, setPressedComponentId] = useState<string | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurements, setMeasurements] = useState<{id: number, x: number, y: number, value: string}[]>([]);

  const filteredPaletteComponents = React.useMemo(() => {
    return MOCK_PALETTE_COMPONENTS.filter(comp => {
      if (projectType === "Installationsschaltplan") {
        return (
          comp.category === "Installationselemente" ||
          comp.category === "Energieversorgung" ||
          comp.category === "Sensoren"
        );
      }
      if (projectType === "Hauptstromkreis") {
        return (
          comp.category === "Hauptstromkreis" ||
          comp.category === "Energieversorgung" ||
          comp.category === "Installationselemente" ||
          comp.category?.includes("Steuerstrom")
        );
      }
      // Default for Steuerstromkreis etc.
      return (
        comp.category?.includes("Steuerstrom") ||
        comp.category === "Energieversorgung" ||
        comp.category === "Befehlsgeräte" ||
        comp.category === "Speichernde / Verarbeitende" ||
        comp.category === "Stellglieder"
      );
    });
  }, [projectType]);


  const runSimulationStep = useCallback(() => {
    setSimulatedComponentStates(currentSimStates => {
      let newSimCompStates = JSON.parse(JSON.stringify(currentSimStates));

      // 1. Stromausbreitung simulieren, um aktuelle Spulen-Zustände zu ermitteln
      const energizedFrom24V = new Set<string>();
      const energizedFrom0V = new Set<string>();
      const energizedFromPhase = new Set<string>();
      const energizedFromNeutral = new Set<string>();
      const energizedFromPE = new Set<string>();

      components.forEach(comp => {
        const addConnections = (set: Set<string>) => {
          connections.forEach(conn => {
            if (conn.startComponentId === comp.id) set.add(`${comp.id}/${conn.startPinName}`);
            if (conn.endComponentId === comp.id) set.add(`${comp.id}/${conn.endPinName}`);
          });
        };

        if (comp.type === '24V') addConnections(energizedFrom24V);
        if (comp.type === '0V') addConnections(energizedFrom0V);
        if (comp.type === 'L1' || comp.type === 'L2' || comp.type === 'L3') addConnections(energizedFromPhase);
        if (comp.type === 'N') addConnections(energizedFromNeutral);
        if (comp.type === 'PE') addConnections(energizedFromPE);
      });

      const propagate = (energizedSet: Set<string>) => {
        for (let i = 0; i < (components.length + connections.length) * 2; i++) {
          let changed = false;

          // Externe Ausbreitung über Verbindungen
          connections.forEach(conn => {
            const startKey = `${conn.startComponentId}/${conn.startPinName}`;
            const endKey = `${conn.endComponentId}/${conn.endPinName}`;

            if (energizedSet.has(startKey) && !energizedSet.has(endKey)) {
              energizedSet.add(endKey);
              changed = true;
            }
            if (energizedSet.has(endKey) && !energizedSet.has(startKey)) {
              energizedSet.add(startKey);
              changed = true;
            }
          });

          // Interne Ausbreitung innerhalb von Bauteilen
          components.forEach(comp => {
            const compState = newSimCompStates[comp.id];
            const compDef = COMPONENT_DEFINITIONS[comp.type];
            if (!compState || !compDef) return;

            const pins = Object.keys(compDef.pins || {});
            for (let a = 0; a < pins.length; a++) {
              for (let b = a + 1; b < pins.length; b++) {
                const pinA = pins[a];
                const pinB = pins[b];

                const aConducts = compState.currentContactState?.[pinA] !== 'open';
                const bConducts = compState.currentContactState?.[pinB] !== 'open';

                if (aConducts && bConducts) {
                  const keyA = `${comp.id}/${pinA}`;
                  const keyB = `${comp.id}/${pinB}`;

                  if (energizedSet.has(keyA) && !energizedSet.has(keyB)) {
                    energizedSet.add(keyB);
                    changed = true;
                  }
                  if (energizedSet.has(keyB) && !energizedSet.has(keyA)) {
                    energizedSet.add(keyA);
                    changed = true;
                  }
                }
              }
            }
          });

          if (!changed) break;
        }
      };

      propagate(energizedFrom24V);
      propagate(energizedFrom0V);
      propagate(energizedFromPhase);
      propagate(energizedFromNeutral);
      propagate(energizedFromPE);

      // 2. Spulen-Zustände bestimmen
      components.forEach(comp => {
        const simConfig = getPaletteComponentById(comp.firebaseComponentId)?.simulation;
        if (simConfig?.energizePins && simConfig.energizePins.length === 2) {
          const pin1 = `${comp.id}/${simConfig.energizePins[0]}`;
          const pin2 = `${comp.id}/${simConfig.energizePins[1]}`;

          const hotSets = [energizedFrom24V, energizedFromPhase];
          const returnSets = [energizedFrom0V, energizedFromNeutral, energizedFromPE];
          const pin1Hot = hotSets.some(set => set.has(pin1));
          const pin2Hot = hotSets.some(set => set.has(pin2));
          const pin1Return = returnSets.some(set => set.has(pin1));
          const pin2Return = returnSets.some(set => set.has(pin2));

          const isEnergized = (pin1Hot && pin2Return) || (pin2Hot && pin1Return);

          newSimCompStates[comp.id].isEnergized = isEnergized;
        }
      });

      // 3. Kontakte anhand aktivierter Spulen aktualisieren
      const energizedLabels = new Set<string>();
      components.forEach(comp => {
        const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
        if (paletteComp?.simulation?.affectingLabel && newSimCompStates[comp.id]?.isEnergized) {
          energizedLabels.add(comp.label);
        }
      });

      components.forEach(comp => {
        const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
        if (paletteComp?.simulation?.controlledBy === 'label_match') {
          const isEnergized = energizedLabels.has(comp.label);
          const targetState = isEnergized
            ? paletteComp.simulation.outputPinStateOnEnergized
            : (paletteComp.simulation.outputPinStateOnDeEnergized || paletteComp.simulation.initialContactState);

          if (JSON.stringify(newSimCompStates[comp.id].currentContactState) !== JSON.stringify(targetState)) {
            newSimCompStates[comp.id].currentContactState = { ...targetState };
          }
        }
      });

      const newConnStates = connections.reduce((acc, conn) => {
        const startKey = `${conn.startComponentId}/${conn.startPinName}`;
        const endKey = `${conn.endComponentId}/${conn.endPinName}`;

        const startCompState = newSimCompStates[conn.startComponentId];
        const endCompState = newSimCompStates[conn.endComponentId];

        const startConducts = startCompState?.currentContactState?.[conn.startPinName] !== 'open';
        const endConducts = endCompState?.currentContactState?.[conn.endPinName] !== 'open';

        const isConducting = (
          (energizedFrom24V.has(startKey) && energizedFrom24V.has(endKey)) ||
          (energizedFrom0V.has(startKey) && energizedFrom0V.has(endKey)) ||
          (energizedFromPhase.has(startKey) && energizedFromPhase.has(endKey)) ||
          (energizedFromNeutral.has(startKey) && energizedFromNeutral.has(endKey)) ||
          (energizedFromPE.has(startKey) && energizedFromPE.has(endKey))
        ) && startConducts && endConducts;

        acc[conn.id] = { isConducting };
        return acc;
      }, {} as { [key: string]: SimulatedConnectionState });

      const newVoltages = connections.reduce((acc, conn) => {
        const startKey = `${conn.startComponentId}/${conn.startPinName}`;
        const endKey = `${conn.endComponentId}/${conn.endPinName}`;
        let voltage: '24V' | '0V' | 'L' | 'N' | 'PE' = '0V';
        if (energizedFrom24V.has(startKey) || energizedFrom24V.has(endKey)) {
          voltage = '24V';
        } else if (energizedFromPhase.has(startKey) || energizedFromPhase.has(endKey)) {
          voltage = 'L';
        } else if (energizedFromNeutral.has(startKey) || energizedFromNeutral.has(endKey)) {
          voltage = 'N';
        } else if (energizedFromPE.has(startKey) || energizedFromPE.has(endKey)) {
          voltage = 'PE';
        }
        acc[conn.id] = voltage;
        return acc;
      }, {} as { [key: string]: '24V' | '0V' | 'L' | 'N' | 'PE' });

      setSimulatedConnectionStates(newConnStates);
      setConnectionVoltages(newVoltages);

      if (JSON.stringify(newSimCompStates) !== JSON.stringify(currentSimStates)) {
        return newSimCompStates;
      }
      return currentSimStates;
    });
  }, [components, connections]);

  // Trigger simulation whenever component states change while simulation is active
  useEffect(() => {
    if (isSimulating) {
      runSimulationStep();
    }
  }, [isSimulating, simulatedComponentStates, runSimulationStep]);

  const toggleComponentState = useCallback((id: string) => {
    setSimulatedComponentStates(prev => {
      const component = components.find(c => c.id === id);
      const simConfig = getPaletteComponentById(component?.firebaseComponentId)?.simulation;
      if (!component || !simConfig) return prev;

      const currentSimState = prev[id];
      const activeState = simConfig.outputPinStateOnEnergized || {};
      const inactiveState = simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState || {};

      const isActive = JSON.stringify(currentSimState.currentContactState) === JSON.stringify(activeState);

      const nextContactState = isActive ? inactiveState : activeState;

      const allPins = {
        ...(simConfig.initialContactState || {}),
        ...activeState,
        ...inactiveState,
      };

      return {
        ...prev,
        [id]: {
          ...currentSimState,
          currentContactState: { ...allPins, ...nextContactState },
        },
      };
    });
  }, [components]);

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
        y: component.y + pinDef.y * scale,
      };
    }

    if (RAIL_TYPES.includes(component.type) && pinName.startsWith('rail@')) {
      const relX = parseFloat(pinName.split('@')[1]);
      const x = component.x + relX * scale;
      const y = component.y + (definition.height / 2) * scale;
      return { x, y };
    }

    return null;
  }, [components]);


  const handleComponentMouseUpInSim = useCallback(() => {
    if (pressedComponentId) {
      toggleComponentState(pressedComponentId);
      setPressedComponentId(null);
    }
  }, [pressedComponentId, toggleComponentState]);


const handleMouseDownComponent = (e: React.MouseEvent<SVGGElement>, id: string) => {
    if (isSimulating) {
      handleComponentMouseDownInSim(id);
      return;
    }
    const component = components.find(c => c.id === id);
    if (component && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
        setOffset({ x: pointInSvg.x - component.x, y: pointInSvg.y - component.y });
        setDraggingComponentId(id);
        dragStartPositionsRef.current = {};
        const ids = selectedComponentIds.includes(id) ? selectedComponentIds : [id];
        draggingIdsRef.current = ids;
        components.forEach(c => {
          if (ids.includes(c.id)) {
            dragStartPositionsRef.current[c.id] = { x: c.x, y: c.y };
          }
        });
        if (!selectedComponentIds.includes(id)) {
          setSelectedComponentIds([id]);
        }
      }
    }
  };
  
  const handleWaypointMouseDown = useCallback((connectionId: string, waypointIndex: number) => {
      if (isSimulating) return;
      setDraggingWaypoint({connectionId, waypointIndex});
  }, [isSimulating]);

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isSimulating) return;
    if (e.target !== svgRef.current) return;
    if (!svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
    setIsSelecting(true);
    setSelectionStart(pointInSvg);
    setSelectionRect({ x: pointInSvg.x, y: pointInSvg.y, width: 0, height: 0 });
    setSelectedComponentIds([]);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const pointInSvg = svgRef.current.createSVGPoint();
    pointInSvg.x = e.clientX;
    pointInSvg.y = e.clientY;
    const { x, y } = pointInSvg.matrixTransform(CTM.inverse());

    setCurrentMouseSvgCoords({ x, y });

    if (isSelecting && selectionStart) {
      const rect = {
        x: Math.min(selectionStart.x, x),
        y: Math.min(selectionStart.y, y),
        width: Math.abs(x - selectionStart.x),
        height: Math.abs(y - selectionStart.y)
      };
      setSelectionRect(rect);
    } else if (draggingComponentId && !isSimulating) {
      const dragged = components.find(c => c.id === draggingComponentId);
      if (!dragged) return;
      let newX = x - offset.x;
      let newY = y - offset.y;
      let snapX: number | null = null;
      let snapY: number | null = null;

      const dragDef = COMPONENT_DEFINITIONS[dragged.type];
      const dragScale = dragged.scale || 1;
      const dragWidth = (dragged.width ?? dragDef.width) * dragScale;
      const dragHeight = (dragged.height ?? dragDef.height) * dragScale;

      const dragCenterX = newX + dragWidth / 2;
      const dragCenterY = newY + dragHeight / 2;

      const TOLERANCE = 5;

      components.forEach(comp => {
        if (draggingIdsRef.current.includes(comp.id)) return;
        const def = COMPONENT_DEFINITIONS[comp.type];
        const scale = comp.scale || 1;
        const width = (comp.width ?? def.width) * scale;
        const height = (comp.height ?? def.height) * scale;
        const compCenterX = comp.x + width / 2;
        const compCenterY = comp.y + height / 2;

        if (Math.abs(newX - comp.x) <= TOLERANCE) {
          newX = comp.x;
          snapX = comp.x;
        } else if (Math.abs(dragCenterX - compCenterX) <= TOLERANCE) {
          newX = compCenterX - dragWidth / 2;
          snapX = compCenterX;
        }

        if (Math.abs(newY - comp.y) <= TOLERANCE) {
          newY = comp.y;
          snapY = comp.y;
        } else if (Math.abs(dragCenterY - compCenterY) <= TOLERANCE) {
          newY = compCenterY - dragHeight / 2;
          snapY = compCenterY;
        }
      });

      setSnapLines({ x: snapX, y: snapY });

      const deltaX = newX - dragStartPositionsRef.current[draggingComponentId].x;
      const deltaY = newY - dragStartPositionsRef.current[draggingComponentId].y;

      setComponents(prevComponents =>
        prevComponents.map(comp => {
          if (draggingIdsRef.current.includes(comp.id)) {
            const start = dragStartPositionsRef.current[comp.id];
            return { ...comp, x: start.x + deltaX, y: start.y + deltaY };
          }
          return comp;
        })
      );
    } else if (draggingWaypoint) {
      setConnections(prev =>
        prev.map(conn => {
          if (conn.id === draggingWaypoint.connectionId) {
            const newWaypoints = [...(conn.waypoints || [])];
            newWaypoints[draggingWaypoint.waypointIndex] = { x, y };
            return { ...conn, waypoints: newWaypoints };
          }
          return conn;
        })
      );
      setSnapLines({ x: null, y: null });
    } else {
      setSnapLines({ x: null, y: null });
    }
  }, [draggingComponentId, offset, isSimulating, draggingWaypoint, components, isSelecting, selectionStart]);

  const handleMouseUpGlobal = useCallback(() => {
    if (isSimulating) {
      handleComponentMouseUpInSim();
    }
    if (isSelecting && selectionRect) {
      const ids: string[] = [];
      components.forEach(comp => {
        const def = COMPONENT_DEFINITIONS[comp.type];
        const scale = comp.scale || 1;
        const width = (comp.width ?? def.width) * scale;
        const height = (comp.height ?? def.height) * scale;
        if (
          comp.x + width >= selectionRect.x &&
          comp.x <= selectionRect.x + selectionRect.width &&
          comp.y + height >= selectionRect.y &&
          comp.y <= selectionRect.y + selectionRect.height
        ) {
          ids.push(comp.id);
        }
      });
      setSelectedComponentIds(ids);
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionRect(null);
    setDraggingComponentId(null);
    setDraggingWaypoint(null);
    setSnapLines({ x: null, y: null });
  }, [isSimulating, handleComponentMouseUpInSim, isSelecting, selectionRect, components]);


  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [handleMouseMove, handleMouseUpGlobal]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setViewBoxSize({ width: Math.max(width, 300), height: Math.max(height - 50, 300) });
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      if (canvasContainerRef.current) {
        resizeObserver.unobserve(canvasContainerRef.current);
      }
    };
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => {
      const newSimulatingState = !prev;
      if (newSimulatingState) {
        const initialSimCompStates: { [key: string]: SimulatedComponentState } = {};
        components.forEach(comp => {
          const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
          const simConfig = paletteComp?.simulation;
          initialSimCompStates[comp.id] = {
            isEnergized: false,
            currentContactState: { ...(simConfig?.initialContactState || {}) },
            timerActive: false,
            timerRemaining: null,
            isLocked: simConfig?.controlLogic === 'fixed_open' || simConfig?.controlLogic === 'fixed_closed',
          };
        });
        setSimulatedComponentStates(initialSimCompStates);

        const initialSimConnStates: { [key: string]: SimulatedConnectionState } = {};
        connections.forEach(conn => {
          initialSimConnStates[conn.id] = { isConducting: false };
        });
        setSimulatedConnectionStates(initialSimConnStates);
      } else {
        activeTimerTimeouts.current.forEach(t => clearTimeout(t.timerId));
        activeTimerTimeouts.current = [];
        setPressedComponentId(null);
        setIsMeasuring(false);
        setMeasurements([]);
      }
      return newSimulatingState;
    });
  }, [components, connections]);

  const zoomIn = useCallback(() => {
    setViewBoxSize(prev => ({ width: prev.width * 1.2, height: prev.height * 1.2 }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewBoxSize(prev => ({ width: prev.width / 1.2, height: prev.height / 1.2 }));
  }, []);


  const handlePinClick = useCallback((componentId: string, pinName: string, pinCoords: Point) => {
    if (isSimulating) return;

    const targetComponent = components.find(c => c.id === componentId);
    if (!targetComponent) return;
    const targetDefinition = COMPONENT_DEFINITIONS[targetComponent.type];
    const isRail = RAIL_TYPES.includes(targetComponent.type) && pinName.startsWith('rail@');
    if (!targetDefinition || (!isRail && !(targetDefinition.pins && targetDefinition.pins[pinName]))) return;

    if (connectingPin) {
      if (connectingPin.componentId === componentId && connectingPin.pinName === pinName) {
        setConnectingPin(null);
        return;
      }

      const isStartPinUsed = connections.some(conn =>
        (conn.startComponentId === connectingPin.componentId && conn.startPinName === connectingPin.pinName) ||
        (conn.endComponentId === connectingPin.componentId && conn.endPinName === connectingPin.pinName)
      );
      const isEndPinUsed = !isRail && connections.some(conn =>
        (conn.startComponentId === componentId && conn.startPinName === pinName) ||
        (conn.endComponentId === componentId && conn.endPinName === pinName)
      );

      if (isStartPinUsed) {
        toast({ title: "Pin bereits belegt", description: `Der Pin ${connectingPin.componentId}/${connectingPin.pinName} wird bereits verwendet.`, variant: "destructive" });
        setConnectingPin(null);
        return;
      }
      if (isEndPinUsed) {
        toast({ title: "Pin bereits belegt", description: `Der Pin ${componentId}/${pinName} wird bereits verwendet.`, variant: "destructive" });
        setConnectingPin(null);
        return;
      }

      setConnections(prev => [
        ...prev,
        {
          id: `conn-${Date.now()}`,
          startComponentId: connectingPin.componentId,
          startPinName: connectingPin.pinName,
          endComponentId: componentId,
          endPinName: pinName,
          color: projectType === "Installationsschaltplan" ? "black" : undefined,
          numberOfWires: projectType === "Installationsschaltplan" ? 1 : undefined,
          waypoints: [],
        },
      ]);
      toast({ title: "Verbindung erstellt", description: `Zwischen ${connectingPin.componentId}/${connectingPin.pinName} und ${componentId}/${pinName}.` });
      setConnectingPin(null);
    } else {
      const isPinAlreadyConnected = !isRail && connections.some(conn =>
        (conn.startComponentId === componentId && conn.startPinName === pinName) ||
        (conn.endComponentId === componentId && conn.endPinName === pinName)
      );
      if (isPinAlreadyConnected) {
        toast({ title: "Pin bereits belegt", description: `Der Pin ${componentId}/${pinName} wird bereits verwendet.`, variant: "destructive" });
        return;
      }
      setConnectingPin({ componentId, pinName, coords: pinCoords });
    }
  }, [isSimulating, components, connections, connectingPin, projectType, toast]);

  const handleComponentClick = useCallback((id: string, isDoubleClick = false, clickCoords?: Point) => {
    if (isSimulating) {
      toggleComponentState(id);
      return;
    }

    const component = components.find(c => c.id === id);
    if (!component) return;

    if (connectingPin && RAIL_TYPES.includes(component.type) && clickCoords) {
      const definition = COMPONENT_DEFINITIONS[component.type];
      const scale = component.scale || 1;
      const railY = component.y + (definition.height / 2) * scale;
      let relX = (clickCoords.x - component.x) / scale;
      relX = Math.max(0, Math.min(definition.width, relX));
      const snappedX = component.x + relX * scale;
      handlePinClick(id, `rail@${relX}`, { x: snappedX, y: railY });
      return;
    }

    if (isDoubleClick) {
      setComponentToEdit(component);
      setIsEditModalOpen(true);
      setSelectedComponentForSidebar(null);
      setSelectedConnectionId(null);
      setIsPropertiesSidebarOpen(false);
    } else {
      setSelectedComponentForSidebar(component);
      setSelectedConnectionId(null);
      setIsPropertiesSidebarOpen(true);
    }
  }, [isSimulating, components, toggleComponentState, connectingPin, handlePinClick]);


  const handleConnectionClick = useCallback((connectionId: string, clickCoords: Point) => {
    if (isSimulating) {
      if (isMeasuring) {
        const voltage = connectionVoltages[connectionId] || '0V';
        const id = Date.now();
        setMeasurements(prev => [...prev, { id, x: clickCoords.x, y: clickCoords.y, value: voltage }]);
        setTimeout(() => {
          setMeasurements(prev => prev.filter(m => m.id !== id));
        }, 2500);
      }
      return;
    }

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

    setSelectedConnectionId(connectionId);
    setSelectedComponentForSidebar(null);
    setIsPropertiesSidebarOpen(true);
  }, [isSimulating, isMeasuring, getAbsolutePinCoordinates, connectionVoltages]);

  const handleComponentMouseDownInSim = (id: string) => {
    setPressedComponentId(id);
    toggleComponentState(id);
  };

  const handleSaveComponentChanges = useCallback((id: string, newLabel: string, newPinLabels: Record<string, string>) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, label: newLabel, displayPinLabels: newPinLabels } : comp
      )
    );
    if (selectedComponentForSidebar?.id === id) {
      setSelectedComponentForSidebar(prev => prev ? { ...prev, label: newLabel, displayPinLabels: newPinLabels } : null);
    }
    toast({ title: "Komponente gespeichert", description: `Änderungen an ${newLabel} wurden übernommen.` });
  }, [selectedComponentForSidebar, toast]);

  const handleUpdateComponentFromSidebar = useCallback((id: string, updates: Partial<ElectricalComponent>) => {
    setComponents(prev =>
      prev.map(comp => (comp.id === id ? { ...comp, ...updates } : comp))
    );
    setSelectedComponentForSidebar(prev => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  }, []);

  const handleUpdateConnectionEndpoint = useCallback((connectionId: string, newEndComponentId: string, newEndPinName: string) => {
    setConnections(prevConnections =>
      prevConnections.map(conn =>
        conn.id === connectionId
          ? { ...conn, endComponentId: newEndComponentId, endPinName: newEndPinName }
          : conn
      )
    );
    toast({ title: "Verbindung geändert", description: `Endpunkt der Verbindung ${connectionId} aktualisiert.` });
  }, [toast]);

  const handleUpdateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setConnections(prevConnections =>
      prevConnections.map(conn =>
        conn.id === connectionId
          ? { ...conn, ...updates }
          : conn
      )
    );
    toast({ title: "Verbindung aktualisiert", description: `Eigenschaften der Verbindung ${connectionId} geändert.` });
  }, [toast]);


  const addComponent = useCallback((paletteItem: PaletteComponentFirebaseData) => {
    if (isSimulating) {
        toast({ title: "Aktion nicht erlaubt", description: "Bauteile können nicht während der Simulation hinzugefügt werden.", variant: "destructive" });
        return;
    }
    const newId = `${paletteItem.id.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
    const definition = COMPONENT_DEFINITIONS[paletteItem.type];

    const existingOfType = components.filter(c => c.firebaseComponentId === paletteItem.id).length;
    let newLabel = `${paletteItem.defaultLabelPrefix}${existingOfType + 1}`;
    if (paletteItem.defaultLabelPrefix === '+24V' || paletteItem.defaultLabelPrefix === '0V') {
      newLabel = paletteItem.defaultLabelPrefix;
      if (components.some(c => c.label === newLabel)) {
        newLabel = `${paletteItem.defaultLabelPrefix}${existingOfType + 1}`;
      }
    }


    let initX = 100 + Math.random() * 50;
    let initY = 100 + Math.random() * 50;

    if (projectType === "Steuerstromkreis") {
      if (paletteItem.type === "24V" && !components.some(c => c.type === "24V")) {
        initX = 50;
        initY = 50;
      }
      if (paletteItem.type === "0V" && !components.some(c => c.type === "0V")) {
        initX = 50;
        initY = 400;
      }
    }

    const newComponent: ElectricalComponent = {
      id: newId,
      type: paletteItem.type,
      firebaseComponentId: paletteItem.id,
      parentId: null,
      x: initX,
      y: initY,
      label: newLabel,
      state: definition?.initialState ? { ...definition.initialState } : undefined,
      displayPinLabels: { ...(paletteItem.initialPinLabels || {}) },
      scale: 1.0,
      width: null,
      height: null,
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponentForSidebar(newComponent);
    setSelectedConnectionId(null);
    setIsPropertiesSidebarOpen(true);
  }, [isSimulating, components, toast, projectType]);

  const confirmDelete = useCallback((type: 'component' | 'connection' | 'waypoint', id: string, waypointIndex?: number) => {
    if (isSimulating) {
        toast({ title: "Aktion nicht erlaubt", description: "Elemente können nicht während der Simulation gelöscht werden.", variant: "destructive" });
        return;
    }
    setDeleteTarget({ type, id, waypointIndex });
    setIsConfirmDeleteModalOpen(true);
  }, [isSimulating, toast]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'component') {
      const componentLabel = components.find(c=>c.id === deleteTarget.id)?.label;
      setComponents(prev => prev.filter(comp => comp.id !== deleteTarget.id));
      setConnections(prev => prev.filter(conn => conn.startComponentId !== deleteTarget.id && conn.endComponentId !== deleteTarget.id));
      if (connectingPin?.componentId === deleteTarget.id) setConnectingPin(null);
      if (selectedComponentForSidebar?.id === deleteTarget.id) {
        setSelectedComponentForSidebar(null);
        setIsPropertiesSidebarOpen(false);
      }
       toast({ title: "Komponente gelöscht", description: `Komponente "${componentLabel || deleteTarget.id}" entfernt.` });
    } else if (deleteTarget.type === 'connection') {
      setConnections(prev => prev.filter(conn => conn.id !== deleteTarget.id));
      if (selectedConnectionId === deleteTarget.id) {
        setSelectedConnectionId(null);
        setIsPropertiesSidebarOpen(false);
      }
      toast({ title: "Verbindung gelöscht", description: `Verbindung ${deleteTarget.id} entfernt.` });
    } else if (deleteTarget.type === 'waypoint') {
        setConnections(prev => prev.map(conn => {
            if (conn.id === deleteTarget.id) {
                const newWaypoints = [...(conn.waypoints || [])];
                if(deleteTarget.waypointIndex !== undefined) {
                    newWaypoints.splice(deleteTarget.waypointIndex, 1);
                }
                return { ...conn, waypoints: newWaypoints };
            }
            return conn;
        }));
    }
    setIsConfirmDeleteModalOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, components, connectingPin, selectedComponentForSidebar, selectedConnectionId, toast]);

  const handleClosePropertiesSidebar = useCallback(() => {
    setIsPropertiesSidebarOpen(false);
    setSelectedComponentForSidebar(null);
    setSelectedConnectionId(null);
  }, []);

  const handleDeleteConnectionFromSidebar = useCallback((connectionId: string) => {
    confirmDelete('connection', connectionId);
  }, [confirmDelete]);

  const handleExportSVG = useCallback(() => {
    if (svgRef.current) {
      exportSvg(svgRef.current, `${projectName || 'CircuitCraft-Export'}.svg`);
      toast({ title: "SVG Export gestartet", description: "Die SVG-Datei wird heruntergeladen." });
    } else {
      toast({ title: "SVG Export fehlgeschlagen", description: "Das SVG-Element konnte nicht gefunden werden.", variant: "destructive"});
    }
  }, [projectName, toast]);

  const handlePaletteToggle = useCallback(() => {
    setIsPaletteOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-row h-screen w-full bg-background p-3 gap-3 overflow-hidden">
      <ComponentPalette
        onAddComponent={addComponent}
        isOpen={isPaletteOpen}
        onToggle={handlePaletteToggle}
        paletteComponents={filteredPaletteComponents}
        isSimulating={isSimulating}
      />

      <div ref={canvasContainerRef} className="flex-1 flex flex-col items-stretch p-0 rounded-lg shadow-md bg-card min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-border">
            <div>
                <Link href="/" passHref>
                    <Button variant="outline" size="sm" className="mb-2 flex items-center">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Zurück zur Startseite
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-primary">{projectName}</h1>
                <p className="text-sm text-muted-foreground">Projekttyp: {projectType}</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleSimulation}>
                    <Play className="mr-2 h-4 w-4" />
                    {isSimulating ? 'Simulation beenden' : 'Simulation starten'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsMeasuring(prev => !prev)} disabled={!isSimulating} className={isMeasuring ? 'bg-primary text-primary-foreground' : ''}>
                    <Gauge className="mr-2 h-4 w-4" /> Messmodus
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsAiSuggestionModalOpen(true)} disabled={isSimulating}>
                    <Lightbulb className="mr-2 h-4 w-4" /> KI Vorschlag
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSVG} disabled={isSimulating}>
                    <Download className="mr-2 h-4 w-4" /> SVG Export
                </Button>
                <Button variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="mr-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="mr-2 h-4 w-4" />
                </Button>
            </div>
        </div>

        <div className="flex-grow p-4 overflow-auto relative min-h-0">
          <CircuitCanvas
            svgRef={svgRef}
            components={components}
            connections={connections}
            connectingPin={connectingPin}
            currentMouseSvgCoords={currentMouseSvgCoords}
            getAbsolutePinCoordinates={getAbsolutePinCoordinates}
            onMouseDownComponent={handleMouseDownComponent}
            onMouseUpComponent={handleComponentMouseUpInSim}
            onCanvasMouseDown={handleCanvasMouseDown}
            onPinClick={handlePinClick}
            onComponentClick={handleComponentClick}
            onConnectionClick={handleConnectionClick}
            onWaypointMouseDown={handleWaypointMouseDown}
            onWaypointDoubleClick={(connId, index) => confirmDelete('waypoint', connId, index)}
            viewBoxWidth={viewBoxSize.width}
            viewBoxHeight={viewBoxSize.height}
            isSimulating={isSimulating}
            isMeasuring={isMeasuring}
            measurements={measurements}
            simulatedConnectionStates={simulatedConnectionStates}
            simulatedComponentStates={simulatedComponentStates}
            selectedConnectionId={selectedConnectionId}
            projectType={projectType}
            snapLines={snapLines}
            selectionRect={selectionRect}
            selectedComponentIds={selectedComponentIds}
          />
        </div>

        <Accordion type="single" collapsible className="w-full p-4 border-t border-border">
          <AccordionItem value="info">
            <AccordionTrigger className="text-sm hover:no-underline bg-gray-900 text-white hover:bg-gray-700 border border-gray-700 rounded-md px-4 py-2">
                <Info className="mr-2 h-4 w-4" /> Informationen & Bedienung
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-1 pt-2">
              <p><strong>Ziehen:</strong> Komponenten oder Wegpunkte verschieben (nur im Bearbeitungsmodus).</p>
              <p><strong>Verbinden:</strong> Blauen Anschlusspunkt klicken, dann Zielpunkt klicken.</p>
              <p><strong>Wegpunkt hinzufügen:</strong> Auf eine Verbindungslinie klicken.</p>
              <p><strong>Wegpunkt löschen:</strong> Doppelklick auf einen Wegpunkt.</p>
              <p><strong>Schalten (Simulation):</strong> Auf Schalter/Taster klicken, um Zustand zu ändern.</p>
              <p><strong>Bearbeiten/Details:</strong> Klick auf Komponente öffnet rechte Seitenleiste, Doppelklick für Details.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {isPropertiesSidebarOpen && (selectedComponentForSidebar || selectedConnectionId) && (
        <div className={`transition-all duration-300 ease-in-out ${isPropertiesSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden shrink-0`}>
             <PropertiesSidebar
                component={selectedComponentForSidebar}
                paletteComponent={selectedComponentForSidebar ? getPaletteComponentById(selectedComponentForSidebar.firebaseComponentId) : undefined}
                connection={selectedConnectionId ? connections.find(c => c.id === selectedConnectionId) : undefined}
                allComponents={components}
                connections={connections}
                onClose={handleClosePropertiesSidebar}
                onUpdateComponent={handleUpdateComponentFromSidebar}
                onDeleteComponent={(id) => confirmDelete('component', id)}
                onDeleteConnection={handleDeleteConnectionFromSidebar}
                onUpdateConnectionEndpoint={handleUpdateConnectionEndpoint}
                onUpdateConnection={handleUpdateConnection}
                onComponentClick={handleComponentClick}
                isSimulating={isSimulating}
                projectType={projectType}
              />
        </div>
      )}


      {componentToEdit && (
        <ComponentEditDialog
          component={componentToEdit}
          paletteComponent={getPaletteComponentById(componentToEdit.firebaseComponentId)}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveComponentChanges}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          isOpen={isConfirmDeleteModalOpen}
          message={`Möchten Sie ${deleteTarget.type === 'component' ? `die Komponente "${components.find(c=>c.id === deleteTarget.id)?.label || deleteTarget.id}"` : (deleteTarget.type === 'waypoint' ? 'diesen Wegpunkt' : `die Verbindung "${connections.find(c=>c.id === deleteTarget.id)?.id || deleteTarget.id}"`)} wirklich löschen?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmDeleteModalOpen(false)}
        />
      )}

      <AiSuggestionDialog
        isOpen={isAiSuggestionModalOpen}
        onClose={() => setIsAiSuggestionModalOpen(false)}
      />
    </div>
  );
}

export default function DesignerPage() {
  return (
    <Suspense fallback={<div>Lade Projektparameter...</div>}>
      <DesignerPageContent />
    </Suspense>
  );
}