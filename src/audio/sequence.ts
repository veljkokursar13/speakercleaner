export type SequenceStep = {
  kind: 'tone' | 'sweep' | 'silence';
  frequency?: number;
  fromHz?: number;
  toHz?: number;
  durationMs: number;
  gain?: number;
};

export type CleanSequence = SequenceStep[];

export const defaultSequence: CleanSequence = [
  { kind: 'tone', frequency: 180, durationMs: 2000, gain: 0.9 },
  { kind: 'sweep', fromHz: 200, toHz: 12000, durationMs: 4000, gain: 1 },
  { kind: 'silence', durationMs: 500 },
  { kind: 'tone', frequency: 950, durationMs: 2000, gain: 0.9 },
];


