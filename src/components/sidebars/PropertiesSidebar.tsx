import React from 'react'; // Import React
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { ElectricalComponent, PaletteComponentFirebaseData } from '@/types/circuit';
// COMPONENT_DEFINITIONS is not directly needed here if info comes from paletteComponent

interface PropertiesSidebarProps {
  component: ElectricalComponent | null;
  paletteComponent?: PaletteComponentFirebaseData;
  onClose: () => void;
  onUpdateComponent: (id: string, updates: Partial<ElectricalComponent>) => void;
  onDeleteComponent: (id: string) => void;
}

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({ component, paletteComponent, onClose, onUpdateComponent, onDeleteComponent }) => {
  if (!component || !paletteComponent) return null;


  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateComponent(component.id, { label: e.target.value });
  };

  const handlePinLabelChange = (pinName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newPinLabels = {
      ...(component.displayPinLabels || {}),
      [pinName]: e.target.value
    };
    onUpdateComponent(component.id, { displayPinLabels: newPinLabels });
  };
  
  const canEditPins = paletteComponent.hasEditablePins;
  const pinKeysToEdit = Object.keys(paletteComponent.initialPinLabels || {});


  return (
    <div className="h-full w-full bg-card p-4 flex flex-col rounded-lg shadow-md">
      <ScrollArea className="flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">{paletteComponent.name} Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </Button>
        </div>

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
            />
          </div>

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
                      placeholder={paletteComponent.initialPinLabels[pinKey] || ''}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Add field for Time 'T' if it's a ZeitRelaisEin */}
          {paletteComponent.type === 'ZeitRelaisEin' && paletteComponent.initialPinLabels?.T !== undefined && (
             <div>
              <h3 className="text-md font-semibold mb-2 text-card-foreground">Einstellungen:</h3>
                <div className="flex items-center">
                  <Label htmlFor="sidebar-pin-T" className="text-sm text-muted-foreground mr-2 w-1/3">
                    Zeit (T):
                  </Label>
                  <Input
                    id="sidebar-pin-T"
                    type="text"
                    value={component.displayPinLabels?.['T'] || ''}
                    onChange={(e) => handlePinLabelChange('T', e)}
                    className="w-2/3"
                    placeholder={paletteComponent.initialPinLabels['T'] || 'z.B. 5s'}
                  />
                </div>
            </div>
          )}

           <div>
            <p className="text-sm text-muted-foreground">Typ: <span className="font-medium text-card-foreground">{paletteComponent.name}</span></p>
            <p className="text-sm text-muted-foreground">ID: <span className="font-medium text-card-foreground">{component.id}</span></p>
            <p className="text-sm text-muted-foreground">Position: <span className="font-medium text-card-foreground">X: {Math.round(component.x)}, Y: {Math.round(component.y)}</span></p>
          </div>
        </div>
      </ScrollArea>
      <Button
        onClick={() => onDeleteComponent(component.id)}
        variant="destructive"
        className="mt-6 w-full"
      >
        Komponente löschen
      </Button>
    </div>
  );
};

export default PropertiesSidebar;
