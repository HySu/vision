import React from 'react';

function ParticipantsList({ participants }) {
  return (
    <div className="participants-list">
      <div className="participants-header">
        <h4>참가자 ({participants.length})</h4>
      </div>
      
      <div className="participants-container">
        {participants.map((participant) => (
          <div key={participant.id} className="participant-item">
            <div className="participant-avatar">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div className="participant-details">
              <span className="participant-name">
                {participant.name} {participant.isLocal && '(나)'}
              </span>
              <div className="participant-status">
                {!participant.isMicOn && <span className="status-icon muted">🔇</span>}
                {!participant.isCameraOn && <span className="status-icon video-off">📹</span>}
                {participant.isLocal && <span className="status-badge">호스트</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParticipantsList;