// script.js
// Использует Firebase JS SDK (v11) — модульные импорты через CDN

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDoc,
  addDoc, onSnapshot, query, orderBy, where, getDocs,
  deleteDoc, updateDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject, listAll
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// ========= ВАШ firebaseConfig — замените при необходимости =========
const firebaseConfig = {
  apiKey: "AIzaSyDIItYSQdfdDxw8OAbdcWicaD3dCOEulII",
  authDomain: "schooltrade-9a6b8.firebaseapp.com",
  projectId: "schooltrade-9a6b8",
  storageBucket: "schooltrade-9a6b8.firebasestorage.app",
  messagingSenderId: "34444383953",
  appId: "1:34444383953:web:f6402f9a3d6cd9ab5a97f0",
  measurementId: "G-G36C12L68B"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ========== глобальные переменные состояния ==========
let savedCode = "";
let savedName = "";
let isAdminLocal = false;

// ========== вспомогательные функции ==========
function genCode() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

function el(id) { return document.getElementById(id); }

// ========== регистрация, вход ==========
document.addEventListener("DOMContentLoaded", async () => {
  // show register by default
  el("registerBox").style.display = "block";
  setupUIHandlers();
  subscribePostsRealtime(); // realtime updates for posts
});

function setupUIHandlers() {
  el("registerBtn").addEventListener("click", register);
  el("continueBtn").addEventListener("click", continueToLogin);
  el("loginBtn").addEventListener("click", login);
  el("logoutBtn").addEventListener("click", logout);
  el("capture").addEventListener("click", capturePhotoOnce);
  el("togglePostBox").addEventListener("click", togglePostBox);
  el("savePostBtn").addEventListener("click", savePost);
  el("copyCodeBtn").addEventListener("click", copyGeneratedCodeToClipboard);
  el("clearAllBtn").addEventListener("click", clearAll);
}

async function register() {
  const nickname = el("nickname").value.trim();
  if (!nickname) {
    el("regMessage").innerText = "אנא הכנס שם משתמש";
    return;
  }

  // генерируем уникальный код (проверяем в Firestore)
  let code;
  let tries = 0;
  do {
    code = genCode();
    const docRef = doc(db, "users", code);
    const snap = await getDoc(docRef);
    if (!snap.exists()) break;
    tries++;
    if (tries > 10) { alert("Ошибка генерации кода — попробуйте снова"); return; }
  } while (true);

  // сохраняем пользователя
  await setDoc(doc(db, "users", code), {
    name: nickname,
    createdAt: new Date().toISOString(),
    isAdmin: false
  });

  savedName = nickname;
  savedCode = code;
  isAdminLocal = false;

  el("generatedCode").innerText = code;
  el("showCodeBox").style.display = "block";
  el("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

function continueToLogin() {
  el("registerBox").style.display = "none";
  el("loginBox").style.display = "block";
}

async function login() {
  const loginCode = el("loginCode").value.trim();
  el("logMessage").innerText = "";

  // Проверяем в users коллекции
  if (!loginCode) { el("logMessage").innerText = "הכנס קוד"; return; }
  const userSnap = await getDoc(doc(db, "users", loginCode));
  if (userSnap.exists()) {
    const data = userSnap.data();
    savedCode = loginCode;
    savedName = data.name || loginCode;
    isAdminLocal = !!data.isAdmin;
    enterUser(isAdminLocal);
    return;
  }

  // fallback: локальные "special codes" (если вы хотите оставить 'admin' как раньше)
  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedCode = loginCode;
    savedName = loginCode;
    isAdminLocal = true;
    // При желании можно автоматически создать док для admin
    await setDoc(doc(db, "users", loginCode), { name: loginCode, isAdmin: true, createdAt: new Date().toISOString() }, { merge: true });
    enterUser(true);
    return;
  }

  el("logMessage").innerText = "קוד שגוי!";
}

async function enterUser(isAdmin) {
  el("loginBox").style.display = "none";
  el("welcomeBox").style.display = "block";
  el("allPosts").style.display = "block";
  el("createPost").style.display = isAdmin ? "none" : "block";
  el("welcomeText").innerText = "ברוך הבא, " + savedName + "!";
  el("adminPanel").style.display = isAdmin ? "block" : "none";

  if (!isAdmin) startCamera();
  // posts realtime already subscribed globally
  if (isAdmin) await showUsersList();
}

function logout() {
  el("welcomeBox").style.display = "none";
  el("registerBox").style.display = "block";
  el("nickname").value = "";
  el("showCodeBox").style.display = "none";
  el("loginCode").value = "";
  el("allPosts").style.display = "none";
  el("createPost").style.display = "none";
  el("adminPanel").style.display = "none";
  savedCode = "";
  savedName = "";
  isAdminLocal = false;
  stopCameraStream();
}

// ========== камера / фото ==========
let cameraStream = null;

function startCamera() {
  const video = el('camera');
  if (cameraStream) return;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
    })
    .catch(err => console.warn('שגיאה במצלמה:', err));
}

