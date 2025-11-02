/**
 * Cleaning Pattern Presets
 */

export type Preset = {
  id: 'water' | 'dust' | 'sand';
  name: string;
  sequence: CleanSequence;
};

export type SequenceStep = {
  kind: 'tone' | 'sweep' | 'silence';
  frequency?: number;
  fromHz?: number;
  toHz?: number;
  durationMs: number;
  gain?: number;
};

export type CleanSequence = SequenceStep[];

export const presets: Preset[] = [
  {
    id: 'water',
    name: 'Water Ejection',
    sequence: [
      { kind: 'tone', frequency: 180, durationMs: 2500 },
      { kind: 'sweep', fromHz: 300, toHz: 10000, durationMs: 5000 },
    ],
  },
  {
    id: 'dust',
    name: 'Dust Shake',
    sequence: [
      { kind: 'tone', frequency: 950, durationMs: 2500 },
      { kind: 'silence', durationMs: 400 },
      { kind: 'tone', frequency: 12000, durationMs: 1500 },
    ],
  },
  {
    id: 'sand',
    name: 'Sand Clear',
    sequence: [
      { kind: 'sweep', fromHz: 200, toHz: 12000, durationMs: 6000 },
    ],
  },
];

export const defaultSequence: CleanSequence = [
  { kind: 'tone', frequency: 180, durationMs: 2000, gain: 0.9 },
  { kind: 'sweep', fromHz: 200, toHz: 12000, durationMs: 4000, gain: 1 },
  { kind: 'silence', durationMs: 500 },
  { kind: 'tone', frequency: 950, durationMs: 2000, gain: 0.9 },
];
