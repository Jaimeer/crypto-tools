import { brotliCompress, brotliDecompress, constants } from "node:zlib";
import { promisify } from "node:util";

// Promisify Brotli compression and decompression
const brotliCompressAsync = promisify(brotliCompress);
const brotliDecompressAsync = promisify(brotliDecompress);

async function compressString(text: string): Promise<string> {
  const compressedBuffer = await brotliCompressAsync(Buffer.from(text), {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 4, // Compression level (maximum is 11)
    },
  });

  return compressedBuffer.toString("base64"); // Convert to Base64
}

async function decompressString(base64String: string): Promise<string> {
  const compressedBuffer = Buffer.from(base64String, "base64"); // Convert Base64 string to a buffer
  const decompressedBuffer = await brotliDecompressAsync(compressedBuffer); // Decompress the buffer
  return decompressedBuffer.toString();
}

export const CompressLib = {
  compressString,
  decompressString,
};
