// WordGameM\www\js\app.js
import { englishList } from "./words.js";
const englishWords = englishList;

/**
 * We'll store the current word in a variable (instead of an index).
 */
let currentWord = null;

/**
 * Displays a new random word from the list.
 */
function showWord() {
  currentWord = getRandomWord();
  if (!currentWord) return;

  document.getElementById("word").textContent = currentWord.word;
  document.getElementById("transcription").textContent = currentWord.transcription;

  // Hide the meaning by default
  const meaningEl = document.getElementById("meaning");
  meaningEl.textContent = currentWord.meaning.join("; ");
  meaningEl.classList.add("hidden");

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
    }, 1000);
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
 * Show/hide the meaning when the button is clicked.
 */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    document.getElementById("meaning").classList.toggle("hidden");
  });

  // Start with the first random word
  showWord();
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
