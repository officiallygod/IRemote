export interface IrCodeDefinition {
  id: string;
  name: string;
  hex: string;
  protocol: 'NEC';
  category?: string;
  description?: string;
}

export const FAN_CODES: {
  power: IrCodeDefinition;
  speed: IrCodeDefinition;
  timer: IrCodeDefinition;
  swing: IrCodeDefinition;
  mode: IrCodeDefinition;
} = {
  power: {
    id: 'fan-power',
    name: 'Switch On/Off',
    hex: '00FF58A7',
    protocol: 'NEC',
    description: 'Toggle fan power',
  },
  speed: {
    id: 'fan-speed',
    name: 'Wind Speed',
    hex: 'C03FC03F',
    protocol: 'NEC',
    description: 'Cycle fan wind speed (Levels 1 - 5)',
  },
  timer: {
    id: 'fan-timer',
    name: 'Timer',
    hex: '00FF906F',
    protocol: 'NEC',
    description: 'Cycle off timer (1h / 2h / 4h / 8h)',
  },
  swing: {
    id: 'fan-swing',
    name: 'Swing',
    hex: '926DE01F',
    protocol: 'NEC',
    description: 'Toggle oscillation swing',
  },
  mode: {
    id: 'fan-mode',
    name: 'Wind Mode',
    hex: '5D05807F',
    protocol: 'NEC',
    description: 'Cycle wind mode (Normal / Natural / Sleep)',
  },
};
