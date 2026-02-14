// WordGameM\www\js\app.js

import { loadWords } from "./wordsRepository.js";
import { userProgressList, PlayedWords } from "./mockUser.js";
import { getCurrentUser, signOutUser } from "./firebaseAuth.js";
import { saveUserProfile, upsertCloudProgress } from "./cloudRepository.js";
import { setSyncStatus } from "./syncStatus.js";

let userProgressInMemory = [];
let sessionHistory = new PlayedWords();
let currentWord = null;
let englishWords = [];
let wordsLoaded = false;
const sessionOptionStates = new Map();
const sessionWordOptions = new Map();
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_VERTICAL_DRIFT = 50;

document.addEventListener("DOMContentLoaded", async () => {
  await ensureWordsLoaded();
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");
    displayUserInfo();
    showWord();
  }

  document
    .getElementById("switchProfileIcon")
    .addEventListener("click", () => {
      signOutUser().catch(() => {
        setSyncStatus("Sign-out failed", "error", 1500);
      });
    });

  document
    .getElementById("showMeaningBtn")
    .addEventListener("click", () => {
      document.getElementById("meaning").classList.toggle("hidden");
    });
  document
    .getElementById("showSynonymsBtn")
    .addEventListener("click", () => {
      document.getElementById("synonyms").classList.toggle("hidden");
    });
  document
    .getElementById("word")
    .addEventListener("click", pronounceWord);
  setupSwipeBackNavigation();
});

/** Load userProgress from localStorage or fallback. */
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

export async function ensureWordsLoaded() {
  if (wordsLoaded) return;
  englishWords = await loadWords();
  wordsLoaded = true;
}

export function getWordsSnapshot() {
  return englishWords;
}

export function getUserProgressList() {
  return userProgressInMemory;
}

export function setUserProgressList(list) {
  userProgressInMemory = Array.isArray(list) ? list : [];
  localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));
}

/** Displays a given word in the UI. */
function displayWord(word) {
  currentWord = word;
  document.getElementById("word").textContent = word.word;
  document.getElementById("transcription").textContent = word.transcription;

  const meaningEl = document.getElementById("meaning");
  meaningEl.textContent = word.meaning.join("; ");
  meaningEl.classList.add("hidden");

  const synonymsEl = document.getElementById("synonyms");
  synonymsEl.textContent = word.synonyms
    ? "Synonyms: " + word.synonyms.join(", ")
    : "No synonyms available.";
  synonymsEl.classList.add("hidden");

  generateOptions(word);
}

/** Move forward in session history or pick a new random word. */
export function showWord() {
  loadNextWord();
}

function loadNextWord() {
  if (sessionHistory.currentIndex === sessionHistory.words.length - 1) {
    const newWord = getRandomWord();
    sessionHistory.addWord(newWord);
    displayWord(newWord);
  } else {
    const next = sessionHistory.nextWord();
    if (!next) {
      const randWord = getRandomWord();
      sessionHistory.addWord(randWord);
      displayWord(randWord);
    } else {
      displayWord(next);
    }
  }
}

function loadPreviousWord() {
  const prevWord = sessionHistory.prevWord();
  if (prevWord) {
    displayWord(prevWord);
  }
}

function getRandomWord() {
  const currentUserStr = localStorage.getItem("currentUser");
  let availableWords = englishWords;

  if (currentUserStr) {
    const user = JSON.parse(currentUserStr);
    if (user.vocabulary && user.vocabulary.length > 0) {
      availableWords = englishWords.filter((word) =>
        word.vocabulary.some((v) => user.vocabulary.includes(v))
      );
    }
  }

  if (availableWords.length === 0) {
    availableWords = englishWords;
  }

  const randIndex = Math.floor(Math.random() * availableWords.length);
  return availableWords[randIndex];
}

function animatePageTurn(direction, callback) {
  const wordCard = document.getElementById("wordCard");
  const animationClass =
    direction === "forward" ? "page-turn-forward" : "page-turn-back";
  wordCard.classList.add(animationClass);

  setTimeout(() => {
    callback();
  }, 300);

  setTimeout(() => {
    wordCard.classList.remove(animationClass);
  }, 600);
}

/** 
 * UPDATED: We now show a styled toast for both "correct" & "wrong" instead of alert(), 
 * and color the correct button green immediately.
 */
function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  const wordKey = String(wordObj.id);
  let allOptions = sessionWordOptions.get(wordKey);

  if (!allOptions) {
    allOptions = buildOptionsForWord(wordObj);
    sessionWordOptions.set(wordKey, allOptions);
  }

  allOptions.forEach((option) => {
    const btn = buildOptionButton(option, wordObj.id);
    optionsContainer.appendChild(btn);
  });
  applySessionOptionState(wordObj.id);
}

