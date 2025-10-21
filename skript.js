// ====== Firebase SDK ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// ====== Конфиг Firebase ======
const firebaseConfig = {
  apiKey: "AIzaSyDCqfC0GDQp_xqogail5_rzJxG5Nsfqtyg",
  authDomain: "schooltrade-9a6b8.firebaseapp.com",
  projectId: "schooltrade-9a6b8",
  storageBucket: "schooltrade-9a6b8.appspot.com.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let savedCode = "";
let savedName = "";

// ====== Регистрация ======
async function register() {
  const nickname = document.getElementById("nickname").value.trim();
  if (!nickname) {
    document.getElementById("regMessage").innerText = "אנא הכנס שם משתמש";
    return;
  }

  let code = Math.floor(100000000 + Math.random() * 900000000).toString();
  const usersCol = collection(db, "users");
  const snapshot = await getDocs(usersCol);
  const codes = snapshot.docs.map(d => d.id);
  while (codes.includes(code)) code = Math.floor(100000000 + Math.random() * 900000000).toString();

  await setDoc(doc(db, "users", code), { name: nickname });

  savedName = nickname;
  savedCode = code;

  document.getElementById("generatedCode").innerText = code;
  document.getElementById("showCodeBox").style.display = "block";
  document.getElementById("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

// ====== Вход ======
async function login() {
  const loginCode = document.getElementById("loginCode").value.trim();
  document.getElementById("logMessage").innerText = "";

  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedCode = loginCode;
    savedName = loginCode;
    enterUser(true);
    return;
  }

  const userSnap = await getDocs(collection(db, "users"));
  const userData = userSnap.docs.find(d => d.id === loginCode);
  if (userData) {
    savedCode = loginCode;
    savedName = userData.data().name;
    enterUser(false);
  } else {
    document.getElementById("logMessage").innerText = "קוד שגוי!";
  }
}

// ====== Вход пользователя ======
function enterUser(isAdmin) {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("welcomeBox").style.display = "block";
  document.getElementById("allPosts").style.display = "block";
  document.getElementById("createPost").style.display = isAdmin ? "none" : "block";
  document.getElementById("welcomeText").innerText = "ברוך הבא, " + savedName + "!";
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";

  if (!isAdmin) startCamera();
  showPostsRealtime();
  if (isAdmin) showUsersListRealtime();
}

// ====== Камера ======
function startCamera() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('photo');
  const preview = document.getElementById('preview');
  const captureButton = document.getElementById('capture');

  if (captureButton._listenerAdded) return;
  captureButton._listenerAdded = true;

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => console.warn('שגיאה במצלמה:', err));

  captureButton.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    if (!video.videoWidth) { alert("המתן לטעינה"); return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    preview.src = canvas.toDataURL('image/png');
    preview.style.display = 'block';
  });
}

// ====== Сохранение поста ======
async function savePost() {
  if (!savedCode || savedCode === "admin" || savedCode === "michaelrodov") {
    alert("רק משתמשים רגילים יכולים לפרסם");
    return;
  }

  const photo = document.getElementById("preview").src;
  const desc = document.getElementById("description").value.trim();
  const price = document.getElementById("price").value.trim();
  if (!photo || !desc) { alert("צריך תיאור ותמונה!"); return; }

  const id = Date.now() + "_" + Math.random().toString(36).slice(2);
  const storageRef = ref(storage, posts/${id}.png);
  await uploadString(storageRef, photo, 'data_url');
  const photoURL = await getDownloadURL(storageRef);

  await setDoc(doc(db, "posts", id), {
    ownerCode: savedCode,
    name: savedName,
    desc,
    price,
    photo: photoURL,
    date: new Date().toLocaleString(),
    comments: []
  });

  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
}

