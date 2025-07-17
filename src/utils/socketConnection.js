import { io } from 'socket.io-client';

class SocketConnection {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    const isHttps = window.location.protocol === 'https:';
    const port = isHttps ? 3443 : 3001;
    const protocol = isHttps ? 'https' : 'http';
    
    const serverUrl = `${protocol}://${window.location.hostname}:${port}`;
    
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      secure: isHttps,
      rejectUnauthorized: false, // For development with self-signed certificates
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit:', event);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export default new SocketConnection();