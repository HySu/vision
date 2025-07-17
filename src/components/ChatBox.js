import React, { useState, useRef, useEffect } from 'react';

function ChatBox({ messages, onSendMessage, userName }) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <h4>채팅</h4>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === userName ? 'own-message' : 'other-message'}`}
          >
            <div className="message-header">
              <span className="message-sender">{message.sender}</span>
              <span className="message-time">{message.timestamp}</span>
            </div>
            <div className="message-text">{message.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="message-input"
        />
        <button type="submit" className="send-button">전송</button>
      </form>
    </div>
  );
}

export default ChatBox;