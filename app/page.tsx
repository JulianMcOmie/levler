'use client';

import { useState, KeyboardEvent } from 'react';
import styles from './page.module.css';

interface HistoryItem {
  query: string;
  response: string;
  timestamp: number;
}

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [originalTopic, setOriginalTopic] = useState('');
  const [contextPath, setContextPath] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchResponse = async (query: string, addToHistory: boolean = true) => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      
      const data = await response.json();
      setAiResponse(data.response);
      
      if (addToHistory) {
        setHistory(prev => [...prev, {
          query,
          response: data.response,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setAiResponse('Sorry, something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      const userInput = inputValue.trim();
      setDisplayText(userInput);
      setOriginalTopic(userInput);
      setContextPath([]);
      setShowInput(false);
      await fetchResponse(userInput);
    }
  };

  const handleDisplayClick = () => {
    setShowInput(true);
    setInputValue('');
    setDisplayText('');
    setAiResponse('');
    setOriginalTopic('');
    setContextPath([]);
    setHistory([]);
  };

  const handleHistoryClick = (item: HistoryItem, index: number) => {
    setDisplayText(item.query);
    setAiResponse(item.response);
    // Trim history to this point
    setHistory(prev => prev.slice(0, index + 1));
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      setDisplayText(selectedText);
      setContextPath([...contextPath, displayText]);
      await fetchResponse(selectedText);
      selection?.removeAllRanges();
    }
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
        <div className={styles.mainContainer}>
          {history.length > 0 && (
            <div className={styles.historyPanel}>
              <div className={styles.historyTitle}>History</div>
              {history.map((item, index) => (
                <div
                  key={item.timestamp}
                  className={`${styles.historyItem} ${index === history.length - 1 ? styles.historyItemActive : ''}`}
                  onClick={() => handleHistoryClick(item, index)}
                >
                  <div className={styles.historyQuery}>{item.query}</div>
                  <div className={styles.historyResponse}>{item.response}</div>
                </div>
              ))}
            </div>
          )}
          <div className={styles.responseContainer}>
            <div className={styles.questionText}>{displayText}</div>
            {loading ? (
              <div className={styles.loadingText}>Thinking...</div>
            ) : (
              aiResponse && (
                <div 
                  className={styles.aiResponse}
                  onMouseUp={handleTextSelection}
                >
                  {aiResponse}
                </div>
              )
            )}
            <button className={styles.backButton} onClick={handleDisplayClick}>
              Ask something else
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
