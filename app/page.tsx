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
      
      // Collect all previously explored terms to prevent circular definitions
      const usedTerms = history.map(h => h.query.toLowerCase());
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          context: originalTopic || undefined,
          depth,
          pathContext,
          usedTerms
        }),
      });
      
      const data = await response.json();
      const responseText = data.response.trim();
      
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

  // Parse response into tokens (words + their following delimiters)
  interface Token {
    word: string;
    delimiter: string; // space, dash, or empty for last word (nothing remaining)
  }
  
  const parseTokens = useCallback((text: string): Token[] => {
    const tokens: Token[] = [];
    // Split on whitespace and dashes, keeping the delimiters
    const parts = text.split(/(\s+|-)/);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Skip empty parts and delimiter-only parts
      if (!part || /^(\s+|-)$/.test(part)) continue;
      
      // Look ahead for the delimiter
      const nextPart = parts[i + 1] || '';
      const delimiter = /^-$/.test(nextPart) ? '-' : /^\s+$/.test(nextPart) ? ' ' : '';
      
      tokens.push({ word: part, delimiter });
    }
    return tokens;
  }, []);
  
  // Helper to get just the words array
  const parseWords = useCallback((text: string): string[] => {
    return parseTokens(text).map(t => t.word);
  }, [parseTokens]);

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
      const tokens = parseTokens(aiResponse);
      const sortedIndices = Array.from(selectedWords).sort((a, b) => a - b);
      
      // Build the selected text with correct delimiters
      let selectedText = '';
      for (let i = 0; i < sortedIndices.length; i++) {
        const idx = sortedIndices[i];
        const token = tokens[idx];
        selectedText += token.word;
        
        // Add delimiter if there's a next selected word that's consecutive
        if (i < sortedIndices.length - 1 && sortedIndices[i + 1] === idx + 1) {
          selectedText += token.delimiter;
        }
      }
      
      // Remove trailing punctuation
      selectedText = selectedText.replace(/[.,!?;:]+$/, '');
      
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
    const tokens = parseTokens(aiResponse);
    const sortedSelected = Array.from(selectedWords).sort((a, b) => a - b);
    const firstSelected = sortedSelected[0];
    const lastSelected = sortedSelected[sortedSelected.length - 1];
    
    return tokens.map((token, index) => {
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
        >
          {token.word}
          {token.delimiter}
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
                    onMouseUp={handleWordMouseUp}
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
