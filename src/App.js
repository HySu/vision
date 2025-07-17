import React, { useState, useEffect } from 'react';
import VideoChat from './components/VideoChat';
import AuthWrapper from './components/AuthWrapper';
import firebaseService from './services/firebaseService';
import './App.css';

function App() {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoinRoom = () => {
    if (userName.trim() && roomId.trim()) {
      setIsJoined(true);
    }
  };

  const handleLeaveRoom = () => {
    setIsJoined(false);
  };

  return (
    <AuthWrapper>
      <div className="App">
        {!isJoined ? (
          <div className="join-container">
            <div className="join-form">
              <h1>Vision - 다중 화상 채팅</h1>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="사용자 이름"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="방 ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="input-field"
                />
              </div>
              <button onClick={handleJoinRoom} className="join-btn">
                방 입장하기
              </button>
            </div>
          </div>
        ) : (
          <VideoChat 
            userName={userName} 
            roomId={roomId} 
            onLeave={handleLeaveRoom}
          />
        )}
      </div>
    </AuthWrapper>
  );
}

export default App;