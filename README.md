# Wordle Clone

A simple implementation of the popular word-guessing game Wordle, built with React and TypeScript. This project focuses on core functionality while maintaining a minimalistic design.

## Features

- Daily word challenge (same word for everyone on the same day)
- 6 attempts to guess the 5-letter word
- Color-coded feedback:
  - Green: Correct letter in correct position
  - Yellow: Correct letter in wrong position
  - Gray: Letter not in the word
- Hint system to help players
- Game state persistence using localStorage
- Responsive design for both desktop and mobile
- Keyboard support (physical and on-screen)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/surya-sanity/wordle-clone.git
```

2. Install dependencies:

```bash
cd wordle-clone
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Note on Styling

This project focuses primarily on functionality rather than extensive styling. While the core game mechanics are fully implemented, the visual design is intentionally kept simple and minimalistic. The styling is basic but functional, ensuring the game is playable and responsive across different devices.

## How to Play

1. Enter a 5-letter word using the on-screen keyboard or your physical keyboard
2. Press Enter to submit your guess
3. Use the color feedback to guide your next guess:
   - Green tiles: Correct letter, correct position
   - Yellow tiles: Correct letter, wrong position
   - Gray tiles: Letter not in the word
4. You have 6 attempts to guess the word
5. Use the hint button if you need help
6. The word changes daily at midnight

## License

MIT License - feel free to use this project as you wish.
