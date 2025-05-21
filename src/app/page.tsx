
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info } from 'lucide-react'; // Removed Trash2, Settings2 for now
import { useToast } from "@/hooks/use-toast";

import type { ElectricalComponent, Connection, Point, PaletteComponentFirebaseData } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import { MOCK_PALETTE_COMPONENTS, getPaletteComponentById } from '@/config/mock-palette-data'; // Import mock data

import DraggableComponent from '@/components/circuit/DraggableComponent';
import ComponentEditDialog from '@/components/modals/ComponentEditDialog';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import PropertiesSidebar from '@/components/sidebars/PropertiesSidebar';
import ComponentPalette from '@/components/sidebars/ComponentPalette';
import CircuitCanvas from '@/components/canvas/CircuitCanvas';
import AiSuggestionDialog from '@/components/modals/AiSuggestionDialog';
import { exportSvg } from '@/lib/svg-export';


const initialComponents: ElectricalComponent[] = [
  // Example: Add a 24V source using the new structure for demonstration
  // { 
  //   id: 'source24v_inst1', 
  //   type: '24V', 
  //   firebaseComponentId: 'spannung_24v', 
  //   x: 50, y: 50, 
  //   label: '+24V1', 
  //   displayPinLabels: getPaletteComponentById('spannung_24v')?.initialPinLabels 
  // },
];

