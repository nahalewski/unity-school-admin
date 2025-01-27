import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBdZt0bQR6QB1sDt08PcgMUj4yl2NYo_zs",
  authDomain: "unity-school-bf275.firebaseapp.com",
  projectId: "unity-school-bf275",
  storageBucket: "unity-school-bf275.firebasestorage.app",
  messagingSenderId: "772147712953",
  appId: "1:772147712953:web:be92d61b0309df846c1c68",
  measurementId: "G-XEM3LTYYHE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
