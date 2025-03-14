// WordGameM\www\js\app.js
import { englishList } from "./words.js";
const englishWords = englishList;

let currentWord = null;

document.addEventListener("DOMContentLoaded", () => {
  // If there's a currentUser in localStorage, show game page
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");

    // Start the game
    showWord();
  }

  // Switch Profile button => show the profile page
  const switchBtn = document.getElementById("switchProfileBtn");
  switchBtn.addEventListener("click", showProfilePage);

  // Meaning toggle
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    document.getElementById("meaning").classList.toggle("hidden");
  });

  // Synonyms toggle
  document.getElementById("showSynonymsBtn").addEventListener("click", () => {
    document.getElementById("synonyms").classList.toggle("hidden");
  });

  // Pull-to-refresh
  let startY = null;
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      startY = e.touches[0].clientY;
    }
  });
  document.addEventListener("touchend", (e) => {
    if (startY !== null && e.changedTouches.length === 1) {
      const endY = e.changedTouches[0].clientY;
      const distance = endY - startY;
      if (distance > 100 && window.scrollY === 0) {
        window.location.reload();
      }
    }
    startY = null;
  });
});

function showProfilePage() {
  // Simply hide the game page, show the profile page
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
}

// Main logic for displaying random word, etc.
function showWord() {
  currentWord = getRandomWord();
  if (!currentWord) return;

  document.getElementById("word").textContent = currentWord.word;
  document.getElementById("transcription").textContent =
    currentWord.transcription;

  const meaningEl = document.getElementById("meaning");
  meaningEl.textContent = currentWord.meaning.join("; ");
  meaningEl.classList.add("hidden");

  const synonymsEl = document.getElementById("synonyms");
  synonymsEl.textContent = currentWord.synonyms
    ? "Synonyms: " + currentWord.synonyms.join(", ")
    : "No synonyms available.";
  synonymsEl.classList.add("hidden");

  generateOptions(currentWord);
}

// The rest of your code unchanged
function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  const correctOption = {
    translations: wordObj.rusTranslations,
    isCorrect: true,
  };

  const wrongWordObjects = getRandomWrongWords(wordObj.type, wordObj.id, 2);
  const wrongOptions = wrongWordObjects.map((w) => ({
    translations: w.rusTranslations,
    isCorrect: false,
  }));

  let allOptions = [correctOption, ...wrongOptions];
  shuffleArray(allOptions);

  allOptions.forEach((option) => {
    const btn = document.createElement("button");
    btn.textContent = option.translations.join("\n");
    btn.classList.add("option-btn");

    btn.addEventListener("click", () => {
      if (option.isCorrect) {
        showToast("Correct!");
        setTimeout(() => {
          hideToast();
          showWord();
        }, 1000);
      } else {
        alert("Incorrect. Try again!");
      }
    });
    optionsContainer.appendChild(btn);
  });
}

function getRandomWrongWords(type, excludeId, count) {
  const candidates = englishWords.filter(
    (word) => word.type === type && word.id !== excludeId
  );
  shuffleArray(candidates);
  return candidates.slice(0, count);
}

function getRandomWord() {
  const randIndex = Math.floor(Math.random() * englishWords.length);
  return englishWords[randIndex];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* Toast functions */
function showToast(message) {
  const toast = document.getElementById("resultToast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");
}

function hideToast() {
  const toast = document.getElementById("resultToast");
  toast.classList.remove("show");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 300);
}
