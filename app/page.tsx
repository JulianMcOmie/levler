'use client';

import { useState, KeyboardEvent } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [showInput, setShowInput] = useState(true);

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      setDisplayText(inputValue.trim());
      setShowInput(false);
    }
  };

  const handleDisplayClick = () => {
    setShowInput(true);
    setInputValue('');
    setDisplayText('');
  };

  return (
    <main className={styles.main}>
      {showInput ? (
        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.textBox}
            placeholder="Type something and press Enter..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        </div>
      ) : (
        <div className={styles.displayContainer} onClick={handleDisplayClick}>
          <div className={styles.displayText}>{displayText}</div>
        </div>
      )}
    </main>
  );
}


