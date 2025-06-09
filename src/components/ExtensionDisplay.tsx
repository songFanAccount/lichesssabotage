import React, { useEffect, useState } from 'react';
import Counter from './counter/Counter';

export const ExtensionDisplay: React.FC = () => {
  const [stats, setStats] = useState<{ moves: number }>({ moves: 0 });
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setStats(e.detail);
    };
    window.addEventListener('extension-stats-update', handler as EventListener);
    return () => {
      window.removeEventListener('extension-stats-update', handler as EventListener);
    };
  }, []);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px", // space between text and counter
        padding: "8px",
        background: "#f0f0f0",
        borderRadius: "8px",
      }}
    >
      <span style={{ fontSize: "20px", fontWeight: "bold" }}>
        Your number of moves:
      </span>
      <Counter value={stats.moves} fontSize={20} places={stats.moves >= 10 ? [10,1] : [1]} />
    </div>
  );
};