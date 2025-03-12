// WordGameM\www\js\app.js
import { englishList } from "./words.js";
const englishWords = englishList;
  

  let currentIndex = 0;

function showWord() {
  const wordObj = englishWords[currentIndex];

  document.getElementById('word').textContent = wordObj.word;
  document.getElementById('transcription').textContent = wordObj.transcription;
  // Hide the meaning initially
  document.getElementById('meaning').classList.add('hidden');
  document.getElementById('meaning').textContent = wordObj.meaning.join('; ');

  // Generate random options
  generateOptions(wordObj);
}

function generateOptions(wordObj) {
  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';

  // Correct translation
  const correctAnswer = wordObj.rusTranslations[0];

  // Gather some random translations from other words (same type ideally)
  const wrongAnswers = getRandomTranslations(wordObj.type, correctAnswer);

  // Combine correct answer and wrong answers
  const allAnswers = [correctAnswer, ...wrongAnswers];

  // Shuffle them
  shuffleArray(allAnswers);

  // Create buttons
  allAnswers.forEach(answer => {
    const btn = document.createElement('button');
    btn.textContent = answer;
    btn.addEventListener('click', () => checkAnswer(answer, correctAnswer));
    optionsContainer.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    alert('Correct!');
    // Move to next word
    currentIndex = (currentIndex + 1) % englishWords.length;
    showWord();
  } else {
    alert('Incorrect. Try again!');
  }
}

// Helper to get random translations from words of the same type
function getRandomTranslations(type, exclude) {
  // Filter the words that have the same type
  const sameTypeWords = englishWords.filter(word => word.type === type);

  // Gather all possible rusTranslations from them
  let possibleTranslations = [];
  sameTypeWords.forEach(w => {
    possibleTranslations = possibleTranslations.concat(w.rusTranslations);
  });

  // Remove the correct answer
  possibleTranslations = possibleTranslations.filter(t => t !== exclude);

  // Shuffle and pick some random ones (e.g., pick 2 or 3)
  shuffleArray(possibleTranslations);
  return possibleTranslations.slice(0, 2); // pick 2 random wrong options
}

// Simple array shuffle function
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('showMeaningBtn').addEventListener('click', () => {
    document.getElementById('meaning').classList.toggle('hidden');
  });
  showWord();
});