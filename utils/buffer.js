// ======================
// BUFFER UTILITIES (BROWSER COMPATIBLE)
// ======================

// ✅ Convert BigInt/Number to u64 little-endian bytes (BROWSER SAFE)
export const u64ToLeBytes = (num) => {
  const bn = BigInt(num);
  const arr = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    arr[i] = Number((bn >> BigInt(i * 8)) & 0xFFn);
  }
  return Buffer.from(arr);
};

// ✅ Read u64 from buffer (little-endian)
export const readU64LE = (buffer, offset = 0) => {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    value |= BigInt(buffer[offset + i]) << BigInt(i * 8);
  }
  return value;
};

// ✅ Read i64 from buffer (little-endian, signed)
export const readI64LE = (buffer, offset = 0) => {
  const value = readU64LE(buffer, offset);
  // Check if negative (high bit set)
  if (value >= 0x8000000000000000n) {
    return value - 0x10000000000000000n;
  }
  return value;
};
