
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ElectricalComponent, PaletteComponentFirebaseData, Connection, ProjectType } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import { getPaletteComponentById } from '@/config/mock-palette-data';

interface PropertiesSidebarProps {
  component: ElectricalComponent | null;
  paletteComponent?: PaletteComponentFirebaseData;
  connection?: Connection;
  allComponents: ElectricalComponent[];
  connections: Connection[];
  onClose: () => void;
  onUpdateComponent: (id: string, updates: Partial<ElectricalComponent>) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onUpdateConnectionEndpoint: (connectionId: string, newEndComponentId: string, newEndPinName: string) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  onComponentClick: (id: string, isDoubleClick?: boolean, clickCoords?: {x:number, y:number}) => void;
  isSimulating?: boolean;
  projectType?: ProjectType | null;
}

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  component,
  paletteComponent,
  connection,
  allComponents,
  connections,
  onClose,
  onUpdateComponent,
  onDeleteComponent,
  onDeleteConnection,
  onUpdateConnectionEndpoint,
  onUpdateConnection,
  onComponentClick,
  isSimulating,
  projectType
}) => {

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (component) {
      onUpdateComponent(component.id, { label: e.target.value });
    }
  };

  const handlePinLabelChange = (pinName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (component) {
      const newPinLabels = {
        ...(component.displayPinLabels || {}),
        [pinName]: e.target.value
      };
      onUpdateComponent(component.id, { displayPinLabels: newPinLabels });
    }
  };

  const handleScaleChange = (newScale: number[]) => {
    if (component) {
      onUpdateComponent(component.id, { scale: newScale[0] });
    }
  };

  const handleScaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (component && paletteComponent) {
      let newScale = parseFloat(e.target.value);
      if (isNaN(newScale)) newScale = 1.0;

      const minScale = paletteComponent.minScale || 0.1;
      const maxScale = paletteComponent.maxScale || 5.0;

      if (newScale < minScale) newScale = minScale;
      if (newScale > maxScale) newScale = maxScale;

      onUpdateComponent(component.id, { scale: newScale });
    }
  };

  const resetScale = () => {
    if (component) {
      onUpdateComponent(component.id, { scale: 1.0 });
    }
  };

  const getAvailablePinsForConnection = (currentConnection: Connection): { value: string; label: string }[] => {
    const availablePins: { value: string; label: string }[] = [];
    const occupiedPins = new Set<string>();

    connections.forEach(conn => {
      if (conn.id !== currentConnection.id) {
        occupiedPins.add(`${conn.startComponentId}/${conn.startPinName}`);
        occupiedPins.add(`${conn.endComponentId}/${conn.endPinName}`);
      }
    });
    occupiedPins.add(`${currentConnection.startComponentId}/${currentConnection.startPinName}`);


    allComponents.forEach(comp => {
      const definition = COMPONENT_DEFINITIONS[comp.type];
      if (definition?.pins) {
        Object.entries(definition.pins).forEach(([pinName, pinDef]) => {
          const pinId = `${comp.id}/${pinName}`;
          if (!occupiedPins.has(pinId) || (comp.id === currentConnection.endComponentId && pinName === currentConnection.endPinName)) {
            availablePins.push({
              value: pinId,
              label: `${comp.label} - ${pinDef.label || pinName}`,
            });
          }
        });
      }
    });
    return availablePins;
  };

  const handleConnectionEndpointChange = (newEndpointValue: string) => {
    if (connection && newEndpointValue) {
      const [newEndComponentId, newEndPinName] = newEndpointValue.split('/');
      if (newEndComponentId && newEndPinName) {
        onUpdateConnectionEndpoint(connection.id, newEndComponentId, newEndPinName);
      }
    }
  };

  const handleConnectionColorChange = (newColor: string) => {
    if (connection) {
      onUpdateConnection(connection.id, { color: newColor });
    }
  };

  const handleConnectionWiresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (connection) {
      const numWires = parseInt(e.target.value, 10);
      onUpdateConnection(connection.id, { numberOfWires: isNaN(numWires) || numWires < 1 ? 1 : numWires });
    }
  };


  if (!component && !connection && !isSimulating) return null;

  const canEditPins = component && paletteComponent && paletteComponent.hasEditablePins;
  const pinKeysToEdit = component && paletteComponent ? Object.keys(paletteComponent.initialPinLabels || {}) : [];
  const isResizable = component && paletteComponent && paletteComponent.resizable === true;
  const currentScale = component?.scale || 1.0;

  const startComponent = connection ? allComponents.find(c => c.id === connection.startComponentId) : null;
  const endComponent = connection ? allComponents.find(c => c.id === connection.endComponentId) : null;
  const startPinDef = startComponent ? COMPONENT_DEFINITIONS[startComponent.type]?.pins?.[connection!.startPinName] : null;
  const endPinDef = endComponent ? COMPONENT_DEFINITIONS[endComponent.type]?.pins?.[connection!.endPinName] : null;

  const isInstallationPlan = projectType === "Installationsschaltplan";

  if (isSimulating) {
    const interactableComponents = allComponents.filter(c => {
      const palette = getPaletteComponentById(c.firebaseComponentId);
      return palette?.simulation?.interactable;
    });

    return (
      <div className="h-full w-full bg-card p-4 flex flex-col rounded-lg shadow-md">
        <ScrollArea className="flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">Simulationssteuerung</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-4">
            {interactableComponents.map(comp => (
              <div key={comp.id} className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">{comp.label}</span>
                <Button variant="outline" size="sm" onClick={() => onComponentClick(comp.id)}>
                  Betätigen
                </Button>
              </div>
            ))}
            {interactableComponents.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine bedienbaren Bauteile vorhanden.</p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card p-4 flex flex-col rounded-lg shadow-md">
      <ScrollArea className="flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">
            {component && paletteComponent ? `${paletteComponent.name} Details` : connection ? "Verbindung bearbeiten" : "Details"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar" disabled={isSimulating}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {component && paletteComponent && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="sidebar-component-label" className="text-sm font-medium text-muted-foreground">
                Bezeichnung:
              </Label>
              <Input
                id="sidebar-component-label"
                type="text"
                value={component.label}
                onChange={handleLabelChange}
                className="mt-1"
                disabled={isSimulating}
              />
            </div>

            {isResizable && (
              <div>
                <h3 className="text-md font-semibold mb-2 text-card-foreground">Größe</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sidebar-component-scale" className="text-sm text-muted-foreground w-1/3">
                      Skalierung:
                    </Label>
                    <Input
                      id="sidebar-component-scale-input"
                      type="number"
                      value={(currentScale * 100).toFixed(0)}
                      onChange={(e) => handleScaleInputChange({ target: { value: (parseFloat(e.target.value) / 100).toString() } } as any)}
                      className="w-20 text-sm hide-arrows"
                      min={(paletteComponent.minScale || 0.1) * 100}
                      max={(paletteComponent.maxScale || 5.0) * 100}
                      step={(paletteComponent.scaleStep || 0.1) * 100}
                      disabled={isSimulating}
                    />
                     <span className="text-sm text-muted-foreground">%</span>
                    <Button variant="ghost" size="icon" onClick={resetScale} title="Größe zurücksetzen" disabled={isSimulating}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <Slider
                    id="sidebar-component-scale"
                    value={[currentScale]}
                    min={paletteComponent.minScale || 0.1}
                    max={paletteComponent.maxScale || 5.0}
                    step={paletteComponent.scaleStep || 0.01}
                    onValueChange={handleScaleChange}
                    className="w-full"
                    disabled={isSimulating}
                  />
                </div>
              </div>
            )}

            {canEditPins && pinKeysToEdit.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2 text-card-foreground">Kontaktkennzeichnungen:</h3>
                <div className="space-y-3">
                  {pinKeysToEdit.map((pinKey) => (
                    <div key={pinKey} className="flex items-center">
                      <Label htmlFor={`sidebar-pin-${pinKey}`} className="text-sm text-muted-foreground mr-2 w-1/3">
                         Kontakt {pinKey}:
                      </Label>
                      <Input
                        id={`sidebar-pin-${pinKey}`}
                        type="text"
                        value={component.displayPinLabels?.[pinKey] || ''}
                        onChange={(e) => handlePinLabelChange(pinKey, e)}
                        className="w-2/3"
                        placeholder={paletteComponent.initialPinLabels?.[pinKey] || ''}
                        disabled={isSimulating}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paletteComponent.type === 'ZeitRelaisEin' && paletteComponent.initialPinLabels?.T !== undefined && (
               <div>
                <h3 className="text-md font-semibold mb-2 text-card-foreground">Einstellungen:</h3>
                  <div className="flex items-center">
                    <Label htmlFor="sidebar-pin-T" className="text-sm text-muted-foreground mr-2 w-1/3">
                      Zeit (T in s):
                    </Label>
                    <Input
                      id="sidebar-pin-T"
                      type="text"
                      value={component.displayPinLabels?.['T'] || ''}
                      onChange={(e) => handlePinLabelChange('T', e)}
                      className="w-2/3"
                      placeholder={paletteComponent.initialPinLabels?.['T'] || 'z.B. 5'}
                      disabled={isSimulating}
                    />
                  </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Typ: <span className="font-medium text-card-foreground">{paletteComponent.name}</span></p>
              <p className="text-sm text-muted-foreground">ID: <span className="font-medium text-card-foreground">{component.id}</span></p>
              <p className="text-sm text-muted-foreground">Position: <span className="font-medium text-card-foreground">X: {Math.round(component.x)}, Y: {Math.round(component.y)}</span></p>
              {isResizable && (
                <p className="text-sm text-muted-foreground">Aktuelle Skalierung: <span className="font-medium text-card-foreground">{(currentScale * 100).toFixed(0)}%</span></p>
              )}
            </div>

            {isSimulating && paletteComponent?.simulation?.interactable && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-md font-semibold mb-2 text-card-foreground">Simulations-Steuerung</h3>
                <Button
                  onClick={() => onComponentClick(component.id)}
                  variant="outline"
                  className="w-full"
                >
                  Kontakt betätigen
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Simuliert einen Klick auf das Bauteil, um dessen Zustand zu ändern.
                </p>
              </div>
            )}
          </div>
        )}

        {connection && (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-semibold text-card-foreground">Aktuelle Verbindung:</h3>
              <p className="text-sm text-muted-foreground">ID: <span className="font-medium text-card-foreground">{connection.id}</span></p>
              <p className="text-sm text-muted-foreground">Start:
                <span className="font-medium text-card-foreground"> {startComponent?.label || connection.startComponentId}</span> - Pin
                <span className="font-medium text-card-foreground"> {startPinDef?.label || connection.startPinName}</span>
              </p>
              <p className="text-sm text-muted-foreground">Ende:
                <span className="font-medium text-card-foreground"> {endComponent?.label || connection.endComponentId}</span> - Pin
                <span className="font-medium text-card-foreground"> {endPinDef?.label || connection.endPinName}</span>
              </p>
            </div>
            {!isSimulating && (
            <div>
              <Label htmlFor="connection-endpoint" className="text-sm font-medium text-muted-foreground">
                Neuer Endpunkt:
              </Label>
              <Select
                value={`${connection.endComponentId}/${connection.endPinName}`}
                onValueChange={handleConnectionEndpointChange}
                disabled={isSimulating}
              >
                <SelectTrigger id="connection-endpoint" className="mt-1">
                  <SelectValue placeholder="Neuen Endpunkt auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePinsForConnection(connection).map(pin => (
                    <SelectItem key={pin.value} value={pin.value}>
                      {pin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground mt-1">
                <AlertTriangle className="inline h-3 w-3 mr-1"/>
                Nur Pins, die noch nicht Teil einer anderen Verbindung sind, werden angezeigt.
              </p>
            </div>
            )}
            {isInstallationPlan && !isSimulating && (
              <>
                <div>
                  <Label htmlFor="connection-color" className="text-sm font-medium text-muted-foreground">
                    Linienfarbe:
                  </Label>
                  <Select
                    value={connection.color || 'black'}
                    onValueChange={handleConnectionColorChange}
                    disabled={isSimulating}
                  >
                    <SelectTrigger id="connection-color" className="mt-1">
                      <SelectValue placeholder="Farbe auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L1">L1 (Braun)</SelectItem>
                      <SelectItem value="N">N (Blau)</SelectItem>
                      <SelectItem value="PE">PE (Grün-Gelb)</SelectItem>
                      <SelectItem value="black">Schwarz (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="connection-wires" className="text-sm font-medium text-muted-foreground">
                    Aderanzahl:
                  </Label>
                  <Input
                    id="connection-wires"
                    type="number"
                    min="1"
                    value={connection.numberOfWires || 1}
                    onChange={handleConnectionWiresChange}
                    className="mt-1"
                    disabled={isSimulating}
                  />
                </div>
              </>
            )}
          </div>
        )}

      </ScrollArea>
      {component && !isSimulating && (
        <Button
          onClick={() => onDeleteComponent(component.id)}
          variant="destructive"
          className="mt-6 w-full"
          disabled={isSimulating}
        >
          Komponente löschen
        </Button>
      )}
      {connection && !isSimulating &&(
        <Button
          onClick={() => onDeleteConnection(connection.id)}
          variant="destructive"
          className="mt-6 w-full"
          disabled={isSimulating}
        >
          Verbindung löschen
        </Button>
      )}
      {isSimulating && (
        <p className="mt-6 text-sm text-center text-destructive bg-destructive/10 p-2 rounded-md">
          Bearbeitung im Simulationsmodus deaktiviert.
        </p>
      )}

      <style jsx global>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default PropertiesSidebar;
