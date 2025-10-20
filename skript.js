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

// ===== Утилиты =====
const q = (id) => document.getElementById(id);
const setDbg = (txt) => { const d = q("dbg"); if (d) d.textContent = txt; };

// ===== Регистрация =====
function register() {
  const nickname = q("nickname").value.trim();
  if (!nickname) return alert("אנא הכנס שם משתמש");
  const code = Math.floor(100000000 + Math.random() * 900000000).toString();
  savedName = nickname;
  savedCode = code;
  db.ref('users/' + code).set({ name: nickname });
  q("generatedCode").innerText = code;
  q("showCodeBox").style.display = "block";
  q("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

// ===== Вход =====
function login() {
  const raw = q("loginCode").value || "";
  const loginCode = raw.normalize('NFKC').trim().toLowerCase();

  // админ-вход
  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedName = loginCode;
    savedCode = loginCode;
    enterUser(true);
    return;
  }
  if (!loginCode) { alert("אנא הזן קוד"); return; }

  // обычный вход
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
  q("registerBox").style.display = "none";
  q("loginBox").style.display = "block";
}

// ===== Выход =====
function logout() { location.reload(); }

// ===== Переход в приложение (показ экранов + камера) =====
function enterUser(isAdmin) {
  q("registerBox").style.display = "none";
  q("loginBox").style.display = "none";
  q("welcomeBox").style.display = "block";
  q("createPost").style.display = "block";
  q("allPosts").style.display = "block";
  q("adminPanel").style.display = isAdmin ? "block" : "none";
  q("welcomeText").innerText = "שלום, " + savedName + "!";
  setDbg(user: ${savedName} | admin: ${isAdmin});

  // камера
  const video = q("camera");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { video.srcObject = stream; })
      .catch(() => { video.replaceWith(document.createTextNode("אין הרשאת מצלמה")); });
  }
}

// ===== Публикация поста =====
function savePost() {
  const desc = q("description").value.trim();
  const price = Number(q("price").value || 0);
  if (!desc && !price) return;

  const post = { by: savedName, desc, price, ts: Date.now() };
  db.ref('posts').push(post);
  q("description").value = "";
  q("price").value = "";
  alert("פורסם!");
}

// ===== Список постов (live) =====
db.ref('posts').on('value', snap => {
  const list = q('postsList');
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

// ===== Список пользователей (для админа) =====
function loadUsers() {
  const ul = q('usersList');
  if (!ul) return;
  db.ref('users').once('value', snap => {
    ul.innerHTML = "";
    if (!snap.exists()) { ul.textContent = "אין משתמשים"; return; }
    snap.forEach(ch => {
      const u = ch.val();
      const div = document.createElement('div');
      div.textContent = ${u.name} — קוד: ${ch.key};
      ul.appendChild(div);
    });
  });
}

// ===== Очистка всех постов (только админ) =====
function clearAll() {
  if (confirm("האם אתה בטוח שברצונך למחוק את כל הפוסטים?")) {
    db.ref('posts').remove().then(() => alert("כל הפוסטים נמחקו"));
  }
}

// ===== Захват фото (по желанию) =====
function wireCameraCapture() {
  const btn = q('capture');
  if (!btn) return;
  btn.onclick = () => {
    const video = q('camera');
    const canvas = q('photo');
    const preview = q('preview');
    if (!video || !canvas || !preview) return;

    const w = video.videoWidth, h = video.videoHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    preview.src = dataUrl;
    preview.style.display = 'block';
  };
}

// ===== Привязка кнопок после загрузки DOM =====
document.addEventListener("DOMContentLoaded", () => {
  // кнопки
  q("btnRegister").onclick = register;
  q("btnContinueToLogin").onclick = continueToLogin;
  q("btnLogin").onclick = login;
  q("btnLogout").onclick = logout;
  q("btnSavePost").onclick = savePost;
  q("btnClearAll").onclick = () => { clearAll(); };

  const t = q("togglePostBox");
  if (t) t.onclick = () => {
    const b = q("postBox");
    b.style.display = (b.style.display === "block") ? "none" : "block";
  };

  const copyBtn = q("copyCodeBtn");
  if (copyBtn) copyBtn.onclick = () => {
    const code = savedCode || q("generatedCode").innerText;
    navigator.clipboard.writeText(code);
    alert("הקוד הועתק");
  };

  wireCameraCapture();
  loadUsers();
  setDbg("app: ready");
});
