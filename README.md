# Vision - 다중 화상 채팅 웹사이트 (HTTPS 지원)

고품질 다중 화상 채팅 웹 애플리케이션으로 HTTPS를 지원하여 보안과 WebRTC 기능을 향상시킵니다.

## 🔒 HTTPS 기능

- **보안 연결**: 모든 통신이 SSL/TLS로 암호화됩니다
- **WebRTC 최적화**: HTTPS는 WebRTC 기능의 완전한 지원을 제공합니다
- **카메라/마이크 접근**: 최신 브라우저에서 미디어 접근 권한을 위해 HTTPS가 필요합니다
- **화면 공유**: 보안 컨텍스트에서만 화면 공유 기능이 작동합니다

## 📋 주요 기능

- 실시간 다중 화상 통화
- 텍스트 채팅
- 화면 공유
- 카메라/마이크 제어
- 참가자 목록 관리
- 반응형 디자인
- Socket.io를 통한 실시간 통신
- WebRTC를 통한 P2P 연결

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
cd vision
npm install
```

### 2. HTTPS 개발 서버 실행
```bash
# 개발 환경에서 HTTPS로 실행
npm run dev

# 또는 개별 실행
npm run server:https  # 백엔드 서버 (포트 3443)
npm run start:https   # 프론트엔드 서버 (포트 3000)
```

### 3. HTTP 서버 실행 (옵션)
```bash
# HTTP로 실행 (기본 개발용)
npm run start:http
```

## 🔧 환경 설정

### 개발 환경 (.env)
```env
HTTPS=true
SSL_CRT_FILE=ssl/cert.pem
SSL_KEY_FILE=ssl/key.pem
PORT=3000
REACT_APP_SERVER_URL=https://localhost:3443
REACT_APP_SOCKET_URL=https://localhost:3443
NODE_ENV=development
```

### 프로덕션 환경 (.env.production)
```env
HTTPS=true
SSL_CRT_FILE=ssl/cert.pem
SSL_KEY_FILE=ssl/key.pem
PORT=3000
REACT_APP_SERVER_URL=https://yourdomain.com
REACT_APP_SOCKET_URL=https://yourdomain.com
NODE_ENV=production
```

## 📁 프로젝트 구조

```
vision/
├── ssl/                    # SSL 인증서 파일
│   ├── cert.pem           # SSL 인증서
│   └── key.pem            # SSL 개인키
├── src/
│   ├── components/
│   │   ├── VideoChat.js   # 메인 화상 채팅 컴포넌트
│   │   ├── VideoCall.js   # 개별 비디오 호출 컴포넌트
│   │   ├── ChatBox.js     # 채팅 박스 컴포넌트
│   │   └── ParticipantsList.js # 참가자 목록 컴포넌트
│   ├── utils/
│   │   ├── webrtc.js      # WebRTC 관리자
│   │   └── socketConnection.js # Socket.io 연결 관리
│   ├── App.js             # 메인 앱 컴포넌트
│   ├── App.css            # 스타일링
│   └── index.js           # 진입점
├── server.js              # Express/Socket.io 서버
├── package.json
├── .env                   # 개발 환경 설정
├── .env.production        # 프로덕션 환경 설정
└── README.md
```

## 🔐 SSL 인증서

개발 환경에서는 자체 서명된 SSL 인증서를 사용합니다:

```bash
# 인증서 생성 (이미 포함됨)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=Vision/OU=Development/CN=localhost"
```

⚠️ **중요**: 브라우저에서 "안전하지 않음" 경고가 표시되면 "고급" → "localhost로 이동(안전하지 않음)"을 클릭하여 진행하세요.

## 🌐 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 사용 방법

1. **브라우저에서 접속**: `https://localhost:3000`
2. **사용자 이름 입력**: 고유한 사용자명 설정
3. **방 ID 입력**: 같은 방 ID로 다른 사용자들과 연결
4. **화상 채팅 시작**: 카메라/마이크 권한 허용 후 통화 시작

## 🛠️ 기술 스택

- **Frontend**: React 18, WebRTC, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **보안**: HTTPS, SSL/TLS
- **스타일링**: CSS3, Flexbox, Grid

## 🔧 고급 설정

### WebRTC 구성
- STUN/TURN 서버 설정
- ICE 후보 최적화
- 미디어 품질 설정

### 서버 구성
- HTTPS/HTTP 자동 전환
- Socket.io CORS 설정
- 방 관리 시스템

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
```

### 프로덕션 서버 실행
```bash
NODE_ENV=production HTTPS=true node server.js
```

## 🐛 문제 해결

### 일반적인 문제

1. **SSL 인증서 오류**
   - 브라우저에서 "고급" 옵션으로 진행
   - 유효한 SSL 인증서로 교체 권장

2. **미디어 접근 권한 오류**
   - HTTPS 연결 확인
   - 브라우저 권한 설정 확인

3. **Socket 연결 오류**
   - 서버 포트 확인 (3443)
   - 방화벽 설정 확인

### 로그 확인
```bash
# 서버 로그
npm run server:https

# 클라이언트 로그
브라우저 개발자 도구 → Console
```

## 📄 라이선스

MIT License

## 👥 기여

풀 리퀘스트와 이슈 리포트를 환영합니다!