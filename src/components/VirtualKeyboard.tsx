import { memo } from "react";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  correctLetters: string[];
  misplacedLetters: string[];
  incorrectLetters: string[];
}

const VirtualKeyboard = memo(
  ({
    onKeyPress,
    correctLetters,
    misplacedLetters,
    incorrectLetters,
  }: VirtualKeyboardProps) => {
    const rows = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
    ];

    const getKeyStyle = (key: string) => {
      if (correctLetters.includes(key)) return "correct";
      if (misplacedLetters.includes(key)) return "misplaced";
      if (incorrectLetters.includes(key)) return "incorrect";
      return "";
    };

    return (
      <div className="virtual-keyboard">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key, keyIndex) => (
              <button
                key={keyIndex}
                className={`keyboard-key ${getKeyStyle(key)} ${
                  key === "Enter" || key === "Backspace" ? "wide-key" : ""
                }`}
                onClick={() => onKeyPress(key)}
                aria-label={key === "Backspace" ? "Delete" : key}
              >
                {key === "Backspace" ? "⌫" : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }
);

export default VirtualKeyboard;
