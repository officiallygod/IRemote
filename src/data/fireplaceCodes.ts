export interface FireplaceCandidate {
  label: string;
  cmdByte: string;
  hex: string;
  description: string;
}

// Helper to build 32-bit NEC hex with address 0xC2E2 and command byte
export function buildFireplaceHex(cmdHex: string, address: string = 'C2E2'): string {
  const cmd = parseInt(cmdHex, 16);
  const inv = (~cmd) & 0xff;
  return `${address}${cmd.toString(16).padStart(2, '0').toUpperCase()}${inv.toString(16).padStart(2, '0').toUpperCase()}`;
}

// Confirmed codes from IrCode Finder & user hardware testing
export const FIREPLACE_VERIFIED = {
  // Toggle Fireplace Light Effect / Wake from off (Confirmed working)
  changeColor: {
    hex: 'C2E238C7',
    cmd: '38',
    label: 'Toggle Light / Wake',
    description: 'Cycles through 6 flame colors and wakes device from off state',
  },
  // Switch Fog Light Effect (Confirmed working)
  addSmoke: {
    hex: 'C2E29867',
    cmd: '98',
    label: 'Switch Fog Effect',
    description: 'Switches ultrasonic flame mist rising plumes',
  },
};

// High-probability Power candidates for Address 0xC2E2 (Non-8 low nibbles, power patterns, and universal codes)
export const FIREPLACE_CANDIDATES: FireplaceCandidate[] = [
  // 1. Common Zero-Nibble Power Commands for 0xC2E2
  { label: '0xC2E200FF (CMD 0x00)', cmdByte: '00', hex: 'C2E200FF', description: 'Address C2E2 command 0' },
  { label: '0xC2E201FE (CMD 0x01)', cmdByte: '01', hex: 'C2E201FE', description: 'Address C2E2 command 1' },
  { label: '0xC2E202FD (CMD 0x02)', cmdByte: '02', hex: 'C2E202FD', description: 'Address C2E2 command 2' },
  { label: '0xC2E204FB (CMD 0x04)', cmdByte: '04', hex: 'C2E204FB', description: 'Address C2E2 command 4' },
  { label: '0xC2E210EF (CMD 0x10)', cmdByte: '10', hex: 'C2E210EF', description: 'Address C2E2 command 0x10' },
  { label: '0xC2E220DF (CMD 0x20)', cmdByte: '20', hex: 'C2E220DF', description: 'Address C2E2 command 0x20' },
  { label: '0xC2E230CF (CMD 0x30)', cmdByte: '30', hex: 'C2E230CF', description: 'Address C2E2 command 0x30' },
  { label: '0xC2E240BF (CMD 0x40)', cmdByte: '40', hex: 'C2E240BF', description: 'Address C2E2 command 0x40' },
  { label: '0xC2E2807F (CMD 0x80)', cmdByte: '80', hex: 'C2E2807F', description: 'Address C2E2 command 0x80' },
  { label: '0xC2E2906F (CMD 0x90)', cmdByte: '90', hex: 'C2E2906F', description: 'Address C2E2 command 0x90' },
  { label: '0xC2E2A05F (CMD 0xA0)', cmdByte: 'A0', hex: 'C2E2A05F', description: 'Address C2E2 command 0xA0' },
  { label: '0xC2E2B04F (CMD 0xB0)', cmdByte: 'B0', hex: 'C2E2B04F', description: 'Address C2E2 command 0xB0' },
  { label: '0xC2E2C03F (CMD 0xC0)', cmdByte: 'C0', hex: 'C2E2C03F', description: 'Address C2E2 command 0xC0' },
  { label: '0xC2E2F00F (CMD 0xF0)', cmdByte: 'F0', hex: 'C2E2F00F', description: 'Address C2E2 command 0xF0' },
  { label: '0xC2E2FF00 (CMD 0xFF)', cmdByte: 'FF', hex: 'C2E2FF00', description: 'Address C2E2 command 0xFF' },

  // 2. Neighboring Commands around 0x38 (Color) and 0x98 (Fog)
  { label: '0xC2E239C6 (CMD 0x39)', cmdByte: '39', hex: 'C2E239C6', description: 'Color sibling key' },
  { label: '0xC2E237C8 (CMD 0x37)', cmdByte: '37', hex: 'C2E237C8', description: 'Color sibling key' },
  { label: '0xC2E29966 (CMD 0x99)', cmdByte: '99', hex: 'C2E29966', description: 'Fog sibling key' },
  { label: '0xC2E29768 (CMD 0x97)', cmdByte: '97', hex: 'C2E29768', description: 'Fog sibling key' },

  // 3. Universal Humidifier / Aroma Diffuser Power Codes
  { label: '0x00FF02FD (Univ Power)', cmdByte: '02', hex: '00FF02FD', description: 'Universal Chinese Diffuser ON/OFF' },
  { label: '0x00FFA25D (Tuya Diffuser)', cmdByte: 'A2', hex: '00FFA25D', description: 'Tuya Smart Humidifier Power' },
  { label: '0x00FF629D (Mist Toggle)', cmdByte: '62', hex: '00FF629D', description: 'Standard Mist Power' },
  { label: '0x00FF1AE5 (Flame Power)', cmdByte: '1A', hex: '00FF1AE5', description: 'LED Flame Humidifier Power' },
  { label: '0x807F02FD (Aux Power)', cmdByte: '02', hex: '807F02FD', description: 'Extended NEC 807F Power' },
];

export const FIREPLACE_CODES = {
  changeColor: FIREPLACE_VERIFIED.changeColor,
  addSmoke: FIREPLACE_VERIFIED.addSmoke,
  candidates: FIREPLACE_CANDIDATES,
};

const STORAGE_KEY_POWER = 'iremote_fireplace_confirmed_power';
const STORAGE_KEY_TIMER = 'iremote_fireplace_confirmed_timer';

export function getSavedFireplacePowerCode(): string {
  return localStorage.getItem(STORAGE_KEY_POWER) || FIREPLACE_CANDIDATES[0].hex;
}

export function saveFireplacePowerCode(hex: string): void {
  localStorage.setItem(STORAGE_KEY_POWER, hex.toUpperCase());
}

export function getSavedFireplaceTimerCode(): string {
  return localStorage.getItem(STORAGE_KEY_TIMER) || 'C2E27887';
}

export function saveFireplaceTimerCode(hex: string): void {
  localStorage.setItem(STORAGE_KEY_TIMER, hex.toUpperCase());
}
