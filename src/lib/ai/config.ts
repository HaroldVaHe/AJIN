/**
 * Configuración del proveedor de IA para el cerebro interno.
 *
 * Se elige con AI_PROVIDER (`openai`, `gemini` o `mock`). Si no se indica,
 * se detecta por la llave disponible: OPENAI_API_KEY o GEMINI_API_KEY
 * (también se acepta GOOGLE_API_KEY). Sin llave el cerebro responde
 * `not_configured` y el resto del panel sigue funcionando igual.
 *
 * `mock` existe solo para pruebas locales: genera embeddings deterministas
 * a partir de las palabras y no llama a ningún servicio externo. Nunca se
 * activa solo.
 */

export type AiProviderName = 'openai' | 'gemini' | 'mock';

/** Dimensión fija: debe coincidir con `vector(1536)` en supabase-cerebro.sql. */
export const EMBEDDING_DIM = 1536;

export interface AiConfig {
  provider: AiProviderName;
  apiKey: string;
  embeddingModel: string;
  chatModel: string;
  embeddingDim: number;
  cacheEnabled: boolean;
  cacheThreshold: number;
  cacheTtlDays: number;
}

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

function num(name: string, fallback: number): number {
  const value = Number(env(name));
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const DEFAULT_MODELS: Record<AiProviderName, { embedding: string; chat: string }> = {
  openai: { embedding: 'text-embedding-3-small', chat: 'gpt-4o-mini' },
  // gemini-2.0-flash es estable y ampliamente disponible; se puede cambiar con AI_CHAT_MODEL.
  gemini: { embedding: 'gemini-embedding-001', chat: 'gemini-2.0-flash' },
  mock: { embedding: 'mock-1536', chat: 'mock' },
};

export function getAiConfig(): AiConfig | null {
  const explicit = env('AI_PROVIDER').toLowerCase();
  const openaiKey = env('OPENAI_API_KEY');
  const geminiKey = env('GEMINI_API_KEY') || env('GOOGLE_API_KEY');

  let provider: AiProviderName | null = null;
  if (explicit === 'openai' || explicit === 'gemini' || explicit === 'mock') {
    provider = explicit;
  } else if (openaiKey) {
    provider = 'openai';
  } else if (geminiKey) {
    provider = 'gemini';
  }
  if (!provider) return null;

  const apiKey = provider === 'openai' ? openaiKey : provider === 'gemini' ? geminiKey : '';
  // Un proveedor real sin llave es un error de configuración, no un fallback.
  if (provider !== 'mock' && !apiKey) return null;

  const defaults = DEFAULT_MODELS[provider];
  return {
    provider,
    apiKey,
    embeddingModel: env('AI_EMBEDDING_MODEL') || defaults.embedding,
    chatModel: env('AI_CHAT_MODEL') || defaults.chat,
    embeddingDim: EMBEDDING_DIM,
    cacheEnabled: env('AI_CACHE_ENABLED') !== 'false',
    cacheThreshold: clamp(num('AI_CACHE_THRESHOLD', 0.97), 0.8, 0.999),
    cacheTtlDays: clamp(num('AI_CACHE_TTL_DAYS', 14), 1, 90),
  };
}

export function isAiConfigured(): boolean {
  return getAiConfig() !== null;
}

/** Resumen sin secretos, apto para la UI y los logs. */
export function publicAiInfo(): {
  configured: boolean;
  provider: AiProviderName | null;
  embeddingModel: string | null;
  chatModel: string | null;
} {
  const config = getAiConfig();
  if (!config) {
    return { configured: false, provider: null, embeddingModel: null, chatModel: null };
  }
  return {
    configured: true,
    provider: config.provider,
    embeddingModel: config.embeddingModel,
    chatModel: config.chatModel,
  };
}