function buildOptionsForWord(wordObj) {
  // For "sentence" words: use meaning-based distractors
  if (wordObj.vocabulary && wordObj.vocabulary.includes("sentence")) {
    const correctOption = {
      translations: wordObj.rusTranslations,
      isCorrect: true,
    };

    let wrongVariants = Array.isArray(wordObj.meaning)
      ? [...wordObj.meaning]
      : [];
    wrongVariants = wrongVariants.filter(
      (variant) => !wordObj.rusTranslations.includes(variant)
    );

    shuffleArray(wrongVariants);
    const wrongOptions = wrongVariants.slice(0, 2).map((variant) => ({
      translations: [variant],
      isCorrect: false,
    }));

    const allOptions = [correctOption, ...wrongOptions];
    shuffleArray(allOptions);
    return allOptions;
  }

  // For normal words: random words of the same type
  const correctOption = {
    translations: wordObj.rusTranslations,
    isCorrect: true,
  };
  const wrongWordObjects = getRandomWrongWords(wordObj.type, wordObj.id, 2);
  const wrongOptions = wrongWordObjects.map((w) => ({
    translations: w.rusTranslations,
    isCorrect: false,
  }));
  const allOptions = [correctOption, ...wrongOptions];
  shuffleArray(allOptions);
  return allOptions;
}

function buildOptionButton(option, wordId) {
  const btn = document.createElement("button");
  const optionKey = getOptionKey(option.translations);
  btn.textContent = option.translations.join("\n");
  btn.classList.add("option-btn");
  btn.setAttribute("data-correct", option.isCorrect);
  btn.setAttribute("data-option-key", optionKey);

  btn.addEventListener("click", () => {
    const wordState = getOrCreateWordState(wordId);
    if (wordState.solved) return;

    if (option.isCorrect) {
      wordState.solved = true;
      wordState.optionResults[optionKey] = "correct";
      btn.classList.remove("option-wrong", "option-shake");
      btn.classList.add("option-correct");
      updateUserProgress(true, wordId);
      disableOptions();
      setTimeout(() => {
        animatePageTurn("forward", loadNextWord);
      }, 450);
    } else {
      wordState.optionResults[optionKey] = "wrong";
      btn.classList.remove("option-correct");
      btn.classList.add("option-wrong", "option-shake");
      updateUserProgress(false, wordId);
      setTimeout(() => {
        btn.classList.remove("option-shake");
      }, 220);
    }
  });

  return btn;
}

function getRandomWrongWords(type, excludeId, count) {
  const candidates = englishWords.filter(
    (w) => w.type === type && w.id !== excludeId
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

function pronounceWord() {
  if (!currentWord || !currentWord.word) return;

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    speechSynthesis.speak(utterance);
  } else {
    alert("Text-to-speech is not supported on this device.");
  }
}

function getOptionKey(translations) {
  return (translations || []).join("||");
}

function getOrCreateWordState(wordId) {
  const key = String(wordId);
  if (!sessionOptionStates.has(key)) {
    sessionOptionStates.set(key, {
      solved: false,
      optionResults: {},
    });
  }
  return sessionOptionStates.get(key);
}

function applySessionOptionState(wordId) {
  const state = sessionOptionStates.get(String(wordId));
  if (!state) return;

  const optionsContainer = document.getElementById("options");
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((btn) => {
    const optionKey = btn.getAttribute("data-option-key");
    const result = state.optionResults[optionKey];
    if (result === "wrong") {
      btn.classList.add("option-wrong");
      btn.classList.remove("option-correct");
    } else if (result === "correct") {
      btn.classList.add("option-correct");
      btn.classList.remove("option-wrong");
    }
  });

  if (state.solved) {
    disableOptions();
  }
}

function setupSwipeBackNavigation() {
  const card = document.getElementById("wordCard");
  if (!card) return;

  let startX = 0;
  let startY = 0;

  const handleSwipeEnd = (endX, endY) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const isLeftSwipe = deltaX <= -SWIPE_MIN_DISTANCE;
    const isMostlyHorizontal = Math.abs(deltaY) <= SWIPE_MAX_VERTICAL_DRIFT;
    if (isLeftSwipe && isMostlyHorizontal) {
      animatePageTurn("back", loadPreviousWord);
    }
  };

  if ("PointerEvent" in window) {
    card.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    });
    card.addEventListener("pointerup", (event) => {
      handleSwipeEnd(event.clientX, event.clientY);
    });
    return;
  }

  card.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    },
    { passive: true }
  );
  card.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      handleSwipeEnd(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
}

/** 
 * CRITICAL: parseInt for IDs so "correct" increments actually work.
 */
