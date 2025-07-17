# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Start development environment (recommended)
npm run dev                    # Runs both HTTPS server (3443) and React dev server (3000)

# Individual servers
npm run server:https          # Backend WebSocket server on port 3443
npm run start:https          # React frontend on port 3000 with HTTPS
npm run start:http           # React frontend on port 3000 with HTTP (fallback)
```

### Production
```bash
npm run build                 # Build React app for production
NODE_ENV=production HTTPS=true node server.js  # Run production server
```

### Testing
```bash
npm test                     # Run React tests
npm test -- --watchAll=false # Run tests once without watch mode
npm test -- --verbose       # Run tests with detailed output
```

## Architecture Overview

This is a real-time multi-user video chat application built with React frontend and Node.js/Express backend, using WebRTC for peer-to-peer video communication and Socket.io for signaling.

### Key Components Architecture

**Frontend (React)**
- **App.js**: Main application component handling join/leave room flow
- **VideoChat.js**: Core video chat orchestrator - manages WebRTC connections, Socket.io events, and local media
- **VideoCall.js**: Individual video stream renderer for participants
- **ChatBox.js**: Real-time messaging interface
- **ParticipantsList.js**: Shows active users in room

**Backend (Node.js/Express)**
- **server.js**: Express server with Socket.io for WebRTC signaling, room management, and message relay
- Handles dual HTTP/HTTPS mode based on environment variables
- Manages room state and user connections in memory (Map-based storage)

**Utils Layer**
- **webrtc.js**: WebRTC connection management class handling peer connections, ICE candidates, and media streams
- **socketConnection.js**: Socket.io client connection manager with automatic HTTPS/HTTP protocol detection
- **debug.js**: Development logging utility

### Communication Flow

1. **User Join**: App.js → VideoChat.js → socketConnection → server.js
2. **WebRTC Signaling**: VideoChat.js ↔ webrtc.js ↔ socketConnection ↔ server.js ↔ other peers
3. **Media Streams**: WebRTC peer-to-peer connections bypass server after initial handshake
4. **Chat Messages**: ChatBox.js → socketConnection → server.js → all room participants

### HTTPS/SSL Configuration

The application requires HTTPS for WebRTC functionality (camera/microphone access). SSL certificates are located in `/ssl/` directory:
- `cert.pem`: Self-signed certificate for development
- `key.pem`: Private key

Server automatically detects environment and switches between HTTP/HTTPS modes. Frontend automatically connects to correct protocol/port.

### Environment Variables

Development uses `.env` file:
- `HTTPS=true` enables SSL mode
- `SSL_CRT_FILE` and `SSL_KEY_FILE` specify certificate paths
- `REACT_APP_SERVER_URL` and `REACT_APP_SOCKET_URL` configure backend endpoints

### WebRTC Connection Management

WebRTC connections are managed through the `WebRTCManager` class:
- Uses public STUN servers and open TURN relay for NAT traversal
- Maintains peer connection map for multiple simultaneous users
- Handles offer/answer exchange and ICE candidate negotiation
- Supports media stream replacement for screen sharing

### Room and User State

Server maintains room state using ES6 Maps:
- `rooms`: Map of roomId → Set of socket IDs
- `users`: Map of socket ID → user object
- Real-time synchronization of user join/leave events across all room participants

### Development Notes

- Use browser developer tools to debug WebRTC connections and Socket.io events
- Debug logging is enabled in development mode through `debug.js` utility
- Self-signed certificates will trigger browser warnings - accept them to proceed
- Test multi-user functionality by opening multiple browser windows/tabs (use incognito/private mode for separate users)
- Server logs provide detailed connection and signaling information
- WebRTC requires HTTPS for camera/microphone access in modern browsers
- The application auto-detects protocol (HTTP/HTTPS) and connects to appropriate server port

### Key Socket.io Events

- `join-room`: User joins a room
- `user-joined`/`user-left`: Room membership changes
- `offer`/`answer`/`ice-candidate`: WebRTC signaling
- `chat-message`: Text messaging
- `media-state`: Camera/microphone toggle notifications
- `room-users`: Current room participant list

### CSS Architecture

Uses CSS Grid for responsive video layout with automatic adaptation to participant count. Glassmorphism design with backdrop-filter effects and gradient backgrounds.

### SSL Certificate Management

For development, self-signed certificates are located in `/ssl/` directory:
```bash
# Regenerate certificates if needed
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=Vision/OU=Development/CN=localhost"
```

### Common Issues and Solutions

- **SSL Certificate Errors**: Browser will show "Not Secure" warning for self-signed certificates - click "Advanced" and proceed
- **Media Permission Denied**: Ensure HTTPS is being used; HTTP will block camera/microphone access
- **WebRTC Connection Fails**: Check browser console for ICE candidate errors; may need different STUN/TURN servers
- **Multi-user Issues**: Check server logs for Socket.io connection problems; ensure users are in same room ID