import React from 'react';

interface DevLinksProps {
  twitchUsername?: string;
  youtubeUsername?: string;
}

export const AboutTheDev: React.FC<DevLinksProps> = ({ 
  twitchUsername = 'song_code', 
  youtubeUsername = 'song_code' 
}) => {
  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  };

  const twitchStyle: React.CSSProperties = {
    ...linkStyle,
    background: '#9146ff',
    borderColor: '#9146ff',
  };

  const youtubeStyle: React.CSSProperties = {
    ...linkStyle,
    background: '#ff0000',
    borderColor: '#ff0000',
  };

  const handleHover = (e: React.MouseEvent<HTMLAnchorElement>, hoverColor: string): void => {
    const target = e.currentTarget;
    target.style.background = hoverColor;
    target.style.transform = 'translateY(-1px)';
    target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  };

  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>, originalColor: string): void => {
    const target = e.currentTarget;
    target.style.background = originalColor;
    target.style.transform = 'translateY(0)';
    target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      background: '#2a2a2a',
      border: '1px solid #444',
      borderRadius: '12px',
      padding: '40px',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}>
      <h2 style={{
        color: '#ffffff',
        fontSize: '1.8rem',
        marginBottom: '15px',
        fontWeight: '600',
      }}>
        Made by: song_code
      </h2>
      
      <p style={{
        color: '#cccccc',
        fontSize: '1rem',
        marginBottom: '30px',
        lineHeight: '1.5',
      }}>
        You can follow me on Twitch and YouTube where I'll make more for-fun projects like this one :)
      </p>
      
      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <a 
          href={`https://twitch.tv/${twitchUsername}`}
          style={twitchStyle}
          target="_blank" 
          rel="noopener noreferrer"
          onMouseEnter={(e) => handleHover(e, '#a970ff')}
          onMouseLeave={(e) => handleLeave(e, '#9146ff')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
          </svg>
          Twitch
        </a>
        
        <a 
          href={`https://youtube.com/@${youtubeUsername}`}
          style={youtubeStyle}
          target="_blank" 
          rel="noopener noreferrer"
          onMouseEnter={(e) => handleHover(e, '#ff3333')}
          onMouseLeave={(e) => handleLeave(e, '#ff0000')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube
        </a>
      </div>
    </div>
  );
};