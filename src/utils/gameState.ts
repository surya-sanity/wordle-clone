import wordles from "../wordles.json";

interface GameState {
  currentWord: string;
  currentHint: string;
  lastPlayedDate: string;
  isGameOver: boolean;
  attempts: string[];
  won: boolean;
}

const STORAGE_KEY = "wordle_game_state";

export const getGameState = (): GameState => {
  const today = new Date().toISOString().split("T")[0];
  const storedState = localStorage.getItem(STORAGE_KEY);

  if (storedState) {
    const state: GameState = JSON.parse(storedState);

    if (state.lastPlayedDate !== today) {
      return initializeNewGame();
    }

    return state;
  }

  return initializeNewGame();
};

const initializeNewGame = (): GameState => {
  const today = new Date().toISOString().split("T")[0];

  const seed = today
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const wordIndex = seed % wordles.wordles.length;

  const selectedWord = wordles.wordles[wordIndex];

  const newState: GameState = {
    currentWord: selectedWord.wordle,
    currentHint: selectedWord.hint,
    lastPlayedDate: today,
    isGameOver: false,
    attempts: [],
    won: false,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
};

export const updateGameState = (attempt: string, won: boolean): GameState => {
  const state = getGameState();
  const newAttempts = [...state.attempts, attempt];

  const updatedState: GameState = {
    ...state,
    attempts: newAttempts,
    isGameOver: won || newAttempts.length >= 6,
    won,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  return updatedState;
};
