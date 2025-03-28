// WordGameM\www\js\app.js

import { englishList } from "./words.js";
import { userProgressList, PlayedWords } from "./mockUser.js";

let userProgressInMemory = [];
let sessionHistory = new PlayedWords();
let currentWord = null;

document.addEventListener("DOMContentLoaded", () => {
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");
    displayUserInfo();
    showWord();
  }

  document
    .getElementById("switchProfileIcon")
    .addEventListener("click", showProfilePage);

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

  document
    .getElementById("nextArrow")
    .addEventListener("click", () => {
      animatePageTurn("forward", loadNextWord);
    });
  document
    .getElementById("prevArrow")
    .addEventListener("click", () => {
      animatePageTurn("back", loadPreviousWord);
    });

  // Listen for "Save Categories"
  const saveCategoryBtn = document.getElementById("saveCategoryBtn");
  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener("click", onSaveCategories);
  }
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

const englishWords = englishList;

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

  // If we are going backward in history & the word was guessed right before, disable buttons
  const isFromHistory = sessionHistory.currentIndex < sessionHistory.words.length - 1;
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    const currentUser = JSON.parse(currentUserStr);
    const progressObj = userProgressInMemory.find(
      (up) => parseInt(up.user_id) === parseInt(currentUser.user_id)
    );
    let guessedCorrectly = false;
    if (progressObj && progressObj.guessed_words) {
      const gw = progressObj.guessed_words.find(
        (g) => parseInt(g.word_id) === parseInt(word.id)
      );
      if (gw && gw.guess_correctly > 0) {
        guessedCorrectly = true;
      }
    }
    if (isFromHistory && guessedCorrectly) {
      disableOptions();
    }
  }
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

/** Move backward in session history (if available). */
function loadPreviousWord() {
  const prevWord = sessionHistory.prevWord();
  if (prevWord) {
    displayWord(prevWord);
  } else {
    showToast("No previous words.");
  }
}

/** Filters words by user’s categories or uses the full list as fallback. */
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

/** Simple page-turn animation. */
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

/** Generate multiple-choice “rusTranslations” for each word. */
function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  // For “sentence” words, pick wrong options from meaning
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

    let allOptions = [correctOption, ...wrongOptions];
    shuffleArray(allOptions);

    allOptions.forEach((option) => {
      const btn = document.createElement("button");
      btn.textContent = option.translations.join("\n");
      btn.classList.add("option-btn");
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
  } else {
    // For normal words, pick random words of the same “type” as distractors
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
}

/** Grab N random words of the same type (exclude current word). */
function getRandomWrongWords(type, excludeId, count) {
  const candidates = englishWords.filter(
    (w) => w.type === type && w.id !== excludeId
  );
  shuffleArray(candidates);
  return candidates.slice(0, count);
}

/** Shuffle array in-place. */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Text-to-speech for the current word. */
function pronounceWord() {
  if (!currentWord || !currentWord.word) return;

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    speechSynthesis.speak(utterance);
  } else {
    alert("Text-to-speech is not supported on this device.");
  }
}

/** Return to profile page to pick a different user. */
function showProfilePage() {
  document.getElementById("gamePage").classList.add("hidden");
  document.getElementById("profilePage").classList.remove("hidden");
}

/** 
 * The critical fix: parseInt on user_id & word_id 
 * so that correct guesses increment properly.
 */
function updateUserProgress(isCorrect, wordId) {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);

  // Reload progress in memory
  let storedProgress = localStorage.getItem("userProgressList");
  if (storedProgress) {
    userProgressInMemory = JSON.parse(storedProgress);
  } else {
    userProgressInMemory = userProgressList;
    localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));
  }

  // Find or create progress object for user
  let progressObj = userProgressInMemory.find(
    (up) => parseInt(up.user_id) === parseInt(user.user_id)
  );
  if (!progressObj) {
    progressObj = {
      user_id: parseInt(user.user_id),
      guessed_words: [],
    };
    userProgressInMemory.push(progressObj);
  }

  // Find or create guessedWord object for this word
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

  // Increment correct/wrong
  if (isCorrect) {
    guessedWord.guess_correctly++;
  } else {
    guessedWord.guessed_wrong++;
  }

  // Save back
  localStorage.setItem("userProgressList", JSON.stringify(userProgressInMemory));

  // Update user info (stats)
  displayUserInfo();
}

