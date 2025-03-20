// WordGameM/www/js/app.js

import { englishList } from "./words.js";
import { userProgressList, PlayedWords } from "./mockUser.js"; // Import the new PlayedWords

let userProgressInMemory = [];

// Initialize the session history for played words.
let sessionHistory = new PlayedWords();
let currentWord = null;

document.addEventListener("DOMContentLoaded", () => {
  // If a user is already logged in, show the game page.
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");

    displayUserInfo();
    showWord();
  }

  // Set up switch profile functionality.
  document
    .getElementById("switchProfileIcon")
    .addEventListener("click", showProfilePage);

  // Toggle meaning.
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    document.getElementById("meaning").classList.toggle("hidden");
  });

  // Toggle synonyms.
  document.getElementById("showSynonymsBtn").addEventListener("click", () => {
    document.getElementById("synonyms").classList.toggle("hidden");
  });

  // Tap on the word to pronounce it.
  document.getElementById("word").addEventListener("click", pronounceWord);

  // ===== Remove swipe detection code =====
  // (Swiping functionality has been removed in favor of arrow navigation.)

  // ===== Add arrow button event listeners =====
  document.getElementById("nextArrow").addEventListener("click", () => {
    animatePageTurn("forward", loadNextWord);
  });

  document.getElementById("prevArrow").addEventListener("click", () => {
    animatePageTurn("back", loadPreviousWord);
  });
});

// Load user progress from localStorage or seed with the mock.
function loadUserProgress() {
  const data = localStorage.getItem("userProgressList");
  if (data) {
    userProgressInMemory = JSON.parse(data);
  } else {
    userProgressInMemory = userProgressList;
    localStorage.setItem(
      "userProgressList",
      JSON.stringify(userProgressInMemory)
    );
  }
}
loadUserProgress();

const englishWords = englishList;

/**
 * Renders a given word in the word card.
 */
function displayWord(word) {
  currentWord = word;
  document.getElementById("word").textContent = word.word;
  document.getElementById("transcription").textContent = word.transcription;
  
  // Hide meaning by default.
  const meaningEl = document.getElementById("meaning");
  meaningEl.textContent = word.meaning.join("; ");
  meaningEl.classList.add("hidden");

  // Hide synonyms by default.
  const synonymsEl = document.getElementById("synonyms");
  synonymsEl.textContent = word.synonyms
    ? "Synonyms: " + word.synonyms.join(", ")
    : "No synonyms available.";
  synonymsEl.classList.add("hidden");

  // Generate multiple-choice options.
  generateOptions(word);

  // Determine if this word is coming from history (i.e. revisited).
  const isFromHistory = (sessionHistory.currentIndex < sessionHistory.words.length - 1);
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    const currentUser = JSON.parse(currentUserStr);
    // Always re-load the latest progress from storage
    userProgressInMemory = JSON.parse(localStorage.getItem("userProgressList")) || [];
    const matchingProgress = userProgressInMemory.find(
      (up) => parseInt(up.user_id) === parseInt(currentUser.user_id)
    );
    let guessedCorrectly = false;
    if (matchingProgress && matchingProgress.guessed_words) {
      const guessedWord = matchingProgress.guessed_words.find(
        (gw) => gw.word_id === word.id
      );
      if (guessedWord && guessedWord.guess_correctly > 0) {
        guessedCorrectly = true;
      }
    }
    // If revisited and guessed correctly, disable guessing.
    if (isFromHistory && guessedCorrectly) {
      disableOptions();
    }
  }
}

/**
 * Called externally (and by arrow clicks) to show a new word.
 * It loads the next word into the session history.
 */
export function showWord() {
  loadNextWord();
}

/**
 * Loads the next word. If the current word is the latest in the history,
 * a new random word is generated and added.
 */
function loadNextWord() {
  let newWord;
  if (sessionHistory.currentIndex === sessionHistory.words.length - 1) {
    newWord = getRandomWord();
    sessionHistory.addWord(newWord);
  } else {
    newWord = sessionHistory.nextWord();
    if (!newWord) {
      newWord = getRandomWord();
      sessionHistory.addWord(newWord);
    }
  }
  displayWord(newWord);
}

