import React, { useRef, useEffect } from 'react';

function VideoCall({ participant, isLocal = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className={`video-call ${isLocal ? 'local' : 'remote'}`}>
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className="participant-video"
      />
      <div className="participant-info">
        <span className="participant-name">
          {participant.name} {isLocal && '(나)'}
        </span>
        <div className="participant-status">
          {!participant.isMicOn && <span className="status-icon">🔇</span>}
          {!participant.isCameraOn && <span className="status-icon">📹</span>}
        </div>
      </div>
    </div>
  );
}

export default VideoCall;