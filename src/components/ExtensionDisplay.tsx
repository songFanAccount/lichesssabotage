import React, { useEffect, useState } from 'react';

export const ExtensionDisplay: React.FC = () => {
  const [stats, setStats] = useState<{ moves: number; captures: number }>({ moves: 0, captures: 0 });
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
    <div>
      <div>Moves: {stats.moves}</div>
      <div>Captures: {stats.captures}</div>
    </div>
  );
};