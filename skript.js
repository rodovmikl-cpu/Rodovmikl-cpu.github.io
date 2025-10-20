// ====== данные ======
let users = JSON.parse(localStorage.getItem("users") || "{}");
let posts = JSON.parse(localStorage.getItem("posts") || "[]");

let savedCode = "";
let savedName = "";

function saveData() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("posts", JSON.stringify(posts));
}

function register() {
  const nickname = document.getElementById("nickname").value.trim();
  if (!nickname) {
    document.getElementById("regMessage").innerText = "אנא הכנס שם משתמש";
    return;
  }

  let code;
  do {
    code = Math.floor(100000000 + Math.random() * 900000000).toString();
  } while (users[code]);

  users[code] = { name: nickname };
  saveData();

  savedName = nickname;
  savedCode = code;

  document.getElementById("generatedCode").innerText = code;
  document.getElementById("showCodeBox").style.display = "block";
  document.getElementById("regMessage").innerText = "נרשמת בהצלחה — שמור את הקוד!";
}

function continueToLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function login() {
  const loginCode = document.getElementById("loginCode").value.trim();
  document.getElementById("logMessage").innerText = "";

  if (loginCode === "admin" || loginCode === "michaelrodov") {
    savedCode = loginCode;
    savedName = loginCode;
    enterUser(true);
    return;
  }

  if (users[loginCode]) {
    savedCode = loginCode;
    savedName = users[loginCode].name;
    enterUser(false);
  } else {
    document.getElementById("logMessage").innerText = "קוד שגוי!";
  }
}

function enterUser(isAdmin) {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("welcomeBox").style.display = "block";
  document.getElementById("allPosts").style.display = "block";
  document.getElementById("createPost").style.display = isAdmin ? "none" : "block";
  document.getElementById("welcomeText").innerText = "ברוך הבא, " + savedName + "!";
  document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";

  if (!isAdmin) startCamera();
  showPosts();
  if (isAdmin) showUsersList();
}

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
    if (!video.videoWidth) {
      alert("המתן לטעינה");
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    preview.src = canvas.toDataURL('image/png');
    preview.style.display = 'block';
  });
}

function savePost() {
  if (!savedCode || savedCode === "admin" || savedCode === "michaelrodov") {
    alert("רק משתמשים רגילים יכולים לפרסם");
    return;
  }

  const photo = document.getElementById("preview").src;
  const desc = document.getElementById("description").value.trim();
  const price = document.getElementById("price").value.trim();

  if (!photo || !desc) {
    alert("צריך תיאור ותמונה!");
    return;
  }

  const newPost = {
    id: Date.now() + "_" + Math.random().toString(36).slice(2),
    ownerCode: savedCode,
    name: savedName,
    desc: desc,
    price: price,
    photo: photo,
    date: new Date().toLocaleString(),
    comments: []
  };

  posts.push(newPost);
  saveData();
  showPosts();
  document.getElementById("description").value = "";
  document.getElementById("price").value = "";
}

function showPosts() {
  const container = document.getElementById("postsList");
  container.innerHTML = "";

  posts.slice().reverse().forEach(p => {
    const isAdmin = (savedCode === "admin" || savedCode === "michaelrodov");
    const canDelete = isAdmin || (p.ownerCode === savedCode);
    const deleteBtn = canDelete ? <div class="admin-delete" onclick="deletePost('${p.id}')">❌ מחק</div> : "";

    let commentsHTML = "";
    p.comments.forEach(c => {
      commentsHTML += <div class="comment"><b>${c.name}:</b> ${c.text}</div>;
    });

    const postHTML = `
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
      </div>
    `;
    container.innerHTML += postHTML;
  });
}

function addComment(postId) {
  const input = document.getElementById(cmt-${postId});
  const text = input.value.trim();
  if (!text) return;
  const post = posts.find(p => p.id === postId);
  post.comments.push({ name: savedName, text });
  saveData();
  input.value = "";
  showPosts();
}

function deletePost(id) {
  if (!confirm("למחוק פוסט זה?")) return;
  posts = posts.filter(p => p.id !== id);
  saveData();
  showPosts();
}

function showUsersList() {
  const c = document.getElementById("usersList");
  c.innerHTML = "";
  for (const code in users) {
    const u = users[code];
    c.innerHTML += `<div class="user-row">
      <span>${u.name} (${code})</span>
      <button class="user-delete" onclick="deleteAccount('${code}')">מחק</button>
    </div>`;
  }
}

function deleteAccount(code) {
  delete users[code];
  posts = posts.filter(p => p.ownerCode !== code);
  saveData();
  showUsersList();
  showPosts();
}

function clearAll() {
  if (!confirm("למחוק את כל הפוסטים?")) return;
  posts = [];
  saveData();
  showPosts();
}

// ====== копирование кода (כפתור העתק קוד) ======
function copyGeneratedCodeToClipboard() {
  const codeEl = document.getElementById('generatedCode');
  if (!codeEl) return;
  const text = codeEl.innerText || codeEl.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const msg = document.getElementById('regMessage');
    if (msg) {
      msg.innerText = "הקוד הועתק!";
      setTimeout(() => msg.innerText = "נרשמת בהצלחה — שמור את הקוד!", 1800);
    }
  }).catch(err => {
    alert('לא יכול להעתיק — בדוק הרשאות הדפדפן.');
    console.error(err);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("registerBox").style.display = "block";
  showPosts();

  const toggleBtn = document.getElementById('togglePostBox');
  const postBox = document.getElementById('postBox');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      postBox.style.display = postBox.style.display === 'none' ? 'block' : 'none';
    });
  }

  // добавляем обработчик для иврит-кнопки "העתק קוד"
  const copyBtn = document.getElementById('copyCodeBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyGeneratedCodeToClipboard);
  }
});
