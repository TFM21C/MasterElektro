import type React from 'react';
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
import type { ElectricalComponent } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';

interface ComponentEditDialogProps {
  component: ElectricalComponent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newLabel: string, newPinLabels: Record<string, string>) => void;
}

const ComponentEditDialog: React.FC<ComponentEditDialogProps> = ({ component, isOpen, onClose, onSave }) => {
  const [currentLabel, setCurrentLabel] = React.useState(component.label);
  const [currentPinLabels, setCurrentPinLabels] = React.useState(
    component.displayPinLabels || COMPONENT_DEFINITIONS[component.type]?.initialDisplayPinLabels || {}
  );

  React.useEffect(() => {
    setCurrentLabel(component.label);
    setCurrentPinLabels(component.displayPinLabels || COMPONENT_DEFINITIONS[component.type]?.initialDisplayPinLabels || {});
  }, [component]);

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

  const definition = COMPONENT_DEFINITIONS[component.type];
  const canEditPins = component.type === 'Schließer' || component.type === 'Öffner';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Komponente bearbeiten</DialogTitle>
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

          {canEditPins && definition?.pins && (
            <>
              <h3 className="text-md font-semibold col-span-4 pt-2">Kontaktkennzeichnungen:</h3>
              {Object.keys(definition.pins).map((pinName, index) => (
                <div key={pinName} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`pin-${pinName}`} className="text-right">
                    Kontakt {index + 1}
                  </Label>
                  <Input
                    id={`pin-${pinName}`}
                    value={currentPinLabels[pinName] || ''}
                    onChange={(e) => handlePinLabelChange(pinName, e)}
                    className="col-span-3"
                  />
                </div>
              ))}
            </>
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
