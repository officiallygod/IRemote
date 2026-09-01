/**
 * NEC Infrared Protocol Encoder
 * Standard 38kHz NEC pulse format (MSB-first format matching IrCode Finder and Arduino-IRremote 2.x).
 */

export interface NecSignal {
  hex: string;
  carrierFrequency: number; // typically 38000 Hz
  pattern: number[]; // Alternating microsecond durations [mark, space, mark, space...]
  binaryString: string;
}

export function encodeNecHex(hex: string, carrierFrequency: number = 38000): NecSignal {
  const cleanHex = hex.replace(/^0x/i, '').trim().padStart(8, '0').toUpperCase();
  const num = parseInt(cleanHex, 16);

  // Standard NEC timings in microseconds (µs)
  const HDR_MARK = 9000;
  const HDR_SPACE = 4500;
  const BIT_MARK = 560;
  const ONE_SPACE = 1690;
  const ZERO_SPACE = 560;
  const STOP_MARK = 560;
  const GAP_SPACE = 40000; // 40ms trailing space ensures even-length array for Xiaomi ConsumerIrManager HAL

  const pattern: number[] = [HDR_MARK, HDR_SPACE];
  let binaryStr = '';

  // Transmit 32 bits MSB-first (bit 31 down to bit 0)
  for (let i = 31; i >= 0; i--) {
    const bit = (num >>> i) & 1;
    binaryStr += bit;
    pattern.push(BIT_MARK);
    pattern.push(bit === 1 ? ONE_SPACE : ZERO_SPACE);
  }

  // Final stop bit and trailing space (making pattern length 68 - an even number)
  pattern.push(STOP_MARK);
  pattern.push(GAP_SPACE);

  return {
    hex: '0x' + cleanHex,
    carrierFrequency,
    pattern,
    binaryString: binaryStr,
  };
}
