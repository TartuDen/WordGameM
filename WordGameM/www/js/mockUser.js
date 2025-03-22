// WordGameM/www/js/mockUser.js

export const userDataList = [
  {
    user_id: 1,
    user_name: "Den",
    user_reg_data: "05.10.2022",
    vocabulary: ["general"],
  },
  {
    user_id: 2,
    user_name: "Mike",
    user_reg_data: "07.02.2023",
    vocabulary: ["general"],
  },
];

export const userProgressList = [
  {
    user_id: 1,
    guessed_words: [
      {
        word_id: 1, //word's id,
        guess_correctly: 3,
        guessed_wrong: 1,
      },
      {
        word_id: 10,
        guess_correctly: 2,
        guessed_wrong: 5,
      },
    ],
  },
  {
    user_id: 2,
    guessed_words: [
      {
        word_id: 1,
        guess_correctly: 0,
        guessed_wrong: 1,
      },
    ],
  },
];

/*===================================================
  NEW: PlayedWords prototype to track session history.
  This object will hold all played words and the current index.
=====================================================*/
export class PlayedWords {
  constructor() {
    this.words = [];
    this.currentIndex = -1;
  }

  addWord(word) {
    // If the user has navigated back, trim the "future" history.
    if (this.currentIndex < this.words.length - 1) {
      this.words = this.words.slice(0, this.currentIndex + 1);
    }
    this.words.push(word);
    this.currentIndex = this.words.length - 1;
  }

  nextWord() {
    // If there is already a “next” word (from a previous backward navigation),
    // move the pointer forward.
    if (this.currentIndex < this.words.length - 1) {
      this.currentIndex++;
      return this.words[this.currentIndex];
    }
    return null;
  }

  prevWord() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.words[this.currentIndex];
    }
    return null;
  }
}
