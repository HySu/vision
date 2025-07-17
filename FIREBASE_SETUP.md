# Firebase 설정 가이드

이 가이드는 Vision 화상 채팅 애플리케이션에 Firebase를 연동하는 방법을 설명합니다.

## 🔥 Firebase 프로젝트 생성

### 1. Firebase Console에서 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: vision-video-chat)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 2. Realtime Database 활성화
1. Firebase Console에서 "Realtime Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 모드 선택:
   - **테스트 모드**: 개발 중 (30일 후 만료)
   - **잠금 모드**: 프로덕션용 (나중에 규칙 설정)
4. 데이터베이스 위치 선택 (아시아-태평양 권장)

### 3. Authentication 설정
1. Firebase Console에서 "Authentication" 선택
2. "시작하기" 클릭
3. "Sign-in method" 탭에서 로그인 방법 활성화:
   - **익명**: 개발/테스트용
   - **이메일/비밀번호**: 일반 사용자용
   - **Google**: 소셜 로그인 (선택사항)

## 🔧 Firebase 설정 정보 가져오기

### 1. 웹 앱 설정 (클라이언트용)
1. Firebase Console에서 "프로젝트 설정" (⚙️) 클릭
2. "일반" 탭 → "내 앱" 섹션
3. "웹 앱 추가" 클릭 (</> 아이콘)
4. 앱 닉네임 입력 (예: vision-web-app)
5. "Firebase SDK 구성" 정보 복사

### 2. Admin SDK 설정 (서버용)
1. Firebase Console에서 "프로젝트 설정" → "서비스 계정" 탭
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드 및 안전한 위치에 보관

## 📝 환경 변수 설정

### 1. .env 파일 설정
`.env.example` 파일을 참조하여 `.env` 파일을 생성하고 다음 값들을 설정:

```env
# Firebase 웹 앱 설정에서 가져온 값들
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Admin SDK JSON 파일에서 가져온 값들
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project_id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

## 🗂️ 데이터베이스 구조

```
vision-video-chat/
├── rooms/
│   └── {roomId}/
│       ├── messages/
│       │   └── {messageId}
│       │       ├── message: "Hello world"
│       │       ├── sender: "John Doe"
│       │       ├── senderId: "socket_id"
│       │       ├── userId: "firebase_user_id"
│       │       └── timestamp: "2024-01-01T00:00:00.000Z"
│       └── participants/
│           └── {socketId}
│               ├── name: "John Doe"
│               ├── userId: "firebase_user_id"
│               └── joinedAt: "2024-01-01T00:00:00.000Z"
└── users/
    └── {userId}/
        ├── displayName: "John Doe"
        ├── email: "john@example.com"
        └── lastSeen: "2024-01-01T00:00:00.000Z"
```

## 🔐 보안 규칙

Firebase Console에서 Realtime Database → 규칙 탭에서 다음 규칙을 설정:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['senderId', 'message', 'timestamp'])"
          }
        },
        "participants": {
          "$participantId": {
            ".validate": "newData.hasChildren(['name', 'joinedAt'])"
          }
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

## 🚀 실행 및 테스트

1. **의존성 설치**:
   ```bash
   npm install
   ```

2. **개발 서버 실행**:
   ```bash
   npm run dev
   ```

3. **테스트**:
   - 브라우저에서 `https://localhost:3000` 접속
   - 익명 로그인 또는 이메일 회원가입/로그인
   - 방 생성 및 채팅 테스트
   - Firebase Console에서 실시간 데이터 확인

## 🔧 Firebase 기능

### 현재 구현된 기능:
- ✅ 익명 인증
- ✅ 이메일/비밀번호 인증
- ✅ 실시간 채팅 메시지 저장
- ✅ 방 참가자 관리
- ✅ 자동 정리 (사용자 나가기)

### 추가 가능한 기능:
- 📱 소셜 로그인 (Google, Facebook)
- 📁 파일 업로드 (Firebase Storage)
- 🔔 푸시 알림 (FCM)
- 📊 사용자 분석 (Firebase Analytics)
- 💾 사용자 프로필 관리

## 🐛 문제해결

### 인증 오류
- Firebase 프로젝트 설정 확인
- 환경 변수 값 재검토
- 브라우저 캐시 클리어

### 데이터베이스 접근 오류
- 보안 규칙 확인
- 사용자 인증 상태 확인
- 네트워크 연결 확인

### 서버 연결 실패
- Admin SDK 설정 확인
- 서비스 계정 권한 확인
- 방화벽 설정 확인

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. Firebase Console 에러 로그
2. 브라우저 개발자 도구 콘솔
3. 서버 로그 (`npm run server:https`)
4. 환경 변수 설정 재확인