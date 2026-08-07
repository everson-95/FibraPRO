import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5cM7xCbmOkLIXLpfN1sFM9pTvU61JpwM",
  authDomain: "fibrapro.firebaseapp.com",
  projectId: "fibrapro",
  storageBucket: "fibrapro.firebasestorage.app",
  messagingSenderId: "969328523015",
  appId: "1:969328523015:web:de0512078b667f00d277a2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
