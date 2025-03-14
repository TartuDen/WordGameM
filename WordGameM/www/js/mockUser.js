// WordGameM\www\js\mockUser.js

export const user_data = {
    user_id: 1, // INT?
    user_name: "Den", //TEXT
    user_reg_data: "05.10.2022", // TIME ???
    vocabulary:["general", "gaming"]
  }
  
  export const user_progress = {
    user_id: "1",
    guessed_words: [
      {
        word_id: 1, //word's id,
        guess_correctly: 3,//number 
        guessed_wrong: 1,
      },
      {
        word_id: 10, //word's id,
        guess_correctly: 2,//number 
        guessed_wrong: 5,
      },
    ]
  }