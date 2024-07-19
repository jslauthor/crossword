export async function decompressData(compressedData: ArrayBuffer) {
  const cs = new DecompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(compressedData);
  writer.close();
  return new Response(cs.readable).arrayBuffer();
}
