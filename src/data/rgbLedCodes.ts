export interface RgbColorKey {
  id: string;
  name: string;
  hexCode: string;
  displayColor: string;
  label?: string;
}

export interface PowerCandidate {
  label: string;
  hex: string;
  description: string;
}

// 24-key standard RGB remote NEC codes (address 0x00F7)
export const RGB_LED_CONTROLS = {
  powerOn: { id: 'pwr-on', name: 'Power ON', hex: '00F7C03F', protocol: 'NEC' as const },
  powerOff: { id: 'pwr-off', name: 'Power OFF', hex: '00F740BF', protocol: 'NEC' as const },
  brightUp: { id: 'brt-up', name: 'Brightness +', hex: '00F700FF', protocol: 'NEC' as const },
  brightDown: { id: 'brt-down', name: 'Brightness -', hex: '00F7807F', protocol: 'NEC' as const },
};

// Power OFF & Toggle Candidates for Sunset Lamp
export const SUNSET_POWER_CANDIDATES: PowerCandidate[] = [
  { label: 'Standard OFF (0x00F740BF)', hex: '00F740BF', description: 'Row 1 Col 3 black button on 00F7' },
  { label: 'Power Toggle (0x00F7C03F)', hex: '00F7C03F', description: 'Row 1 Col 4 red button (turns on lamp; test if toggles off)' },
  { label: 'Inverted OFF (0x00F700FF)', hex: '00F700FF', description: 'Top-left button as power off' },
  { label: 'Inverted Down (0x00F7807F)', hex: '00F7807F', description: 'Top button 2 as power off' },
  { label: 'Magic Lighting OFF (0x00FF02FD)', hex: '00FF02FD', description: 'Standard 00FF address power off' },
  { label: 'Magic Lighting Toggle (0x00FFA25D)', hex: '00FFA25D', description: 'Standard 00FF power toggle' },
  { label: 'Alternate OFF (0x00EF40BF)', hex: '00EF40BF', description: '00EF clone address power off' },
];

const STORAGE_KEY_SUNSET_OFF = 'iremote_sunset_confirmed_off';

export function getSavedSunsetOffCode(): string {
  return localStorage.getItem(STORAGE_KEY_SUNSET_OFF) || RGB_LED_CONTROLS.powerOff.hex;
}

export function saveSunsetOffCode(hex: string): void {
  localStorage.setItem(STORAGE_KEY_SUNSET_OFF, hex.toUpperCase());
}

// 16 color buttons from the standard 24-key grid
export const RGB_LED_COLORS: RgbColorKey[] = [
  // Row 1: Primary Colors & White (The 4 fundamental keys)
  { id: 'c-red', name: 'Red', hexCode: '00F720DF', displayColor: '#EF4444', label: 'R' },
  { id: 'c-green', name: 'Green', hexCode: '00F7A05F', displayColor: '#22C55E', label: 'G' },
  { id: 'c-blue', name: 'Blue', hexCode: '00F7609F', displayColor: '#3B82F6', label: 'B' },
  { id: 'c-white', name: 'White', hexCode: '00F7E01F', displayColor: '#F8FAFC', label: 'W' },

  // Row 2: Warm Red / Orange / Teal
  { id: 'c-orange', name: 'Orange', hexCode: '00F710EF', displayColor: '#F97316' },
  { id: 'c-lightgreen', name: 'Lime', hexCode: '00F7906F', displayColor: '#84CC16' },
  { id: 'c-darkblue', name: 'Navy', hexCode: '00F750AF', displayColor: '#1E40AF' },
  { id: 'c-flash', name: 'Flash Mode', hexCode: '00F7D02F', displayColor: '#A855F7', label: 'FLASH' },

  // Row 3: Amber / Cyan / Purple
  { id: 'c-amber', name: 'Amber', hexCode: '00F730CF', displayColor: '#F59E0B' },
  { id: 'c-cyan', name: 'Cyan', hexCode: '00F7B04F', displayColor: '#06B6D4' },
  { id: 'c-purple', name: 'Purple', hexCode: '00F7708F', displayColor: '#9333EA' },
  { id: 'c-strobe', name: 'Strobe Mode', hexCode: '00F7F00F', displayColor: '#EC4899', label: 'STROBE' },

  // Row 4: Yellow / Mint / Magenta
  { id: 'c-yellow', name: 'Warm Yellow', hexCode: '00F708F7', displayColor: '#EAB308' },
  { id: 'c-mint', name: 'Mint Green', hexCode: '00F78877', displayColor: '#10B981' },
  { id: 'c-magenta', name: 'Magenta', hexCode: '00F748B7', displayColor: '#D946EF' },
  { id: 'c-fade', name: 'Fade Mode', hexCode: '00F7C837', displayColor: '#6366F1', label: 'FADE' },

  // Row 5: Warm Gold / Sky / Pink / Smooth
  { id: 'c-gold', name: 'Sunset Glow', hexCode: '00F728D7', displayColor: '#FB923C' },
  { id: 'c-sky', name: 'Ice Blue', hexCode: '00F7A857', displayColor: '#38BDF8' },
  { id: 'c-pink', name: 'Rose Pink', hexCode: '00F76897', displayColor: '#F43F5E' },
  { id: 'c-smooth', name: 'Smooth Mode', hexCode: '00F7E817', displayColor: '#14B8A6', label: 'SMOOTH' },
];

export const SUNSET_LAMP_PRESETS = [
  {
    id: 'sunset-red',
    name: 'Crimson Red',
    subtitle: 'Primary Red channel',
    colorHex: '#EF4444',
    irHex: '00F720DF',
    gradient: 'from-[#EF4444] via-[#DC2626] to-[#991B1B]',
  },
  {
    id: 'sunset-golden',
    name: 'Golden Hour',
    subtitle: 'Warm 2200K amber glow',
    colorHex: '#F8E5A5',
    irHex: '00F708F7',
    gradient: 'from-[#F8E5A5] via-[#FB923C] to-[#EF4444]',
  },
  {
    id: 'sunset-amber',
    name: 'Amber Dusk',
    subtitle: 'Warm sunset flare',
    colorHex: '#F59E0B',
    irHex: '00F730CF',
    gradient: 'from-[#F59E0B] via-[#EA580C] to-[#C2410C]',
  },
  {
    id: 'sunset-cyan',
    name: 'Glacier Sky',
    subtitle: 'Cool Nordic twilight',
    colorHex: '#06B6D4',
    irHex: '00F7B04F',
    gradient: 'from-[#06B6D4] via-[#0284C7] to-[#1E40AF]',
  },
  {
    id: 'sunset-aurora',
    name: 'Twilight Violet',
    subtitle: 'Dreamy evening sky',
    colorHex: '#9333EA',
    irHex: '00F7708F',
    gradient: 'from-[#C084FC] via-[#9333EA] to-[#3B82F6]',
  },
];
