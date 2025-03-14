const englishWords = [
    {
      id: 1,
      word: "world",
      transcription: "",//add here transcription
      type: "",// add here, what type it is? object, noun, verb, phrase, etc,
      synonyms: ["earth", "globe", "planet", "sphere"],
      meaning: [
        "the earth, together with all of its countries and peoples."
      ],
      rusTranslations: ["мир"]
    },
    {
      id: 2,
      word: "happy",
      transcription: "",//add here transcription
      type: "",// add here, what type it is? object, noun, verb, phrase, etc,
      synonyms: ["joyful", "cheerful", "content", "delighted"],
      meaning: [
        "feeling or showing pleasure or contentment"
      ],
      rusTranslations: ["счастливый"]
    },
    {
      id: 3,
      word: "love",
      transcription: "",//add here transcription
      type: "",// add here, what type it is? object, noun, verb, phrase, etc,
      synonyms: ["affection", "adoration", "fondness", "devotion"],
      meaning: [
        "an intense feeling of deep affection",
        "a great interest and pleasure in something"
      ],
      rusTranslations: ["любовь"]
    },
    {
      id: 4,
      word: "book",
      synonyms: ["volume", "tome", "publication", "work"],
      meaning: [
        "a written or printed work consisting of pages glued or sewn together along one side and bound in covers"
      ],
      rusTranslations: ["книга"]
    }
  ];

const user_data = {
  user_id: "will be given by db, unique",
  user_name: "Name, also unique",
  user_reg_data: "time when user registered",
  vocabulary:["general", "gaming"]
}

const user_progress = {
  user_id: "",
  guessed_words: [
    {
      word_id: 1, //word's id,
      guess_correctly: 3,//number 
      guessed_wrong: 1,
    }
  ]
}