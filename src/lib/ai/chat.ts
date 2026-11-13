import { getAiConfig } from './config';
import { AiNotConfiguredError, AiRequestError } from './embeddings';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function mockReply(turns: ChatTurn[]): string {
  const userText = turns
    .filter((turn) => turn.role === 'user')
    .map((turn) => turn.content)
    .join('\n');
  const firstSource = userText.match(/\[(\d+)\][^\n]*\n?([\s\S]{0,260})/);
  const used = firstSource ? [Number(firstSource[1])] : [];
  const excerpt = firstSource ? firstSource[2].replace(/\s+/g, ' ').trim() : '';
  return JSON.stringify({
    answer:
      'Modo de prueba (sin proveedor de IA). ' +
      (excerpt
        ? `Esto es lo más relevante que encontré en el índice: ${excerpt}`
        : 'No encontré información en el índice.'),
    usedSources: used,
    insufficient: !firstSource,
  });
}

/**
 * Pide al modelo una respuesta en JSON. El prompt debe exigir el formato
 * `{ "answer": string, "usedSources": number[] }`.
 */
export async function chatJson(turns: ChatTurn[]): Promise<{ text: string }> {
  const config = getAiConfig();
  if (!config) throw new AiNotConfiguredError();
  if (config.provider === 'mock') return { text: mockReply(turns) };

  const run = async (): Promise<string> => {
    if (config.provider === 'gemini') {
      const system = turns
        .filter((turn) => turn.role === 'system')
        .map((turn) => turn.content)
        .join('\n\n');
      const contents = turns
        .filter((turn) => turn.role !== 'system')
        .map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        }));

      const requestBody = (jsonMode: boolean) => ({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1400,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });

      const call = async (model: string, jsonMode: boolean) =>
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model
          )}:generateContent`,
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': config.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody(jsonMode)),
            signal: AbortSignal.timeout(60000),
          }
        );

      const suggested = (detail: string): string[] => {
        const names = [...detail.matchAll(/models\/([a-z0-9][a-z0-9.\-]*)/gi)].map((m) => m[1]);
        return names.filter((n, i) => names.indexOf(n) === i);
      };

      const models = [config.chatModel];
      let response = await call(models[0], true);
      let detail = '';

      if (!response.ok) {
        detail = await response.text().catch(() => '');
        // Algunos modelos/versiones no aceptan responseMimeType: reintentar sin JSON forzado.
        if (response.status === 400 && /response.?mime|json/i.test(detail)) {
          response = await call(models[0], false);
          if (!response.ok) detail = await response.text().catch(() => detail);
        }
        // Modelo retirado o no disponible: probar el sugerido por la API y alternativas comunes.
        if (!response.ok && response.status === 404) {
          const fallbacks = [
            ...suggested(detail),
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
          ].filter((m, i, arr) => m && arr.indexOf(m) === i && !models.includes(m));
          for (const model of fallbacks.slice(0, 3)) {
            models.push(model);
            response = await call(model, true);
            if (!response.ok) {
              detail = await response.text().catch(() => '');
              if (response.status === 400 && /response.?mime|json/i.test(detail)) {
                response = await call(model, false);
                if (!response.ok) detail = await response.text().catch(() => detail);
              }
            }
            if (response.ok) break;
          }
        }
        if (!response.ok) {
          throw new AiRequestError(`Gemini ${response.status}: ${detail.slice(0, 300)}`, 502);
        }
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
      if (!text.trim()) throw new AiRequestError('Gemini devolvió una respuesta vacía');
      return text;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.chatModel,
        messages: turns,
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new AiRequestError(`OpenAI ${response.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) throw new AiRequestError('OpenAI devolvió una respuesta vacía');
    return text;
  };

  return { text: await run() };
}
