// ============ Firebase הגדרה ============
const firebaseConfig = {
  apiKey: "AIzaSyDIItYSQdfdDxw8OAbdcWicaD3dCOEulII",
  authDomain: "schooltrade-9a6b8.firebaseapp.com",
  projectId: "schooltrade-9a6b8",
  storageBucket: "schooltrade-9a6b8.appspot.com",
  messagingSenderId: "29580124691",
  appId: "1:29580124691:web:8439f37bba78d81e0997d1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

let savedCode = "";
let savedName = "";
let currentUid = "";

// ============ Anonymous Auth ============
auth.signInAnonymously()
  .then(() => currentUid = auth.currentUser.uid)
  .catch(err => console.warn("Auth error:", err));

// ============ הרשמה ============
async function register() {
  const nickname = document.getElementById("nickname").value.trim();
  const regMsg = document.getElementById("regMessage");
  if (!nickname) { regMsg.innerText = "אנא הכנס שם משתמש"; return; }

  let code;
  do {
    code = Math.floor(100000000 + Math.random() * 900000000).toString();
    const doc = await db.collection("users").doc(code).get();
    if (!doc.exists) break;
  } while (true);

  await db.collection("users").doc(code).set({ name: nickname, ownerUid: currentUid });
  savedName = nickname;
  savedCode = code;

  document.getElementById("generatedCode").innerText = code;
  document.getElementById("showCodeBox").style.display = "block";
  regMsg.innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

// ============ התחברות ============
async function login() {
  const code = document.getElementById("loginCode").value.trim();
  const msg = document.getElementById("logMessage");
  msg.innerText = "";

  if (code === "admin" || code === "michaelrodov") {
    savedCode = code;
    savedName = code;
    enterUser(true);
    return;
  }

  const doc = await db.collection("users").doc(code).get();
  if (doc.exists && doc.data().ownerUid === currentUid) {
    savedCode = code;
    savedName = doc.data().name;
    enterUser(false);
  } else if (doc.exists) {
    savedCode = code;
    savedName = doc.data().name;
    enterUser(false);
  } else {
    msg.innerText = "קוד שגוי!";
  }
}

// ============ כניסה למשתמש ============
function enterUser(isAdmin) {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("welcomeBox").style.display = "block";
  document.getElementById("allPosts").style.display = "block";
  document.getElementById("createPost").style.display = isAdmin ? "none" : "block";
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";
  document.getElementById("welcomeText").innerText = "ברוך הבא, " + savedName + "!";
  if (!isAdmin) startCamera();
  listenPosts();
  if (isAdmin) showUsersList();
}

// ============ מצלמה ============
function startCamera() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('photo');
  const preview = document.getElementById('preview');
  const captureButton = document.getElementById('capture');
  if (captureButton._listenerAdded) return;
  captureButton._listenerAdded = true;

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => video.srcObject = stream)
    .catch(err => console.warn('שגיאה במצלמה:', err));

  captureButton.addEventListener('click', () => {
    if (!video.videoWidth) { alert("המתן לטעינה"); return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    preview.src = canvas.toDataURL('image/png');
    preview.style.display = 'block';
  });
}

// ============ פרסום פוסט ============
async function savePost() {
  const desc = document.getElementById("description").value.trim();
  const price = document.getElementById("price").value.trim();
  const imgData = document.getElementById("preview").src;
  if (!desc || !imgData) { alert("צריך תיאור ותמונה!"); return; }

  const imgRef = storage.ref("photos/" + Date.now() + ".png");
  const blob = await (await fetch(imgData)).blob();
  await imgRef.put(blob);
  const url = await imgRef.getDownloadURL();

  await db.collection("posts").add({
    ownerCode: savedCode,
    ownerUid: currentUid,
    name: savedName,
    desc,
    price,
    photo: url,
    date: new Date().toLocaleString(),
    comments: []
  });

  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
  document.getElementById("preview").style.display = "none";
}

// ============ צפיה בפוסטים בזמן אמת ============
function listenPosts() {
  const container = document.getElementById("postsList");
  db.collection("posts").orderBy("date", "desc").onSnapshot(snapshot => {
    container.innerHTML = "";
    snapshot.forEach(doc => {
      const p = { id: doc.id, ...doc.data() };
      const isAdmin = (savedCode === "admin" || savedCode === "michaelrodov");
      const canDelete = isAdmin || (p.ownerUid === currentUid);
      const deleteBtn = canDelete ? <div class="admin-delete" onclick="deletePost('${p.id}','${p.photo}')">❌ מחק</div> : "";

      let commentsHTML = "";
      (p.comments || []).forEach(c => {
        commentsHTML += <div class="comment"><b>${c.name}:</b> ${c.text}</div>;
      });

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
              <input type="text" placeholder="הוסף תגובה..." id="cmt-${p.id}">
              <button onclick="addComment('${p.id}')">💬 שלח</button>
            </div>
          </div>
        </div>`;
    });
  });
}

// ============ תגובות ============
async function addComment(postId) {
  const input = document.getElementById(cmt-${postId});
  const text = input.value.trim();
  if (!text) return;
  const ref = db.collection("posts").doc(postId);
  const data = (await ref.get()).data();
  data.comments.push({ name: savedName, text
