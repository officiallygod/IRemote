/**
 * NEC Infrared Protocol Encoder
 * Standard 38kHz NEC pulse format used by TVs, ACs, Fans, China RGB strips, and Sunset Lamps.
 */

export interface NecSignal {
  hex: string;
  carrierFrequency: number; // typically 38000 Hz
  pattern: number[]; // Alternating microsecond durations [mark, space, mark, space...]
  binaryString: string;
}

export function encodeNecHex(hex: string, carrierFrequency: number = 38000): NecSignal {
  // Clean hex string
  const cleanHex = hex.replace(/^0x/i, '').trim().padStart(8, '0').toUpperCase();
  const num = parseInt(cleanHex, 16);

  // Standard NEC timings in microseconds (µs)
  const HDR_MARK = 9000;
  const HDR_SPACE = 4500;
  const BIT_MARK = 560;
  const ONE_SPACE = 1690;
  const ZERO_SPACE = 560;
  const STOP_MARK = 560;

  const pattern: number[] = [HDR_MARK, HDR_SPACE];

  // Convert 32-bit number to binary string (MSB to LSB or LSB to MSB based on standard NEC transmission)
  // NEC transmits 32 bits: 8-bit addr, 8-bit inv-addr, 8-bit cmd, 8-bit inv-cmd.
  // Bits in each byte are transmitted LSB first.
  let binaryStr = '';
  
  // Break into 4 bytes
  const b0 = (num >>> 24) & 0xff;
  const b1 = (num >>> 16) & 0xff;
  const b2 = (num >>> 8) & 0xff;
  const b3 = num & 0xff;
  const bytes = [b0, b1, b2, b3];

  for (const byte of bytes) {
    for (let i = 0; i < 8; i++) {
      // Bit test (LSB first per byte)
      const bit = (byte >> i) & 1;
      binaryStr += bit;
      pattern.push(BIT_MARK);
      pattern.push(bit === 1 ? ONE_SPACE : ZERO_SPACE);
    }
  }

  // Final stop bit
  pattern.push(STOP_MARK);

  return {
    hex: '0x' + cleanHex,
    carrierFrequency,
    pattern,
    binaryString: binaryStr,
  };
}
