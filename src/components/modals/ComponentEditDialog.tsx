import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ElectricalComponent, PaletteComponentFirebaseData } from '@/types/circuit';
// COMPONENT_DEFINITIONS is not directly needed here if all info comes from paletteComponent

interface ComponentEditDialogProps {
  component: ElectricalComponent;
  paletteComponent?: PaletteComponentFirebaseData; // Make optional or ensure it's always passed
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newLabel: string, newPinLabels: Record<string, string>) => void;
}

const ComponentEditDialog: React.FC<ComponentEditDialogProps> = ({ component, paletteComponent, isOpen, onClose, onSave }) => {
  const [currentLabel, setCurrentLabel] = useState(component.label);
  const [currentPinLabels, setCurrentPinLabels] = useState(
    component.displayPinLabels || paletteComponent?.initialPinLabels || {}
  );

  useEffect(() => {
    setCurrentLabel(component.label);
    setCurrentPinLabels(component.displayPinLabels || paletteComponent?.initialPinLabels || {});
  }, [component, paletteComponent]);

  const handleSave = () => {
    onSave(component.id, currentLabel, currentPinLabels);
    onClose();
  };

  const handlePinLabelChange = (pinName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPinLabels(prev => ({
      ...prev,
      [pinName]: e.target.value
    }));
  };

  if (!paletteComponent) {
    // Handle case where paletteComponent data might not be available (e.g., for legacy components)
    // Or ensure it's always passed by the parent. For now, let's render a generic title.
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent><DialogHeader><DialogTitle>Komponente bearbeiten</DialogTitle></DialogHeader>...</DialogContent>
        </Dialog>
    );
  }


  const canEditPins = paletteComponent.hasEditablePins;
  const pinKeysToEdit = Object.keys(paletteComponent.initialPinLabels || {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{`${paletteComponent.name} bearbeiten`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="component-label" className="text-right">
              Bezeichnung
            </Label>
            <Input
              id="component-label"
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              className="col-span-3"
            />
          </div>

          {canEditPins && pinKeysToEdit.length > 0 && (
            <>
              <h3 className="text-md font-semibold col-span-4 pt-2">Kontaktkennzeichnungen:</h3>
              {pinKeysToEdit.map((pinKey) => (
                <div key={pinKey} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`pin-${pinKey}`} className="text-right">
                    {/* Use a generic "Kontakt X" or try to get a more meaningful name if available */}
                    Kontakt {pinKey}
                  </Label>
                  <Input
                    id={`pin-${pinKey}`}
                    value={currentPinLabels[pinKey] || ''}
                    onChange={(e) => handlePinLabelChange(pinKey, e)}
                    className="col-span-3"
                    placeholder={paletteComponent.initialPinLabels[pinKey] || ''}
                  />
                </div>
              ))}
            </>
          )}
          {/* Add field for Time 'T' if it's a ZeitRelaisEin */}
          {paletteComponent.type === 'ZeitRelaisEin' && paletteComponent.initialPinLabels?.T !== undefined && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pin-T" className="text-right">
                Zeit (T)
              </Label>
              <Input
                id="pin-T"
                value={currentPinLabels['T'] || ''}
                onChange={(e) => handlePinLabelChange('T', e)}
                className="col-span-3"
                placeholder={paletteComponent.initialPinLabels['T'] || 'z.B. 5s'}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Abbrechen</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComponentEditDialog;
