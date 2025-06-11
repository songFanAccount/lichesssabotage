
import React from 'react';

export const ExtensionState = ({
  state,
  timer = 0,
  endStatus
}: {
  state: string;
  timer: number;
  endStatus: string | undefined
}) => {
  // Define a map of styles and messages for each state
  const variants: Record<
    string,
    [string, React.CSSProperties]
  > = {
    ended: [
      endStatus ? endStatus : "",
      {
  backgroundColor: '#0f0f0f', // Very dark gray/black
  color: '#e5e5e5', // Light gray text for good contrast
  border: '1px solid #404040' // Medium gray border
}
    ],
    waiting: [
      "Opponent's turn",
      {
        backgroundColor: '#eff6ff', // blue-50
        color: '#1e40af', // blue-800
        border: '1px solid #bfdbfe' // blue-200
      }
    ],
    calculating: [
      'Calculating',
      {
        backgroundColor: '#fef9c3', // yellow-50
        color: '#92400e', // yellow-800
        border: '1px solid #fef08a' // yellow-200
      }
    ],
    timer: [
      `Timer: ${timer}`,
      {
        backgroundColor: '#fee2e2', // red-50
        color: '#b91c1c', // red-800
        border: '1px solid #fecaca' // red-200
      }
    ],
    ready: [
      'Blocking :D',
      {
        backgroundColor: '#dcfce7', // green-50
        color: '#166534', // green-800
        border: '1px solid #bbf7d0' // green-200
      }
    ]
  };

  const variant = variants[state];
  if (!variant) return <></>;

  // Shared style for the container
  const containerStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.3rem 0.5rem',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    width: 'fit-content',
    ...variant[1]
  };

  return (
    <div style={containerStyle}>
      <span style={{fontFamily: "sans-serif"}}>{variant[0]}</span>
    </div>
  );
};
