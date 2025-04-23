// Utility functions for encoding/decoding

export function encode(data: Uint8Array): string {
  return Buffer.from(data).toString("base64")
}

export function decode(data: string): Uint8Array {
  return Buffer.from(data, "base64")
}
