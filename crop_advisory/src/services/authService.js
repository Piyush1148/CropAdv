import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import firebaseConfig from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);

// Authentication service functions
export const authService = {
  // Sign up with email and password
  signUp: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(user, {
          displayName: displayName
        });
      }
      
      // Send email verification
      await sendEmailVerification(user);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        },
        message: 'Account created successfully! Please check your email to verify your account.'
      };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
        code: error.code
      };
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
        code: error.code
      };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.code)
      };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.code)
      };
    }
  },

  // Send email verification
  sendEmailVerification: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        return {
          success: true,
          message: 'Verification email sent!'
        };
      }
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.code)
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

// Helper function to convert Firebase error codes to user-friendly messages
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to perform this action.';
    default:
      return 'An error occurred. Please try again.';
  }
};

export default app;