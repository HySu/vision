import { io } from 'socket.io-client';

class SocketConnection {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    // Check if we're in production (Vercel) or development
    const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('.vercel.app');
    const isHttps = window.location.protocol === 'https:';
    
    let serverUrl;
    
    if (isProduction) {
      // For Vercel deployment, use environment variables or current domain
      serverUrl = process.env.REACT_APP_SERVER_URL || 
                  process.env.REACT_APP_SOCKET_URL || 
                  `${window.location.protocol}//${window.location.hostname}`;
    } else {
      // For local development
      const port = isHttps ? 3443 : 3001;
      const protocol = isHttps ? 'https' : 'http';
      serverUrl = `${protocol}://${window.location.hostname}:${port}`;
    }
    
    console.log('Connecting to Socket.io server:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'], // Add polling as fallback for Vercel
      secure: isHttps,
      rejectUnauthorized: false, // For development with self-signed certificates
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
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