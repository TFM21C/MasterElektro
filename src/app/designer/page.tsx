
"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info, ChevronLeft, Play } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

import type { ElectricalComponent, Connection, Point, PaletteComponentFirebaseData, ProjectType, SimulatedComponentState, SimulatedConnectionState, PaletteComponentSimulationConfig } from '@/types/circuit';
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
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [connectingPin, setConnectingPin] = useState<{ componentId: string; pinName: string, coords: Point } | null>(null);
  const [currentMouseSvgCoords, setCurrentMouseSvgCoords] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<ElectricalComponent | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'component' | 'connection'; id: string } | null>(null);

  const [selectedComponentForSidebar, setSelectedComponentForSidebar] = useState<ElectricalComponent | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isPropertiesSidebarOpen, setIsPropertiesSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);

  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 700 });

  // Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedComponentStates, setSimulatedComponentStates] = useState<{ [key: string]: SimulatedComponentState }>({});
  const [simulatedConnectionStates, setSimulatedConnectionStates] = useState<{ [key: string]: SimulatedConnectionState }>({});
  const activeTimerTimeouts = useRef<NodeJS.Timeout[]>([]);
  const [pressedComponentId, setPressedComponentId] = useState<string | null>(null);


  const filteredPaletteComponents = MOCK_PALETTE_COMPONENTS.filter(comp => {
    if (!projectType || projectType === "Steuerstromkreis") { 
      return true; 
    }
    // TODO: Implement actual filtering based on projectType and component categories/types
    return true; 
  });

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
  
  const handleComponentMouseUpInSim = useCallback(() => {
    if (pressedComponentId) {
        const component = components.find(c => c.id === pressedComponentId);
        const paletteComp = component ? getPaletteComponentById(component.firebaseComponentId) : null;
        const simConfig = paletteComp?.simulation;

        if (component && simConfig && simConfig.controlLogic === 'toggle_on_press') {
            setSimulatedComponentStates(prev => ({
                ...prev,
                [component.id]: {
                    ...prev[component.id],
                    currentContactState: { ...(simConfig.initialContactState || {}) }
                }
            }));
        }
        setPressedComponentId(null);
         // Trigger simulation step after releasing a "press" component
        if(simConfig?.interactable) runSimulationStep();
    }
  }, [pressedComponentId, components, setSimulatedComponentStates]); // Added runSimulationStep


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
    
    setCurrentMouseSvgCoords(pointInSvg);

    if (draggingComponentId && !isSimulating) {
      setComponents(prevComponents =>
        prevComponents.map(comp =>
          comp.id === draggingComponentId
            ? { ...comp, x: pointInSvg.x - offset.x, y: pointInSvg.y - offset.y }
            : comp
        )
      );
    }
  }, [draggingComponentId, offset, isSimulating]);

  const handleMouseUpGlobal = useCallback(() => {
    if (isSimulating) {
      handleComponentMouseUpInSim();
    }
    setDraggingComponentId(null);
  }, [isSimulating, handleComponentMouseUpInSim]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal); // Changed from handleMouseUp
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal); // Changed from handleMouseUp
    };
  }, [handleMouseMove, handleMouseUpGlobal]); // Changed from handleMouseUp
  
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasDimensions({ width: Math.max(width, 300), height: Math.max(height - 50, 300) });
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

  const runSimulationStep = useCallback(() => {
    if (!isSimulating) return;

    let newSimCompStates = JSON.parse(JSON.stringify(simulatedComponentStates)) as typeof simulatedComponentStates;
    let newSimConnStates = JSON.parse(JSON.stringify(simulatedConnectionStates)) as typeof simulatedConnectionStates;
    
    let changedInIteration = true;
    const maxIterations = components.length + connections.length + 10; // Safety break
    let iterations = 0;

    // Reset all conduction and energization before recalculating each step
    Object.keys(newSimConnStates).forEach(id => newSimConnStates[id].isConducting = false);
    Object.keys(newSimCompStates).forEach(compId => {
        const comp = components.find(c => c.id === compId);
        const paletteComp = comp ? getPaletteComponentById(comp.firebaseComponentId) : null;
        const simConfig = paletteComp?.simulation;
        if (simConfig?.controlLogic === 'visualize_energized' || simConfig?.controlLogic === 'energize_coil' || simConfig?.controlLogic === 'timer_on_delay') {
            if (!newSimCompStates[compId].timerActive) { // Don't reset energized if timer is still active for its output
                newSimCompStates[compId].isEnergized = false;
            }
        }
    });

    while (changedInIteration && iterations < maxIterations) {
        changedInIteration = false;
        iterations++;

        const poweredPins = new Set<string>(); // "componentId/pinName"

        // 1. Identify initial power sources (24V)
        components.forEach(comp => {
            const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
            if (paletteComp?.type === '24V') { // Assuming 24V source is of type '24V'
                const pins = Object.keys(COMPONENT_DEFINITIONS[comp.type]?.pins || {});
                pins.forEach(pinName => poweredPins.add(`${comp.id}/${pinName}`));
            }
        });
        
        // 2. Propagate power through connections and components
        let propagationChanged = true;
        while(propagationChanged){
            propagationChanged = false;
            connections.forEach(conn => {
                const startPinKey = `${conn.startComponentId}/${conn.startPinName}`;
                const endPinKey = `${conn.endComponentId}/${conn.endPinName}`;
                
                let startPinIsPowered = poweredPins.has(startPinKey);

                // Check if power comes through a component's internal contact state
                const startComp = components.find(c => c.id === conn.startComponentId);
                const startCompState = startComp ? newSimCompStates[startComp.id] : undefined;
                if (startPinIsPowered && startCompState?.currentContactState) {
                    if (startCompState.currentContactState[conn.startPinName] === 'open') {
                        startPinIsPowered = false; // Blocked by open contact
                    }
                }


                if (startPinIsPowered) {
                    if (!newSimConnStates[conn.id].isConducting) {
                        newSimConnStates[conn.id].isConducting = true;
                        changedInIteration = true;
                    }
                    if (!poweredPins.has(endPinKey)) {
                        poweredPins.add(endPinKey);
                        propagationChanged = true; 
                        changedInIteration = true;
                    }
                }
            });
        }


        // 3. Update component states based on powered pins and their logic
        components.forEach(comp => {
            const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
            const simConfig = paletteComp?.simulation;
            if (!simConfig) return;

            const compState = newSimCompStates[comp.id];

            if (simConfig.controlLogic === 'energize_coil' || simConfig.controlLogic === 'visualize_energized' || simConfig.controlLogic === 'timer_on_delay') {
                const energizePins = simConfig.energizePins || [];
                const allEnergizePinsPowered = energizePins.every(pinName => poweredPins.has(`${comp.id}/${pinName}`));
                
                if (allEnergizePinsPowered && !compState.isEnergized && (!compState.timerActive || simConfig.controlLogic !== 'timer_on_delay')) {
                    newSimCompStates[comp.id].isEnergized = true;
                    changedInIteration = true;

                    if (simConfig.controlLogic === 'timer_on_delay' && !compState.timerActive) {
                        newSimCompStates[comp.id].timerActive = true;
                        const duration = simConfig.timerDurationMs || 0;
                        newSimCompStates[comp.id].timerRemaining = duration;
                        
                        // Clear any existing timer for this component before starting a new one
                        activeTimerTimeouts.current = activeTimerTimeouts.current.filter(t => t.compId !== comp.id); 
                        clearTimeout(activeTimerTimeouts.current.find(t => t.compId === comp.id)?.timerId);


                        const timerId = setTimeout(() => {
                           setSimulatedComponentStates(prev => {
                               const updatedState = {
                                   ...prev[comp.id],
                                   // Timer output might be different from coil energization, e.g. it activates contacts
                                   currentContactState: { ...(simConfig.outputPinStateOnEnergized || {}) }, 
                                   timerActive: false,
                                   timerRemaining: 0,
                                   isEnergized: true, // Keep coil energized if voltage is still there, contacts change
                               };
                               // Make sure to apply other changes from runSimulationStep
                               runSimulationStep(); 
                               return {...prev, [comp.id]: updatedState };
                           });
                        }, duration);
                        activeTimerTimeouts.current.push({compId: comp.id, timerId});
                    }
                } else if (!allEnergizePinsPowered && compState.isEnergized && simConfig.controlLogic !== 'timer_on_delay') { // For timer, de-energizing coil might not immediately affect output
                    newSimCompStates[comp.id].isEnergized = false;
                    changedInIteration = true;
                    if (simConfig.controlLogic === 'timer_on_delay' && compState.timerActive) {
                        // If coil de-energizes while on-delay timer is active, reset timer
                        clearTimeout(activeTimerTimeouts.current.find(t => t.compId === comp.id)?.timerId);
                        activeTimerTimeouts.current = activeTimerTimeouts.current.filter(t => t.compId !== comp.id);
                        newSimCompStates[comp.id].timerActive = false;
                        newSimCompStates[comp.id].timerRemaining = null;
                        newSimCompStates[comp.id].currentContactState = { ...(simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState || {}) };
                    }
                }
            }

            // Update contacts controlled by coils (label matching)
            if (simConfig.controlledBy === 'label_match' && comp.label && paletteComp?.type !== 'SchuetzSpule' && paletteComp?.type !== 'ZeitRelaisEin') {
                const controllingCoils = components.filter(c => {
                    const p = getPaletteComponentById(c.firebaseComponentId);
                    return p?.simulation?.affectingLabel === true && c.label === comp.label && 
                           (p.simulation.controlLogic === 'energize_coil' || p.simulation.controlLogic === 'timer_on_delay');
                });

                let isAnyControllingCoilEnergized = false;
                if (controllingCoils.length > 0) {
                    isAnyControllingCoilEnergized = controllingCoils.some(controllingCoil => {
                        const coilState = newSimCompStates[controllingCoil.id];
                        const coilPalette = getPaletteComponentById(controllingCoil.firebaseComponentId);
                        if (coilPalette?.simulation?.controlLogic === 'timer_on_delay') {
                            // For timers, contacts are controlled by the timer's output state (currentContactState), not just coil energization
                            // Assuming timer's outputPinStateOnEnergized reflects the "active" state of its controlled contacts.
                            return Object.values(coilState?.currentContactState || {}).length > 0 && 
                                   JSON.stringify(coilState?.currentContactState) === JSON.stringify(coilPalette.simulation.outputPinStateOnEnergized);

                        }
                        return coilState?.isEnergized;
                    });
                }

                const newContactState = isAnyControllingCoilEnergized
                    ? simConfig.outputPinStateOnEnergized 
                    : (simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState);

                if (JSON.stringify(newSimCompStates[comp.id].currentContactState) !== JSON.stringify(newContactState)) {
                    newSimCompStates[comp.id].currentContactState = newContactState;
                    changedInIteration = true;
                }
            }
        });
    } 

    setSimulatedComponentStates(newSimCompStates);
    setSimulatedConnectionStates(newSimConnStates);

  }, [isSimulating, components, connections, simulatedComponentStates, simulatedConnectionStates]); // Removed setSimulatedComponentStates, setSimulatedConnectionStates


  // Effect to run simulation whenever relevant states change
  useEffect(() => {
    if (isSimulating) {
      runSimulationStep();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, components, connections]); // Only runSimulationStep directly, it will update its own states

  // This effect will trigger runSimulationStep when simulatedComponentStates changes *from an interaction*
  useEffect(() => {
    if (isSimulating) {
      runSimulationStep();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulatedComponentStates]);


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
            isLocked: simConfig?.controlLogic === 'fixed_open' ? true : // Example for NotAus
                      simConfig?.controlLogic === 'fixed_closed' ? true : undefined,
          };
        });
        setSimulatedComponentStates(initialSimCompStates);

        const initialSimConnStates: { [key: string]: SimulatedConnectionState } = {};
        connections.forEach(conn => {
          initialSimConnStates[conn.id] = { isConducting: false };
        });
        setSimulatedConnectionStates(initialSimConnStates);
        // runSimulationStep(); // Initial run will be triggered by useEffect watching isSimulating
      } else {
        // Clear all active timers when stopping simulation
        activeTimerTimeouts.current.forEach(t => clearTimeout(t.timerId));
        activeTimerTimeouts.current = [];
        setPressedComponentId(null);
        // Optionally reset states to a defined non-simulating state or leave as is for inspection
        // For now, we just stop further simulation steps. Visuals will persist until next start.
      }
      return newSimulatingState;
    });
  }, [components, connections, setIsSimulating, setSimulatedComponentStates, setSimulatedConnectionStates]);


  const handlePinClick = (componentId: string, pinName: string, pinCoords: Point) => {
    if (isSimulating) return; 

    const targetComponent = components.find(c => c.id === componentId);
    if (!targetComponent) return;
    const targetDefinition = COMPONENT_DEFINITIONS[targetComponent.type];
    if (!targetDefinition || !targetDefinition.pins[pinName]) return;


    if (connectingPin) {
      if (connectingPin.componentId === componentId && connectingPin.pinName === pinName) {
        setConnectingPin(null);
        return;
      }

      // Check if start or end pin is already used
      const isStartPinUsed = connections.some(conn => 
        (conn.startComponentId === connectingPin.componentId && conn.startPinName === connectingPin.pinName) ||
        (conn.endComponentId === connectingPin.componentId && conn.endPinName === connectingPin.pinName)
      );
      const isEndPinUsed = connections.some(conn => 
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
        },
      ]);
      toast({ title: "Verbindung erstellt", description: `Zwischen ${connectingPin.componentId}/${connectingPin.pinName} und ${componentId}/${pinName}.` });
      setConnectingPin(null);
    } else {
      // Check if the pin to start connecting from is already used
       const isPinAlreadyConnected = connections.some(conn => 
        (conn.startComponentId === componentId && conn.startPinName === pinName) ||
        (conn.endComponentId === componentId && conn.endPinName === pinName)
      );
      if (isPinAlreadyConnected) {
        toast({ title: "Pin bereits belegt", description: `Der Pin ${componentId}/${pinName} wird bereits verwendet.`, variant: "destructive" });
        return;
      }
      setConnectingPin({ componentId, pinName, coords: pinCoords });
    }
  };

  const handleComponentClick = (id: string, isDoubleClick = false) => {
    const component = components.find(c => c.id === id);
    if (!component) return;
    
    const paletteDef = getPaletteComponentById(component.firebaseComponentId);
    const simConfig = paletteDef?.simulation;

    if (isSimulating) {
        if (simConfig?.interactable && simConfig.controlLogic === 'toggle_on_click') {
            setSimulatedComponentStates(prev => {
                const currentSimState = prev[id] || { currentContactState: { ...simConfig.initialContactState } };
                const newPinStates: { [key: string]: 'open' | 'closed' } = {};
                
                // Determine if the component is currently in its "active" or "energized" pin state
                let isActiveState = false;
                if (simConfig.outputPinStateOnEnergized) {
                    isActiveState = JSON.stringify(currentSimState.currentContactState) === JSON.stringify(simConfig.outputPinStateOnEnergized);
                } else if (simConfig.affectsPins) { // Fallback for older config
                     // This is a simplified check. A more robust one would compare against defined active states.
                    isActiveState = Object.values(currentSimState.currentContactState || {}).every(s => s === 'closed');
                }


                if (isActiveState) { // If active, toggle to initial/de-energized state
                    Object.assign(newPinStates, (simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState || {}));
                } else { // If inactive, toggle to energized state
                    Object.assign(newPinStates, (simConfig.outputPinStateOnEnergized || {}));
                }
                return { ...prev, [id]: { ...currentSimState, currentContactState: newPinStates } };
            });
            // runSimulationStep(); // Triggered by useEffect on simulatedComponentStates
        }
        return; 
    }

    if (isDoubleClick) {
      setComponentToEdit(component);
      setIsEditModalOpen(true);
      setSelectedComponentForSidebar(null);
      setSelectedConnectionId(null);
      setIsPropertiesSidebarOpen(false);
    } else {
      if (paletteDef?.hasToggleState && !connectingPin && !isSimulating) { 
        const definition = COMPONENT_DEFINITIONS[component.type];
        if (definition?.initialState) { 
           setComponents(prev =>
            prev.map(comp => {
              if (comp.id === id) {
                const newState = { ...(comp.state || definition.initialState) }; 
                if (comp.type === 'Schließer') newState.isOpen = !newState.isOpen;
                else if (comp.type === 'Öffner') newState.isClosed = !newState.isClosed;
                return { ...comp, state: newState };
              }
              return comp;
            })
          );
        }
      }
      setSelectedComponentForSidebar(component);
      setSelectedConnectionId(null);
      setIsPropertiesSidebarOpen(true);
    }
  };

  const handleConnectionClick = (connectionId: string) => {
    if (isSimulating) return;
    setSelectedConnectionId(connectionId);
    setSelectedComponentForSidebar(null);
    setIsPropertiesSidebarOpen(true);
  };

  const handleComponentMouseDownInSim = (id: string) => {
    const component = components.find(c => c.id === id);
    const paletteComp = component ? getPaletteComponentById(component.firebaseComponentId) : null;
    const simConfig = paletteComp?.simulation;

    if (component && simConfig?.interactable && simConfig.controlLogic === 'toggle_on_press') {
        setPressedComponentId(id);
        setSimulatedComponentStates(prev => {
            const currentSimState = prev[id] || { currentContactState: { ...simConfig.initialContactState } };
            const newContactState: { [key: string]: 'open' | 'closed' } = {};
            const activeState = simConfig.outputPinStateOnEnergized || (simConfig.affectsPins ? Object.fromEntries(Object.keys(simConfig.affectsPins).map(key => [key, (simConfig.affectsPins as any)[key].active])) : {});
            
            Object.assign(newContactState, activeState);

            return {
                ...prev,
                [component.id]: {
                    ...currentSimState,
                    currentContactState: newContactState
                }
            };
        });
        // runSimulationStep(); // Triggered by useEffect on simulatedComponentStates
    }
  };
  
  const handleSaveComponentChanges = (id: string, newLabel: string, newPinLabels: Record<string, string>) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, label: newLabel, displayPinLabels: newPinLabels } : comp
      )
    );
    if (selectedComponentForSidebar?.id === id) {
      setSelectedComponentForSidebar(prev => prev ? { ...prev, label: newLabel, displayPinLabels: newPinLabels } : null);
    }
    toast({ title: "Komponente gespeichert", description: `Änderungen an ${newLabel} wurden übernommen.` });
  };

  const handleUpdateComponentFromSidebar = (id: string, updates: Partial<ElectricalComponent>) => {
    setComponents(prev =>
      prev.map(comp => (comp.id === id ? { ...comp, ...updates } : comp))
    );
    setSelectedComponentForSidebar(prev => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

   const handleUpdateConnectionEndpoint = (connectionId: string, newEndComponentId: string, newEndPinName: string) => {
    setConnections(prevConnections =>
      prevConnections.map(conn =>
        conn.id === connectionId
          ? { ...conn, endComponentId: newEndComponentId, endPinName: newEndPinName }
          : conn
      )
    );
    toast({ title: "Verbindung geändert", description: `Endpunkt der Verbindung ${connectionId} aktualisiert.` });
     if (isSimulating) {
      runSimulationStep(); // Re-run simulation if it's active
    }
  };

  const addComponent = (paletteItem: PaletteComponentFirebaseData) => {
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

    const newComponent: ElectricalComponent = {
      id: newId,
      type: paletteItem.type,
      firebaseComponentId: paletteItem.id,
      x: 100 + Math.random() * 50, 
      y: 100 + Math.random() * 50,
      label: newLabel,
      state: definition?.initialState ? { ...definition.initialState } : undefined,
      displayPinLabels: { ...(paletteItem.initialPinLabels || {}) },
      scale: 1.0, 
      width: null, 
      height: null, 
    };
    setComponents(prev => [...prev, newComponent]);
    // setIsEditModalOpen(true); // Removed to open sidebar instead
    // setComponentToEdit(newComponent); // Removed to open sidebar instead
    setSelectedComponentForSidebar(newComponent);
    setSelectedConnectionId(null);
    setIsPropertiesSidebarOpen(true);
    toast({ title: "Komponente hinzugefügt", description: `${newLabel} (${paletteItem.name}) wurde der Arbeitsfläche hinzugefügt.` });
  };

  const confirmDelete = (type: 'component' | 'connection', id: string) => {
    if (isSimulating) {
        toast({ title: "Aktion nicht erlaubt", description: "Elemente können nicht während der Simulation gelöscht werden.", variant: "destructive" });
        return;
    }
    setDeleteTarget({ type, id });
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
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
    }
    setIsConfirmDeleteModalOpen(false);
    setDeleteTarget(null);
    if (isSimulating) runSimulationStep(); // Re-run simulation if active
  };

  const handleClosePropertiesSidebar = () => {
    setIsPropertiesSidebarOpen(false);
    setSelectedComponentForSidebar(null);
    setSelectedConnectionId(null);
  };

  const handleDeleteConnectionFromSidebar = (connectionId: string) => {
    confirmDelete('connection', connectionId);
  };

  return (
    <div className="flex flex-row h-screen w-full bg-background p-3 gap-3 overflow-hidden">
      <ComponentPalette
        onAddComponent={addComponent}
        isOpen={isPaletteOpen}
        onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
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
                <Button variant="outline" size="sm" onClick={() => setIsAiSuggestionModalOpen(true)}>
                    <Lightbulb className="mr-2 h-4 w-4" /> KI Vorschlag
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSVG}>
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
            onMouseUpComponent={handleComponentMouseUpInSim} // Pass mouse up for simulation
            onPinClick={handlePinClick}
            onComponentClick={handleComponentClick}
            onConnectionClick={handleConnectionClick} // Pass connection click handler
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            isSimulating={isSimulating}
            simulatedConnectionStates={simulatedConnectionStates}
            simulatedComponentStates={simulatedComponentStates}
            selectedConnectionId={selectedConnectionId}
          />
        </div>

        <Accordion type="single" collapsible className="w-full p-4 border-t border-border">
          <AccordionItem value="info">
            <AccordionTrigger className="text-sm hover:no-underline bg-gray-900 text-white hover:bg-gray-700 border border-gray-700 rounded-md px-4 py-2">
                <Info className="mr-2 h-4 w-4" /> Informationen & Bedienung
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-1 pt-2">
              <p><strong>Ziehen:</strong> Komponenten verschieben (nur im Bearbeitungsmodus).</p>
              <p><strong>Verbinden:</strong> Blauen Anschlusspunkt klicken, dann Zielpunkt klicken (nur im Bearbeitungsmodus).</p>
              <p><strong>Verbindung auswählen/löschen:</strong> Auf Verbindungslinie klicken, um Details rechts zu sehen und zu löschen (nur Bearbeitungsmodus).</p>
              <p><strong>Schalten (Simulation):</strong> Auf Schalter/Taster klicken, um Zustand zu ändern (wenn Simulation aktiv).</p>
              <p><strong>Bearbeiten:</strong> Doppelklick auf Komponente für Details (Modal, nur Bearbeitungsmodus).</p>
              <p><strong>Details:</strong> Klick auf Komponente öffnet rechte Seitenleiste (nur Bearbeitungsmodus).</p>
              <p><strong>Löschen:</strong> Komponente über Seitenleiste, Verbindung über Seitenleiste (nach Auswahl, nur Bearbeitungsmodus).</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {isPropertiesSidebarOpen && (selectedComponentForSidebar || selectedConnectionId) && ( 
        <div className={`transition-all duration-300 ease-in-out ${isPropertiesSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden shrink-0`}> {/* Increased width */}
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
                isSimulating={isSimulating}
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
          message={`Möchten Sie ${deleteTarget.type === 'component' ? `die Komponente "${components.find(c=>c.id === deleteTarget.id)?.label || deleteTarget.id}"` : `die Verbindung "${connections.find(c=>c.id === deleteTarget.id)?.id || deleteTarget.id}"`} wirklich löschen?`}
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

// Wrap the component with Suspense for useSearchParams
export default function DesignerPage() {
  return (
    <Suspense fallback={<div>Lade Projektparameter...</div>}>
      <DesignerPageContent />
    </Suspense>
  );
}
