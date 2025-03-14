// WordGameM\www\js\app.js
import { englishList } from "./words.js";
import { user_progress } from "./mockUser.js"; // mock progress for demonstration

const englishWords = englishList;
let currentWord = null;

document.addEventListener("DOMContentLoaded", () => {
  // If there's a logged-in user, show game page & user info
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");

    // Show the user's data
    displayUserInfo();
    // Start the quiz
    showWord();
  }

  // Switch Profile => show profile page
  document
    .getElementById("switchProfileBtn")
    .addEventListener("click", showProfilePage);

  // Toggle meaning
  document
    .getElementById("showMeaningBtn")
    .addEventListener("click", () => {
      document.getElementById("meaning").classList.toggle("hidden");
    });

  // Toggle synonyms
  document
    .getElementById("showSynonymsBtn")
    .addEventListener("click", () => {
      document.getElementById("synonyms").classList.toggle("hidden");
    });

  // Simple pull-to-refresh
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

/**
 * Show the profile page, hide the game page
 */
function showProfilePage() {
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
}

/**
 * Display the current user’s info (name, date, vocab, progress)
 */
function displayUserInfo() {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;

  const user = JSON.parse(currentUserStr);

  // Basic user data
  document.getElementById("userNameDisplay").textContent = user.user_name;
  document.getElementById("userRegDateDisplay").textContent =
    "Registered on: " + user.user_reg_data;
  document.getElementById("userVocabularyDisplay").textContent =
    "Vocabularies: " + (user.vocabulary || []).join(", ");

  // Show guessed words if user_progress.user_id matches
  const progressListEl = document.getElementById("userProgressList");
  progressListEl.innerHTML = "";

  if (parseInt(user_progress.user_id) === user.user_id) {
    if (user_progress.guessed_words && user_progress.guessed_words.length > 0) {
      user_progress.guessed_words.forEach((gw) => {
        const li = document.createElement("li");
        li.textContent = `Word ID ${gw.word_id}: correct = ${gw.guess_correctly}, wrong = ${gw.guessed_wrong}`;
        progressListEl.appendChild(li);
      });
    } else {
      progressListEl.innerHTML = "<li>No guessed words yet.</li>";
    }
  } else {
    // No matching progress
    progressListEl.innerHTML = "<li>No progress for this user.</li>";
  }
}

/**
 * Show a random word from our englishWords array
 */
function showWord() {
  currentWord = getRandomWord();
  if (!currentWord) return;

  document.getElementById("word").textContent = currentWord.word;
  document.getElementById("transcription").textContent = currentWord.transcription;

  // Hide meaning by default
  const meaningEl = document.getElementById("meaning");
  meaningEl.textContent = currentWord.meaning.join("; ");
  meaningEl.classList.add("hidden");

  // Hide synonyms by default
  const synonymsEl = document.getElementById("synonyms");
  synonymsEl.textContent = currentWord.synonyms
    ? "Synonyms: " + currentWord.synonyms.join(", ")
    : "No synonyms available.";
  synonymsEl.classList.add("hidden");

  // Generate multiple-choice options
  generateOptions(currentWord);
}

/**
 * Generate correct + wrong multiple-choice buttons
 */
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

/**
 * Get 'count' random words of same type, excluding current word's ID
 */
function getRandomWrongWords(type, excludeId, count) {
  const candidates = englishWords.filter(
    (word) => word.type === type && word.id !== excludeId
  );
  shuffleArray(candidates);
  return candidates.slice(0, count);
}

/**
 * Randomly pick a word from the list
 */
function getRandomWord() {
  const randIndex = Math.floor(Math.random() * englishWords.length);
  return englishWords[randIndex];
}

/** Shuffle array in-place (Fisher-Yates) */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/*============================================================
  TOAST FUNCTIONS
============================================================*/
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
