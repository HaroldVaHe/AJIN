import { createHash } from 'crypto';

export const CHUNK_MAX_CHARS = 1200;
export const CHUNK_OVERLAP_CHARS = 180;

/** Limpia saltos de línea y espacios repetidos sin perder los párrafos. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function hardSplit(text: string, max: number): string[] {
  const pieces: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(' ', max);
    if (cut < max * 0.6) cut = max;
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

/**
 * Divide un texto en fragmentos de tamaño acotado. Respeta párrafos y,
 * cuando hace falta, corta por espacios. Cada fragmento nuevo arrastra un
 * pequeño solape del anterior para no perder contexto en los bordes.
 */
export function chunkText(
  input: string,
  max = CHUNK_MAX_CHARS,
  overlap = CHUNK_OVERLAP_CHARS
): string[] {
  const text = normalizeText(input);
  if (!text) return [];
  if (text.length <= max) return [text];

  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => (block.length > max ? hardSplit(block, max) : [block]));

  const chunks: string[] = [];
  let current = '';

  for (const block of blocks) {
    if (current && current.length + 2 + block.length <= max) {
      current = `${current}\n\n${block}`;
      continue;
    }
    if (current) {
      chunks.push(current);
      const tail = overlap > 0 ? current.slice(-overlap).trim() : '';
      current =
        tail && tail.length + 2 + block.length <= max ? `${tail}\n\n${block}` : block;
      continue;
    }
    current = block;
  }
  if (current) chunks.push(current);

  return chunks.filter((chunk, index) => chunk && chunks.indexOf(chunk) === index);
}

export function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Normaliza una pregunta para compararla con el caché semántico. */
export function normalizeQuestion(question: string): string {
  return normalizeText(question)
    .toLowerCase()
    .replace(/[¿?¡!.,;:]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
