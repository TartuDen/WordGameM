// WordGameM\www\js\mockUser.js

export const userDataList = [
  {
    user_id: 1,
    user_name: "Den",
    user_reg_data: "05.10.2022",
    vocabulary: ["general", "gaming"],
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
