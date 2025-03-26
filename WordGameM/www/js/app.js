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
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    document.getElementById("meaning").classList.toggle("hidden");
  });
  document.getElementById("showSynonymsBtn").addEventListener("click", () => {
    document.getElementById("synonyms").classList.toggle("hidden");
  });
  document.getElementById("word").addEventListener("click", pronounceWord);
  document.getElementById("nextArrow").addEventListener("click", () => {
    animatePageTurn("forward", loadNextWord);
  });
  document.getElementById("prevArrow").addEventListener("click", () => {
    animatePageTurn("back", loadPreviousWord);
  });
});

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

  const isFromHistory = (sessionHistory.currentIndex < sessionHistory.words.length - 1);
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    const currentUser = JSON.parse(currentUserStr);
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
    if (isFromHistory && guessedCorrectly) {
      disableOptions();
    }
  }
}

export function showWord() {
  loadNextWord();
}

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

function loadPreviousWord() {
  const prevWord = sessionHistory.prevWord();
  if (prevWord) {
    displayWord(prevWord);
  } else {
    showToast("No previous words.");
  }
}

function getRandomWord() {
  const currentUserStr = localStorage.getItem("currentUser");
  let availableWords = englishWords;
  if (currentUserStr) {
    const user = JSON.parse(currentUserStr);
    if (user.vocabulary && user.vocabulary.length > 0) {
      availableWords = englishWords.filter(word => {
        return word.vocabulary.some(v => user.vocabulary.includes(v));
      });
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
  const animationClass = direction === "forward" ? "page-turn-forward" : "page-turn-back";
  wordCard.classList.add(animationClass);

  setTimeout(() => {
    callback();
  }, 300);

  setTimeout(() => {
    wordCard.classList.remove(animationClass);
  }, 600);
}

/* ========= UPDATED generateOptions FUNCTION =========
   For words with "sentence" vocabulary, wrong options are taken from
   the same word object's meaning property.
======================================================== */
function generateOptions(wordObj) {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  // Check if the word is of type "sentence" (or has "sentence" in its vocabulary)
  if (wordObj.vocabulary && wordObj.vocabulary.includes("sentence")) {
    const correctOption = {
      translations: wordObj.rusTranslations,
      isCorrect: true,
    };

    // Use the meanings array as the source of wrong options,
    // but filter out any option that exactly matches a correct translation.
    let wrongVariants = Array.isArray(wordObj.meaning) ? wordObj.meaning.slice() : [];
    wrongVariants = wrongVariants.filter(variant => !wordObj.rusTranslations.includes(variant));

    const desiredCount = 2;
    shuffleArray(wrongVariants);
    const wrongOptions = wrongVariants.slice(0, desiredCount).map(variant => ({
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
    // For non-sentence words, use the existing logic.
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

function updateUserProgress(isCorrect, wordId) {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) return;
  const user = JSON.parse(currentUserStr);

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
