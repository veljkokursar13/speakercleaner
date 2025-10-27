import React from 'react';
import EnergyPulse from './EnergyPulse';
import NeonWaveForm from './NeonWaveForm';
import QuantumField from './QuantomField';

export type VisualizerMode = 'vibe' | 'pulse' | 'quantum';

interface Props {
  mode?: VisualizerMode;
  isActive?: boolean;
}

export default function VisualizerManager({ mode = 'vibe', isActive = false }: Props) {
  switch (mode) {
    case 'vibe':
      return <NeonWaveForm isActive={isActive} />;
    case 'pulse':
      return <EnergyPulse isActive={isActive} />;
    case 'quantum':
      return <QuantumField isActive={isActive} />;
    default:
      return <NeonWaveForm isActive={isActive} />;
  }
}