import type React from 'react';
import { Button } from "@/components/ui/button";
import PaletteIcon from '@/components/circuit/PaletteIcon';
import { ChevronDown, ChevronsRightLeft } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ComponentPaletteProps {
  onAddComponent: (type: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const componentTypes = ['Schließer', 'Öffner', 'Motor', 'Lampe'];
const componentLabels: Record<string, string> = {
  'Schließer': 'Schalter NO',
  'Öffner': 'Schalter NC',
  'Motor': 'Motor',
  'Lampe': 'Lampe',
};


const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent, isOpen, onToggle }) => {
  return (
    <div className={`bg-card h-full p-3 flex flex-col shadow-lg transition-all duration-300 ease-in-out rounded-lg ${isOpen ? 'w-56' : 'w-16 items-center'}`}>
      <Button
        onClick={onToggle}
        variant="ghost"
        className={`w-full mb-4 flex items-center justify-center text-sm rounded-md ${isOpen ? 'bg-gray-900 text-white hover:bg-gray-700 py-2' : 'hover:bg-accent'}`}
        aria-label={isOpen ? "Palette schließen" : "Palette öffnen"}
      >
        {isOpen ? (
          <>
            Bauteile
            <ChevronDown className={`ml-2 h-4 w-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <ChevronsRightLeft className="h-5 w-5" />
        )}
      </Button>
      
      <ScrollArea className={`flex-grow w-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'}`}>
        {isOpen && <h3 className="text-md font-semibold bg-gray-900 text-white mb-3 p-2 rounded-md text-center">Steuerungstechnik</h3>}
        <div className="space-y-3 w-full">
          {componentTypes.map(type => (
            <Button
              key={type}
              onClick={() => onAddComponent(type)}
              variant="default"
              className="w-full h-24 py-2 px-2 bg-gray-900 text-white hover:bg-gray-700 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition duration-150 ease-in-out shadow-md flex flex-col items-center justify-center group border border-gray-700"
            >
              <PaletteIcon type={type} />
              {isOpen && <span className="mt-1.5 text-sm text-center leading-snug">{componentLabels[type]}</span>}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ComponentPalette;
