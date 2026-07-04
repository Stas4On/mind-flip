import { auth, isFirebaseConfigured } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged
} from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

// Local mock state for offline / non-Firebase mode
let localUser: AppUser | null = null;
const localListeners: Array<(user: AppUser | null) => void> = [];

export async function signUp(email: string, password: string): Promise<AppUser> {
  if (isFirebaseConfigured && auth) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: credential.user.uid,
      email: credential.user.email,
      isAnonymous: false,
    };
  } else {
    // Mock local signup
    const user: AppUser = { uid: 'local-user', email, isAnonymous: false };
    localUser = user;
    localListeners.forEach(listener => listener(user));
    return user;
  }
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (isFirebaseConfigured && auth) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: credential.user.uid,
      email: credential.user.email,
      isAnonymous: false,
    };
  } else {
    // Mock local signin
    const user: AppUser = { uid: 'local-user', email, isAnonymous: false };
    localUser = user;
    localListeners.forEach(listener => listener(user));
    return user;
  }
}

export async function signInAsGuest(): Promise<AppUser> {
  const user: AppUser = { uid: 'guest-user', email: 'guest@mindflip.local', isAnonymous: true };
  localUser = user;
  localListeners.forEach(listener => listener(user));
  return user;
}

export async function signOut(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth);
  } else {
    localUser = null;
    localListeners.forEach(listener => listener(null));
  }
}

export function onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return fbOnAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Local memory listener
    localListeners.push(callback);
    // Call immediately with current state
    callback(localUser);
    
    // Return unsubscribe function
    return () => {
      const idx = localListeners.indexOf(callback);
      if (idx !== -1) {
        localListeners.splice(idx, 1);
      }
    };
  }
}

export function getCurrentUser(): AppUser | null {
  if (isFirebaseConfigured && auth) {
    const fbUser = auth.currentUser;
    return fbUser ? {
      uid: fbUser.uid,
      email: fbUser.email,
      isAnonymous: fbUser.isAnonymous,
    } : null;
  }
  return localUser;
}
