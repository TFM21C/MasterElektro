"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info, ChevronLeft, Play } from 'lucide-react';
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
  const svgRef = useRef<SVGSVGElement>(null);

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
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 700 });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedComponentStates, setSimulatedComponentStates] = useState<{ [key: string]: SimulatedComponentState }>({});
  const [simulatedConnectionStates, setSimulatedConnectionStates] = useState<{ [key: string]: SimulatedConnectionState }>({});
  const activeTimerTimeouts = useRef<{compId: string, timerId: NodeJS.Timeout}[]>([]);
  const [pressedComponentId, setPressedComponentId] = useState<string | null>(null);

  const filteredPaletteComponents = React.useMemo(() => {
    return MOCK_PALETTE_COMPONENTS.filter(comp => {
      if (projectType === "Installationsschaltplan") {
        return comp.category === "Installationselemente" || comp.category === "Energieversorgung";
      }
      return comp.category?.includes("Steuerstrom") || comp.category === "Energieversorgung" || comp.category === "Befehlsgeräte" || comp.category === "Speichernde / Verarbeitende" || comp.category === "Stellglieder";
    });
  }, [projectType]);

  const propagatePower = useCallback((
    currentComponents: ElectricalComponent[],
    currentConnections: Connection[],
    currentSimCompStates: typeof simulatedComponentStates
  ) => {
      const energizedPins = new Set<string>();
      
      currentComponents.forEach(comp => {
          if (comp.type === '24V') {
              Object.keys(COMPONENT_DEFINITIONS[comp.type]?.pins || {}).forEach(pinName => {
                  energizedPins.add(`${comp.id}/${pinName}`);
              });
          }
      });

      for (let i = 0; i < (currentComponents.length + currentConnections.length); i++) {
          let changedInIteration = false;
          currentConnections.forEach(conn => {
              const startKey = `${conn.startComponentId}/${conn.startPinName}`;
              const endKey = `${conn.endComponentId}/${conn.endPinName}`;

              const startComp = currentComponents.find(c => c.id === conn.startComponentId);
              const endComp = currentComponents.find(c => c.id === conn.endComponentId);

              if (!startComp || !endComp) return;

              const startState = currentSimCompStates[startComp.id];
              const endState = currentSimCompStates[endComp.id];

              const startConducts = startState?.currentContactState?.[conn.startPinName] !== 'open';
              const endConducts = endState?.currentContactState?.[conn.endPinName] !== 'open';
              
              if (energizedPins.has(startKey) && startConducts && !energizedPins.has(endKey) && endConducts) {
                  energizedPins.add(endKey);
                  changedInIteration = true;
              }
              if (energizedPins.has(endKey) && endConducts && !energizedPins.has(startKey) && startConducts) {
                  energizedPins.add(startKey);
                  changedInIteration = true;
              }
          });
          if (!changedInIteration) break;
      }
      
      return { energizedPins };
  }, []);

  const runSimulationStep = useCallback(() => {
    setSimulatedComponentStates(currentSimStates => {
        let newSimCompStates = JSON.parse(JSON.stringify(currentSimStates));

        components.forEach(comp => {
            const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
            if (paletteComp?.simulation?.controlledBy === 'label_match') {
                const controllingCoils = components.filter(c => 
                    c.label === comp.label && 
                    getPaletteComponentById(c.firebaseComponentId)?.simulation?.affectingLabel
                );
                
                const isEnergized = controllingCoils.some(coil => newSimCompStates[coil.id]?.isEnergized);
                
                const targetState = isEnergized 
                    ? paletteComp.simulation.outputPinStateOnEnergized 
                    : (paletteComp.simulation.outputPinStateOnDeEnergized || paletteComp.simulation.initialContactState);

                if (JSON.stringify(newSimCompStates[comp.id].currentContactState) !== JSON.stringify(targetState)) {
                    newSimCompStates[comp.id].currentContactState = { ...targetState };
                }
            }
        });

        const { energizedPins } = propagatePower(components, connections, newSimCompStates);

        components.forEach(comp => {
            const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
            const simConfig = paletteComp?.simulation;
            if (!simConfig) return;

            const isNowEnergized = (simConfig.energizePins || []).every(pin => energizedPins.has(`${comp.id}/${pin}`));
            
            if (newSimCompStates[comp.id].isEnergized !== isNowEnergized) {
                newSimCompStates[comp.id].isEnergized = isNowEnergized;
            }
        });
        
        const newSimConnStates = connections.reduce((acc, conn) => {
            acc[conn.id] = { isConducting: energizedPins.has(`${conn.startComponentId}/${conn.startPinName}`) && energizedPins.has(`${conn.endComponentId}/${conn.endPinName}`) };
            return acc;
        }, {} as { [key: string]: SimulatedConnectionState });

        setSimulatedConnectionStates(newSimConnStates);
        
        return newSimCompStates;
    });
  }, [components, connections, propagatePower]);

  useEffect(() => {
    if (isSimulating) {
      runSimulationStep();
    }
  }, [isSimulating, runSimulationStep, simulatedComponentStates]);

  const getAbsolutePinCoordinates = useCallback((componentId: string, pinName: string): Point | null => {
    const component = components.find(c => c.id === componentId);
    if (!component) return null;
    const definition = COMPONENT_DEFINITIONS[component.type];
    if (!definition || !definition.pins[pinName]) return null;
    const pinDef = definition.pins[pinName];
    const scale = component.scale || 1;
    return {
      x: component.x + pinDef.x * scale,
      y: component.y + pinDef.y * scale
    };
  }, [components]);

  const handleComponentMouseUpInSim = useCallback(() => {
    if (pressedComponentId) {
        setSimulatedComponentStates(prev => {
            const component = components.find(c => c.id === pressedComponentId);
            const paletteComp = component ? getPaletteComponentById(component.firebaseComponentId) : null;
            const simConfig = paletteComp?.simulation;
            if (component && simConfig && simConfig.controlLogic === 'toggle_on_press') {
                return {
                    ...prev,
                    [component.id]: {
                        ...prev[component.id],
                        currentContactState: { ...(simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState || {}) }
                    }
                };
            }
            return prev;
        });
        setPressedComponentId(null);
    }
  }, [pressedComponentId, components]);

  const handleMouseDownComponent = (e: React.MouseEvent<SVGGElement>, id: string) => {
    if (isSimulating) {
      handleComponentMouseDownInSim(id);
      return;
    }
    const component = components.find(c => c.id === id);
    if (component && svgRef.current) {
      setDraggingComponentId(id);
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
        setOffset({
          x: pointInSvg.x - component.x,
          y: pointInSvg.y - component.y,
        });
      }
    }
  };
  
  const handleWaypointMouseDown = useCallback((connectionId: string, waypointIndex: number) => {
      if (isSimulating) return;
      setDraggingWaypoint({connectionId, waypointIndex});
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const pointInSvg = svgRef.current.createSVGPoint();
    pointInSvg.x = e.clientX;
    pointInSvg.y = e.clientY;
    const { x, y } = pointInSvg.matrixTransform(CTM.inverse());
    setCurrentMouseSvgCoords({x, y});

    if (draggingComponentId && !isSimulating) {
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
  }, [draggingComponentId, offset, isSimulating, draggingWaypoint]);

  const handleMouseUpGlobal = useCallback(() => {
    if (isSimulating) {
      handleComponentMouseUpInSim();
    }
    setDraggingComponentId(null);
    setDraggingWaypoint(null);
  }, [isSimulating, handleComponentMouseUpInSim]);

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
        setCanvasDimensions({ width: Math.max(width, 300), height: Math.max(height - 50, 300) });
      }
    });
    if (canvasContainerRef.current) resizeObserver.observe(canvasContainerRef.current);
    return () => {
      if (canvasContainerRef.current) resizeObserver.unobserve(canvasContainerRef.current);
    };
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => {
      const newSimulatingState = !prev;
      if (newSimulatingState) {
        setSimulatedComponentStates(components.reduce((acc, comp) => {
          const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
          const simConfig = paletteComp?.simulation;
          acc[comp.id] = {
            isEnergized: false,
            currentContactState: { ...(simConfig?.initialContactState || {}) },
          };
          return acc;
        }, {} as { [key: string]: SimulatedComponentState }));
        setSimulatedConnectionStates(connections.reduce((acc, conn) => {
          acc[conn.id] = { isConducting: false };
          return acc;
        }, {} as { [key: string]: SimulatedConnectionState }));
      } else {
        activeTimerTimeouts.current.forEach(t => clearTimeout(t.timerId));
        activeTimerTimeouts.current = [];
        setPressedComponentId(null);
      }
      return newSimulatingState;
    });
  }, [components, connections]);

  const handlePinClick = useCallback((componentId: string, pinName: string, pinCoords: Point) => {
    if (isSimulating) return;
    if (connectingPin) {
      setConnections(prev => [...prev, { id: `conn-${Date.now()}`, startComponentId: connectingPin.componentId, startPinName: connectingPin.pinName, endComponentId: componentId, endPinName: pinName, waypoints: [] }]);
      setConnectingPin(null);
    } else {
      setConnectingPin({ componentId, pinName, coords: pinCoords });
    }
  }, [isSimulating, connectingPin]);

  const handleComponentClick = useCallback((id: string, isDoubleClick = false) => {
    if (isSimulating) {
        const component = components.find(c => c.id === id);
        const paletteDef = component ? getPaletteComponentById(component.firebaseComponentId) : null;
        const simConfig = paletteDef?.simulation;
        if (simConfig?.interactable && simConfig.controlLogic === 'toggle_on_click') {
            setSimulatedComponentStates(prev => {
                const currentSimState = prev[id];
                const isActiveState = JSON.stringify(currentSimState.currentContactState) === JSON.stringify(simConfig.outputPinStateOnEnergized);
                return { ...prev, [id]: { ...currentSimState, currentContactState: isActiveState ? (simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState || {}) : (simConfig.outputPinStateOnEnergized || {}) }};
            });
        }
        return;
    }
    if (isDoubleClick) {
      const component = components.find(c => c.id === id);
      if (component) {
        setComponentToEdit(component);
        setIsEditModalOpen(true);
      }
    } else {
      setSelectedComponentForSidebar(components.find(c => c.id === id) || null);
      setSelectedConnectionId(null);
      setIsPropertiesSidebarOpen(true);
    }
  }, [isSimulating, components]);

  const handleConnectionClick = useCallback((connectionId: string, clickCoords: Point) => {
    if (isSimulating) return;
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
  }, [isSimulating, getAbsolutePinCoordinates]);

  const handleComponentMouseDownInSim = (id: string) => {
    const component = components.find(c => c.id === id);
    const paletteComp = component ? getPaletteComponentById(component.firebaseComponentId) : null;
    const simConfig = paletteComp?.simulation;

    if (component && simConfig?.interactable && simConfig.controlLogic === 'toggle_on_press') {
        setPressedComponentId(id); 
        setSimulatedComponentStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                currentContactState: { ...(simConfig.outputPinStateOnEnergized || {}) }
            }
        }));
    }
  };

  const handleSaveComponentChanges = useCallback((id: string, newLabel: string, newPinLabels: Record<string, string>) => {
    setComponents(prev => prev.map(comp => comp.id === id ? { ...comp, label: newLabel, displayPinLabels: newPinLabels } : comp));
    toast({ title: "Komponente gespeichert", description: `Änderungen an ${newLabel} wurden übernommen.` });
  }, [toast]);

  const handleUpdateComponentFromSidebar = useCallback((id: string, updates: Partial<ElectricalComponent>) => {
    setComponents(prev => prev.map(comp => (comp.id === id ? { ...comp, ...updates } : comp)));
    setSelectedComponentForSidebar(prev => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  }, []);

   const handleUpdateConnectionEndpoint = useCallback((connectionId: string, newEndComponentId: string, newEndPinName: string) => {
    setConnections(prev => prev.map(conn => conn.id === connectionId ? { ...conn, endComponentId: newEndComponentId, endPinName: newEndPinName } : conn));
    toast({ title: "Verbindung geändert", description: `Endpunkt der Verbindung ${connectionId} aktualisiert.` });
  }, [toast]);

  const handleUpdateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn => conn.id === connectionId ? { ...conn, ...updates } : conn));
    toast({ title: "Verbindung aktualisiert", description: `Eigenschaften der Verbindung ${connectionId} geändert.` });
  }, [toast]);

  const addComponent = useCallback((paletteItem: PaletteComponentFirebaseData) => {
    if (isSimulating) {
        toast({ title: "Aktion nicht erlaubt", description: "Bauteile können nicht während der Simulation hinzugefügt werden.", variant: "destructive" });
        return;
    }
    const newId = `${paletteItem.id.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
    const newComponent: ElectricalComponent = { id: newId, type: paletteItem.type, firebaseComponentId: paletteItem.id, x: 100, y: 100, label: `${paletteItem.defaultLabelPrefix}${components.filter(c => c.type === paletteItem.type).length + 1}`, displayPinLabels: { ...(paletteItem.initialPinLabels || {}) }, scale: 1.0 };
    setComponents(prev => [...prev, newComponent]);
  }, [isSimulating, components, toast]);

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
    const { type, id, waypointIndex } = deleteTarget;
    if (type === 'component') {
      setComponents(prev => prev.filter(comp => comp.id !== id));
      setConnections(prev => prev.filter(conn => conn.startComponentId !== id && conn.endComponentId !== id));
    } else if (type === 'connection') {
      setConnections(prev => prev.filter(conn => conn.id !== id));
    } else if (type === 'waypoint') {
        setConnections(prev => prev.map(conn => {
            if (conn.id === id) {
                const newWaypoints = [...(conn.waypoints || [])];
                if(waypointIndex !== undefined) newWaypoints.splice(waypointIndex, 1);
                return { ...conn, waypoints: newWaypoints };
            }
            return conn;
        }));
    }
    setIsConfirmDeleteModalOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleClosePropertiesSidebar = useCallback(() => setIsPropertiesSidebarOpen(false), []);
  const handleDeleteConnectionFromSidebar = useCallback((connectionId: string) => confirmDelete('connection', connectionId), [confirmDelete]);
  const handleExportSVG = useCallback(() => {
    if (svgRef.current) {
      exportSvg(svgRef.current, `${projectName || 'CircuitCraft-Export'}.svg`);
    }
  }, [projectName]);
  const handlePaletteToggle = useCallback(() => setIsPaletteOpen(prev => !prev), []);

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
                <Button variant="outline" size="sm" onClick={() => setIsAiSuggestionModalOpen(true)} disabled={isSimulating}>
                    <Lightbulb className="mr-2 h-4 w-4" /> KI Vorschlag
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSVG} disabled={isSimulating}>
                    <Download className="mr-2 h-4 w-4" /> SVG Export
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
            onPinClick={handlePinClick}
            onComponentClick={handleComponentClick}
            onConnectionClick={handleConnectionClick}
            onWaypointMouseDown={handleWaypointMouseDown}
            onWaypointDoubleClick={(connId, waypointIndex) => confirmDelete('waypoint', connId, waypointIndex)}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            isSimulating={isSimulating}
            simulatedConnectionStates={simulatedConnectionStates}
            simulatedComponentStates={simulatedComponentStates}
            selectedConnectionId={selectedConnectionId}
            projectType={projectType}
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

