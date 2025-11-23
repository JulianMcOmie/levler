'use client';

import { useState, KeyboardEvent } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyPress = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      const userInput = inputValue.trim();
      setDisplayText(userInput);
      setShowInput(false);
      setLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userInput }),
        });
        
        const data = await response.json();
        setAiResponse(data.response);
      } catch (error) {
        console.error('Error:', error);
        setAiResponse('Sorry, something went wrong.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDisplayClick = () => {
    setShowInput(true);
    setInputValue('');
    setDisplayText('');
    setAiResponse('');
  };


  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Levler</h1>
      {showInput ? (
        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.textBox}
            placeholder="Type something you want to learn and press Enter..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        </div>
      ) : (
        <div className={styles.displayContainer}>
          <div className={styles.displayText}>{displayText}</div>
          {loading ? (
            <div className={styles.aiResponse}>Thinking...</div>
          ) : (
            aiResponse && <div className={styles.aiResponse}>{aiResponse}</div>
          )}
          <button className={styles.backButton} onClick={handleDisplayClick}>
            Ask something else
          </button>
        </div>
      )}
    </main>
  );
}
