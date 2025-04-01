export interface Guess {
  isValidated: boolean;
  value: string;
}

export interface GameState {
  wordleData: {
    wordle: string;
    encryptedWordle: string;
    hint: string;
  };
  guesses: Guess[];
  currentGuess: number;
  isGameover: boolean;
  showHint: boolean;
  lastPlayedDate: string;
  message: string;
}
