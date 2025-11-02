/**
 * Auto Mode Types
 */

export type CleaningTechnique = 'auto' | 'water' | 'dust' | 'sand';

export type VisualizerMode = 'vibe' | 'pulse' | 'quantum';

export interface CleaningTechniqueInfo {
  id: CleaningTechnique;
  label: string;
  description: string;
  icon: string;
  visualizer: VisualizerMode;
}