/** Disable the multiple-choice buttons if the user already got it correct. */
function disableOptions() {
  const optionsContainer = document.getElementById("options");
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.getAttribute("data-correct") === "true") {
      // Show correct button in green
      btn.style.backgroundColor = "green";
    }
  });
}

/** Render user’s name, avatar, stats, categories, etc. */
export function displayUserInfo() {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);

  // Basic info
  document.getElementById("userNameDisplay").textContent = user.user_name;
  const userAvatarEl = document.getElementById("userAvatar");
  if (user.avatar) {
    userAvatarEl.src = "img/avatars/" + user.avatar;
    userAvatarEl.style.display = "block";
  } else {
    userAvatarEl.style.display = "none";
  }

  // Load userProgress from localStorage
  let storedProgress = localStorage.getItem("userProgressList");
  if (storedProgress) {
    userProgressInMemory = JSON.parse(storedProgress);
  } else {
    userProgressInMemory = userProgressList;
  }

  // Calculate total correct/wrong
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
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  document.getElementById("userStats").textContent = `${totalAttempts}/${correctPercent}%`;

  // Also show category checkboxes inside game page
  renderGamePageCategories(user);
}

/** Build checkboxes for all categories in game page. */
function renderGamePageCategories(user) {
  const container = document.getElementById("inlineVocabCheckboxes");
  const saveBtn = document.getElementById("saveCategoryBtn");
  if (!container || !saveBtn) return;

  // Collect all unique categories from englishList
  const uniqueVocabs = new Set();
  englishWords.forEach((word) => {
    if (Array.isArray(word.vocabulary)) {
      word.vocabulary.forEach((v) => uniqueVocabs.add(v));
    }
  });

  container.innerHTML = "";
  saveBtn.classList.add("hidden"); // hide until user changes something

  uniqueVocabs.forEach((vocab) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = vocab;
    checkbox.checked = user.vocabulary && user.vocabulary.includes(vocab);

    checkbox.addEventListener("change", () => {
      // If user toggles anything, show "Save" button
      saveBtn.classList.remove("hidden");
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + vocab));
    container.appendChild(label);
  });
}

/** Handle “Save Categories” in the game page. */
function onSaveCategories() {
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

  // Update currentUser in localStorage
  localStorage.setItem("currentUser", JSON.stringify(user));

  // Also update userList so changes persist beyond session
  let userListStr = localStorage.getItem("userList");
  if (userListStr) {
    const userList = JSON.parse(userListStr);
    const idx = userList.findIndex((u) => parseInt(u.user_id) === parseInt(user.user_id));
    if (idx !== -1) {
      userList[idx].vocabulary = newVocab;
      localStorage.setItem("userList", JSON.stringify(userList));
    }
  }

  // Hide "Save" button again
  document.getElementById("saveCategoryBtn").classList.add("hidden");

  // Recalculate stats, etc.
  displayUserInfo();

  // Optionally reset session history so new categories show up right away:
  // sessionHistory = new PlayedWords();

  showToast("Categories saved!");
  setTimeout(() => {
    hideToast();
    // Reload next word or do showWord() if you want a fresh pick
    showWord();
  }, 800);
}

/** Show a floating toast message. */
function showToast(message) {
  const toast = document.getElementById("resultToast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");
}

/** Hide toast after short delay. */
function hideToast() {
  const toast = document.getElementById("resultToast");
  toast.classList.remove("show");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 300);
}
