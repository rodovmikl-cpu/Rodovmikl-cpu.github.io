// ===== Supabase setup =====
const SUPABASE_URL = 'https://fxskzfjezoolsgqytumw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4c2t6Zmplem9vbHNncXl0dW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTkzODksImV4cCI6MjA3NjYzNTM4OX0.MYIWkWhdVNzlqs53l4a4eJXQJeJpf0bD3kQQCDN-zrI';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Переменные =====
let savedCode = "", savedName = "";
let isAdmin = false;

// ===== Регистрация =====
document.getElementById("registerBtn").addEventListener("click", async () => {
  const nickname = document.getElementById("nickname").value.trim();
  if (!nickname) {
    document.getElementById("regMessage").innerText = "אנא הכנס שם משתמש";
    return;
  }

  let code = Math.floor(100000000 + Math.random()*900000000).toString();

  // Проверка уникальности в Supabase
  const { data: existing } = await supabase.from('users').select('code').eq('code', code);
  if (existing && existing.length > 0) code = Math.floor(100000000 + Math.random()*900000000).toString();

  const { error } = await supabase.from('users').insert([{ code, name: nickname }]);
  if (error) {
    console.error("Ошибка при регистрации:", error);
    alert("שגיאה בהרשמה — בדוק את הקונסול!");
    return;
  }

  savedCode = code;
  savedName = nickname;

  document.getElementById("generatedCode").innerText = code;
  document.getElementById("showCodeBox").style.display = "block";
  document.getElementById("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
});

// ===== Продолжить =====
document.getElementById("continueBtn").addEventListener("click", () => {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
});

// ===== Вход =====
document.getElementById("loginBtn").addEventListener("click", async () => {
  const loginCode = document.getElementById("loginCode").value.trim();
  document.getElementById("logMessage").innerText = "";

  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedCode = loginCode;
    savedName = loginCode;
    isAdmin = true;
    enterUser();
    return;
  }

  const { data, error } = await supabase.from('users').select('*').eq('code', loginCode).single();
  if (error || !data) {
    document.getElementById("logMessage").innerText = "קוד שגוי!";
    return;
  }

  savedCode = loginCode;
  savedName = data.name;
  isAdmin = false;
  enterUser();
});

// ===== Вход пользователя =====
function enterUser() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("welcomeBox").style.display = "block";
  document.getElementById("allPosts").style.display = "block";
  document.getElementById("createPost").style.display = isAdmin ? "none" : "block";
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";
  document.getElementById("welcomeText").innerText = "ברוך הבא, " + savedName + "!";

  if (!isAdmin) startCamera();
  showPosts();
  if (isAdmin) showUsersList();
}

// ===== Выход =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("welcomeBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
  document.getElementById("showCodeBox").style.display = "none";
  document.getElementById("loginCode").value = "";
  savedCode = "";
  savedName = "";
  isAdmin = false;
});

// ===== Камера =====
function startCamera() {
  const video = document.getElementById("camera");
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { console.warn("שגיאה במצלמה:", err); });
}

// ===== Захват фото =====
document.getElementById("capture").addEventListener("click", () => {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("photo");
  const preview = document.getElementById("preview");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");
  preview.src = dataUrl;
  preview.style.display = "block";
});

// ===== Создание поста =====
document.getElementById("savePostBtn").addEventListener("click", async () => {
  if (!savedCode || isAdmin) {
    alert("רק משתמשים רגילים יכולים לפרסם");
    return;
  }

  const photo = document.getElementById("preview").src;
  const desc = document.getElementById("description").value.trim();
  const price = document.getElementById("price").value.trim();

  if (!photo || !desc) { alert("צריך תיאור ותמונה!"); return; }

  const newPost = {
    ownerCode: savedCode,
    name: savedName,
    desc, price, photo,
    comments: [],
    created_at: new Date().toISOString()
  };

  const { error } = await supabase.from("posts").insert([newPost]);
  if (error) { console.error(error); alert("שגיאה בפרסום פוסט"); return; }

  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
  document.getElementById("preview").style.display = "none";

  showPosts();
});

// ===== Показ постов =====
async function showPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return; }

  const container = document.getElementById("postsList");
  container.innerHTML = "";

  data.forEach(p => {
    const canDelete = isAdmin || p.ownerCode === savedCode;
    let commentsHTML = "";
    if (p.comments) p.comments.forEach(c => { commentsHTML += `<div><b>${c.name}:</b> ${c.text}</div>`; });

    container.innerHTML += `
      <div class="post">
        <img src="${p.photo}">
        <h4>${p.name}</h4>
        <p>${p.desc}</p>
        <p>💰 ${p.price || "ללא מחיר"} ₪</p>
        <small>${new Date(p.created_at).toLocaleString()}</small>
        ${canDelete ? `<div class="admin-delete" onclick="deletePost('${p.id}')">❌ מחק</div>` : ""}
        <div class="comment-section">
          ${commentsHTML}
          <div class="comment-input">
            <input type="text" placeholder="הוסף תגובה..." id="cmt-${p.id}">
            <button onclick="addComment('${p.id}')">💬 שלח</button>
          </div>
        </div>
      </div>
    `;
  });
}

//
