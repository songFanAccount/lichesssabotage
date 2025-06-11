import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, X, Check, Settings } from 'lucide-react';

export const ExtensionSettings = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(3);
  const [appliedMuted, setAppliedMuted] = useState(false);
  const [appliedDuration, setAppliedDuration] = useState(3);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(parseInt(e.target.value));
  };

  const handleTogglePopup = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleApplySettings = () => {
    window.dispatchEvent(new CustomEvent("apply-settings", {
      detail: {
        isMuted: isMuted,
        duration: duration
      }
    }))
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("extension_settings_ready"))
  }, [])
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const detail = event.detail
      if ('appliedIsMuted' in detail) setAppliedMuted(detail.appliedIsMuted)
      if ('appliedDuration' in detail) setAppliedDuration(detail.appliedDuration)
    }
    window.addEventListener("extension-settings-update", handler as EventListener)
    return () => {
      window.removeEventListener("extension-settings-update", handler as EventListener)
    }
  }, [appliedMuted, appliedDuration])
  const settingsButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    backgroundColor: '#374151',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#111827',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid #374151',
    maxWidth: '384px',
    width: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const titleStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    textAlign: 'center',
    margin: '0 0 24px 0'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#d1d5db',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '12px'
  };

  const muteButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    backgroundColor: isMuted ? '#dc2626' : '#16a34a',
    color: '#ffffff'
  }

  const currentSettingsStyle: React.CSSProperties = {
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#1f2937',
    borderRadius: '6px',
    border: '1px solid #4b5563'
  };

  const currentSettingsTitleStyle: React.CSSProperties = {
    color: '#d1d5db',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    margin: '0 0 8px 0'
  };

  const settingsListStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#9ca3af'
  };

  const settingItemStyle: React.CSSProperties = {
    marginBottom: '4px'
  };

  const muteValueStyle: React.CSSProperties = {
    color: appliedMuted ? '#f87171' : '#4ade80'
  };

  const timerValueStyle: React.CSSProperties = {
    color: '#60a5fa'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease, background-color 0.2s ease'
  };

  const applyButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    marginLeft: 'auto',
    marginTop: '16px'
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={handleTogglePopup}
        style={settingsButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4b5563';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#374151';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
      >
        <Settings size={20} />
        <span style={{ marginLeft: '8px' }}>Extension Settings</span>
      </button>

      {/* Settings Popup */}
      {isOpen && (
        <div style={overlayStyle} onClick={handleOverlayClick}>
          <div style={containerStyle}>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={closeButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>

            <h2 style={titleStyle}>Extension Settings</h2>
            
            {/* Mute Button */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Audio</label>
              <button
                onClick={toggleMute}
                style={muteButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isMuted ? '#b91c1c' : '#15803d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isMuted ? '#dc2626' : '#16a34a';
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                <span>
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </button>
            </div>

            {/* Timer Duration Slider */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Timer Duration: {duration}s</label>
              
              {/* Slider track */}
              <div style={{
                position: 'relative',
                height: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0',
                  right: '0',
                  height: '2px',
                  backgroundColor: '#6b7280', // neutral color for the track
                  transform: 'translateY(-50%)'
                }}></div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={duration}
                  onChange={handleDurationChange}
                  style={{
                    width: '100%',
                    height: '16px',
                    background: 'transparent', // no fill
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    padding: '0 0px',
                    border: "none"
                  }}
                />
              </div>

              {/* X-axis Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '4px',
                marginLeft: '2px'
              }}>
                <span>0s</span>
                <span>20s</span>
              </div>

              {/* Thumb styling */}
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  appearance: none;
                  height: 16px;
                  width: 16px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 2px solid #1e40af;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }

                input[type="range"]::-moz-range-thumb {
                  height: 16px;
                  width: 16px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 2px solid #1e40af;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
              `}</style>
            </div>

            {/* Apply Settings Button */}
            <button
              onClick={handleApplySettings}
              style={applyButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <Check size={16} />
              <span>Apply Settings</span>
            </button>

            {/* Current Settings Display */}
            <div style={currentSettingsStyle}>
              <h3 style={currentSettingsTitleStyle}>Current Settings:</h3>
              <div style={settingsListStyle}>
                <div style={settingItemStyle}>
                  Audio: <span style={muteValueStyle}>{appliedMuted ? 'Muted' : 'Enabled'}</span>
                </div>
                <div style={settingItemStyle}>
                  Timer: <span style={timerValueStyle}>{appliedDuration} seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};