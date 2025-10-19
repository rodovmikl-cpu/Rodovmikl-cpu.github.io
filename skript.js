// ===== Firebase конфиг =====
const firebaseConfig = {
  apiKey: "AIzaSyBvvebig_d426cyfqzhmUdYm1xeos1qI3g",
  authDomain: "schooltrade-24d67.firebaseapp.com",
  projectId: "schooltrade-24d67",
  storageBucket: "schooltrade-24d67.appspot.com",
  messagingSenderId: "810785338793",
  appId: "1:810785338793:web:c0e430982daf74351300b8",
  measurementId: "G-F1Q46581JN"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

let savedName = "";
let savedCode = "";

// ===== Регистрация =====
function register() {
  const nickname = document.getElementById("nickname").value.trim();
  if (!nickname) return alert("אנא הכנס שם משתמש");
  const code = Math.floor(100000000 + Math.random() * 900000000).toString();
  savedName = nickname; savedCode = code;

  db.ref('users/' + code).set({ name: nickname });
  document.getElementById("generatedCode").innerText = code;
  document.getElementById("showCodeBox").style.display = "block";
  document.getElementById("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

// ===== Вход =====
function login() {
  const loginCode = document.getElementById("loginCode").value.trim();
  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedName = savedCode = loginCode;
    enterUser(true); return;
  }
  db.ref('users/' + loginCode).once('value', snap => {
    if (snap.exists()) { savedName = snap.val().name; savedCode = loginCode; enterUser(false); }
    else alert("קוד שגוי!");
  });
}

// ===== Главная страница =====
function enterUser(isAdmin) {
  document.getElementById("registerBox").style.display
