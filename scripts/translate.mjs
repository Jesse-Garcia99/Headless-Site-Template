#!/usr/bin/env node
// Delta-translates locales/en.json into every other locales/<lang>.json via
// the OpenAI chat API. Only new/changed keys are translated (tracked in
// locales/source-map.json). No-op when locales/ or OPENAI_API_KEY is absent —
// the translate workflow also gates on both.
import fs from 'fs/promises';
import path from 'path';

const LOCALES_DIR = path.join(process.cwd(), 'locales');
const BASE_FILE = path.join(LOCALES_DIR, 'en.json');
const SOURCE_MAP_FILE = path.join(LOCALES_DIR, 'source-map.json');

const LANGUAGE_NAMES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  ko: 'Korean',
  pt: 'Portuguese',
};

const MAX_BATCH_SIZE = Number.parseInt(process.env.TRANSLATE_BATCH_SIZE || '40', 10);

// Brand/product names preserved verbatim. Comes from site.json plus an
// optional comma-separated TRANSLATE_DO_NOT_TRANSLATE env var.
async function doNotTranslateList() {
  const defaults = [];
  try {
    const site = JSON.parse(await fs.readFile('src/content/site.json', 'utf8'));
    if (site.name) defaults.push(String(site.name));
    if (site.siteName) defaults.push(String(site.siteName));
  } catch { /* site.json optional */ }
  const extra = (process.env.TRANSLATE_DO_NOT_TRANSLATE || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...defaults, ...extra])];
}

function flatten(obj, prefix = '', result = {}) {
  Object.entries(obj || {}).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  });
  return result;
}

function setNested(obj, key, value) {
  const parts = key.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (i === parts.length - 1) {
      current[part] = value;
      return;
    }
    if (!current[part] || typeof current[part] !== 'object') current[part] = {};
    current = current[part];
  }
}

const chunkKeys = (keys, size) =>
  Array.from({ length: Math.ceil(keys.length / size) }, (_, i) => keys.slice(i * size, i * size + size));

function extractJson(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) throw new Error('Empty translation response');
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

async function translateBatch(langCode, entries, protectedTerms) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY for translation');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const langName = LANGUAGE_NAMES[langCode] || langCode;
  const protectedLine = protectedTerms.length
    ? `- Do not translate these brand/product names: ${protectedTerms.map((t) => `"${t}"`).join(', ')}.`
    : '- Do not translate brand or product names.';

  const systemPrompt = [
    `You are a translation engine. Translate the JSON values from English to ${langName}.`,
    'Rules:',
    '- Preserve JSON keys exactly.',
    '- Preserve placeholders like {{name}}, {{count}}, {{url}} exactly.',
    protectedLine,
    '- Keep punctuation and emojis.',
    '- Return JSON only, no explanations.',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(entries, null, 2) },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation API error (${response.status}): ${await response.text()}`);
  }
  const data = await response.json();
  return extractJson(data.choices?.[0]?.message?.content);
}

const fileExists = (p) => fs.access(p).then(() => true).catch(() => false);

async function main() {
  if (!(await fileExists(BASE_FILE))) {
    console.log('No locales/en.json — localization not configured.');
    return;
  }
  const baseFlat = flatten(JSON.parse(await fs.readFile(BASE_FILE, 'utf8')));
  const protectedTerms = await doNotTranslateList();
  const force = process.env.FORCE_TRANSLATE === 'true';

  const sourceMapExists = await fileExists(SOURCE_MAP_FILE);
  const sourceMap = sourceMapExists
    ? JSON.parse(await fs.readFile(SOURCE_MAP_FILE, 'utf8'))
    : { _meta: { source: 'en', updatedAt: null }, keys: {} };
  const previousSource = sourceMap.keys || {};
  const previousKeys = Object.keys(previousSource);

  const baseKeys = Object.keys(baseFlat);
  const changedKeys = force
    ? baseKeys
    : sourceMapExists
      ? baseKeys.filter((key) => previousSource[key] !== baseFlat[key])
      : [];
  const sourceMapNeedsUpdate =
    !sourceMapExists ||
    changedKeys.length > 0 ||
    previousKeys.some((key) => !(key in baseFlat));

  const languageFiles = (await fs.readdir(LOCALES_DIR)).filter(
    (f) => f.endsWith('.json') && f !== 'en.json' && f !== 'source-map.json'
  );
  if (languageFiles.length === 0) {
    console.log('No target locale files — add e.g. locales/es.json to enable translation.');
    return;
  }

  let anyChanges = false;
  for (const file of languageFiles) {
    const langCode = path.basename(file, '.json');
    const filePath = path.join(LOCALES_DIR, file);
    const current = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const currentFlat = flatten(current);

    const keysToTranslate = Array.from(
      new Set([
        ...baseKeys.filter((key) => !(key in currentFlat)),
        ...changedKeys,
      ])
    );
    if (keysToTranslate.length > 0 && !process.env.OPENAI_API_KEY) {
      throw new Error(`Translation required for ${file} but OPENAI_API_KEY is not set.`);
    }

    for (const batch of chunkKeys(keysToTranslate, MAX_BATCH_SIZE)) {
      const entries = Object.fromEntries(batch.map((k) => [k, baseFlat[k]]));
      const translated = await translateBatch(langCode, entries, protectedTerms);
      Object.entries(translated).forEach(([key, value]) => {
        if (typeof value === 'string') currentFlat[key] = value;
      });
    }

    const rebuilt = {};
    baseKeys.forEach((key) => {
      setNested(rebuilt, key, currentFlat[key] !== undefined ? currentFlat[key] : baseFlat[key]);
    });

    const nextContent = `${JSON.stringify(rebuilt, null, 2)}\n`;
    if (nextContent !== `${JSON.stringify(current, null, 2)}\n`) {
      await fs.writeFile(filePath, nextContent, 'utf8');
      anyChanges = true;
      console.log(`Updated ${file} (${keysToTranslate.length} keys)`);
    }
  }

  if (sourceMapNeedsUpdate) {
    sourceMap.keys = baseFlat;
    sourceMap._meta.updatedAt = new Date().toISOString();
    const nextSourceMap = `${JSON.stringify(sourceMap, null, 2)}\n`;
    const currentSourceMap = sourceMapExists ? await fs.readFile(SOURCE_MAP_FILE, 'utf8') : '';
    if (nextSourceMap !== currentSourceMap) {
      await fs.writeFile(SOURCE_MAP_FILE, nextSourceMap, 'utf8');
      anyChanges = true;
      console.log('Updated source-map.json');
    }
  }

  if (!anyChanges) console.log('No translation updates needed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
