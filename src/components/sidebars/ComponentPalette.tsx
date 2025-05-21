import React, { useMemo } from 'react'; // Import React
import { Button } from "@/components/ui/button";
import PaletteIcon from '@/components/circuit/PaletteIcon';
import { ChevronDown, ChevronsRightLeft } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PaletteComponentFirebaseData } from '@/types/circuit';
import { MOCK_PALETTE_COMPONENTS } from '@/config/mock-palette-data'; // Import mock data

interface ComponentPaletteProps {
  onAddComponent: (componentData: PaletteComponentFirebaseData) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent, isOpen, onToggle }) => {
  const groupedComponents = useMemo(() => {
    return MOCK_PALETTE_COMPONENTS.reduce((acc, component) => {
      const category = component.category || 'Sonstige';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(component);
      return acc;
    }, {} as Record<string, PaletteComponentFirebaseData[]>);
  }, []);

  const categories = Object.keys(groupedComponents);

  return (
    <div className={`bg-card h-full p-3 flex flex-col shadow-lg transition-all duration-300 ease-in-out rounded-lg ${isOpen ? 'w-64' : 'w-16 items-center'}`}> {/* Increased width when open */}
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
        {isOpen && categories.map(category => (
          <div key={category} className="mb-4">
            <h3 className="text-md font-semibold bg-gray-900 text-white mb-2 p-2 rounded-md text-center sticky top-0 z-10">
              {category}
            </h3>
            <div className="space-y-2 w-full">
              {groupedComponents[category].map(componentData => (
                <Button
                  key={componentData.id}
                  onClick={() => onAddComponent(componentData)}
                  variant="outline" 
                  className="w-full h-auto p-2 bg-card hover:bg-muted focus:ring-2 focus:ring-ring focus:ring-offset-2 transition duration-150 ease-in-out shadow-md flex flex-col items-center justify-center group border-border text-left"
                >
                  <PaletteIcon type={componentData.paletteIconType || componentData.type} />
                  <span className="mt-1.5 px-2 py-1 bg-gray-900 text-white rounded-md text-xs font-medium text-center w-auto inline-block leading-snug max-w-full break-words">
                    {componentData.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default ComponentPalette;
