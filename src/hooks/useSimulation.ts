import { useState, useCallback, useEffect } from 'react';
import type { ElectricalComponent, Connection, SimulatedComponentState, SimulatedConnectionState } from '@/types/circuit';
import { getPaletteComponentById } from '@/config/mock-palette-data';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';

const propagatePower = (
    currentComponents: ElectricalComponent[],
    currentConnections: Connection[],
    currentSimCompStates: { [key: string]: SimulatedComponentState }
) => {
    const energizedPins = new Set<string>();
    currentComponents.forEach(comp => {
        if (comp.type === '24V') {
            Object.keys(COMPONENT_DEFINITIONS[comp.type]?.pins || {}).forEach(pinName => {
                energizedPins.add(`${comp.id}/${pinName}`);
            });
        }
    });

    for (let i = 0; i < (currentComponents.length + currentConnections.length); i++) {
        let changedInIteration = false;
        currentConnections.forEach(conn => {
            const startKey = `${conn.startComponentId}/${conn.startPinName}`;
            const endKey = `${conn.endComponentId}/${conn.endPinName}`;
            const startComp = currentComponents.find(c => c.id === conn.startComponentId);
            const endComp = currentComponents.find(c => c.id === conn.endComponentId);
            if (!startComp || !endComp) return;
            const startState = currentSimCompStates[startComp.id];
            const endState = currentSimCompStates[endComp.id];
            const startConducts = startState?.currentContactState?.[conn.startPinName] !== 'open';
            const endConducts = endState?.currentContactState?.[conn.endPinName] !== 'open';
            
            if (energizedPins.has(startKey) && startConducts && !energizedPins.has(endKey) && endConducts) {
                energizedPins.add(endKey);
                changedInIteration = true;
            }
            if (energizedPins.has(endKey) && endConducts && !energizedPins.has(startKey) && startConducts) {
                energizedPins.add(startKey);
                changedInIteration = true;
            }
        });
        if (!changedInIteration) break;
    }
    return { energizedPins };
};

export const useSimulation = (isSimulating: boolean, components: ElectricalComponent[], connections: Connection[]) => {
    const [simulatedComponentStates, setSimulatedComponentStates] = useState<{ [key: string]: SimulatedComponentState }>({});
    const [simulatedConnectionStates, setSimulatedConnectionStates] = useState<{ [key: string]: SimulatedConnectionState }>({});

    const runSimulationStep = useCallback(() => {
        let hasChanged = false;
        
        setSimulatedComponentStates(currentSimStates => {
            let newSimCompStates = JSON.parse(JSON.stringify(currentSimStates));

            components.forEach(comp => {
                const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
                if (paletteComp?.simulation?.controlledBy === 'label_match') {
                    const controllingCoils = components.filter(c => c.label === comp.label && getPaletteComponentById(c.firebaseComponentId)?.simulation?.affectingLabel);
                    const isEnergized = controllingCoils.some(coil => newSimCompStates[coil.id]?.isEnergized);
                    const targetState = isEnergized ? paletteComp.simulation.outputPinStateOnEnergized : (paletteComp.simulation.outputPinStateOnDeEnergized || paletteComp.simulation.initialContactState);
                    if (JSON.stringify(newSimCompStates[comp.id].currentContactState) !== JSON.stringify(targetState)) {
                        newSimCompStates[comp.id].currentContactState = { ...targetState };
                        hasChanged = true;
                    }
                }
            });

            const { energizedPins } = propagatePower(components, connections, newSimCompStates);

            components.forEach(comp => {
                const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
                const simConfig = paletteComp?.simulation;
                if (!simConfig) return;
                const isNowEnergized = (simConfig.energizePins || []).every(pin => energizedPins.has(`${comp.id}/${pin}`));
                if (newSimCompStates[comp.id].isEnergized !== isNowEnergized) {
                    newSimCompStates[comp.id].isEnergized = isNowEnergized;
                    hasChanged = true;
                }
            });

            const newSimConnStates = connections.reduce((acc, conn) => {
                acc[conn.id] = { isConducting: energizedPins.has(`${conn.startComponentId}/${conn.startPinName}`) && energizedPins.has(`${conn.endComponentId}/${conn.endPinName}`) };
                return acc;
            }, {} as { [key: string]: SimulatedConnectionState });

            if (JSON.stringify(newSimConnStates) !== JSON.stringify(simulatedConnectionStates)) {
                setSimulatedConnectionStates(newSimConnStates);
                hasChanged = true;
            }

            if(hasChanged) return newSimCompStates;
            return currentSimStates;
        });
    }, [components, connections, simulatedConnectionStates]);

    useEffect(() => {
        if (isSimulating) {
            runSimulationStep();
        }
    }, [isSimulating, components, connections, runSimulationStep, simulatedComponentStates]);
    
    return {
        simulatedComponentStates, setSimulatedComponentStates,
        simulatedConnectionStates, setSimulatedConnectionStates,
        runSimulationStep,
    };
};
