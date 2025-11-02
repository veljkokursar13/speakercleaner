/**
 * Modes - Mode-specific logic and components
 * 
 * Each mode is self-contained with its own:
 * - Component (UI)
 * - Hook (logic)
 * - Types (type definitions)
 */

// Manual Mode
export { ManualMode, useManualMode } from './manual';
export type { ManualModeConfig, Waveform } from './manual';

// Auto Mode
export { AutoMode, useAutoMode } from './auto';
export type { CleaningTechnique, VisualizerMode, CleaningTechniqueInfo } from './auto';

// Smart Mode
export { SmartDiagnosis, useDiagnosis } from './smart';
export type { DiagnosticStep, DiagnosticPhase } from './smart';

