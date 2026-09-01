export interface FireplaceCodeDefinition {
  id: string;
  name: string;
  hex: string;
  protocol: 'NEC';
  description: string;
}

export const FIREPLACE_CODES = {
  changeColor: {
    id: 'fp-color',
    name: 'Change Color',
    hex: 'C2E238C7',
    protocol: 'NEC' as const,
    description: 'Cycle flame color and flame effects',
  },
  addSmoke: {
    id: 'fp-smoke',
    name: 'Add Smoke',
    hex: 'C2E29867',
    protocol: 'NEC' as const,
    description: 'Toggle fireplace mist and smoke heater',
  },
  powerCandidates: [
    { label: 'Option 1 (Common)', hex: 'C2E218E7' },
    { label: 'Option 2', hex: 'C2E258A7' },
    { label: 'Option 3', hex: 'C2E208F7' },
    { label: 'Option 4', hex: 'C2E228D7' },
  ],
  timerCandidates: [
    { label: 'Option 1 (Common)', hex: 'C2E27887' },
    { label: 'Option 2', hex: 'C2E2B847' },
    { label: 'Option 3', hex: 'C2E2D827' },
    { label: 'Option 4', hex: 'C2E2F807' },
  ],
};