function stopCameraStream() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach(t => t.stop());
  cameraStream = null;
}

function capturePhotoOnce() {
  const video = el('camera');
  const canvas = el('photo');
  const preview = el('preview');
  if (!video.srcObject) {
    alert("המתן לטעינה");
    return;
  }
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  preview.src = canvas.toDataURL('image/png');
  preview.style.display = 'block';
}

// ========== posts: загрузка изображения -> создание документа ==========
async function savePost() {
  if (!savedCode || isAdminLocal) {
    alert("רק משתמשים רגילים יכולים לפרסם");
    return;
  }

  const preview = el("preview");
  const desc = el("description").value.trim();
  const price = el("price").value.trim();

  if (!preview.src || !desc) {
    alert("צריך תיאור ותמונה!");
    return;
  }

  try {
    // создаём doc в Firestore и загружаем фото в Storage
    const postsCol = collection(db, "posts");
    const newPostRef = await addDoc(postsCol, {
      ownerCode: savedCode,
      name: savedName,
      desc,
      price: price || "",
      createdAt: new Date(),
      createdAtISO: new Date().toISOString()
    });

    const postId = newPostRef.id;
    // загрузка картинки в Storage: path posts/{postId}.png
    const imgDataUrl = preview.src;
    const sRef = storageRef(storage, posts/${postId}.png);
    await uploadString(sRef, imgDataUrl, 'data_url');
    const downloadURL = await getDownloadURL(sRef);

    // обновляем post doc с ссылкой и путём к файлу
    await updateDoc(newPostRef, { photoURL: downloadURL, storagePath: posts/${postId}.png });

    // очистка UI
    el("description").value = "";
    el("price").value = "";
    el("preview").style.display = "none";
    alert("הפוסט פורסם בהצלחה!");
  } catch (err) {
    console.error("savePost error:", err);
    alert("שגיאה בפרסום הפוסט — בדוק קונסול");
  }
}