/**
 * Loads the previous word from session history.
 */
function loadPreviousWord() {
  const prevWord = sessionHistory.prevWord();
  if (prevWord) {
    displayWord(prevWord);
  } else {
    showToast("No previous words.");
  }
}

/**
 * Returns a random word from englishWords.
 */
function getRandomWord() {
  const randIndex = Math.floor(Math.random() * englishWords.length);
  return englishWords[randIndex];
}

/**
 * Animate the page turn.
 * @param {string} direction - "forward" for next word, "back" for previous word.
 * @param {Function} callback - Function to update the word content.
 */
function animatePageTurn(direction, callback) {
  const wordCard = document.getElementById("wordCard");
  const animationClass = direction === "forward" ? "page-turn-forward" : "page-turn-back";
  wordCard.classList.add(animationClass);

  // After half the animation duration, update the word.
  setTimeout(() => {
    callback();
  }, 300); // half of 600ms

  // Remove the animation class after the animation completes.
  setTimeout(() => {
    wordCard.classList.remove(animationClass);
  }, 600);
}

/**
 * Generates multiple-choice options for a given word.
 * Each button gets a data attribute indicating if it is correct.
 */
function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  const correctOption = {
    translations: wordObj.rusTranslations,
    isCorrect: true,
  };

  // Get 2 random “wrong” options.
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
    // Mark whether this button is the correct answer.
    btn.setAttribute("data-correct", option.isCorrect);

    btn.addEventListener("click", () => {
      if (option.isCorrect) {
        showToast("Correct!");
        updateUserProgress(true, wordObj.id);
        setTimeout(() => {
          hideToast();
          animatePageTurn("forward", loadNextWord);
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
 * Returns a few wrong word options from the same type.
 */
function getRandomWrongWords(type, excludeId, count) {
  const candidates = englishWords.filter(
    (word) => word.type === type && word.id !== excludeId
  );
  shuffleArray(candidates);
  return candidates.slice(0, count);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Uses the Web Speech API to pronounce the current word when tapped.
 */
function pronounceWord() {
  if (!currentWord || !currentWord.word) return;

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    speechSynthesis.speak(utterance);
  } else if (window.plugins && window.plugins.tts) {
    window.plugins.tts.speak(
      {
        text: currentWord.word,
        locale: "en-US",
        rate: 0.75,
      },
      () => {
        console.log("TTS success");
      },
      (reason) => {
        console.error("TTS error: " + reason);
        alert("Text-to-speech failed: " + reason);
      }
    );
  } else {
    alert("Text-to-speech is not supported on this device.");
  }
}

function showProfilePage() {
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
}

/**
 * Updates the user’s progress (correct and incorrect counts) and
 * re-renders the stats.
 */
function updateUserProgress(isCorrect, wordId) {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);

  // Reload latest progress
  userProgressInMemory = JSON.parse(localStorage.getItem("userProgressList")) || [];

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

  let guessedWord = progressObj.guessed_words.find(
    (gw) => gw.word_id === wordId
  );
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

  localStorage.setItem(
    "userProgressList",
    JSON.stringify(userProgressInMemory)
  );
  displayUserInfo();
}

/**
 * Disables the answer options and highlights the correct one in green.
 */
function disableOptions() {
  const optionsContainer = document.getElementById("options");
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.getAttribute("data-correct") === "true") {
      btn.style.backgroundColor = "green";
    }
  });
}

/**
 * Displays user info and stats.
 */
export function displayUserInfo() {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);
  document.getElementById("userNameDisplay").textContent = user.user_name;

  const userAvatarEl = document.getElementById("userAvatar");
  if (user.avatar) {
    userAvatarEl.src = "img/avatars/" + user.avatar;
    userAvatarEl.style.display = "block";
  } else {
    userAvatarEl.style.display = "none";
  }

  // Always re-load the latest progress from storage
  userProgressInMemory = JSON.parse(localStorage.getItem("userProgressList")) || [];
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
  document.getElementById("userStats").textContent = `${totalAttempts}/${correctPercent}%`;
}

/*===================================================
  Toast functions for displaying brief messages.
=====================================================*/
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
