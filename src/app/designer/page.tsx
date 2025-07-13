"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info, ChevronLeft, Play } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

import type { Point, ProjectType } from '@/types/circuit';
import ComponentEditDialog from '@/components/modals/ComponentEditDialog';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import PropertiesSidebar from '@/components/sidebars/PropertiesSidebar';
import ComponentPalette from '@/components/sidebars/ComponentPalette';
import CircuitCanvas from '@/components/canvas/CircuitCanvas';
import AiSuggestionDialog from '@/components/modals/AiSuggestionDialog';
import { exportSvg } from '@/lib/svg-export';
import { useCircuitState } from '@/hooks/useCircuitState';
import { useSimulation } from '@/hooks/useSimulation';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { MOCK_PALETTE_COMPONENTS } from '@/config/mock-palette-data';

const DesignerPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const projectName = searchParams.get('projectName') || "Unbenanntes Projekt";
  const projectType = searchParams.get('projectType') as ProjectType | null || "Steuerstromkreis";

  const {
      components, setComponents, addComponent, updateComponent, removeComponent,
      connections, setConnections, addConnection, updateConnection, removeConnection, addWaypoint, removeWaypoint,
      getAbsolutePinCoordinates,
  } = useCircuitState();

  const filteredPaletteComponents = React.useMemo(() => {
    return MOCK_PALETTE_COMPONENTS.filter(comp => {
      if (projectType === "Installationsschaltplan") {
        return comp.category === "Installationselemente" || comp.category === "Energieversorgung";
      }
      return comp.category?.includes("Steuerstrom") || comp.category === "Energieversorgung" || comp.category === "Befehlsgeräte" || comp.category === "Speichernde / Verarbeitende" || comp.category === "Stellglieder";
    });
  }, [projectType]);

  const [connectingPin, setConnectingPin] = useState<{ componentId: string; pinName: string, coords: Point } | null>(null);
  const [currentMouseSvgCoords, setCurrentMouseSvgCoords] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'component' | 'connection' | 'waypoint'; id: string, waypointIndex?: number } | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  
  const [selectedComponentForSidebar, setSelectedComponentForSidebar] = useState<any | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isPropertiesSidebarOpen, setIsPropertiesSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);
  const { toast } = useToast();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const { simulatedComponentStates, simulatedConnectionStates, setSimulatedComponentStates, setSimulatedConnectionStates } = useSimulation(isSimulating, components, connections);
  const { handleMouseDownComponent, handleWaypointMouseDown, handleMouseMove, handleMouseUpGlobal } = useDragAndDrop(isSimulating, setComponents, setConnections);
  
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e, svgRef);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [handleMouseMove, handleMouseUpGlobal]);

  const handlePinClick = useCallback((componentId: string, pinName: string, pinCoords: Point) => {
    if (connectingPin) {
      addConnection({ startComponentId: connectingPin.componentId, startPinName: connectingPin.pinName, endComponentId: componentId, endPinName: pinName });
      setConnectingPin(null);
    } else {
      setConnectingPin({ componentId, pinName, coords: pinCoords });
    }
  }, [addConnection, connectingPin]);

  const handleComponentClick = useCallback((id: string, isDoubleClick = false) => {
      if (isDoubleClick) {
          const comp = components.find(c => c.id === id);
          if (comp) {
              setComponentToEdit(comp);
              setIsEditModalOpen(true);
          }
      } else {
          setSelectedComponentForSidebar(components.find(c => c.id === id) || null);
          setSelectedConnectionId(null);
          setIsPropertiesSidebarOpen(true);
      }
  }, [components]);
  
  const handleConnectionClick = useCallback((connectionId: string, clickCoords: Point) => {
    addWaypoint(connectionId, clickCoords);
    setSelectedConnectionId(connectionId);
    setSelectedComponentForSidebar(null);
    setIsPropertiesSidebarOpen(true);
  }, [addWaypoint]);

  const confirmDelete = useCallback((type: 'component' | 'connection' | 'waypoint', id: string, waypointIndex?: number) => {
    setDeleteTarget({ type, id, waypointIndex });
    setIsConfirmDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const { type, id, waypointIndex } = deleteTarget;
    if (type === 'component') removeComponent(id);
    else if (type === 'connection') removeConnection(id);
    else if (type === 'waypoint' && waypointIndex !== undefined) removeWaypoint(id, waypointIndex);
    setIsConfirmDeleteModalOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, removeComponent, removeConnection, removeWaypoint]);

  return (
    <div className="flex flex-row h-screen w-full bg-background p-3 gap-3 overflow-hidden">
        <ComponentPalette onAddComponent={addComponent} isOpen={isPaletteOpen} onToggle={() => setIsPaletteOpen(p => !p)} paletteComponents={filteredPaletteComponents} isSimulating={isSimulating} />
        <div className="flex-1 flex flex-col items-stretch p-0 rounded-lg shadow-md bg-card min-w-0">
            <div className="flex justify-between items-center p-4 border-b border-border">
                {/* Header Content */}
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
                    onMouseUpComponent={() => {}}
                    onPinClick={handlePinClick}
                    onComponentClick={handleComponentClick}
                    onConnectionClick={handleConnectionClick}
                    onWaypointMouseDown={handleWaypointMouseDown}
                    onWaypointDoubleClick={(connId, index) => confirmDelete('waypoint', connId, index)}
                    width={800} height={700}
                    isSimulating={isSimulating}
                    simulatedConnectionStates={simulatedConnectionStates}
                    simulatedComponentStates={simulatedComponentStates}
                    selectedConnectionId={selectedConnectionId}
                    projectType={projectType}
                />
            </div>
            {/* Accordion... */}
        </div>
        {isPropertiesSidebarOpen && (
            <PropertiesSidebar
                component={selectedComponentForSidebar}
                connection={connections.find(c => c.id === selectedConnectionId)}
                allComponents={components}
                connections={connections}
                onClose={() => setIsPropertiesSidebarOpen(false)}
                onUpdateComponent={updateComponent}
                onDeleteComponent={(id) => confirmDelete('component', id)}
                onDeleteConnection={(id) => confirmDelete('connection', id)}
                onUpdateConnectionEndpoint={(id, compId, pinName) => updateConnection(id, {endComponentId: compId, endPinName: pinName})}
                onUpdateConnection={updateConnection}
                isSimulating={isSimulating}
                projectType={projectType}
            />
        )}
        {componentToEdit && <ComponentEditDialog component={componentToEdit} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={(id, label, pinLabels) => updateComponent(id, {label, displayPinLabels: pinLabels})} />}
        {deleteTarget && <ConfirmDeleteDialog isOpen={isConfirmDeleteModalOpen} message="Möchten Sie dieses Element wirklich löschen?" onConfirm={handleConfirmDelete} onCancel={() => setIsConfirmDeleteModalOpen(false)} />}
        <AiSuggestionDialog isOpen={isAiSuggestionModalOpen} onClose={() => setIsAiSuggestionModalOpen(false)} />
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
