export interface FireplaceCandidate {
  label: string;
  cmdByte: string;
  hex: string;
  description: string;
}

// Helper to build 32-bit NEC hex with address 0xC2E2 and command byte
export function buildFireplaceHex(cmdHex: string): string {
  const cmd = parseInt(cmdHex, 16);
  const inv = (~cmd) & 0xff;
  return `C2E2${cmd.toString(16).padStart(2, '0').toUpperCase()}${inv.toString(16).padStart(2, '0').toUpperCase()}`;
}

// Confirmed codes from IrCode Finder & user hardware testing
export const FIREPLACE_VERIFIED = {
  // Toggle Fireplace Light Effect / Wake from off (Confirmed working)
  changeColor: {
    hex: 'C2E238C7',
    cmd: '38',
    label: 'Toggle Light / Wake',
    description: 'Cycles through 6 flame colors (Red, Gold, Green, Cyan, Blue, Purple) and wakes from off state',
  },
  // Switch Fog Light Effect (Confirmed working)
  addSmoke: {
    hex: 'C2E29867',
    cmd: '98',
    label: 'Switch Fog Effect',
    description: 'Switches ultrasonic flame mist rising plumes',
  },
};

// Full matrix of candidate codes for Address 0xC2E2 (all matrix keys ending in 8 or standard row/col layout)
export const FIREPLACE_CANDIDATES: FireplaceCandidate[] = [
  { label: 'Candidate 1 (0x18)', cmdByte: '18', hex: 'C2E218E7', description: 'Col 1 Row 1 standard power' },
  { label: 'Candidate 2 (0x08)', cmdByte: '08', hex: 'C2E208F7', description: 'Col 1 Row 2 standard power' },
  { label: 'Candidate 3 (0x58)', cmdByte: '58', hex: 'C2E258A7', description: 'Col 1 Row 3 standard power' },
  { label: 'Candidate 4 (0x78)', cmdByte: '78', hex: 'C2E27887', description: 'Standard timer/power' },
  { label: 'Candidate 5 (0xB8)', cmdByte: 'B8', hex: 'C2E2B847', description: 'Matrix alt power' },
  { label: 'Candidate 6 (0xD8)', cmdByte: 'D8', hex: 'C2E2D827', description: 'Matrix alt power' },
  { label: 'Candidate 7 (0xF8)', cmdByte: 'F8', hex: 'C2E2F807', description: 'Matrix alt power' },
  { label: 'Candidate 8 (0x88)', cmdByte: '88', hex: 'C2E28877', description: 'Matrix alt' },
  { label: 'Candidate 9 (0xA8)', cmdByte: 'A8', hex: 'C2E2A857', description: 'Matrix alt' },
  { label: 'Candidate 10 (0x28)', cmdByte: '28', hex: 'C2E228D7', description: 'Matrix alt' },
  { label: 'Candidate 11 (0x48)', cmdByte: '48', hex: 'C2E248B7', description: 'Matrix alt' },
  { label: 'Candidate 12 (0x68)', cmdByte: '68', hex: 'C2E26897', description: 'Matrix alt' },
  { label: 'Candidate 13 (0xC8)', cmdByte: 'C8', hex: 'C2E2C837', description: 'Matrix alt' },
  { label: 'Candidate 14 (0xE8)', cmdByte: 'E8', hex: 'C2E2E817', description: 'Matrix alt' },
];

export const FIREPLACE_CODES = {
  changeColor: FIREPLACE_VERIFIED.changeColor,
  addSmoke: FIREPLACE_VERIFIED.addSmoke,
  candidates: FIREPLACE_CANDIDATES,
  powerCandidates: FIREPLACE_CANDIDATES.slice(0, 6),
  timerCandidates: FIREPLACE_CANDIDATES.slice(3, 8),
};

const STORAGE_KEY_POWER = 'iremote_fireplace_confirmed_power';

export function getSavedFireplacePowerCode(): string {
  return localStorage.getItem(STORAGE_KEY_POWER) || FIREPLACE_CANDIDATES[0].hex;
}

export function saveFireplacePowerCode(hex: string): void {
  localStorage.setItem(STORAGE_KEY_POWER, hex.toUpperCase());
}
