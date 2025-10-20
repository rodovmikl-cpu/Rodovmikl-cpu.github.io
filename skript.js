// ------------------ Base helpers ------------------
const q = id => document.getElementById(id);
const dbg = txt => { const d = q('dbg'); if (d) d.textContent = txt; };
console.log('JS LOADED v10');
window.addEventListener('error', e => console.error('JS ERROR:', e.message));

// ------------------ Firebase config ------------------
const firebaseConfig = {
  apiKey: "AIzaSyBvvebig_d426cyfqzhmUdYm1xeos1qI3g",
  authDomain: "schooltrade-24d67.firebaseapp.com",
  databaseURL: "https://schooltrade-24d67-default-rtdb.firebaseio.com",
  projectId: "schooltrade-24d67",
  storageBucket: "schooltrade-24d67.appspot.com",
  messagingSenderId: "810785338793",
  appId: "1:810785338793:web:c0e430982daf74351300b8",
  measurementId: "G-F1Q46581JN"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ------------------ State ------------------
let savedName = "";
let savedCode = "";

// ------------------ Utils ------------------
const makeCode = () => Math.floor(100000000 + Math.random() * 900000000).toString();

// ------------------ Registration ------------------
function register() {
  const nickname = (q('nickname').value || '').trim();
  if (!nickname) return alert('אנא הכנס שם משתמש');

  savedName = nickname;
  savedCode = makeCode();

  // Показать пользователю сразу
  q('generatedCode').innerText = savedCode;
  q('showCodeBox').style.display = 'block';
  q('regMessage').innerText = 'נרשמת בהצלחה — שמור את הקוד!';

  // Записать в БД (если доступно)
  db.ref('users/' + savedCode).set({ name: savedName }).catch(err => {
    console.warn('Firebase write error:', err);
  });
}

function newCode() {
  if (!savedName) {
    alert('קודם רשום שם ולאחר מכן צור קוד');
    return;
  }
  savedCode = makeCode();
  q('generatedCode').innerText = savedCode;
  db.ref('users/' + savedCode).set({ name: savedName }).catch(()=>{});
}

function continueToLogin() {
  q('registerBox').style.display = 'none';
  q('loginBox').style.display = 'block';
}

// ------------------ Login ------------------
function login() {
  const raw = (q('loginCode').value || '');
  const loginCode = raw.normalize('NFKC').trim().toLowerCase();
  if (!loginCode) return alert('הכנס קוד');

  if (loginCode === 'admin' || loginCode === 'michaelrodov') {
    savedName = loginCode;
    savedCode = loginCode;
    enterUser(true);
    return;
  }

  db.ref('users/' + loginCode).once('value', snap => {
    if (snap.exists()) {
      savedName = (snap.val() && snap.val().name) || 'משתמש';
      savedCode = loginCode;
      enterUser(false);
    } else {
      alert('קוד שגוי!');
    }
  }).catch(err => {
    console.error('Login read error:', err);
    alert('שגיאה בקריאה מהשרת');
  });
}

function logout() { location.reload(); }

// ------------------ Enter app ------------------
function enterUser(isAdmin) {
  q('registerBox').style.display = 'none';
  q('loginBox').style.display = 'none';
  q('welcomeBox').style.display = 'block';
  q('createPost').style.display = 'block';
  q('allPosts').style.display = 'block';
  q('adminPanel').style.display = isAdmin ? 'block' : 'none';

  q('welcomeText').innerText = 'שלום, ' + savedName + '!';
  dbg(user: ${savedName} | admin: ${isAdmin});

  // Камера (работает только по HTTPS — GitHub Pages ок)
  const video = q('camera');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { video.srcObject = stream; })
      .catch(() => { video.replaceWith(document.createTextNode('אין הרשאת מצלמה')); });
  }

  // Загрузить список пользователей (для админа)
  loadUsers();
}

// ------------------ Posts ------------------
function savePost() {
  if (!savedName) return alert('יש להתחבר');
  const desc = (q('description').value || '').trim();
  const price = Number(q('price').value || 0);
  if (!desc && !price) return;

  db.ref('posts').push({ by: savedName, desc, price, ts: Date.now() })
    .then(() => {
      q('description').value = '';
      q('price').value = '';
      alert('פורסם!');
    })
    .catch(err => {
      console.error('Post error:', err);
      alert('שגיאה בפרסום');
    });
}

db.ref('posts').on('value', snap => {
  const list = q('postsList');
  if (!list) return;
  list.innerHTML = '';
  snap.forEach(ch => {
    const p = ch.val() || {};
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = <b>${p.by || 'מישהו'}</b> — ₪${p.price || 0}<br>${p.desc || ''};
    list.appendChild(div);
  });
});

// ------------------ Admin helpers ------------------
function loadUsers() {
  const box = q('usersList');
  if (!box) return;
  db.ref('users').once('value', snap => {
    box.innerHTML = '';
    if (!snap.exists()) { box.textContent = 'אין משתמשים'; return; }
    snap.forEach(ch => {
      const u = ch.val() || {};
      const row = document.createElement('div');
      row.textContent = ${u.name || '—'} — קוד: ${ch.key};
      box.appendChild(row);
    });
  });
}

function clearAll() {
  if (!confirm('האם אתה בטוח שברצונך למחוק את כל הפוסטים?')) return;
  db.ref('posts').remove().then(() => alert('כל הפוסטים נמחקו'));
}

// ------------------ UI wiring ------------------
document.addEventListener('DOMContentLoaded', () => {
  const t = q('togglePostBox');
  if (t) t.onclick = () => {
    const b = q('postBox');
    b.style.display = (b.style.display === 'block') ? 'none' : 'block';
  };

  const copy = q('copyCodeBtn');
  if (copy) copy.onclick = () => {
    const code = savedCode || q('generatedCode').innerText;
    if (code) { navigator.clipboard.writeText(code); alert('הקוד הועתק'); }
  };

  // захват фото (необязателен)
  const cap = q('capture');
  if (cap) cap.onclick = () => {
    const video = q('camera'), canvas = q('photo'), preview = q('preview');
    if (!video || !canvas || !preview) return;
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const data = canvas.toDataURL('image/png');
    preview.src = data; preview.style.display = 'block';
  };

  dbg('app: ready');
});
