import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const createOrUpdateUserDocument = async (user, isLogin = false) => {
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    try {
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const userData = {
          email: user.email,
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          schoolCode: 'default',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        };
        await setDoc(userRef, userData);
        return userData;
      } else {
        const userData = userDoc.data();
        if (isLogin) {
          // Only update lastLogin during explicit login
          await setDoc(userRef, { 
            ...userData, 
            lastLogin: new Date().toISOString(),
            email: user.email,
          }, { merge: true });
        }
        return userData;
      }
    } catch (error) {
      console.error('Error managing user document:', error);
      return null;
    }
  };

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await createOrUpdateUserDocument(userCredential.user, true);
      if (userData) {
        setUserProfile(userData);
        setUserRole(userData.role);
      }
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth).then(() => {
      setUserRole(null);
      setUserProfile(null);
      setCurrentUser(null);
    });
  }

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      try {
        if (user) {
          const userData = await createOrUpdateUserDocument(user, false);
          if (mounted && userData) {
            setUserProfile(userData);
            setUserRole(userData.role);
            setCurrentUser(user);
          }
        } else {
          if (mounted) {
            setUserProfile(null);
            setUserRole(null);
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    userProfile,
    login,
    logout,
    isAdmin: userRole === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
