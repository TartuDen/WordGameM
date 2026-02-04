// WordGameM/www/js/wordsRepository.js

const WORDS_CACHE_KEY = "wordsCacheV1";
const WORDS_CACHE_META_KEY = "wordsCacheMetaV1";
const DEFAULT_REMOTE_URL = ""; // Set your remote JSON URL here when ready.
const BUNDLED_WORDS_URL = "data/words.json";

function getRemoteUrl() {
  return localStorage.getItem("wordsRemoteUrl") || DEFAULT_REMOTE_URL;
}

function isValidWordList(words) {
  return (
    Array.isArray(words) &&
    words.length > 0 &&
    typeof words[0] === "object" &&
    typeof words[0].word === "string"
  );
}

async function fetchWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function readCachedWords() {
  const cached = localStorage.getItem(WORDS_CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    return isValidWordList(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedWords(words) {
  localStorage.setItem(WORDS_CACHE_KEY, JSON.stringify(words));
  localStorage.setItem(
    WORDS_CACHE_META_KEY,
    JSON.stringify({ cachedAt: Date.now(), count: words.length })
  );
}

async function loadBundledWords() {
  const bundled = await fetchWithTimeout(BUNDLED_WORDS_URL, 6000);
  if (!isValidWordList(bundled)) {
    throw new Error("Bundled words.json invalid.");
  }
  return bundled;
}

export async function loadWords({ remoteUrl, timeoutMs } = {}) {
  const url = remoteUrl || getRemoteUrl();

  if (url) {
    try {
      const remoteWords = await fetchWithTimeout(url, timeoutMs);
      if (isValidWordList(remoteWords)) {
        writeCachedWords(remoteWords);
        return remoteWords;
      }
    } catch {
      // Fallback to cache/bundled below.
    }
  }

  const cached = readCachedWords();
  if (cached) return cached;

  const bundled = await loadBundledWords();
  writeCachedWords(bundled);
  return bundled;
}
