// OpenAI-compatible API client for Groq, OpenRouter, or OpenAI.
// Keep API keys in server/.env only.

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(SERVER_DIR, '../../.env') });

const getApiKey = () => (process.env.AI_API_KEY || '').trim();
const getBaseUrl = () => (process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
const getModel = () => (process.env.AI_MODEL || 'openai/gpt-oss-120b').trim();

export const aiConfigured = () => Boolean(getApiKey());

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getRetryDelay(attempt, response) {
  const retryAfter = Number(
    response?.headers?.get?.('retry-after')
  );

  if (retryAfter > 0) {
    return Math.min(retryAfter * 1000, 8000);
  }

  return Math.min(700 * (2 ** attempt), 4000);
}

function isRetryableStatus(status) {
  return [408, 409, 425, 429].includes(status) ||
    status >= 500;
}

function getContent(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === 'string' ? part : (part?.text || '')
      )
      .join('')
      .trim();
  }

  return '';
}

export async function askAI({
  stage = 'unspecified',
  system,
  prompt,
  temperature = 0.2,
  maxTokens = 5000,
  jsonMode = false,
}) {
  const API_KEY = getApiKey();
  const BASE = getBaseUrl();
  const MODEL = getModel();

  if (!API_KEY) {
    throw new Error(
      'AI_API_KEY is missing in server/.env.'
    );
  }

  if (!system || !prompt) {
    throw new Error(
      `AI request "${stage}" is missing its system or user prompt.`
    );
  }

  const timeoutMs = Math.max(
    5000,
    Number(process.env.AI_TIMEOUT_MS) || 45000
  );

  const retries = Math.max(
    0,
    Math.min(2, Number(process.env.AI_MAX_RETRIES ?? 2))
  );

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    const body = {
      model: MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    try {
      console.log(
        `[AI START] stage=${stage} model=${MODEL} ` +
        `attempt=${attempt + 1}/${retries + 1}`
      );

      let response = await fetch(
        `${BASE}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify(body),
        }
      );

      // Retry without JSON mode if the provider/model
      // explicitly does not support response_format.
      if (
        !response.ok &&
        jsonMode &&
        [400, 422].includes(response.status)
      ) {
        const errorText = await response.text();

        if (
          /response_format|json_object|json mode/i.test(errorText)
        ) {
          delete body.response_format;

          response = await fetch(
            `${BASE}/chat/completions`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
              body: JSON.stringify(body),
            }
          );
        } else {
          throw new Error(
            `AI provider failed at ${stage} ` +
            `(${response.status}): ${errorText.slice(0, 300)}`
          );
        }
      }

      if (!response.ok) {
        const errorText = await response.text();

        const error = new Error(
          `AI provider failed at ${stage} ` +
          `(${response.status}): ${errorText.slice(0, 300)}`
        );

        error.status = response.status;

        if (
          !isRetryableStatus(response.status) ||
          attempt === retries
        ) {
          throw error;
        }

        lastError = error;

        const waitMs = getRetryDelay(attempt, response);

        console.warn(
          `[AI RETRY] stage=${stage} status=${response.status} ` +
          `wait=${waitMs}ms`
        );

        await sleep(waitMs);
        continue;
      }

      const data = await response.json();
      const content = getContent(data);

      if (!content) {
        lastError = new Error(
          `AI provider returned empty content at ${stage} ` +
          `(finish_reason=${data?.choices?.[0]?.finish_reason || 'unknown'}).`
        );

        if (attempt < retries) {
          await sleep(getRetryDelay(attempt));
          continue;
        }

        throw lastError;
      }

      console.log(`[AI SUCCESS] stage=${stage}`);
      return content;
    } catch (error) {
      lastError = error?.name === 'AbortError'
        ? new Error(
            `AI request timed out at "${stage}" after ` +
            `${timeoutMs}ms (attempt ${attempt + 1}/${retries + 1}).`
          )
        : error;

      const networkFailure =
        error?.name === 'AbortError' ||
        error?.name === 'TypeError' ||
        /fetch failed|network|socket/i.test(
          lastError.message || ''
        );

      if (networkFailure && attempt < retries) {
        const waitMs = getRetryDelay(attempt);

        console.warn(
          `[AI RETRY] stage=${stage} ` +
          `reason=${lastError.message} wait=${waitMs}ms`
        );

        await sleep(waitMs);
        continue;
      }

      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error(`AI request failed at ${stage}.`);
}

export function parseJson(content) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(
      'AI response was empty; expected JSON.'
    );
  }

  const cleaned = content
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const value = JSON.parse(cleaned);

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value;
    }
  } catch {
    // Try extracting the JSON object below.
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start >= 0 && end > start) {
    try {
      const value = JSON.parse(
        cleaned.slice(start, end + 1)
      );

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return value;
      }
    } catch {
      // Use the stable error below.
    }
  }

  throw new Error(
    'AI response was not valid JSON. Try again; ' +
    'if repeated, check the model output and token limit.'
  );
}

export const AI_MODEL = () => getModel();

// Checks the provider without exposing the API key.
export async function checkAIConnection() {
  const API_KEY = getApiKey();
  const BASE = getBaseUrl();
  const MODEL = getModel();

  if (!API_KEY) {
    return {
      ok: false,
      reason: 'AI_API_KEY is empty or missing in server/.env.',
    };
  }

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    10000
  );

  try {
    const response = await fetch(
      `${BASE}/models`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        signal: controller.signal,
      }
    );

    if (response.ok) {
      return {
        ok: true,
        reason: null,
        model: MODEL,
      };
    }

    const body = await response.text();

    if (response.status === 401) {
      return {
        ok: false,
        reason:
          'Provider rejected the API key (401). Check that ' +
          'the key belongs to the provider in AI_BASE_URL.',
      };
    }

    return {
      ok: false,
      reason:
        `AI provider connection returned HTTP ${response.status}: ` +
        body.slice(0, 180),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.name === 'AbortError'
        ? 'AI provider connection timed out after 10 seconds.'
        : `Could not reach AI provider: ${error.message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}