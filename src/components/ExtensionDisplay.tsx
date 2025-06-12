import React, { useEffect, useRef, useState } from 'react';
import Counter from './counter/Counter';
import { ExtensionState } from './ExtensionState';

/* 
Stats:
1. numMoves: User's number of moves
2. bestMovesFound: Number of best moves found -> Includes blocked
3. bestMovesBlocked: Number of best moves blocked
4. bestMovesBeforeEng: Number of best moves found before the engine 
5. movesAllowedByTimer: Number of best moves allowed by timer
6. onlyMovesCount: Number of moves unblocked since they were the only move
*/

interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
}

interface ExtensionDisplayProps {
  stats?: StatItem[];
  title?: string;
}

export const ExtensionDisplay: React.FC<ExtensionDisplayProps> = ({
  title = 'Sabotage Stats'
}) => {
  const initStats = [
    { label: 'Total Moves Made', value: 0, icon: '♞' },
    { label: 'Best Moves Found', value: 0, icon: '🎯' },
    { label: 'Best Moves Blocked', value: 0, icon: '🛑' },
    { label: 'Found Before Engine', value: 0, icon: '🧠' },
    { label: 'Timer Saved Moves', value: 0, icon: '⏱️' },
    { label: 'Only moves allowed', value: 0, icon: '⛓️'},
    { label: 'Number of book moves', value: 0, icon: '📗'},
  ];

  const [stats, setStats] = useState<{ label: string; value: number; icon: string }[]>(initStats);
  const [lastActionWasBlock, setLastActionWasBlock] = useState<boolean>(false)
  const [stillBookMoves, setStillBookMoves] = useState<boolean>(true)
  const [isUsersTurn, setIsUsersTurn] = useState<boolean>(false)
  const [engineIsThinking, setEngineIsThinking] = useState<boolean>(false)
  const [gameEndStatus, setGameEndStatus] = useState<string | undefined>(undefined)
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDuration, setTimerDuration] = useState<number>(3)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  
  const state =
  gameEndStatus !== undefined
  ?
    "ended"
  :
    !isUsersTurn
    ?
      "waiting"
    :
      stillBookMoves
      ?
        "book"
      :
        engineIsThinking
        ?
          "calculating"
        :
          timeLeft > 0
          ?
            "timer"
          :
            "ready"
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // #region style
  // Theme-based colors
  const theme = {
    bg: isDarkMode ? '#1f2937' : '#ffffff',
    bgSecondary: isDarkMode ? '#374151' : '#f8fafc',
    bgTertiary: isDarkMode ? '#4b5563' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#111827',
    textSecondary: isDarkMode ? '#d1d5db' : '#374151',
    textMuted: isDarkMode ? '#9ca3af' : '#6b7280',
    border: isDarkMode ? '#374151' : '#d1d5db',
    borderHover: isDarkMode ? '#4b5563' : '#9ca3af',
    borderCollapsible: isDarkMode ? '#4f46e5' : '#6366f1',
    borderCollapsibleHover: isDarkMode ? '#6366f1' : '#4f46e5'
  };

  const handleThemeChange = (newIsDarkMode: boolean) => {
    setIsDarkMode(newIsDarkMode);
  };

  // Style objects with theme support
  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.bg,
    borderRadius: '0.5rem',
    border: `1px solid ${theme.border}`,
    padding: '1.5rem',
    boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.05)',
    width: "100%",
    marginTop: '24px',
    color: theme.textSecondary,
    fontFamily: 'sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    color: theme.text
  };

  const statItemStyle: React.CSSProperties = {
    backgroundColor: theme.bgSecondary,
    borderRadius: '0.5rem',
    padding: '0.5rem',
    border: `1px solid ${theme.border}`,
    marginBottom: '1rem'
  };

  const collapsibleStatItemStyle: React.CSSProperties = {
    backgroundColor: theme.bgSecondary,
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${theme.borderCollapsible}`,
    marginBottom: '1rem',
    cursor: 'pointer'
  };

  const subStatItemStyle: React.CSSProperties = {
    backgroundColor: theme.bgTertiary,
    borderRadius: '0.375rem',
    padding: '0.75rem',
    border: `1px solid ${theme.border}`,
    marginBottom: '0.5rem',
    marginLeft: '1rem'
  };

  const statItemHoverStyle: React.CSSProperties = {
    borderColor: theme.borderHover
  };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  };

  const collapsibleHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  };

  const collapsibleLeftStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  };

  const collapsibleRightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  };

  const valueWithPercentageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.125rem'
  };

  const expandIconStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: theme.textMuted,
    transition: 'transform 0.2s'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.25rem'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: '500'
  };

  const percentageStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: theme.textMuted,
    marginLeft: '0.5rem'
  };

  // #endregion
  
  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(intervalRef.current!);
        return 0;
      });
    }, 1000);
  };

  const resetTimer = () => {
    setTimeLeft(timerDuration);
    startTimer();
  };
  // Calculate best moves made (sum of indices 3, 4, 5, 6)
  const bestMovesMade = stats[3].value + stats[4].value + stats[5].value + stats[6].value;
  
  // Calculate percentages for best moves found and blocked
  const totalMoves = stats[0].value + (lastActionWasBlock ? 1 : 0);
  const bestMovesFoundPercentage = totalMoves > 0 ? ((stats[1].value / totalMoves) * 100).toFixed(1) : '0.0';
  const bestMovesBlockedPercentage = totalMoves > 0 ? ((stats[2].value / totalMoves) * 100).toFixed(1) : '0.0';
  const bestMovesMadePercentage = totalMoves > 0 ? ((bestMovesMade / totalMoves) * 100).toFixed(1) : '0.0';

  function handleSettingsUpdate(event: Event) {
    const customEvent = event as CustomEvent
    const detail = customEvent.detail
    if ("appliedDuration" in detail) setTimerDuration(detail.appliedDuration)
  }
  function handleLightDarkModeChange(event: Event) {
    const customEvent = event as CustomEvent
    const detail = customEvent.detail
    if ('mode' in detail) handleThemeChange(detail.mode)
    }
  function handleIsBookMoves(event: Event) {
    const customEvent = event as CustomEvent
    const detail = customEvent.detail
    if ('isBookMoves' in detail) setStillBookMoves(detail.isBookMoves)
  }
const loadSettings = (event: Event) => {
    const customEvent = event as CustomEvent
    const detail = customEvent.detail
    if ('duration' in detail) {
      setTimerDuration(detail.duration)
      setTimeLeft(detail.duration)
    }
  }
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("extension_display_ready"))
    window.addEventListener("book-moves-change", handleIsBookMoves)
    window.addEventListener("extension-settings-load", loadSettings)
    window.addEventListener("extension-settings-update", handleSettingsUpdate)
    window.addEventListener("light-dark-mode", handleLightDarkModeChange)
    chrome.storage.local.get(["sab_darkmode"], (data) => {
      if ("sab_darkmode" in data) setIsDarkMode(data.sab_darkmode)
    })
    return () => {
      window.removeEventListener("book-moves-change", handleIsBookMoves)
      window.removeEventListener("extension-settings-load", loadSettings)
      window.removeEventListener("extension-settings-update", handleSettingsUpdate)
      window.removeEventListener("light-dark-mode", handleLightDarkModeChange)
    }
  }, [])
  useEffect(() => {
    const moveHandler = (e: CustomEvent) => {
      const detail = e.detail;
      const newStats = stats.map(s => ({ ...s }));
      if ('numMoves' in detail) newStats[0].value = detail.numMoves;
      if ('bestMovesFound' in detail) newStats[1].value = detail.bestMovesFound;
      if ('bestMovesBlocked' in detail) {
        newStats[2].value = detail.bestMovesBlocked;
        setLastActionWasBlock(true)
      } else setLastActionWasBlock(false)
      if ('bestMovesBeforeEng' in detail) newStats[3].value = detail.bestMovesBeforeEng;
      if ('movesAllowedByTimer' in detail) newStats[4].value = detail.movesAllowedByTimer;
      if ('onlyMovesAllowed' in detail) newStats[5].value = detail.onlyMovesAllowed;
      if ('numBookMoves' in detail) newStats[6].value = detail.numBookMoves
      setStats(newStats);
    };
    window.addEventListener('extension-stats-update', moveHandler as EventListener);
    return () => {
      window.removeEventListener('extension-stats-update', moveHandler as EventListener);
    };
  }, [stats]);
  useEffect(() => {
    const statusHandler = (e: CustomEvent) => {
      const detail = e.detail
      if ('isUsersTurn' in detail) setIsUsersTurn(detail.isUsersTurn)
      if ('engineIsThinking' in detail) setEngineIsThinking(detail.engineIsThinking)
      if ('restartTimer' in detail) resetTimer()
      if ('gameEndStatus' in detail) setGameEndStatus(detail.gameEndStatus)
    }
    window.addEventListener('extension-status-update', statusHandler as EventListener);
    return () => {
      window.removeEventListener('extension-status-update', statusHandler as EventListener);
    }
  }, [isUsersTurn, engineIsThinking, timeLeft])
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        <ExtensionState state={state} timer={timeLeft} endStatus={gameEndStatus} isDarkMode={isDarkMode}/>
      </div>
      <div>
        {/* Regular stats - first 3 with percentages for indices 1 and 2 */}
        {stats.slice(0, 3).map((stat, index) => (
          <div
            key={index}
            style={statItemStyle}
            onMouseOver={e => ((e.currentTarget.style.borderColor = statItemHoverStyle.borderColor!))}
            onMouseOut={e => ((e.currentTarget.style.borderColor = theme.border))}
          >
            <div style={labelContainerStyle}>
              {stat.icon && <span style={iconStyle}>{stat.icon}</span>}
              <span style={labelStyle}>{stat.label}</span>
            </div>
            <div style={{position: "relative", left: "-4px", display: 'flex', alignItems: 'center'}}>
              <Counter value={stat.value} fontSize={20} places={stat.value >= 10 ? [10, 1] : [1]} textColor={isDarkMode ? "white" : "#374151"} />
              {index === 1 && ( // Best Moves Found
                <span style={percentageStyle}>({bestMovesFoundPercentage}%)</span>
              )}
              {index === 2 && ( // Best Moves Blocked
                <span style={percentageStyle}>({bestMovesBlockedPercentage}%)</span>
              )}
            </div>
          </div>
        ))}
        <div
          style={collapsibleStatItemStyle}
          onClick={toggleExpanded}
          onMouseOver={e => ((e.currentTarget.style.borderColor = theme.borderCollapsibleHover))}
          onMouseOut={e => ((e.currentTarget.style.borderColor = theme.borderCollapsible))}
        >
          <div style={collapsibleHeaderStyle}>
            <div style={collapsibleLeftStyle}>
              <div style={{...labelContainerStyle, marginBottom: 0}}>
                <span style={iconStyle}>✅</span>
                <span style={labelStyle}>Best Moves Made</span>
              </div>
            </div>
            <div style={collapsibleRightStyle}>
              <div style={valueWithPercentageStyle}>
                <div style={{position: "relative", left: "-4px"}}>
                  <Counter value={bestMovesMade} fontSize={20} places={bestMovesMade >= 10 ? [10, 1] : [1]} textColor={isDarkMode ? "white" : "#374151"}/>
                </div>
                <span style={{...percentageStyle, marginLeft: 0}}>({bestMovesMadePercentage}%)</span>
              </div>
              <span 
                style={{
                  ...expandIconStyle,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                ▼
              </span>
            </div>
          </div>
          {isExpanded && (
            <div style={{marginTop: '1rem'}}>
              {stats.slice(3, 7).map((stat, index) => (
                <div key={index + 3} style={subStatItemStyle}>
                  <div style={labelContainerStyle}>
                    {stat.icon && <span style={{...iconStyle, fontSize: '1rem'}}>{stat.icon}</span>}
                    <span style={{...labelStyle, fontSize: '0.75rem'}}>{stat.label}</span>
                  </div>
                  <div style={{position: "relative", left: "-4px"}}>
                    <Counter value={stat.value} fontSize={16} places={stat.value >= 10 ? [10, 1] : [1]} textColor={isDarkMode ? "white" : "#374151"}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};