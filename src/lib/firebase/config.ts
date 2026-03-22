import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAHNn4zJdMaxJXziRNa9SmHRFKUvO1q9uA",
  authDomain: "praxisbytacitus.firebaseapp.com",
  projectId: "praxisbytacitus",
  storageBucket: "praxisbytacitus.firebasestorage.app",
  messagingSenderId: "852128226674",
  appId: "1:852128226674:web:535f771c7a3568462c11eb",
  measurementId: "G-7R44KT7CDY",
};

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics — only initialize on the client
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };

export default app;
