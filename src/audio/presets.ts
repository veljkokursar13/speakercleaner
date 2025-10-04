import { CleanSequence } from './sequence';

export type Preset = {
  id: 'water' | 'dust' | 'sand';
  name: string;
  sequence: CleanSequence;
};

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


