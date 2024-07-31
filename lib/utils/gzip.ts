export async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

export async function decompressData(
  compressedData: ArrayBuffer,
): Promise<ArrayBuffer> {
  const cs = new DecompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(compressedData);
  writer.close();
  return new Response(cs.readable).arrayBuffer();
}
