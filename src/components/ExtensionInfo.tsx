import React, { useEffect, useState } from 'react';

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
    padding: '32px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    border: `1px solid ${theme.border}`,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
    animation: 'fadeInScale 0.2s ease-out'
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

  const featureListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const featureItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    color: theme.text
  };

  const featureIconStyle: React.CSSProperties = {
    color: isDarkMode ? '#10b981' : '#059669',
    marginRight: '12px',
    marginTop: '2px',
    fontSize: '16px'
  };

  const footerStyle: React.CSSProperties = {
    marginTop: '32px', 
    padding: '16px', 
    backgroundColor: theme.bgSecondary, 
    borderRadius: '8px',
    border: `1px solid ${theme.borderSecondary}`
  };

  const footerTextStyle: React.CSSProperties = {
    margin: 0, 
    color: theme.textMuted, 
    fontSize: '14px'
  };
  // #endregion

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
            
            <h2 style={titleStyle}>Extension Features</h2>
            
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Core Functionality</h3>
              <ul style={featureListStyle}>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Smart content analysis and processing</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Real-time data synchronization</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Advanced search and filtering capabilities</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Customizable user interface themes</span>
                </li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Productivity Tools</h3>
              <ul style={featureListStyle}>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Keyboard shortcuts for quick actions</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Batch operations and bulk processing</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Export data in multiple formats</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Auto-save and backup functionality</span>
                </li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Privacy & Security</h3>
              <ul style={featureListStyle}>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Local data storage - no cloud dependency</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Encrypted sensitive information</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Minimal permissions required</span>
                </li>
                <li style={featureItemStyle}>
                  <span style={featureIconStyle}>✓</span>
                  <span>Regular security updates</span>
                </li>
              </ul>
            </div>

            <div style={footerStyle}>
              <p style={footerTextStyle}>
                Need help getting started? Check out our documentation or contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};