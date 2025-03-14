// WordGameM\www\js\app.js
import { englishList } from "./words.js";
const englishWords = englishList;

/**
 * We'll store the current word in a variable.
 */
let currentWord = null;

/**
 * Displays a new random word from the list.
 */
function showWord() {
  currentWord = getRandomWord();
  if (!currentWord) return;

  // Show the main word
  document.getElementById("word").textContent = currentWord.word;
  // Show the transcription
  document.getElementById("transcription").textContent = currentWord.transcription;

  // Hide meaning by default
  const meaningEl = document.getElementById("meaning");
  meaningEl.textContent = currentWord.meaning.join("; ");
  meaningEl.classList.add("hidden");

  // Hide synonyms by default
  const synonymsEl = document.getElementById("synonyms");
  if (currentWord.synonyms) {
    synonymsEl.textContent = "Synonyms: " + currentWord.synonyms.join(", ");
  } else {
    synonymsEl.textContent = "No synonyms available.";
  }
  synonymsEl.classList.add("hidden");

  // Generate multiple-choice buttons
  generateOptions(currentWord);
}

/**
 * Generates multiple-choice options for the current word.
 */
function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  // The correct translation is the first in rusTranslations
  const correctAnswer = wordObj.rusTranslations[0];

  // Get random wrong answers from words of the same type
  const wrongAnswers = getRandomTranslations(wordObj.type, correctAnswer);

  // Combine and shuffle
  const allAnswers = [correctAnswer, ...wrongAnswers];
  shuffleArray(allAnswers);

  // Create buttons
  allAnswers.forEach((answer) => {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.classList.add("option-btn");
    btn.addEventListener("click", () => checkAnswer(answer, correctAnswer));
    optionsContainer.appendChild(btn);
  });
}

/**
 * Check the player's answer.
 */
function checkAnswer(selected, correct) {
  if (selected === correct) {
    showToast("Correct!");
    // Hide the toast after 1 second, then show the next random word
    setTimeout(() => {
      hideToast();
      showWord();
    }, 500);
  } else {
    alert("Incorrect. Try again!");
  }
}

/**
 * Returns a random word from the entire englishWords array.
 */
function getRandomWord() {
  const randIndex = Math.floor(Math.random() * englishWords.length);
  return englishWords[randIndex];
}

/**
 * Gets 2 random wrong translations from words of the same 'type'.
 */
function getRandomTranslations(type, exclude) {
  // Filter words by same type
  const sameTypeWords = englishWords.filter((word) => word.type === type);

  // Gather all possible rusTranslations from them
  let possibleTranslations = [];
  sameTypeWords.forEach((w) => {
    possibleTranslations = possibleTranslations.concat(w.rusTranslations);
  });

  // Remove the correct answer
  possibleTranslations = possibleTranslations.filter((t) => t !== exclude);

  // Shuffle and pick 2 random
  shuffleArray(possibleTranslations);
  return possibleTranslations.slice(0, 2);
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Show/hide the meaning or synonyms when the corresponding buttons are clicked.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Meaning toggle
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    document.getElementById("meaning").classList.toggle("hidden");
  });

  // Synonyms toggle
  document.getElementById("showSynonymsBtn").addEventListener("click", () => {
    document.getElementById("synonyms").classList.toggle("hidden");
  });

  // Start with the first random word
  showWord();

  // Pull-to-refresh logic (simple version)
  let startY = null;
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      // Record initial touch
      startY = e.touches[0].clientY;
    }
  });

  document.addEventListener("touchend", (e) => {
    if (startY !== null && e.changedTouches.length === 1) {
      const endY = e.changedTouches[0].clientY;
      const distance = endY - startY;

      // Check if the user pulled down 100px from top of the page
      if (distance > 100 && window.scrollY === 0) {
        // Refresh the page
        window.location.reload();
      }
    }
    startY = null;
  });
});

/*============================================================
  TOAST FUNCTIONALITY
============================================================*/
function showToast(message) {
  const toast = document.getElementById("resultToast");
  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;

  // Reveal the toast: remove .hidden, add .show (for CSS transitions)
  toast.classList.remove("hidden");
  toast.classList.add("show");
}

function hideToast() {
  const toast = document.getElementById("resultToast");

  // Remove the .show class to let the transition animate
  toast.classList.remove("show");

  // After transition completes, add .hidden to remove it from layout
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 300); // match the transition time from CSS
}
