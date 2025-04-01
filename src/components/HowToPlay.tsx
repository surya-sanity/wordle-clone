import { memo, useState } from "react";

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

export default HowToPlay;
