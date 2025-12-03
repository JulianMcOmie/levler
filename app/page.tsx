'use client';

import { useState, KeyboardEvent, useCallback, useRef } from 'react';
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Word selection state
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<number | null>(null);

  const fetchResponse = async (query: string, addToHistory: boolean = true, depth: number = 0) => {
    setLoading(true);
    try {
      // Build path of previous queries for context
      const pathContext = history.length > 0 
        ? history.map(h => h.query).join(' → ')
        : '';
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          context: originalTopic || undefined,
          depth,
          pathContext
        }),
      });
      
      const data = await response.json();
      let responseText = data.response;
      
      // Enforce 10-word response limit on client side as backup
      const words = responseText.trim().split(/\s+/);
      if (words.length > 10) {
        responseText = words.slice(0, 10).join(' ') + '...';
      }
      
      setAiResponse(responseText);
      
      if (addToHistory) {
        setHistory(prev => [...prev, {
          query,
          response: responseText,
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

  // Parse response into words (preserving punctuation attached to words)
  const parseWords = useCallback((text: string): string[] => {
    return text.split(/\s+/).filter(word => word.length > 0);
  }, []);

  const handleWordMouseDown = (index: number) => {
    setIsSelecting(true);
    selectionStartRef.current = index;
    setSelectedWords(new Set([index]));
  };

  const handleWordMouseEnter = (index: number) => {
    if (isSelecting && selectionStartRef.current !== null) {
      const start = Math.min(selectionStartRef.current, index);
      const end = Math.max(selectionStartRef.current, index);
      const newSelection = new Set<number>();
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      setSelectedWords(newSelection);
    }
  };

  const handleWordMouseUp = async () => {
    if (isSelecting && selectedWords.size > 0) {
      const words = parseWords(aiResponse);
      const selectedText = Array.from(selectedWords)
        .sort((a, b) => a - b)
        .map(i => words[i])
        .join(' ')
        .replace(/[.,!?;:]+$/, ''); // Remove trailing punctuation
      
      if (selectedText.length > 0) {
        setDisplayText(selectedText);
        setContextPath([...contextPath, displayText]);
        await fetchResponse(selectedText, true, history.length);
      }
    }
    setIsSelecting(false);
    setSelectedWords(new Set());
    selectionStartRef.current = null;
  };

  const handleMouseLeaveResponse = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedWords(new Set());
      selectionStartRef.current = null;
    }
  };

  const renderSelectableWords = () => {
    const words = parseWords(aiResponse);
    const sortedSelected = Array.from(selectedWords).sort((a, b) => a - b);
    const firstSelected = sortedSelected[0];
    const lastSelected = sortedSelected[sortedSelected.length - 1];
    
    return words.map((word, index) => {
      const isSelected = selectedWords.has(index);
      const isFirst = index === firstSelected;
      const isLast = index === lastSelected;
      
      let selectionClass = '';
      if (isSelected) {
        if (isFirst && isLast) {
          selectionClass = styles.wordSelectedSingle;
        } else if (isFirst) {
          selectionClass = styles.wordSelectedFirst;
        } else if (isLast) {
          selectionClass = styles.wordSelectedLast;
        } else {
          selectionClass = styles.wordSelectedMiddle;
        }
      }
      
      return (
        <span
          key={index}
          className={`${styles.selectableWord} ${selectionClass}`}
          onMouseDown={() => handleWordMouseDown(index)}
          onMouseEnter={() => handleWordMouseEnter(index)}
          onMouseUp={handleWordMouseUp}
        >
          {word}
          {index < words.length - 1 && ' '}
        </span>
      );
    });
  };


  return (
    <main className={`${styles.main} ${isDarkMode ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Leveler</h1>
        <button 
          className={styles.themeToggle}
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
      {showInput ? (
        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.textBox}
            placeholder="Type something you want to understand and press enter"
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
                <>
                  <div className={styles.hintText}>
                    💡 Click and drag across words to explore deeper
                  </div>
                  <div 
                    className={styles.aiResponse}
                    onMouseLeave={handleMouseLeaveResponse}
                  >
                    {renderSelectableWords()}
                  </div>
                </>
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
