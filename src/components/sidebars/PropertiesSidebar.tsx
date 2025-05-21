
import React from 'react'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw } from "lucide-react"; // Added RotateCcw for reset
import { Slider } from "@/components/ui/slider";
import type { ElectricalComponent, PaletteComponentFirebaseData } from '@/types/circuit';

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
  
  const handleScaleChange = (newScale: number[]) => {
    onUpdateComponent(component.id, { scale: newScale[0] });
  };

  const handleScaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newScale = parseFloat(e.target.value);
    if (isNaN(newScale)) newScale = 1.0; // Default to 1 if input is invalid
    
    const minScale = paletteComponent.minScale || 0.1;
    const maxScale = paletteComponent.maxScale || 5.0;

    if (newScale < minScale) newScale = minScale;
    if (newScale > maxScale) newScale = maxScale;
    
    onUpdateComponent(component.id, { scale: newScale });
  };

  const resetScale = () => {
    onUpdateComponent(component.id, { scale: 1.0 });
  };

  const canEditPins = paletteComponent.hasEditablePins;
  const pinKeysToEdit = Object.keys(paletteComponent.initialPinLabels || {});
  const isResizable = paletteComponent.resizable === true;
  const currentScale = component.scale || 1.0;

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
                    className="w-20 text-sm hide-arrows" // Added hide-arrows class if needed
                    min={(paletteComponent.minScale || 0.1) * 100}
                    max={(paletteComponent.maxScale || 5.0) * 100}
                    step={(paletteComponent.scaleStep || 0.1) * 100}
                  />
                   <span className="text-sm text-muted-foreground">%</span>
                  <Button variant="ghost" size="icon" onClick={resetScale} title="Größe zurücksetzen">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <Slider
                  id="sidebar-component-scale"
                  value={[currentScale]}
                  min={paletteComponent.minScale || 0.1}
                  max={paletteComponent.maxScale || 5.0}
                  step={paletteComponent.scaleStep || 0.01} // Slider step needs to be more granular for smooth experience
                  onValueChange={handleScaleChange}
                  className="w-full"
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
                      placeholder={paletteComponent.initialPinLabels[pinKey] || ''}
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
             {isResizable && <p className="text-sm text-muted-foreground">Aktuelle Skalierung: <span className="font-medium text-card-foreground">{(currentScale * 100).toFixed(0)}%</span></p>}
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
