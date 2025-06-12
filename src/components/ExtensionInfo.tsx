import React, { useEffect, useState } from 'react';
import { AboutTheDev } from './AboutTheDev'

interface Theme {
  bg: string;
  bgSecondary: string;
  bgButton: string;
  bgButtonHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSecondary: string;
  overlay: string;
}

export const ExtensionInfo = () => {
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  function handleLightDarkModeChange(event: Event) {
    const customEvent = event as CustomEvent
    const detail = customEvent.detail
    if ('mode' in detail) setIsDarkMode(detail.mode)
  }
  useEffect(() => {
    chrome.storage.local.get(["sab_darkmode"], (data) => {
      if ("sab_darkmode" in data) setIsDarkMode(data.sab_darkmode)
    })
    window.addEventListener("light-dark-mode", handleLightDarkModeChange)
    return () => {
      window.removeEventListener("light-dark-mode", handleLightDarkModeChange)
    }
  }, [])
  // #region style
  // Theme-based colors
  const theme: Theme = {
    bg: isDarkMode ? '#111827' : '#ffffff',
    bgSecondary: isDarkMode ? '#1f2937' : '#f8fafc',
    bgButton: isDarkMode ? '#374151' : '#e5e7eb',
    bgButtonHover: isDarkMode ? '#4b5563' : '#d1d5db',
    text: isDarkMode ? '#ffffff' : '#111827',
    textSecondary: isDarkMode ? '#d1d5db' : '#374151',
    textMuted: isDarkMode ? '#9ca3af' : '#6b7280',
    border: isDarkMode ? '#374151' : '#111827',
    borderSecondary: isDarkMode ? '#4b5563' : '#e5e7eb',
    overlay: 'rgba(0, 0, 0, 0.75)'
  };

  const infoButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: theme.bgButton,
    color: theme.text,
    border: isDarkMode ? 'none' : `1px solid ${theme.border}`,
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const popupStyle: React.CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.text,
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    border: `1px solid ${theme.border}`,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
    animation: 'fadeInScale 0.2s ease-out',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.bg,
    padding: '32px 32px 0 32px',
    borderRadius: '12px 12px 0 0',
    zIndex: 1
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 32px 32px 32px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.textMuted,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s ease'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: theme.text
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '12px',
    color: theme.textSecondary
  };

  const contentTextStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '400',
    marginBottom: '12px',
    color: theme.textSecondary
  }
  // #endregion

  // #region state funcs
  const handleButtonClick = (): void => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = (): void => {
    setIsPopupOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const target = e.target as HTMLButtonElement;
    target.style.backgroundColor = theme.bgButtonHover;
    target.style.transform = 'scale(1.05)';
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const target = e.target as HTMLButtonElement;
    target.style.backgroundColor = theme.bgButton;
    target.style.transform = 'scale(1)';
  };

  const handleCloseButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const target = e.target as HTMLButtonElement;
    target.style.color = theme.text;
  };

  const handleCloseButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const target = e.target as HTMLButtonElement;
    target.style.color = theme.textMuted;
  };
  // #endregion

  return (
    <>
      <style>
        {`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      
      <button
        style={infoButtonStyle}
        onClick={handleButtonClick}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        title="Extension Information"
        type="button"
      >
        ?
      </button>

      {isPopupOpen && (
        <div style={overlayStyle} onClick={handleOverlayClick}>
          <div style={popupStyle}>
            <div style={headerStyle}>
              <button
                style={closeButtonStyle}
                onClick={handleClosePopup}
                onMouseEnter={handleCloseButtonMouseEnter}
                onMouseLeave={handleCloseButtonMouseLeave}
                type="button"
                aria-label="Close popup"
              >
                ×
              </button>
              <h2 style={titleStyle}>About Lichess Sabotage</h2>
            </div>
            
            <div style={contentStyle} className='no-scrollbar'>
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Purpose</h3>
                <h3 style={contentTextStyle}>This extension provides a fun challenge for players to race against the Stockfish engine in finding the best moves. As an unintentional but fortunate by-product, the extension can also be seen as a tool for users to learn whether they are making the best moves.</h3>
              </div>
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>How it works</h3>
                <h3 style={contentTextStyle}>In the background, your live game is tracked by a separate chess board instance. Whenever it is your turn, the board state is analysed by the Stockfish API and, once evaluated, internal code discreetly blocks you from making the best move! However, since the engine typically calculates this within 1-2 seconds, an additional timer is used to only allow Stockfish to block after x seconds.</h3>
              </div>
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Stats</h3>
                <h3 style={contentTextStyle}>The extension tracks how often you are finding the best moves, as well as how fast you were! More specifically, whether you found the move before Stockfish (!!), after Stockfish but within the timer, or you found the best move but it was blocked! For simplicity, book moves aren't blocked and are still counted as the best moves.</h3>
              </div>
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Settings</h3>
                <h3 style={contentTextStyle}>In the settings (below the stats), you can adjust the timer to give yourself more time to make the best moves. Unfortunately, you can also mute the boom effect..</h3>
              </div>
              <AboutTheDev/>
            </div>
          </div>
        </div>
      )}
    </>
  );
};