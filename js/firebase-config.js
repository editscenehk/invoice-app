import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 帶入你先前的 Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyC9Ns_dguRQ47Jnru4nD1tjBlO3izlKxsU",
  authDomain: "invoice-1b023.firebaseapp.com",
  projectId: "invoice-1b023",
  storageBucket: "invoice-1b023.firebasestorage.app",
  messagingSenderId: "1070146387893",
  appId: "1:1070146387893:web:0bc8e1f151562725c463fc"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);