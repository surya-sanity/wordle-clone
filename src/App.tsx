import { useEffect, useState, useCallback, memo, useMemo } from "react";
import wordles from "./wordles.json";
import { encryptWordle, decryptWordle } from "./utils/encryption";
import { Analytics } from "@vercel/analytics/react";

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

  const [currentGuess, setCurrentGuess] = useState("");

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
    (event: KeyboardEvent) => {
      if (
        gameState.currentGuess >= WORDLE_MAX_TRIES ||
        gameState.isGameover ||
        event.ctrlKey ||
        event.metaKey
      )
        return;

      const isCurrentGuessFull =
        gameState.guesses[gameState.currentGuess].value.length >= WORDLE_LENGTH;

      if (event.key === "Enter") {
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

      if (!event.key.match(/^[a-z]+$/) && event.key !== "Backspace") {
        return;
      }

      const isToRemove = event.key === "Backspace";

      const updatedGuesses = gameState.guesses.map((guess, idx) => {
        if (idx === gameState.currentGuess) {
          return {
            ...guess,
            value: isToRemove
              ? guess.value.slice(0, -1)
              : guess.value + event.key,
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

  // Add keyboard state handling
  useEffect(() => {
    const handleFocus = () => {
      document.body.classList.add("keyboard-open");
    };

    const handleBlur = () => {
      document.body.classList.remove("keyboard-open");
    };

    const input = document.querySelector('input[type="text"]');
    if (input) {
      input.addEventListener("focus", handleFocus);
      input.addEventListener("blur", handleBlur);
    }

    return () => {
      if (input) {
        input.removeEventListener("focus", handleFocus);
        input.removeEventListener("blur", handleBlur);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    if (value.length <= WORDLE_LENGTH && /^[a-z]*$/.test(value)) {
      setCurrentGuess(value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentGuess.length === WORDLE_LENGTH) {
      const updatedGuesses = gameState.guesses.map((guess, idx) => {
        if (idx === gameState.currentGuess) {
          return {
            ...guess,
            value: currentGuess,
            isValidated: true,
          };
        }
        return guess;
      });

      const isCorrect =
        currentGuess === gameState.wordleData.wordle.toLowerCase();
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
      setCurrentGuess("");
    }
  };

  return (
    <main className="app">
      <input
        type="text"
        value={currentGuess}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        autoFocus
        maxLength={WORDLE_LENGTH}
        inputMode="text"
        pattern="[A-Za-z]*"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          zIndex: 1000,
        }}
      />
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
