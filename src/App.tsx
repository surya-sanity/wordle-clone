import { useEffect, useState, useCallback, memo, useMemo } from "react";
import wordles from "./wordles.json";
import { encryptWordle, decryptWordle } from "./utils/encryption";
import { Analytics } from "@vercel/analytics/react";
import VirtualKeyboard from "./components/VirtualKeyboard";

const WORDLE_LENGTH = 5;
const WORDLE_MAX_TRIES = 6;
const STORAGE_KEY = "wordle_game_state";

interface Guess {
  isValidated: boolean;
  value: string;
}

interface GameState {
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

const HowToPlay = memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="how-to-play">
      <button
        className="how-to-play-button"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="How to Play"
      >
        ?
      </button>
      {isVisible && (
        <>
          <div
            className="how-to-play-overlay"
            onClick={() => setIsVisible(false)}
          />
          <div className="how-to-play-content">
            <button
              className="close-button"
              onClick={() => setIsVisible(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3>How to Play</h3>
            <ul>
              <li>Guess the 5-letter word</li>
              <li>6 attempts allowed</li>
              <li>Green: Correct letter & position</li>
              <li>Yellow: Correct letter, wrong position</li>
              <li>Gray: Letter not in word</li>
              <li>New word daily at midnight</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
});

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

  // Get letter states for keyboard
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
      {gameState.message && <div className="message">{gameState.message}</div>}
      <VirtualKeyboard
        onKeyPress={handleKeyPress}
        correctLetters={correctLetters}
        misplacedLetters={misplacedLetters}
        incorrectLetters={incorrectLetters}
      />
      <Analytics />
    </main>
  );
}

const Cell = memo(
  ({
    char,
    isValidated,
    isCorrect,
    isMisplaced,
    charIdx,
  }: {
    char: string | null;
    isValidated: boolean;
    isCorrect: boolean;
    isMisplaced: boolean;
    charIdx: number;
  }) => {
    const className = useMemo(() => {
      if (!isValidated) return "cell";
      return `cell ${
        isCorrect ? "correct" : isMisplaced ? "misplaced" : "incorrect"
      } validate`;
    }, [isValidated, isCorrect, isMisplaced]);

    return (
      <div
        className={className}
        key={charIdx.toString()}
        data-char={char?.toUpperCase()}
        style={{ animationDelay: `${charIdx * 0.1}s` }}
      >
        <div className="front">{char?.toUpperCase()}</div>
        <div className="back">{char?.toUpperCase()}</div>
      </div>
    );
  }
);

const Row = memo(({ guess, wordle }: { guess: Guess; wordle: string }) => {
  const cells = useMemo(() => {
    return Array.from({ length: WORDLE_LENGTH }).map((_, charIdx) => {
      const char = guess.value !== "" ? guess.value[charIdx] : null;
      const { isValidated } = guess;
      const isCorrect = char === wordle[charIdx];
      const isMisplaced = Boolean(char && wordle.includes(char));

      return (
        <Cell
          key={charIdx}
          char={char}
          isValidated={isValidated}
          isCorrect={isCorrect}
          isMisplaced={isMisplaced}
          charIdx={charIdx}
        />
      );
    });
  }, [guess, wordle]);

  return <div className="row">{cells}</div>;
});

export default App;
