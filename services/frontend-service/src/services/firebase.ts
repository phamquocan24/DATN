// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import firebaseApi from './firebaseApi';

// Firebase config - will be fetched from backend
let firebaseConfig: any = null;
let app: any = null;
let auth: any = null;
let googleProvider: GoogleAuthProvider | null = null;

/**
 * Initialize Firebase with config from backend
 */
export const initializeFirebase = async () => {
  try {
    // Get Firebase config from backend
    const configResponse = await firebaseApi.getConfig();
    
    if (configResponse.success && configResponse.data.firebaseConfig) {
      firebaseConfig = configResponse.data.firebaseConfig;
      
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      
      // Initialize Google provider
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      console.log('Firebase initialized successfully');
      return { success: true };
    } else {
      throw new Error('Firebase configuration not available');
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      const initResult = await initializeFirebase();
      if (!initResult.success) {
        throw new Error('Firebase not initialized');
      }
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      },
      idToken
    };
  } catch (error: any) {
    console.error('Google sign-in failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Sign out current user
 */
export const signOutFirebase = async () => {
  try {
    if (auth) {
      await auth.signOut();
    }
    return { success: true };
  } catch (error: any) {
    console.error('Firebase sign out failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current Firebase user
 */
export const getCurrentFirebaseUser = () => {
  return auth?.currentUser || null;
};

/**
 * Check if Firebase is initialized
 */
export const isFirebaseInitialized = () => {
  return !!app && !!auth;
};

export { auth, googleProvider };
export default { 
  initializeFirebase, 
  signInWithGoogle, 
  signOutFirebase, 
  getCurrentFirebaseUser, 
  isFirebaseInitialized 
};