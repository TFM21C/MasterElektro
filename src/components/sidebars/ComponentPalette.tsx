
import React, { useMemo } from 'react'; 
import { Button } from "@/components/ui/button";
import PaletteIcon from '@/components/circuit/PaletteIcon';
import { ChevronDown, ChevronsRightLeft } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PaletteComponentFirebaseData } from '@/types/circuit';

interface ComponentPaletteProps {
  onAddComponent: (componentData: PaletteComponentFirebaseData) => void;
  isOpen: boolean;
  onToggle: () => void;
  paletteComponents: PaletteComponentFirebaseData[];
  isSimulating?: boolean; // Added to prevent adding components during simulation
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent, isOpen, onToggle, paletteComponents, isSimulating }) => {
  const groupedComponents = useMemo(() => {
    return paletteComponents.reduce((acc, component) => {
      const category = component.category || 'Sonstige';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(component);
      return acc;
    }, {} as Record<string, PaletteComponentFirebaseData[]>);
  }, [paletteComponents]);

  const categories = Object.keys(groupedComponents).sort();

  return (
    <div className={`bg-card h-full p-3 flex flex-col shadow-lg transition-all duration-300 ease-in-out rounded-lg ${isOpen ? 'w-64' : 'w-16 items-center'}`}>
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
      
      <ScrollArea className="flex-grow w-full">
        <div 
          className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            maxHeight: isOpen ? '10000px' : '0px', // Use a large fixed maxHeight when open, 0px when closed
            overflow: 'hidden' // Ensure content is clipped during animation
          }}
        >
          {/* Content is ALWAYS rendered, visibility controlled by parent div's maxHeight and opacity */}
          {categories.map(category => (
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
                    disabled={isSimulating} // Disable adding components during simulation
                  >
                    <div className="bg-white p-1 rounded mb-1.5 inline-block">
                      <PaletteIcon type={componentData.paletteIconType || componentData.type} />
                    </div>
                    <span className="px-2 py-1 bg-gray-900 text-white rounded-md text-xs font-medium text-center w-auto inline-block leading-snug max-w-full break-words">
                      {componentData.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ComponentPalette;
