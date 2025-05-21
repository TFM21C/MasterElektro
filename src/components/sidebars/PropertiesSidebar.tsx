import type React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { ElectricalComponent } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';

interface PropertiesSidebarProps {
  component: ElectricalComponent | null;
  onClose: () => void;
  onUpdateComponent: (id: string, updates: Partial<ElectricalComponent>) => void;
  onDeleteComponent: (id: string) => void;
}

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({ component, onClose, onUpdateComponent, onDeleteComponent }) => {
  if (!component) return null;

  const definition = COMPONENT_DEFINITIONS[component.type];

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateComponent(component.id, { label: e.target.value });
  };

  const handlePinLabelChange = (pinName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateComponent(component.id, {
      displayPinLabels: {
        ...(component.displayPinLabels || {}),
        [pinName]: e.target.value
      }
    });
  };

  const canEditPins = component.type === 'Schließer' || component.type === 'Öffner';

  return (
    <div className="h-full w-full bg-card p-4 flex flex-col rounded-lg shadow-md">
      <ScrollArea className="flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">Details</h2>
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

          {canEditPins && definition?.pins && (
            <div>
              <h3 className="text-md font-semibold mb-2 text-card-foreground">Kontaktkennzeichnungen:</h3>
              <div className="space-y-3">
                {Object.keys(definition.pins).map((pinName, index) => (
                  <div key={pinName} className="flex items-center">
                    <Label htmlFor={`sidebar-pin-${pinName}`} className="text-sm text-muted-foreground mr-2 w-1/3">
                      Kontakt {index + 1}:
                    </Label>
                    <Input
                      id={`sidebar-pin-${pinName}`}
                      type="text"
                      value={component.displayPinLabels?.[pinName] || ''}
                      onChange={(e) => handlePinLabelChange(pinName, e)}
                      className="w-2/3"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
           <div>
            <p className="text-sm text-muted-foreground">Typ: <span className="font-medium text-card-foreground">{component.type}</span></p>
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
