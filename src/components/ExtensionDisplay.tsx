import React, { useEffect, useState } from 'react';
import Counter from './counter/Counter';

/* 
Stats:
1. numMoves: User's number of moves
2. bestMovesFound: Number of best moves found -> Includes blocked
3. bestMovesBlocked: Number of best moves blocked
4. bestMovesBeforeEng: Number of best moves found before the engine 
5. movesAllowedByTimer: Number of best moves allowed by timer
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

// Simple inline style objects
const containerStyle: React.CSSProperties = {
  backgroundColor: '#1f2937', // Gray-900
  borderRadius: '0.5rem',
  border: '1px solid #374151', // Gray-700
  padding: '1.5rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  maxWidth: '24rem',
  margin: '1rem auto',
  color: '#d1d5db', // Gray-300
  fontFamily: 'sans-serif'
};

const headerStyle: React.CSSProperties = {
  marginBottom: '1.5rem'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '0.25rem',
  color: '#ffffff'
};

const subTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#9ca3af' // Gray-400
};

const statItemStyle: React.CSSProperties = {
  backgroundColor: '#374151', // Gray-800
  borderRadius: '0.5rem',
  padding: '1rem',
  border: '1px solid #374151',
  marginBottom: '1rem'
};

const statItemHoverStyle: React.CSSProperties = {
  borderColor: '#4b5563' // Gray-600
};

const labelContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem'
};

const iconStyle: React.CSSProperties = {
  fontSize: '1.25rem'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: '500'
};

export const ExtensionDisplay: React.FC<ExtensionDisplayProps> = ({
  title = 'Lichess Sabotage Stats'
}) => {
  const initStats = [
    { label: 'Total Moves Made', value: 0, icon: '♞' },
    { label: 'Best Moves Found', value: 0, icon: '♕' },
    { label: 'Best Moves Blocked', value: 0, icon: '🛑' },
    { label: 'Found Before Engine', value: 0, icon: '🧠' },
    { label: 'Timer Saved Moves', value: 0, icon: '⏱️' }
  ];

  const [stats, setStats] = useState<{ label: string; value: number; icon: string }[]>(initStats);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const detail = e.detail;
      const newStats = stats.map(s => ({ ...s }));
      if ('numMoves' in detail) newStats[0].value = detail.numMoves;
      if ('bestMovesFound' in detail) newStats[1].value = detail.bestMovesFound;
      if ('bestMovesBlocked' in detail) newStats[2].value = detail.bestMovesBlocked;
      if ('bestMovesBeforeEng' in detail) newStats[3].value = detail.bestMovesBeforeEng;
      if ('movesAllowedByTimer' in detail) newStats[4].value = detail.movesAllowedByTimer;
      setStats(newStats);
    };
    window.addEventListener('extension-stats-update', handler as EventListener);
    return () => {
      window.removeEventListener('extension-stats-update', handler as EventListener);
    };
  }, [stats]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        <p style={subTitleStyle}>Real-time metrics</p>
      </div>

      <div>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={statItemStyle}
            onMouseOver={e => ((e.currentTarget.style.borderColor = statItemHoverStyle.borderColor!))}
            onMouseOut={e => ((e.currentTarget.style.borderColor = statItemStyle.borderColor!))}
          >
            <div style={labelContainerStyle}>
              {stat.icon && <span style={iconStyle}>{stat.icon}</span>}
              <span style={labelStyle}>{stat.label}</span>
            </div>
            <Counter value={stat.value} fontSize={20} places={stat.value >= 10 ? [10, 1] : [1]} />
          </div>
        ))}
      </div>
    </div>
  );
};
