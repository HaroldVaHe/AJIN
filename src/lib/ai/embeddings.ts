import { getAiConfig, type AiConfig } from './config';

export class AiNotConfiguredError extends Error {
  constructor(message = 'Falta configurar el proveedor de IA') {
    super(message);
    this.name = 'AiNotConfiguredError';
  }
}

export class AiRequestError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'AiRequestError';
    this.status = status;
  }
}

const BATCH_SIZE = 48;
const MAX_INPUT_CHARS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

/** Embeddings deterministas para pruebas locales (sin llamadas externas). */
function mockEmbedding(text: string, dim: number): number[] {
  const vector = new Array<number>(dim).fill(0);
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const tokens = normalized.match(/[a-z0-9ñ]+/gi) ?? [];

  const features: Array<{ value: string; weight: number }> = [];
  for (const token of tokens) {
    features.push({ value: `w:${token}`, weight: 1.6 });
    for (let i = 0; i < token.length - 2; i += 1) {
      features.push({ value: `g:${token.slice(i, i + 3)}`, weight: 0.35 });
    }
  }
  if (features.length === 0) features.push({ value: 'empty', weight: 1 });

  for (const feature of features) {
    // FNV-1a de 32 bits
    let hash = 0x811c9dc5;
    for (let i = 0; i < feature.value.length; i += 1) {
      hash ^= feature.value.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    const index = hash % dim;
    const sign = (hash >>> 16) & 1 ? 1 : -1;
    vector[index] += sign * feature.weight;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

async function openaiEmbeddings(texts: string[], config: AiConfig): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: texts,
      encoding_format: 'float',
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiRequestError(`OpenAI embeddings ${response.status}: ${detail.slice(0, 300)}`, 502);
  }

  const data = (await response.json()) as {
    data?: Array<{ index: number; embedding: number[] }>;
  };
  if (!data.data || data.data.length !== texts.length) {
    throw new AiRequestError('OpenAI devolvió una cantidad inesperada de embeddings');
  }
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function geminiEmbeddings(texts: string[], config: AiConfig): Promise<number[][]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      config.embeddingModel
    )}:batchEmbedContents`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${config.embeddingModel}`,
          content: { parts: [{ text }] },
          // gemini-embedding-001 permite 3072, 1536 o 768. Usamos 1536 para
          // convivir con OpenAI en la misma columna de Postgres.
          outputDimensionality: config.embeddingDim,
        })),
      }),
      signal: AbortSignal.timeout(45000),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiRequestError(`Gemini embeddings ${response.status}: ${detail.slice(0, 300)}`, 502);
  }

  const data = (await response.json()) as { embeddings?: Array<{ values: number[] }> };
  if (!data.embeddings || data.embeddings.length !== texts.length) {
    throw new AiRequestError('Gemini devolvió una cantidad inesperada de embeddings');
  }
  return data.embeddings.map((item) => item.values);
}

/**
 * Vectoriza una lista de textos en lotes. Devuelve un vector por texto,
 * en el mismo orden. Lanza AiNotConfiguredError si no hay proveedor.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const config = getAiConfig();
  if (!config) throw new AiNotConfiguredError();

  const clean = texts.map((text) => (text ?? '').trim().slice(0, MAX_INPUT_CHARS) || 'sin contenido');
  const output: number[][] = [];

  for (let start = 0; start < clean.length; start += BATCH_SIZE) {
    const batch = clean.slice(start, start + BATCH_SIZE);
    const vectors = await withRetry(() => {
      if (config.provider === 'mock') {
        return Promise.resolve(batch.map((text) => mockEmbedding(text, config.embeddingDim)));
      }
      if (config.provider === 'gemini') return geminiEmbeddings(batch, config);
      return openaiEmbeddings(batch, config);
    });

    for (const vector of vectors) {
      if (!Array.isArray(vector) || vector.length !== config.embeddingDim) {
        throw new AiRequestError(
          `Embedding con dimensión inesperada (${vector?.length ?? 0} en vez de ${config.embeddingDim}). ` +
            'Revisa AI_EMBEDDING_MODEL o vuelve a ejecutar supabase-cerebro.sql.'
        );
      }
      output.push(vector);
    }
  }

  return output;
}
