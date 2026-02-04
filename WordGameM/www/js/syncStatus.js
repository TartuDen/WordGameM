// WordGameM/www/js/syncStatus.js

let hideTimer = null;

export function setSyncStatus(message, tone = "info", timeoutMs = 1500) {
  const el = document.getElementById("syncStatus");
  if (!el) return;

  if (!message) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }

  el.textContent = message;
  el.classList.remove("hidden");
  el.dataset.tone = tone;

  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  if (timeoutMs > 0) {
    hideTimer = setTimeout(() => {
      el.classList.add("hidden");
    }, timeoutMs);
  }
}
