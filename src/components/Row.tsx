import { memo } from "react";

interface RowProps {
  guess: {
    isValidated: boolean;
    value: string;
  };
  wordle: string;
}

const Row = memo(({ guess, wordle }: RowProps) => {
  const getLetterStatus = (letter: string, index: number) => {
    if (!guess.isValidated) return "";
    if (letter === wordle[index]) return "correct";
    if (wordle.includes(letter)) return "misplaced";
    return "incorrect";
  };

  return (
    <div className="row">
      {Array(5)
        .fill("")
        .map((_, index) => (
          <div
            key={index}
            className={`cell ${getLetterStatus(
              guess.value[index] || "",
              index
            )}`}
          >
            {guess.value[index] || ""}
          </div>
        ))}
    </div>
  );
});

export default Row;
