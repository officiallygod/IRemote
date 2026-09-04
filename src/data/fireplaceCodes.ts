export interface FireplaceCandidate {
  label: string;
  cmdByte: string;
  hex: string;
  description: string;
}

// Helper to build 32-bit NEC hex with address and command byte
export function buildFireplaceHex(cmdHex: string, address: string = 'C2E2'): string {
  const cmd = parseInt(cmdHex, 16);
  const inv = (~cmd) & 0xff;
  return `${address}${cmd.toString(16).padStart(2, '0').toUpperCase()}${inv.toString(16).padStart(2, '0').toUpperCase()}`;
}

// 100% CONFIRMED hardware codes from IrCode Finder & physical device testing
export const FIREPLACE_VERIFIED = {
  // 1. Power ON / OFF (NEC 08E702FD)
  power: {
    hex: '08E702FD',
    protocol: 'NEC',
    address: '08E7',
    cmd: '02',
    label: 'Switch On Off',
    description: 'Toggles fireplace power ON and OFF',
  },
  // 2. Change Color / Light effect (NEC C2E238C7)
  changeColor: {
    hex: 'C2E238C7',
    protocol: 'NEC',
    address: 'C2E2',
    cmd: '38',
    label: 'Change Color / Wake',
    description: 'Cycles through 6 flame colors and wakes device from off state',
  },
  // 3. Add Smoke / Ultrasonic Mist Toggle (NEC C2E29867)
  addSmoke: {
    hex: 'C2E29867',
    protocol: 'NEC',
    address: 'C2E2',
    cmd: '98',
    label: 'Add Smoke / Mist',
    description: 'Toggles ultrasonic flame mist rising plumes',
  },
  // 4. Timer Cycle (NEC 1CE318E7)
  timer: {
    hex: '1CE318E7',
    protocol: 'NEC',
    address: '1CE3',
    cmd: '18',
    label: 'Timer (1h/3h/5h)',
    description: 'Cycles timer between Off, 1H, 3H, 5H',
  },
};

export const FIREPLACE_CANDIDATES: FireplaceCandidate[] = [
  { label: '08E702FD (Verified Power)', cmdByte: '02', hex: '08E702FD', description: 'Hardware Power ON/OFF' },
  { label: '1CE318E7 (Verified Timer)', cmdByte: '18', hex: '1CE318E7', description: 'Hardware Timer Cycle' },
  { label: 'C2E238C7 (Verified Color)', cmdByte: '38', hex: 'C2E238C7', description: 'Hardware Color Cycle' },
  { label: 'C2E29867 (Verified Smoke)', cmdByte: '98', hex: 'C2E29867', description: 'Hardware Smoke Toggle' },
  { label: 'C2E200FF (CMD 0x00)', cmdByte: '00', hex: 'C2E200FF', description: 'Address C2E2 command 0' },
  { label: 'C2E201FE (CMD 0x01)', cmdByte: '01', hex: 'C2E201FE', description: 'Address C2E2 command 1' },
  { label: 'C2E202FD (CMD 0x02)', cmdByte: '02', hex: 'C2E202FD', description: 'Address C2E2 command 2' },
  { label: 'C2E210EF (CMD 0x10)', cmdByte: '10', hex: 'C2E210EF', description: 'Address C2E2 command 0x10' },
  { label: 'C2E220DF (CMD 0x20)', cmdByte: '20', hex: 'C2E220DF', description: 'Address C2E2 command 0x20' },
];

export const FIREPLACE_CODES = {
  power: FIREPLACE_VERIFIED.power,
  changeColor: FIREPLACE_VERIFIED.changeColor,
  addSmoke: FIREPLACE_VERIFIED.addSmoke,
  timer: FIREPLACE_VERIFIED.timer,
  candidates: FIREPLACE_CANDIDATES,
};

const STORAGE_KEY_POWER = 'iremote_fireplace_confirmed_power';
const STORAGE_KEY_TIMER = 'iremote_fireplace_confirmed_timer';

export function getSavedFireplacePowerCode(): string {
  return localStorage.getItem(STORAGE_KEY_POWER) || FIREPLACE_VERIFIED.power.hex;
}

export function saveFireplacePowerCode(hex: string): void {
  localStorage.setItem(STORAGE_KEY_POWER, hex.toUpperCase());
}

export function getSavedFireplaceTimerCode(): string {
  return localStorage.getItem(STORAGE_KEY_TIMER) || FIREPLACE_VERIFIED.timer.hex;
}

export function saveFireplaceTimerCode(hex: string): void {
  localStorage.setItem(STORAGE_KEY_TIMER, hex.toUpperCase());
}
