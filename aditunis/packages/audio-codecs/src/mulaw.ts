const BIAS = 0x84;
const CLIP = 32635;

function searchSegment(value: number): number {
  const ends = [0xff, 0x1ff, 0x3ff, 0x7ff, 0xfff, 0x1fff, 0x3fff, 0x7fff];
  for (let i = 0; i < ends.length; i += 1) if (value <= ends[i]) return i;
  return 8;
}

export function encodeMuLaw(pcm: Int16Array): Uint8Array {
  const out = new Uint8Array(pcm.length);
  for (let i = 0; i < pcm.length; i += 1) {
    let sample = pcm[i];
    const mask = sample < 0 ? 0x7f : 0xff;
    if (sample < 0) sample = -sample;
    if (sample > CLIP) sample = CLIP;
    sample += BIAS;
    const segment = searchSegment(sample);
    const quant = segment >= 8 ? 0x7f : ((segment << 4) | ((sample >> (segment + 3)) & 0x0f));
    out[i] = quant ^ mask;
  }
  return out;
}

export function decodeMuLaw(encoded: Uint8Array): Int16Array {
  const out = new Int16Array(encoded.length);
  for (let i = 0; i < encoded.length; i += 1) {
    const value = (~encoded[i]) & 0xff;
    const sign = value & 0x80;
    const segment = (value >> 4) & 0x07;
    const quant = value & 0x0f;
    let sample = ((quant << 3) + BIAS) << segment;
    sample -= BIAS;
    out[i] = sign ? -sample : sample;
  }
  return out;
}
