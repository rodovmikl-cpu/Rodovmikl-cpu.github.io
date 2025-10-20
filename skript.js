// ===== Firebase config =====
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

// ===== Variables =====
let savedName = "";
let savedCode = "";

// ===== Генератор кода =====
function makeCode() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// ===== Регистрация =====
function register() {
  const nickname = document.getElementById("nickname").value.trim();
  if (!nickname) return alert("אנא הכנס שם משתמש");
  savedName = nickname;
  savedCode = makeCode();

  document.getElementById("generatedCode").innerText = savedCode;
  document.getElementById("showCodeBox").style.display = "block";
  document.getElementById("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";

  db.ref('users/' + savedCode).set({ name: nickname });
}

// ===== Новый код =====
function newCode() {
  savedCode = makeCode();
  document.getElementById("generatedCode").innerText = savedCode;
  db.ref('users/' + savedCode).set({ name: savedName });
}

// ===== Продолжить к логину =====
function continueToLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

// ===== Вход =====
function login() {
  const loginCode = document.getElementById("loginCode").value.trim().toLowerCase();
  if (!loginCode) return alert("הכנס קוד");

  if (loginCode === "admin" || loginCode === "michaelrodov") {
    enterUser(true);
  } else {
    db.ref('users/' + loginCode).once('value', snap => {
      if (snap.exists()) {
        savedName = snap.val().name;
        enterUser(false);
      } else {
        alert("קוד שגוי!");
      }
    });
  }
}

// ===== Выход =====
function logout() { location.reload(); }

// ===== Вход в систему =====
function enterUser(isAdmin) {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("welcomeBox").style.display = "block";
  document.getElementById("createPost").style.display = "block";
  document.getElementById("allPosts").style.display = "block";
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";

  document.getElementById("welcomeText").innerText = "שלום, " + savedName + "!";
}

// ===== Сохранить пост =====
function savePost() {
  const desc = document.getElementById("description").value.trim();
  const price = Number(document.getElementById("price").value || 0);
  if (!desc && !price) return;

  db.ref('posts').push({ by: savedName, desc, price, ts: Date.now() });
  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
  alert("פורסם!");
}

// ===== Список постов =====
db.ref('posts').on('value', snap => {
  const list = document.getElementById('postsList');
  list.innerHTML = "";
  snap.forEach(ch => {
    const p = ch.val();
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = <b>${p.by || "מישהו"}</b> — ₪${p.price || 0}<br>${p.desc || ""};
    list.appendChild(div);
  });
});

// ===== Удаление всех постов (админ) =====
function clearAll() {
  if (confirm("האם אתה בטוח שברצונך למחוק את כל הפוסטים?")) {
    db.ref('posts').remove();
    alert("כל הפוסטים נמחקו");
  }
}