function updateUserProgress(isCorrect, wordId) {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);

  let storedProgress = localStorage.getItem("userProgressList");
  if (storedProgress) {
    userProgressInMemory = JSON.parse(storedProgress);
  } else {
    userProgressInMemory = userProgressList;
    localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));
  }

  let progressObj = userProgressInMemory.find(
    (up) => String(up.user_id) === String(user.user_id)
  );
  if (!progressObj) {
    progressObj = {
      user_id: user.user_id,
      guessed_words: [],
    };
    userProgressInMemory.push(progressObj);
  }

  let guessedWord = progressObj.guessed_words.find(
    (gw) => parseInt(gw.word_id) === parseInt(wordId)
  );
  if (!guessedWord) {
    guessedWord = {
      word_id: parseInt(wordId),
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

  localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));
  const firebaseUser = getCurrentUser();
  if (firebaseUser && firebaseUser.uid) {
    setSyncStatus("Syncing...", "warn", 0);
    upsertCloudProgress(firebaseUser.uid, wordId, isCorrect)
      .then(() => {
        setSyncStatus("Synced", "ok", 1200);
      })
      .catch(() => {
        setSyncStatus("Offline", "error", 2000);
      });
  }
  displayUserInfo();
}

/** Disable answer buttons if user previously guessed correctly. */
function disableOptions() {
  const optionsContainer = document.getElementById("options");
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.getAttribute("data-correct") === "true") {
      btn.classList.add("option-correct");
    }
  });
}

/** 
 * Renders user info in the top card (name, avatar, stats, categories).
 * parseInt ensures we find the user's progress.
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

  let storedProgress = localStorage.getItem("userProgressList");
  if (storedProgress) {
    userProgressInMemory = JSON.parse(storedProgress);
  } else {
    userProgressInMemory = userProgressList;
  }

  const matchingProgress = userProgressInMemory.find(
    (up) => String(up.user_id) === String(user.user_id)
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
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  document.getElementById("userStats").textContent = `${totalAttempts}/${correctPercent}%`;

  // If you render categories in the game page, refresh them here:
  renderGamePageCategories(user);
}

/** Build checkboxes for categories in the game page. */
function renderGamePageCategories(user) {
  const container = document.getElementById("inlineVocabCheckboxes");
  if (!container) return;
  const uniqueVocabs = new Set();
  englishWords.forEach((word) => {
    if (Array.isArray(word.vocabulary)) {
      word.vocabulary.forEach((v) => uniqueVocabs.add(v));
    }
  });
  container.innerHTML = "";
  uniqueVocabs.forEach((vocab) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = vocab;
    checkbox.checked = user.vocabulary && user.vocabulary.includes(vocab);
    checkbox.addEventListener("change", () => {
      applyCategorySelection();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + vocab));
    container.appendChild(label);
  });
}
function applyCategorySelection() {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);
  const container = document.getElementById("inlineVocabCheckboxes");
  const checkboxes = container.querySelectorAll("input[type='checkbox']");
  const newVocab = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      newVocab.push(cb.value);
    }
  });
  user.vocabulary = newVocab;
  localStorage.setItem("currentUser", JSON.stringify(user));
  // Also update userList in localStorage
  let userListStr = localStorage.getItem("userList");
  if (userListStr) {
    const userList = JSON.parse(userListStr);
    const idx = userList.findIndex((u) => String(u.user_id) === String(user.user_id));
    if (idx !== -1) {
      userList[idx].vocabulary = newVocab;
      localStorage.setItem("userList", JSON.stringify(userList));
    }
  }
  const firebaseUser = getCurrentUser();
  if (firebaseUser && firebaseUser.uid) {
    saveUserProfile(firebaseUser.uid, {
      user_name: user.user_name,
      vocabulary: newVocab,
    }).catch(() => {
      // Best-effort sync.
    });
  }
  displayUserInfo();
  showToast("Categories updated!");
  setTimeout(() => {
    hideToast();
    showWord();
  }, 600);
}

function showToast(message, isError = false) {
  const toast = document.getElementById("resultToast");
  const toastMessage = document.getElementById("toastMessage");
  const toastContent = toast.querySelector(".toast-content");

  toastMessage.textContent = message;

  if (isError) {
    toastContent.style.backgroundColor = "#FF5C5C"; // Red-ish
  } else {
    toastContent.style.backgroundColor = "#1CB841"; // Same green as "Correct!"
  }

  toast.classList.remove("hidden");
  toast.classList.add("show");
}

/** Hide the toast, restore its original style. */
function hideToast() {
  const toast = document.getElementById("resultToast");
  const toastContent = toast.querySelector(".toast-content");

  toast.classList.remove("show");
  setTimeout(() => {
    toast.classList.add("hidden");
    toastContent.style.backgroundColor = "";
  }, 300);
}


