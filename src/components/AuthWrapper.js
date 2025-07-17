import React, { useState, useEffect } from 'react';
import firebaseService from '../services/firebaseService';
import '../styles/AuthWrapper.css';

function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAnonymousSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await firebaseService.signInAnonymously();
    } catch (error) {
      setError('익명 로그인에 실패했습니다: ' + error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (authMode === 'signin') {
        await firebaseService.signInWithEmail(email, password);
      } else {
        await firebaseService.createUserWithEmail(email, password);
      }
    } catch (error) {
      setError(authMode === 'signin' ? '로그인에 실패했습니다: ' + error.message : '회원가입에 실패했습니다: ' + error.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-header">
            <h1>Vision - 화상 채팅</h1>
            <p>안전한 화상 채팅을 위해 인증이 필요합니다</p>
          </div>

          {!showAuth ? (
            <div className="auth-options">
              <button 
                className="auth-btn anonymous-btn" 
                onClick={handleAnonymousSignIn}
                disabled={loading}
              >
                익명으로 시작하기
              </button>
              <button 
                className="auth-btn email-btn" 
                onClick={() => setShowAuth(true)}
              >
                이메일로 로그인
              </button>
            </div>
          ) : (
            <div className="auth-form-container">
              <div className="auth-toggle">
                <button 
                  className={`toggle-btn ${authMode === 'signin' ? 'active' : ''}`}
                  onClick={() => setAuthMode('signin')}
                >
                  로그인
                </button>
                <button 
                  className={`toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => setAuthMode('signup')}
                >
                  회원가입
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="auth-form">
                <div className="form-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    required
                    className="auth-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    required
                    className="auth-input"
                  />
                </div>
                
                {error && <div className="auth-error">{error}</div>}
                
                <button 
                  type="submit" 
                  className="auth-btn submit-btn"
                  disabled={loading}
                >
                  {authMode === 'signin' ? '로그인' : '회원가입'}
                </button>
              </form>

              <button 
                className="back-btn" 
                onClick={() => setShowAuth(false)}
              >
                뒤로가기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="authenticated-container">
      <div className="user-info">
        <span>환영합니다, {user.email || '익명 사용자'}!</span>
        <button onClick={handleSignOut} className="signout-btn">
          로그아웃
        </button>
      </div>
      {children}
    </div>
  );
}

export default AuthWrapper;