// ====== Показ постов ======
function showPostsRealtime() {
  const container = document.getElementById("postsList");
  const postsCol = collection(db, "posts");

  onSnapshot(postsCol, snapshot => {
    container.innerHTML = "";
    snapshot.docs.sort((a,b) => b.data().date.localeCompare(a.data().date)).forEach(docSnap => {
      const p = docSnap.data();
      const canDelete = (savedCode === "admin" || savedCode === "michaelrodov" || p.ownerCode === savedCode);
      const deleteBtn = canDelete ? <div class="admin-delete" onclick="deletePost('${docSnap.id}', '${p.photo}')">❌ מחק</div> : "";

      let commentsHTML = "";
      p.comments.forEach(c => { commentsHTML += <div class="comment"><b>${c.name}:</b> ${c.text}</div>; });

      container.innerHTML += `
        <div class="post">
          <img src="${p.photo}">
          <h4>${p.name}</h4>
          <p>${p.desc}</p>
          <p>💰 ${p.price ? p.price + " ₪" : "ללא מחיר"}</p>
          <small>${p.date}</small>
          ${deleteBtn}
          <div class="comment-section">
            ${commentsHTML}
            <div class="comment-input">
              <input type="text" placeholder="הוסף תגובה..." id="cmt-${docSnap.id}">
              <button onclick="addComment('${docSnap.id}')">💬 שלח</button>
            </div>
          </div>
        </div>`;
    });
  });
}

// ====== Комментарии ======
async function addComment(postId) {
  const input = document.getElementById(cmt-${postId});
  const text = input.value.trim();
  if (!text) return;

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDocs(collection(db, "posts"));
  const postData = (await getDocs(postRef)).data();
  await updateDoc(postRef, { comments: [...(postData.comments || []), { name: savedName, text }] });
  input.value = "";
}

// ====== Удаление поста ======
async function deletePost(id, photoURL) {
  if (!confirm("למחוק פוסט זה?")) return;
  await deleteDoc(doc(db, "posts", id));
  const photoRef = ref(storage, photoURL);
  await deleteObject(photoRef).catch(e => console.log("Фото удалено или не найдено"));
}

// ====== Показ пользователей ======
function showUsersListRealtime() {
  const c = document.getElementById("usersList");
  const usersCol = collection(db, "users");
  onSnapshot(usersCol, snapshot => {
    c.innerHTML = "";
    snapshot.docs.forEach(docSnap => {
      const u = docSnap.data();
      c.innerHTML += `<div class="user-row">
        <span>${u.name} (${docSnap.id})</span>
        <button class="user-delete" onclick="deleteAccount('${docSnap.id}')">מחק</button>
      </div>`;
    });
  });
}

// ====== Удаление аккаунта ======
async function deleteAccount(code) {
  await deleteDoc(doc(db, "users", code));

  const postsCol = collection(db, "posts");
  const snapshot = await getDocs(postsCol);
  snapshot.docs.forEach(async docSnap => {
    if (docSnap.data().ownerCode === code) {
      await deletePost(docSnap.id, docSnap.data().photo);
    }
  });
}

// ====== Logout ======
function logout() {
  document.getElementById("welcomeBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
  document.getElementById("nickname").value = "";
  document.getElementById("showCodeBox").style.display = "none";
  document.getElementById("loginCode").value = "";
  document.getElementById("allPosts").style.display = "none";
  document.getElementById("createPost").style.display = "none";
  document.getElementById("adminPanel").style.display = "none";
  savedCode = "";
  savedName = "";
}

// ====== Копирование кода ======
function copyGeneratedCodeToClipboard() {
  const codeEl = document.getElementById('generatedCode');
  if (!codeEl) return;
  const text = codeEl.innerText || codeEl.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const msg = document.getElementById('regMessage');
    if (msg) { msg.innerText = "הקוד הועתק!"; setTimeout(() => msg.innerText = "נרשמת בהצלחה — שמור את הקוד!", 1800); }
  }).catch(err => { alert('לא יכול להעתיק — בדוק הרשאות הדפדפן.'); console.error(err); });
}

// ====== DOMContentLoaded ======
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("registerBox").style.display = "block";

  const toggleBtn = document.getElementById('togglePostBox');
  const postBox = document.getElementById('postBox');
  if (toggleBtn) toggleBtn.addEventListener('click', () => { postBox.style.display = postBox.style.display === 'none' ? 'block' : 'none'; });

  const copyBtn = document.getElementById('copyCodeBtn');
  if (copyBtn) copyBtn.addEventListener('click', copyGeneratedCodeToClipboard);
});
