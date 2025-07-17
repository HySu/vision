import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, push, onValue, off, remove } from 'firebase/database';
import { auth, database } from '../config/firebase';

class FirebaseService {
  constructor() {
    this.auth = auth;
    this.database = database;
    this.currentUser = null;
  }

  // Authentication methods
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(this.auth);
      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  }

  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    }
  }

  async createUserWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      callback(user);
    });
  }

  // Database methods
  async saveMessage(roomId, message) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const messageData = {
      message: message.message,
      sender: message.sender,
      senderId: message.senderId,
      userId: this.currentUser.uid,
      timestamp: new Date().toISOString()
    };

    try {
      const messagesRef = ref(this.database, `rooms/${roomId}/messages`);
      await push(messagesRef, messageData);
      return messageData;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  subscribeToMessages(roomId, callback) {
    const messagesRef = ref(this.database, `rooms/${roomId}/messages`);
    
    onValue(messagesRef, (snapshot) => {
      const messages = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }
      callback(messages);
    });

    return () => off(messagesRef);
  }

  async saveRoomParticipant(roomId, participant) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const participantData = {
      name: participant.name,
      userId: this.currentUser.uid,
      joinedAt: new Date().toISOString()
    };

    try {
      const participantsRef = ref(this.database, `rooms/${roomId}/participants/${participant.id}`);
      await push(participantsRef, participantData);
      return participantData;
    } catch (error) {
      console.error('Error saving participant:', error);
      throw error;
    }
  }

  subscribeToParticipants(roomId, callback) {
    const participantsRef = ref(this.database, `rooms/${roomId}/participants`);
    
    onValue(participantsRef, (snapshot) => {
      const participants = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          participants.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }
      callback(participants);
    });

    return () => off(participantsRef);
  }

  async removeParticipant(roomId, participantId) {
    try {
      const participantRef = ref(this.database, `rooms/${roomId}/participants/${participantId}`);
      await remove(participantRef);
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }
}

export default new FirebaseService();