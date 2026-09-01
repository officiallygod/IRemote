import { IrCodeDefinition } from './fanCodes';

export interface RgbColorKey {
  id: string;
  name: string;
  hexCode: string;
  displayColor: string; // CSS color representation
  label?: string;
}

// 24-key standard Chinese RGB remote NEC codes (address 0x00F7)
export const RGB_LED_CONTROLS = {
  powerOn: { id: 'pwr-on', name: 'Power ON', hex: '00F7C03F', protocol: 'NEC' as const },
  powerOff: { id: 'pwr-off', name: 'Power OFF', hex: '00F740BF', protocol: 'NEC' as const },
  brightUp: { id: 'brt-up', name: 'Brightness +', hex: '00F700FF', protocol: 'NEC' as const },
  brightDown: { id: 'brt-down', name: 'Brightness -', hex: '00F7807F', protocol: 'NEC' as const },
};

// 16 color buttons from the standard 24-key grid
export const RGB_LED_COLORS: RgbColorKey[] = [
  // Row 1: Primary Colors & White
  { id: 'c-red', name: 'Red', hexCode: '00F720DF', displayColor: '#EF4444' },
  { id: 'c-green', name: 'Green', hexCode: '00F7A05F', displayColor: '#22C55E' },
  { id: 'c-blue', name: 'Blue', hexCode: '00F7609F', displayColor: '#3B82F6' },
  { id: 'c-white', name: 'White', hexCode: '00F7E01F', displayColor: '#F8FAFC' },

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
    id: 'sunset-golden',
    name: 'Golden Hour',
    subtitle: 'Warm 2200K amber glow',
    colorHex: '#F8E5A5',
    irHex: '00F708F7',
    gradient: 'from-[#F8E5A5] via-[#FB923C] to-[#EF4444]',
  },
  {
    id: 'sunset-red',
    name: 'Deep Sunset',
    subtitle: 'Rich crimson dusk horizon',
    colorHex: '#FF5733',
    irHex: '00F710EF',
    gradient: 'from-[#FF7849] via-[#FF3366] to-[#791E42]',
  },
  {
    id: 'sunset-halo',
    name: 'Sunset Halo',
    subtitle: 'Dual halo solar flare',
    colorHex: '#FB923C',
    irHex: '00F728D7',
    gradient: 'from-[#FDE047] via-[#FB923C] to-[#C026D3]',
  },
  {
    id: 'sunset-aurora',
    name: 'Twilight Violet',
    subtitle: 'Dreamy evening sky',
    colorHex: '#A855F7',
    irHex: '00F7708F',
    gradient: 'from-[#C084FC] via-[#A855F7] to-[#3B82F6]',
  },
  {
    id: 'sunset-cyan',
    name: 'Nordic Sky',
    subtitle: 'Cool polar ambiance',
    colorHex: '#C5F5FA',
    irHex: '00F7B04F',
    gradient: 'from-[#C5F5FA] via-[#38BDF8] to-[#0284C7]',
  },
];
