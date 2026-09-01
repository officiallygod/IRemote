/**
 * NEC Infrared Protocol Encoder
 * Standard 38kHz NEC pulse format used by Fans, ACs, and RGB Lamps.
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
  const TRAILING_SPACE = 20000; // 20ms trailing space ensures even-length mark/space pairs for Xiaomi HAL

  const pattern: number[] = [HDR_MARK, HDR_SPACE];

  let binaryStr = '';
  
  // 4 bytes: [Address, ~Address, Command, ~Command]
  const b0 = (num >>> 24) & 0xff;
  const b1 = (num >>> 16) & 0xff;
  const b2 = (num >>> 8) & 0xff;
  const b3 = num & 0xff;
  const bytes = [b0, b1, b2, b3];

  for (const byte of bytes) {
    for (let i = 0; i < 8; i++) {
      const bit = (byte >> i) & 1;
      binaryStr += bit;
      pattern.push(BIT_MARK);
      pattern.push(bit === 1 ? ONE_SPACE : ZERO_SPACE);
    }
  }

  // Final stop bit and trailing space (making pattern length exactly 68 - an even number)
  pattern.push(STOP_MARK);
  pattern.push(TRAILING_SPACE);

  return {
    hex: '0x' + cleanHex,
    carrierFrequency,
    pattern,
    binaryString: binaryStr,
  };
}
