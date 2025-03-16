// WordGameM\www\js\app.js

import { englishList } from "./words.js";
import { userProgressList } from "./mockUser.js";

let userProgressInMemory = [];

// Load userProgress from localStorage or from the mock
function loadUserProgress() {
  const data = localStorage.getItem("userProgressList");
  if (data) {
    userProgressInMemory = JSON.parse(data);
  } else {
    userProgressInMemory = userProgressList;
    localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));
  }
}
loadUserProgress();

const englishWords = englishList;
let currentWord = null;

document.addEventListener("DOMContentLoaded", () => {
  // If a user is logged in from before, show the game page
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");

    displayUserInfo();
    showWord();
  }

  // Switch Profile => show profile page
  document
    .getElementById("switchProfileBtn")
    .addEventListener("click", showProfilePage);

  // Toggle meaning
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    document.getElementById("meaning").classList.toggle("hidden");
  });

  // Toggle synonyms
  document.getElementById("showSynonymsBtn").addEventListener("click", () => {
    document.getElementById("synonyms").classList.toggle("hidden");
  });

  // Simple pull-to-refresh for mobile
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
 * Export so auth.js can call these:
 *   displayUserInfo()
 *   showWord()
 */
export function displayUserInfo() {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;

  const user = JSON.parse(currentUserStr);

  // Basic user data (kid-friendly style)
  document.getElementById("userNameDisplay").textContent =
    "Player: " + user.user_name;
  document.getElementById("userRegDateDisplay").textContent =
    "Registered on: " + user.user_reg_data;

  // Calculate stats
  const matchingProgress = userProgressInMemory.find(
    (up) => parseInt(up.user_id) === parseInt(user.user_id)
  );

  let totalCorrect = 0;
  let totalWrong = 0;
  if (matchingProgress && matchingProgress.guessed_words) {
    matchingProgress.guessed_words.forEach((gw) => {
      totalCorrect += gw.guess_correctly;
      totalWrong += gw.guessed_wrong;
    });
  }

  const totalAttempts = totalCorrect + totalWrong;
  const correctPercent =
    totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(0) : 0;

  // Display total attempts & correct% in a simpler style
  document.getElementById("totalPlayedWordsDisplay").textContent =
    `Total Attempts: ${totalAttempts}`;
  document.getElementById("correctPercentageDisplay").textContent =
    `Correct Guesses: ${correctPercent}%`;
}

export function showWord() {
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

function showProfilePage() {
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
}

/**
 * Track correct/wrong guesses in userProgressInMemory
 */
function updateUserProgress(isCorrect, wordId) {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);

  let progressObj = userProgressInMemory.find(
    (up) => parseInt(up.user_id) === parseInt(user.user_id)
  );
  if (!progressObj) {
    progressObj = {
      user_id: user.user_id,
      guessed_words: [],
    };
    userProgressInMemory.push(progressObj);
  }

  let guessedWord = progressObj.guessed_words.find((gw) => gw.word_id === wordId);
  if (!guessedWord) {
    guessedWord = {
      word_id: wordId,
      guess_correctly: 0,
      guessed_wrong: 0,
    };
    progressObj.guessed_words.push(guessedWord);
  }

  if (isCorrect) {
    guessedWord.guess_correctly++;
  } else {
    guessedWord.guessed_wrong++;
  }

  // Persist changes
  localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));

  // Re-render user info to update stats
  displayUserInfo();
}

function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  const correctOption = {
    translations: wordObj.rusTranslations,
    isCorrect: true,
  };

  // Get 2 random “wrong” options
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
        updateUserProgress(true, wordObj.id);

        setTimeout(() => {
          hideToast();
          showWord();
        }, 1000);
      } else {
        alert("Incorrect. Try again!");
        updateUserProgress(false, wordObj.id);
      }
    });

    optionsContainer.appendChild(btn);
  });
}

/**
 * Return `count` random words of the same type, excluding the current word's ID
 */
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
