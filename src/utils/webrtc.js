export class WebRTCManager {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.configuration = {
      iceServers: [
        // Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Additional STUN servers for better reliability
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.nextcloud.com:443' },
        
        // Free TURN servers (for NAT traversal)
        {
          urls: 'turn:relay.metered.ca:80',
          username: 'openrelay',
          credential: 'openrelay'
        },
        {
          urls: 'turn:relay.metered.ca:443',
          username: 'openrelay',
          credential: 'openrelay'
        },
        {
          urls: 'turn:relay.metered.ca:443?transport=tcp',
          username: 'openrelay',
          credential: 'openrelay'
        },
        
        // Additional reliable TURN servers
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelay',
          credential: 'openrelay'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelay',
          credential: 'openrelay'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelay',
          credential: 'openrelay'
        }
      ],
      iceCandidatePoolSize: 20, // Increased for better connectivity
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all' // Use both STUN and TURN servers
    };
  }

  async initializeLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
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
      return this.localStream;
    } catch (error) {
      console.error('로컬 스트림 초기화 오류:', error);
      throw error;
    }
  }

  async createPeerConnection(peerId) {
    const peerConnection = new RTCPeerConnection(this.configuration);
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(peerId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      this.onRemoteStream(peerId, event.streams[0]);
    };

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  async createOffer(peerId) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return null;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Offer 생성 오류:', error);
      throw error;
    }
  }

  async createAnswer(peerId, offer) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return null;

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Answer 생성 오류:', error);
      throw error;
    }
  }

  async handleAnswer(peerId, answer) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Answer 처리 오류:', error);
    }
  }

  async addIceCandidate(peerId, candidate) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('ICE 후보 추가 오류:', error);
    }
  }

  closePeerConnection(peerId) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
  }

  closeAllConnections() {
    this.peerConnections.forEach((peerConnection, peerId) => {
      peerConnection.close();
    });
    this.peerConnections.clear();
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      const videoTrack = screenStream.getVideoTracks()[0];
      
      this.peerConnections.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      videoTrack.addEventListener('ended', () => {
        this.stopScreenShare();
      });

      return screenStream;
    } catch (error) {
      console.error('화면 공유 시작 오류:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      
      this.peerConnections.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    } catch (error) {
      console.error('화면 공유 중지 오류:', error);
    }
  }

  onIceCandidate(peerId, candidate) {
    console.log('ICE 후보 생성:', peerId, candidate);
  }

  onRemoteStream(peerId, stream) {
    console.log('원격 스트림 수신:', peerId, stream);
  }
}

export default WebRTCManager;