// ========== realtime отображение постов ==========
let unsubscribePosts = null;
function subscribePostsRealtime() {
  // подписываемся на все посты, сортируем по дате
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  unsubscribePosts = onSnapshot(q, snapshot => {
    const posts = [];
    snapshot.forEach(docSnap => {
      posts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderPosts(posts);
  }, err => { console.error("posts onSnapshot err:", err); });
}

function renderPosts(posts) {
  const container = el("postsList");
  container.innerHTML = "";

  posts.forEach(p => {
    const canDelete = isAdminLocal || (p.ownerCode === savedCode);
    const deleteBtn = canDelete ? <div class="admin-delete" onclick="window.deletePost('${p.id}')">❌ מחק</div> : "";
    const photo = p.photoURL ? <img src="${p.photoURL}" /> : "";
    // комментарии: получим их при клике или заранее — для простоты получаем тут (асинхронно)
    const commentsHTML = <div id="comments-${p.id}">טוען תגובות...</div>;

    const postHTML = `
      <div class="post" id="post-${p.id}">
        ${photo}
        <h4>${escapeHtml(p.name || '')}</h4>
        <p>${escapeHtml(p.desc || '')}</p>
        <p>💰 ${p.price ? escapeHtml(p.price) + " ₪" : "ללא מחיר"}</p>
        <small>${p.createdAtISO ? escapeHtml(p.createdAtISO) : ''}</small>
        ${deleteBtn}
        <div class="comment-section">
          ${commentsHTML}
          <div class="comment-input">
            <input type="text" placeholder="הוסף תגובה..." id="cmt-${p.id}">
            <button onclick="window.addComment('${p.id}')">💬 שלח</button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += postHTML;
    loadCommentsForPost(p.id);
  });
}

// загрузка комментариев (отдельно)
async function loadCommentsForPost(postId) {
  const commentsContainer = el(comments-${postId});
  if (!commentsContainer) return;
  commentsContainer.innerHTML = "טוען תגובות...";

  const commentsCol = collection(db, "posts", postId, "comments");
  const snap = await getDocs(commentsCol);
  let html = "";
  snap.forEach(docSnap => {
    const c = docSnap.data();
    html += <div class="comment"><b>${escapeHtml(c.name || '')}:</b> ${escapeHtml(c.text || '')}</div>;
  });
  if (!html) html = "<div style='opacity:.6'>אין תגובות</div>";
  commentsContainer.innerHTML = html;
}

// ========== комментарии ==========
window.addComment = async function(postId) {
  const input = el(cmt-${postId});
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const commentsCol = collection(db, "posts", postId, "comments");
  await addDoc(commentsCol, { name: savedName, text, createdAt: new Date().toISOString() });
  input.value = "";
  loadCommentsForPost(postId);
};

// ========== удаление поста (удаляет Firestore doc + Storage файл) ==========
window.deletePost = async function(postId) {
  if (!confirm("למחוק פוסט זה?")) return;
  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      alert("פוסט לא נמצא");
      return;
    }
    const postData = postSnap.data();
    // security: разрешаем удаление только админ или владелец
    if (!(isAdminLocal || postData.ownerCode === savedCode)) {
      alert("אין לך הרשאה למחוק");
      return;
    }

    // удаляем файл из storage (если путь есть)
    if (postData.storagePath) {
      try {
        await deleteObject(storageRef(storage, postData.storagePath));
      } catch (e) {
        console.warn("Не удалось удалить файл Storage:", e);
      }
    }

    // удаляем все комментарии в подколлекции (batch) — либо оставьте Firestore rules, но очистим
    const commentsSnap = await getDocs(collection(db, "posts", postId, "comments"));
    const batch = writeBatch(db);
    commentsSnap.forEach(cs => batch.delete(cs.ref));
    await batch.commit();

    // удаляем документ поста
    await deleteDoc(postRef);
    alert("הפוסט נמחק");
  } catch (err) {
    console.error("deletePost err:", err);
    alert("שגיאה במחיקה — בדוק קונסול");
  }
};

// ========== админ: показать пользователей ==========
async function showUsersList() {
  const usersListDiv = el("usersList");
  usersListDiv.innerHTML = "טוען משתמשים...";
  const snap = await getDocs(collection(db, "users"));
  usersListDiv.innerHTML = "";
  snap.forEach(docSnap => {
    const u = docSnap.data();
    const code = docSnap.id;
    usersListDiv.innerHTML += `<div class="user-row">
      <span>${escapeHtml(u.name || '')} (${escapeHtml(code)})</span>
      <button class="user-delete" onclick="window.deleteAccount('${escapeHtml(code)}')">מחק</button>
    </div>`;
  });
}

window.deleteAccount = async function(code) {
  if (!confirm("למחוק את המשתמש ואת כל הפוסטים שלו?")) return;
  try {
    // удаляем все посты ownerCode == code
    const postsQ = query(collection(db, "posts"), where("ownerCode", "==", code));
    const postsSnap = await getDocs(postsQ);
    for (const ps of postsSnap.docs) {
      const pd = ps.data();
      const pid = ps.id;
      // удаляем storage файл, если есть
      if (pd.storagePath) {
        try { await deleteObject(storageRef(storage, pd.storagePath)); } catch (e) { console.warn(e); }
      }
      // удаляем комментарии
      const commentsSnap = await getDocs(collection(db, "posts", pid, "comments"));
      const batch = writeBatch(db);
      commentsSnap.forEach(cs => batch.delete(cs.ref));
      await batch.commit();
      // удаляем сам пост
      await deleteDoc(doc(db, "posts", pid));
    }
    // удаляем user doc
    await deleteDoc(doc(db, "users", code));
    alert("המשתמש נמחק יחד עם כל הפוסטים");
    await showUsersList();
  } catch (err) {
    console.error("deleteAccount err:", err);
    alert("שגיאה במחיקת חשבון — בדוק קונסול");
  }
};

// ========== очистка всех постов (админ) ==========
async function clearAll() {
  if (!confirm("למחוק את כל הפוסטים?")) return;
  try {
    const postsSnap = await getDocs(collection(db, "posts"));
    for (const ps of postsSnap.docs) {
      const pd = ps.data();
      const pid = ps.id;
      if (pd.storagePath) {
        try { await deleteObject(storageRef(storage, pd.storagePath)); } catch (e) { console.warn(e); }
      }
      // удаляем комментарии
      const commentsSnap = await getDocs(collection(db, "posts", pid, "comments"));
      const batch = writeBatch(db);
      commentsSnap.forEach(cs => batch.delete(cs.ref));
      await batch.commit();
      await deleteDoc(doc(db, "posts", pid));
    }
    alert("כל הפוסטים נמחקו");
  } catch (err) {
    console.error("clearAll err:", err);
    alert("שגיאה — בדוק קונסול");
  }
}

// ========== копирование кода ==========
function copyGeneratedCodeToClipboard() {
  const codeEl = el('generatedCode');
  if (!codeEl) return;
  const text = codeEl.innerText || codeEl.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const msg = el('regMessage');
    if (msg) {
      msg.innerText = "הקוד הועתק!";
      setTimeout(() => msg.innerText = "נרשמת בהצלחה — שמור את הקוד!", 1800);
    }
  }).catch(err => {
    alert('לא יכול להעתיק — בדוק הרשאות הדפדפן.');
    console.error(err);
  });
}

// ========== утилиты ==========
function togglePostBox() {
  const postBox = el('postBox');
  postBox.style.display = postBox.style.display === 'none' ? 'block' : 'none';
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
