# Vercel 배포 가이드

## 🚨 중요한 문제점

**Vercel의 Serverless 특성상 Socket.io 실시간 서버가 지속적으로 실행되지 않습니다.**
이로 인해 WebRTC 시그널링이 제대로 작동하지 않아 각 사용자가 독립적인 호스트가 되는 문제가 발생합니다.

## 🔧 해결 방안

### 옵션 1: 별도 서버 사용 (권장)
1. **Railway**, **Render**, **Heroku** 등에 Socket.io 서버를 별도 배포
2. Vercel에는 React 앱만 배포
3. React 앱이 별도 서버의 Socket.io에 연결

### 옵션 2: Vercel Pro 사용
1. Vercel Pro 플랜에서 **Edge Functions** 사용
2. WebSocket 연결을 위한 별도 설정 필요

### 옵션 3: Firebase Realtime Database 활용
1. Socket.io 대신 Firebase Realtime Database 사용
2. 실시간 시그널링을 Firebase로 처리

## 📋 현재 적용된 수정사항

### 1. Socket.io 연결 개선
- 프로덕션 환경 자동 감지
- Polling 전송 방식 추가 (WebSocket 실패 시 fallback)
- 재연결 로직 강화

### 2. WebRTC STUN/TURN 서버 확장
- 더 많은 STUN/TURN 서버 추가
- NAT 우회 능력 향상

### 3. 환경 설정 개선
- Vercel 배포용 `vercel.json` 추가
- 프로덕션 환경 변수 설정

## 🚀 배포 단계

### Vercel 환경변수 설정
다음 환경변수를 Vercel 대시보드에 추가하세요:

```
NODE_ENV=production
REACT_APP_FIREBASE_API_KEY=AIzaSyAsRccRdebJCyyInJtgyOEh-28VB3uEoZM
REACT_APP_FIREBASE_AUTH_DOMAIN=vision-video-chat.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://vision-video-chat-default-rtdb.asia-southeast1.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=vision-video-chat
REACT_APP_FIREBASE_STORAGE_BUCKET=vision-video-chat.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=995748643748
REACT_APP_FIREBASE_APP_ID=1:995748643748:web:04ce614d660ef00f0b3731

# Firebase Admin (서버용)
FIREBASE_PROJECT_ID=vision-video-chat
FIREBASE_PRIVATE_KEY_ID=e271f9434ab897d791d870dc2afdabbfb69f54f8
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCVDYbANBOQOs3g..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@vision-video-chat.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=113460139721193075872
FIREBASE_DATABASE_URL=https://vision-video-chat-default-rtdb.asia-southeast1.firebasedatabase.app
```

### 별도 서버 배포 (Railway 예시)
1. Railway에 새 프로젝트 생성
2. `server.js`만 포함한 별도 레포지토리 생성
3. Railway에 연결하여 배포
4. Vercel 환경변수에 Railway 서버 URL 설정:
   ```
   REACT_APP_SERVER_URL=https://your-app.railway.app
   REACT_APP_SOCKET_URL=https://your-app.railway.app
   ```

## 🧪 테스트 방법

1. **로컬 테스트**: `npm run dev`로 확인
2. **프로덕션 테스트**: 
   - 빌드: `npm run build`
   - 서버 실행: `npm run server:https`
   - 브라우저에서 `https://localhost:3443` 접속

## 💡 권장사항

현재 구현으로는 Vercel 단독으로는 완전한 멀티유저 화상채팅이 어렵습니다.
**Railway + Vercel 조합** 또는 **Firebase Realtime Database 전환**을 권장합니다.