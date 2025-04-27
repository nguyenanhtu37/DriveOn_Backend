// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyB6sB2_G5LP5OsO4ANJTzOOsuIFbsE9hPM",
//   authDomain: "driveon-sep490.firebaseapp.com",
//   projectId: "driveon-sep490",
//   storageBucket: "driveon-sep490.firebasestorage.app",
//   messagingSenderId: "880335858610",
//   appId: "1:880335858610:web:3c5a86dd10254403fa12ab",
//   measurementId: "G-YZLYR2FDEZ"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

import admin from "firebase-admin";
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('src/config/serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;