import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { suggestCircuitConfiguration, SuggestCircuitConfigurationInput } from '@/ai/flows/suggest-circuit-configuration';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface AiSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiSuggestionDialog: React.FC<AiSuggestionDialogProps> = ({ isOpen, onClose }) => {
  const [description, setDescription] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Bitte geben Sie eine Beschreibung ein.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const input: SuggestCircuitConfigurationInput = { circuitDescription: description };
      const result = await suggestCircuitConfiguration(input);
      setSuggestion(result.circuitSuggestion);
    } catch (err) {
      console.error("AI Suggestion Error:", err);
      setError("Fehler beim Abrufen des Vorschlags. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setSuggestion(null);
    setError(null);
    setIsLoading(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>KI-gestützte Schaltungsvorschläge</DialogTitle>
          <DialogDescription>
            Beschreiben Sie das gewünschte Verhalten Ihrer Schaltung. Die KI wird einen Konfigurationsvorschlag machen.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="circuit-description" className="text-sm font-medium">
              Schaltungsbeschreibung
            </Label>
            <Textarea
              id="circuit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Ein Motor soll laufen, wenn ein Schalter betätigt wird und eine Lampe leuchten, wenn der Motor läuft."
              className="mt-1 min-h-[100px]"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {suggestion && (
            <div>
              <h4 className="text-md font-semibold mb-2">Vorschlag:</h4>
              <ScrollArea className="h-[200px] w-full rounded-md border p-3 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap">{suggestion}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleClose}>Schließen</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Vorschlag erhalten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiSuggestionDialog;
