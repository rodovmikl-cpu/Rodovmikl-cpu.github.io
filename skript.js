// ===================== Firebase config =====================
const firebaseConfig = {
  apiKey: "AIzaSyDIItYSQdfdDxw8OAbdcWicaD3dCOEulII",
  authDomain: "schooltrade-9a6b8.firebaseapp.com",
  projectId: "schooltrade-9a6b8",
  storageBucket: "schooltrade-9a6b8.appspot.com",
  messagingSenderId: "29580124691",
  appId: "1:29580124691:web:8439f37bba78d81e0997d1"
};

// ===================== Инициализация Firebase =====================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===================== Регистрация =====================
function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const status = document.getElementById("status");

  if (!username || !password) {
    status.textContent = "יש למלא את כל השדות.";
    return;
  }

  auth.createUserWithEmailAndPassword(username + "@schooltrade.com", password)
    .then(userCredential => {
      status.textContent = "נרשמת בהצלחה!";
      console.log("User registered:", userCredential.user);
    })
    .catch(error => {
      status.textContent = "שגיאה בהרשמה: " + error.message;
      console.error(error);
    });
}

// ===================== Вход =====================
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const status = document.getElementById("status");

  if (!username || !password) {
    status.textContent = "יש למלא את כל השדות.";
    return;
  }

  auth.signInWithEmailAndPassword(username + "@schooltrade.com", password)
    .then(userCredential => {
      status.textContent = "התחברת בהצלחה!";
      console.log("User logged in:", userCredential.user);
    })
    .catch(error => {
      status.textContent = "שגיאה בהתחברות: " + error.message;
      console.error(error);
    });
}

// ===================== Назначение кнопок =====================
document.getElementById("registerBtn").addEventListener("click", register);
document.getElementById("loginBtn").addEventListener("click", login)
