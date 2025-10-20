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
  savedName = nickname;
  savedCode = code;

  db.ref('users/' + code).set({ name: nickname });
  document.getElementById("generatedCode").innerText = code;
  document.getElementById("showCodeBox").style.display = "block";
  document.getElementById("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

// ===== Кнопка “העתק קוד” и переключение формы поста =====
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("copyCodeBtn");
  if (btn) btn.onclick = () => {
    const code = savedCode || document.getElementById("generatedCode").innerText;
    navigator.clipboard.writeText(code);
    alert("הקוד הועתק");
  };

  const toggle = document.getElementById("togglePostBox");
  if (toggle) toggle.onclick = () => {
    const box = document.getElementById("postBox");
    box.style.display = (box.style.display === "block") ? "none" : "block";
  };
});

// ===== Вход =====
function login() {
  const loginCode = document.getElementById("loginCode").value.trim();
  if (!loginCode) return;

  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedName = loginCode;
    savedCode = loginCode;
    enterUser(true);
    return;
  }

  db.ref('users/' + loginCode).once('value', snap => {
    if (snap.exists()) {
      savedName = snap.val().name;
      savedCode = loginCode;
      enterUser(false);
    } else {
      alert("קוד שגוי!");
    }
  });
}

// ===== Переход на экран логина после регистрации =====
function continueToLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

// ===== Выход =====
function logout() { location.reload(); }

// ===== Вход пользователя / показ экранов + камера =====
function enterUser(isAdmin) {
  // показать нужные блоки
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("welcomeBox").style.display = "block";
  document.getElementById("createPost").style.display = "block";
  document.getElementById("allPosts").style.display = "block";
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";

  document.getElementById("welcomeText").innerText = "שלום, " + savedName + "!";

  // камера (работает только по HTTPS)
  const video = document.getElementById("camera");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { video.srcObject = stream; })
      .catch(() => { video.replaceWith(document.createTextNode("אין הרשאת מצלמה")); });
  }
}

// ===== Публикация поста =====
function savePost() {
  const desc = document.getElementById("description").value.trim();
  const price = Number(document.getElementById("price").value || 0);
  if (!desc && !price) return;

  const post = { by: savedName, desc, price, ts: Date.now() };
  db.ref('posts').push(post);
  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
  alert("פורסם!");
}

// ===== Загрузка списка постов =====
db.ref('posts').on('value', snap => {
  const list = document.getElementById('postsList');
  if (!list) return;
  list.innerHTML = "";
  snap.forEach(ch => {
    const p = ch.val();
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = <b>${p.by || "מישהו"}</b> — ₪${p.price || 0}<br>${p.desc || ""};
    list.appendChild(div);
  });
});

// ===== Очистка постов (только для администратора
