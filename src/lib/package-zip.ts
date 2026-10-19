import JSZip from 'jszip';

export const IMPORT_ZIP_LIMITS = { archiveBytes: 2 * 1024 * 1024, fileBytes: 2 * 1024 * 1024, totalBytes: 8 * 1024 * 1024, files: 128, expansionRatio: 100 };
type Limits = typeof IMPORT_ZIP_LIMITS;
type Entry = { name: string; size: number; crc: number };
type ZipStream = {
  on(event: 'data', listener: (chunk: Uint8Array) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'end', listener: () => void): void;
  pause(): void;
  resume(): void;
};
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  return crc >>> 0;
});

function safePath(name: string): void {
  const path = name.endsWith('/') ? name.slice(0, -1) : name;
  if (!/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(path)
    || path.split('/').some(part => part === '.' || part === '..' || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) || /[. ]$/.test(part)))
    throw new Error('Unsafe package path.');
}

/** Raw names are checked before JSZip can normalize or overwrite aliases. */
function inspect(bytes: Uint8Array, limits: Limits): Entry[] {
  if (Object.values(limits).some(v => !Number.isSafeInteger(v) || v < 1)) throw new Error('Invalid ZIP limits.');
  if (bytes.byteLength > limits.archiveBytes) throw new Error('ZIP archive byte limit exceeded.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (at: number) => view.getUint16(at, true), u32 = (at: number) => view.getUint32(at, true);
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--)
    if (u32(at) === 0x06054b50 && at + 22 + u16(at + 20) === bytes.length) { end = at; break; }
  if (end < 0) throw new Error('Invalid ZIP end record.');
  const count = u16(end + 10), centralSize = u32(end + 12), central = u32(end + 16);
  if (u16(end + 4) || u16(end + 6) || count !== u16(end + 8) || count === 65535 || central === 0xffffffff || central + centralSize !== end || count > limits.files)
    throw new Error('Unsupported ZIP directory or entry limit.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries: Entry[] = [], names = new Set<string>(), ranges: Array<[number, number]> = [];
  let at = central, total = 0;
  for (let i = 0; i < count; i++) {
    if (at + 46 > end || u32(at) !== 0x02014b50) throw new Error('Invalid ZIP directory.');
    const flags = u16(at + 8), method = u16(at + 10), crc = u32(at + 16), compressed = u32(at + 20), size = u32(at + 24);
    const length = u16(at + 28), next = at + 46 + length + u16(at + 30) + u16(at + 32), local = u32(at + 42);
    if (next > end || flags & 1 || ![0, 8].includes(method) || u16(at + 34) || ((u32(at + 38) >>> 16) & 0xf000) === 0xa000)
      throw new Error('Unsafe or unsupported ZIP entry.');
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + length)); safePath(name);
    const key = name.replace(/\/$/, '').toLowerCase();
    if (names.has(key)) throw new Error('Duplicate or aliased ZIP path.');
    names.add(key); total += size;
    if (name.endsWith('/') && size !== 0) throw new Error('Unsafe directory payload.');
    if (size > limits.fileBytes || total > limits.totalBytes || size / Math.max(1, compressed) > limits.expansionRatio) throw new Error('ZIP expansion byte budget exceeded.');
    if (local + 30 > central || u32(local) !== 0x04034b50) throw new Error('Invalid ZIP local header.');
    const nameLength = u16(local + 26), data = local + 30 + nameLength + u16(local + 28);
    if (data + compressed > central || u16(local + 6) !== flags || u16(local + 8) !== method
      || decoder.decode(bytes.subarray(local + 30, local + 30 + nameLength)) !== name) throw new Error('ZIP local and central headers disagree.');
    ranges.push([local, data + compressed]); entries.push({ name, size, crc }); at = next;
  }
  if (at !== end) throw new Error('Unexpected ZIP directory bytes.');
  ranges.sort((a, b) => a[0] - b[0]);
  if (ranges.some((range, i) => i > 0 && range[0] < ranges[i - 1][1])) throw new Error('Overlapping ZIP entries.');
  return entries;
}

/** Bounded streaming prevents a forged size from allocating an unbounded output.
 * This transport layer is browser-safe; it does not interpret a capsule format. */
export async function readImportZip(input: Buffer | ArrayBuffer | Uint8Array, overrides: Partial<Limits> = {}): Promise<JSZip> {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input);
  const entries = inspect(bytes, { ...IMPORT_ZIP_LIMITS, ...overrides });
  const zip = await JSZip.loadAsync(bytes);
  if (Object.keys(zip.files).length !== entries.length) throw new Error('ZIP membership changed during parsing.');
  for (const entry of entries) {
    const file = zip.files[entry.name];
    if (!file) throw new Error('ZIP entry changed during parsing.');
    if (file.dir) { if (entry.size || entry.crc) throw new Error('Unsafe ZIP directory.'); continue; }
    // JSZip 3's documented stream helper is absent from its object typings.
    const boundedFile = file as typeof file & { internalStream(type: 'uint8array'): ZipStream };
    if (typeof boundedFile.internalStream !== 'function') throw new Error('Bounded ZIP streaming is unavailable.');
    await new Promise<void>((resolve, reject) => {
      let length = 0, crc = 0xffffffff, failed = false;
      const stream = boundedFile.internalStream('uint8array');
      stream.on('data', (chunk: Uint8Array) => {
        if (failed) return;
        length += chunk.length;
        if (length > entry.size) { failed = true; stream.pause(); reject(new Error('ZIP declared size or byte budget exceeded.')); return; }
        for (const byte of chunk) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
      });
      stream.on('error', reject);
      stream.on('end', () => {
        if (failed) return;
        if (length !== entry.size || ((crc ^ 0xffffffff) >>> 0) !== entry.crc) reject(new Error('ZIP size or CRC integrity mismatch.'));
        else resolve();
      });
      stream.resume();
    });
  }
  return zip;
}
