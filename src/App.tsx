import { useEffect, useState, useCallback, useMemo } from "react";
import wordles from "./wordles.json";
import { encryptWordle, decryptWordle } from "./utils/encryption";
import { Analytics } from "@vercel/analytics/react";
import VirtualKeyboard from "./components/VirtualKeyboard";
import HowToPlay from "./components/HowToPlay";
import Row from "./components/Row";
import { GameState } from "./types/game";
import { WORDLE_LENGTH, WORDLE_MAX_TRIES, STORAGE_KEY } from "./constants/game";

function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const today = new Date().toISOString().split("T")[0];

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.lastPlayedDate === today) {
        return {
          ...parsedState,
          wordleData: {
            ...parsedState.wordleData,
            wordle: decryptWordle(parsedState.wordleData.encryptedWordle),
          },
        };
      }
    }

    const seed = today
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const wordIndex = seed % wordles.wordles.length;
    const wordleData = wordles.wordles[wordIndex];
    const encryptedWordle = encryptWordle(wordleData.wordle);

    return {
      wordleData: {
        ...wordleData,
        encryptedWordle,
      },
      guesses: Array(WORDLE_MAX_TRIES).fill({ isValidated: false, value: "" }),
      currentGuess: 0,
      isGameover: false,
      showHint: false,
      lastPlayedDate: today,
      message: "",
    };
  });

  useEffect(() => {
    const stateToSave = {
      ...gameState,
      wordleData: {
        ...gameState.wordleData,
        wordle: gameState.wordleData.encryptedWordle,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [gameState]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent | string) => {
      const key = typeof event === "string" ? event : event.key;

      if (
        gameState.currentGuess >= WORDLE_MAX_TRIES ||
        gameState.isGameover ||
        (typeof event !== "string" && (event.ctrlKey || event.metaKey))
      )
        return;

      const isCurrentGuessFull =
        gameState.guesses[gameState.currentGuess].value.length >= WORDLE_LENGTH;

      if (key === "Enter") {
        if (isCurrentGuessFull) {
          const updatedGuesses = gameState.guesses.map((guess, idx) => {
            if (idx === gameState.currentGuess) {
              return {
                ...guess,
                isValidated: true,
              };
            }
            return guess;
          });

          const isCorrect =
            updatedGuesses[gameState.currentGuess].value.toLowerCase() ===
            gameState.wordleData.wordle.toLowerCase();

          const nextGuess = gameState.currentGuess + 1;
          const isLastAttempt = nextGuess >= WORDLE_MAX_TRIES;

          setGameState((prev) => ({
            ...prev,
            guesses: updatedGuesses,
            currentGuess: isCorrect ? prev.currentGuess : nextGuess,
            isGameover: isCorrect || isLastAttempt,
            message: isCorrect
              ? "Congratulations, You won, Comeback tomorrow for a new wordle 😉"
              : isLastAttempt
              ? `Game Over! The wordle of the day is ${prev.wordleData.wordle}`
              : "",
          }));
        }
        return;
      }

      if (!key.match(/^[a-z]+$/) && key !== "Backspace") {
        return;
      }

      const isToRemove = key === "Backspace";

      const updatedGuesses = gameState.guesses.map((guess, idx) => {
        if (idx === gameState.currentGuess) {
          return {
            ...guess,
            value: isToRemove ? guess.value.slice(0, -1) : guess.value + key,
          };
        }
        return guess;
      });

      setGameState((prev) => ({
        ...prev,
        guesses: updatedGuesses,
      }));
    },
    [
      gameState.currentGuess,
      gameState.guesses,
      gameState.isGameover,
      gameState.wordleData.wordle,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const { correctLetters, misplacedLetters, incorrectLetters } = useMemo(() => {
    const correct: string[] = [];
    const misplaced: string[] = [];
    const incorrect: string[] = [];

    gameState.guesses.forEach((guess) => {
      if (!guess.isValidated) return;

      guess.value.split("").forEach((char, idx) => {
        if (char === gameState.wordleData.wordle[idx]) {
          correct.push(char);
        } else if (gameState.wordleData.wordle.includes(char)) {
          misplaced.push(char);
        } else {
          incorrect.push(char);
        }
      });
    });

    return {
      correctLetters: [...new Set(correct)],
      misplacedLetters: [...new Set(misplaced)],
      incorrectLetters: [...new Set(incorrect)],
    };
  }, [gameState.guesses, gameState.wordleData.wordle]);

  return (
    <main className="app">
      <div className="logo">WORDLE</div>
      <HowToPlay />
      {gameState.showHint && !gameState.isGameover && (
        <div className="hint-text">Hint: {gameState.wordleData.hint}</div>
      )}
      <div className="board">
        {gameState.guesses.map((guess, idx) => (
          <Row
            guess={guess}
            key={idx}
            wordle={gameState.wordleData.wordle.toLowerCase()}
          />
        ))}
      </div>
      {!gameState.isGameover && (
        <button
          className="hint-button"
          onClick={() => setGameState((prev) => ({ ...prev, showHint: true }))}
        >
          Show Hint
        </button>
      )}
      <VirtualKeyboard
        onKeyPress={handleKeyPress}
        correctLetters={correctLetters}
        misplacedLetters={misplacedLetters}
        incorrectLetters={incorrectLetters}
      />
      {gameState.message && <div className="message">{gameState.message}</div>}
      <Analytics />
    </main>
  );
}

export default App;
