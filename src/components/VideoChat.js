import React, { useState, useEffect, useRef } from 'react';
import VideoCall from './VideoCall';
import ChatBox from './ChatBox';
import ParticipantsList from './ParticipantsList';
import socketConnection from '../utils/socketConnection';
import WebRTCManager from '../utils/webrtc';
import debug from '../utils/debug';

function VideoChat({ userName, roomId, onLeave }) {
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef(null);
  const webRTCManager = useRef(null);

  useEffect(() => {
    initializeConnection();
    return () => {
      cleanup();
    };
  }, []);

  const initializeConnection = async () => {
    try {
      console.log('🔄 Initializing connection...');
      
      // Initialize WebRTC Manager
      webRTCManager.current = new WebRTCManager();
      console.log('✅ WebRTC Manager initialized');
      
      // Initialize Socket Connection
      const socket = socketConnection.connect();
      console.log('🔌 Socket connection initiated');
      
      // Wait for socket connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 10000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Socket connected successfully');
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Socket connection failed:', error);
          reject(error);
        });
      });
      
      // Initialize Media
      const stream = await initializeMedia();
      console.log('✅ Media initialized');
      
      // Set local stream to WebRTC Manager
      if (webRTCManager.current && stream) {
        webRTCManager.current.localStream = stream;
        
        // Setup WebRTC callbacks
        webRTCManager.current.onIceCandidate = (peerId, candidate) => {
          socket.emit('ice-candidate', { candidate, to: peerId });
        };
        
        webRTCManager.current.onRemoteStream = (peerId, stream) => {
          setParticipants(prev => prev.map(p => 
            p.id === peerId ? { ...p, stream } : p
          ));
        };
      }
      
      // Setup Socket Events
      setupSocketEvents(socket);
      
      // Add local user to participants immediately
      setParticipants([{
        id: socket.id,
        name: userName,
        roomId: roomId,
        isLocal: true,
        isCameraOn: true,
        isMicOn: true,
        stream: stream
      }]);
      
      // Join Room  
      socket.emit('join-room', { roomId, userName, userId: null });
      
      setIsConnected(true);
    } catch (error) {
      console.error('연결 초기화 오류:', error);
    }
  };

  const setupSocketEvents = (socket) => {
    socket.on('room-users', (users) => {
      debug.log('방 참가자 목록:', users);
      setParticipants(prev => {
        // Keep the local user that was already added
        const localUser = prev.find(p => p.isLocal);
        
        // Map remote users from server data
        const remoteUsers = users
          .filter(user => user.id !== socket.id)
          .map(user => ({
            ...user,
            isLocal: false,
            isCameraOn: true,
            isMicOn: true
          }));
        
        // Combine local and remote users
        const allUsers = localUser ? [localUser, ...remoteUsers] : remoteUsers;
        
        debug.log('Updated participants:', allUsers);
        return allUsers;
      });
    });

    socket.on('user-joined', (user) => {
      debug.log('사용자 입장:', user);
      setParticipants(prev => {
        const exists = prev.find(p => p.id === user.id);
        if (exists) return prev;
        return [...prev, { ...user, isCameraOn: true, isMicOn: true }];
      });
      handleUserJoined(user);
    });

    socket.on('user-left', ({ userId }) => {
      debug.log('사용자 퇴장:', userId);
      handleUserLeft(userId);
    });

    socket.on('chat-message', (message) => {
      debug.log('채팅 메시지:', message);
      setMessages(prev => [...prev, message]);
    });

    socket.on('offer', async ({ offer, from }) => {
      debug.log('Offer 수신:', from);
      await handleOffer(offer, from);
    });

    socket.on('answer', async ({ answer, from }) => {
      debug.log('Answer 수신:', from);
      await handleAnswer(answer, from);
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      debug.log('ICE 후보 수신:', from);
      await handleIceCandidate(candidate, from);
    });

    socket.on('user-media-state', ({ userId, isCameraOn, isMicOn }) => {
      debug.log('미디어 상태 변경:', { userId, isCameraOn, isMicOn });
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isCameraOn, isMicOn } : p
      ));
    });

    socket.on('connect', () => {
      debug.log('Socket 연결됨:', socket.id);
    });

    socket.on('disconnect', () => {
      debug.log('Socket 연결 해제됨');
    });
  };

  const handleUserJoined = async (user) => {
    try {
      debug.log('새 사용자와 WebRTC 연결 시작:', user.id);
      if (webRTCManager.current) {
        await webRTCManager.current.createPeerConnection(user.id);
        const offer = await webRTCManager.current.createOffer(user.id);
        debug.log('Offer 생성 완료, 전송:', user.id);
        socketConnection.emit('offer', { offer, to: user.id });
      }
    } catch (error) {
      debug.error('사용자 입장 처리 오류:', error);
    }
  };

  const handleUserLeft = (userId) => {
    debug.log('사용자 퇴장 처리:', userId);
    if (webRTCManager.current) {
      webRTCManager.current.closePeerConnection(userId);
    }
    setParticipants(prev => prev.filter(p => p.id !== userId));
  };

  const handleOffer = async (offer, from) => {
    try {
      debug.log('Offer 처리 시작:', from);
      if (webRTCManager.current) {
        await webRTCManager.current.createPeerConnection(from);
        const answer = await webRTCManager.current.createAnswer(from, offer);
        debug.log('Answer 생성 완료, 전송:', from);
        socketConnection.emit('answer', { answer, to: from });
      }
    } catch (error) {
      debug.error('Offer 처리 오류:', error);
    }
  };

  const handleAnswer = async (answer, from) => {
    try {
      debug.log('Answer 처리 시작:', from);
      if (webRTCManager.current) {
        await webRTCManager.current.handleAnswer(from, answer);
        debug.log('Answer 처리 완료:', from);
      }
    } catch (error) {
      debug.error('Answer 처리 오류:', error);
    }
  };

  const handleIceCandidate = async (candidate, from) => {
    try {
      debug.log('ICE 후보 처리:', from);
      if (webRTCManager.current) {
        await webRTCManager.current.addIceCandidate(from, candidate);
      }
    } catch (error) {
      debug.error('ICE 후보 처리 오류:', error);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (webRTCManager.current) {
      webRTCManager.current.closeAllConnections();
    }
    socketConnection.disconnect();
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('미디어 접근 오류:', error);
      throw error;
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
        
        // Notify other participants about media state change
        socketConnection.emit('media-state', {
          roomId,
          isCameraOn: !isCameraOn,
          isMicOn
        });
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
        
        // Notify other participants about media state change
        socketConnection.emit('media-state', {
          roomId,
          isCameraOn,
          isMicOn: !isMicOn
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setLocalStream(screenStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsScreenSharing(false);
          initializeMedia();
        });
      } catch (error) {
        console.error('화면 공유 오류:', error);
      }
    } else {
      setIsScreenSharing(false);
      initializeMedia();
    }
  };

  const sendMessage = (message) => {
    socketConnection.emit('chat-message', { message, roomId });
  };

  return (
    <div className="video-chat-container">
      <div className="video-section">
        <div className="videos-grid">
          <div className="main-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
            <div className="video-info">
              <span>{userName} (나)</span>
            </div>
          </div>
          
          {participants.filter(p => !p.isLocal).map(participant => (
            <VideoCall
              key={participant.id}
              participant={participant}
              isLocal={false}
            />
          ))}
        </div>
        
        <div className="controls">
          <button 
            onClick={toggleCamera}
            className={`control-btn ${!isCameraOn ? 'off' : ''}`}
          >
            📹 {isCameraOn ? '카메라 끄기' : '카메라 켜기'}
          </button>
          <button 
            onClick={toggleMic}
            className={`control-btn ${!isMicOn ? 'off' : ''}`}
          >
            🎤 {isMicOn ? '마이크 끄기' : '마이크 켜기'}
          </button>
          <button 
            onClick={toggleScreenShare}
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          >
            🖥️ {isScreenSharing ? '화면 공유 중지' : '화면 공유'}
          </button>
          <button onClick={onLeave} className="control-btn leave-btn">
            📞 나가기
          </button>
        </div>
      </div>
      
      <div className="sidebar">
        <div className="room-info">
          <h3>방 ID: {roomId}</h3>
        </div>
        
        <ParticipantsList participants={participants} />
        
        <ChatBox 
          messages={messages} 
          onSendMessage={sendMessage}
          userName={userName}
        />
      </div>
    </div>
  );
}

export default VideoChat;