export default function CircuitCraftPage() {
  const [components, setComponents] = useState<ElectricalComponent[]>(initialComponents);
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
  const [isPropertiesSidebarOpen, setIsPropertiesSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);

  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 700 });


  const getAbsolutePinCoordinates = useCallback((componentId: string, pinName: string): Point | null => {
    const component = components.find(c => c.id === componentId);
    if (!component) return null;
    const definition = COMPONENT_DEFINITIONS[component.type];
    if (!definition || !definition.pins[pinName]) return null;

    const pinDef = definition.pins[pinName];
    return { x: component.x + pinDef.x, y: component.y + pinDef.y };
  }, [components]);

  const handleMouseDownComponent = (e: React.MouseEvent<SVGGElement>, id: string) => {
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
    
    setCurrentMouseSvgCoords(pointInSvg);

    if (draggingComponentId) {
      setComponents(prevComponents =>
        prevComponents.map(comp =>
          comp.id === draggingComponentId
            ? { ...comp, x: pointInSvg.x - offset.x, y: pointInSvg.y - offset.y }
            : comp
        )
      );
    }
  }, [draggingComponentId, offset]);

  const handleMouseUp = useCallback(() => {
    setDraggingComponentId(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
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


  const handlePinClick = (componentId: string, pinName: string, pinCoords: Point) => {
    if (connectingPin) {
      if (connectingPin.componentId === componentId && connectingPin.pinName === pinName) {
        setConnectingPin(null);
        return;
      }
      const connectionExists = connections.some(conn =>
        (conn.startComponentId === connectingPin.componentId && conn.startPinName === connectingPin.pinName &&
         conn.endComponentId === componentId && conn.endPinName === pinName) ||
        (conn.startComponentId === componentId && conn.startPinName === pinName &&
         conn.endComponentId === connectingPin.componentId && conn.endPinName === connectingPin.pinName)
      );

      if (!connectionExists) {
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
      } else {
        toast({ title: "Verbindung existiert bereits", variant: "destructive" });
      }
      setConnectingPin(null);
    } else {
      setConnectingPin({ componentId, pinName, coords: pinCoords });
    }
  };

  const handleComponentClick = (id: string, isDoubleClick = false) => {
    const component = components.find(c => c.id === id);
    if (!component) return;
    
    const paletteDef = getPaletteComponentById(component.firebaseComponentId);

    if (isDoubleClick) {
      setComponentToEdit(component);
      setIsEditModalOpen(true);
      setIsPropertiesSidebarOpen(false);
    } else {
      if (paletteDef?.hasToggleState && !connectingPin) {
        // Toggle state logic
        const definition = COMPONENT_DEFINITIONS[component.type];
        if (definition?.initialState) { // Check if initial state is defined
           setComponents(prev =>
            prev.map(comp => {
              if (comp.id === id) {
                const newState = { ...(comp.state || definition.initialState) }; // Use current or initial state
                if (comp.type === 'Schließer') newState.isOpen = !newState.isOpen;
                else if (comp.type === 'Öffner') newState.isClosed = !newState.isClosed;
                // Add other toggleable states here if needed
                return { ...comp, state: newState };
              }
              return comp;
            })
          );
        }
      }
      setSelectedComponentForSidebar(component);
      setIsPropertiesSidebarOpen(true);
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

  const addComponent = (paletteItem: PaletteComponentFirebaseData) => {
    const newId = `${paletteItem.id.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
    const definition = COMPONENT_DEFINITIONS[paletteItem.type];
    
    // Generate a unique label based on prefix and count
    const existingOfType = components.filter(c => c.firebaseComponentId === paletteItem.id).length;
    let newLabel = `${paletteItem.defaultLabelPrefix}${existingOfType + 1}`;
    if (paletteItem.defaultLabelPrefix === '+24V' || paletteItem.defaultLabelPrefix === '0V') {
      newLabel = paletteItem.defaultLabelPrefix; // For sources, use the prefix directly if only one is typical
      if (components.some(c => c.label === newLabel)) { // Add number if already exists
        newLabel = `${paletteItem.defaultLabelPrefix}${existingOfType + 1}`;
      }
    }


    const newComponent: ElectricalComponent = {
      id: newId,
      type: paletteItem.type,
      firebaseComponentId: paletteItem.id,
      x: 100 + components.length * 10, 
      y: 100 + components.length * 10,
      label: newLabel,
      state: definition?.initialState ? { ...definition.initialState } : undefined,
      displayPinLabels: { ...(paletteItem.initialPinLabels || {}) },
    };
    setComponents(prev => [...prev, newComponent]);
    setComponentToEdit(newComponent); // Open edit dialog for the new component
    setIsEditModalOpen(true);
    setIsPropertiesSidebarOpen(false);
    toast({ title: "Komponente hinzugefügt", description: `${newLabel} (${paletteItem.name}) wurde der Arbeitsfläche hinzugefügt.` });
  };

  const confirmDelete = (type: 'component' | 'connection', id: string) => {
    setDeleteTarget({ type, id });
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const componentLabel = components.find(c=>c.id === deleteTarget.id)?.label;
    if (deleteTarget.type === 'component') {
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
      toast({ title: "Verbindung gelöscht", description: `Verbindung ${deleteTarget.id} entfernt.` });
    }
    setIsConfirmDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConnectionContextMenu = (e: React.MouseEvent<SVGLineElement>, connectionId: string) => {
    e.preventDefault();
    confirmDelete('connection', connectionId);
  };
  
  const handleExportSVG = () => {
    exportSvg(svgRef.current, 'CircuitCraft_Design.svg');
    toast({ title: "SVG Exportiert", description: "Ihre Schaltung wurde als SVG heruntergeladen." });
  };


  return (
    <div className="flex flex-row h-screen w-full bg-background p-3 gap-3 overflow-hidden">
      <ComponentPalette
        onAddComponent={addComponent}
        isOpen={isPaletteOpen}
        onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
      />

      <div ref={canvasContainerRef} className="flex-1 flex flex-col items-stretch p-0 rounded-lg shadow-md bg-card min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">CircuitCraft Designer</h1>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAiSuggestionModalOpen(true)}>
                    <Lightbulb className="mr-2 h-4 w-4" /> KI Vorschlag
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSVG}>
                    <Download className="mr-2 h-4 w-4" /> SVG Export
                </Button>
            </div>
        </div>
        
        <div className="flex-grow p-4 overflow-auto relative min-h-0"> {/* Canvas container */}
          <CircuitCanvas
            svgRef={svgRef}
            components={components}
            connections={connections}
            connectingPin={connectingPin}
            currentMouseSvgCoords={currentMouseSvgCoords}
            getAbsolutePinCoordinates={getAbsolutePinCoordinates}
            onMouseDownComponent={handleMouseDownComponent}
            onPinClick={handlePinClick}
            onComponentClick={handleComponentClick}
            onConnectionContextMenu={handleConnectionContextMenu}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
          />
        </div>

        <Accordion type="single" collapsible className="w-full p-4 border-t border-border">
          <AccordionItem value="info">
            <AccordionTrigger className="text-sm hover:no-underline bg-gray-900 text-white hover:bg-gray-700 border border-gray-700 rounded-md px-4 py-2">
                <Info className="mr-2 h-4 w-4" /> Informationen & Bedienung
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-1 pt-2">
              <p><strong>Ziehen:</strong> Komponenten verschieben.</p>
              <p><strong>Verbinden:</strong> Blauen Anschlusspunkt klicken, dann Zielpunkt klicken.</p>
              <p><strong>Schalten:</strong> Auf Schalter (NO/NC) klicken, um Zustand zu ändern (wenn unterstützt).</p>
              <p><strong>Bearbeiten:</strong> Doppelklick auf Komponente für Details (Modal).</p>
              <p><strong>Details:</strong> Klick auf Komponente öffnet rechte Seitenleiste.</p>
              <p><strong>Löschen:</strong> Komponente über Seitenleiste, Verbindung per Rechtsklick.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {isPropertiesSidebarOpen && selectedComponentForSidebar && ( // ensure component is not null
        <div className={`transition-all duration-300 ease-in-out ${isPropertiesSidebarOpen ? 'w-72' : 'w-0'} overflow-hidden shrink-0`}>
             <PropertiesSidebar
                component={selectedComponentForSidebar}
                paletteComponent={getPaletteComponentById(selectedComponentForSidebar.firebaseComponentId)}
                onClose={() => setIsPropertiesSidebarOpen(false)}
                onUpdateComponent={handleUpdateComponentFromSidebar}
                onDeleteComponent={(id) => confirmDelete('component', id)}
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
          message={`Möchten Sie ${deleteTarget.type === 'component' ? `die Komponente "${components.find(c=>c.id === deleteTarget.id)?.label || deleteTarget.id}"` : 'diese Verbindung'} wirklich löschen?`}
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
