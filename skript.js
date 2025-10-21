// Импорты Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ====== Настройка Firebase ======
const firebaseConfig = {
  apiKey: "AIzaSyDCqfC0GDQp_xqogail5_rzJxG5Nsfqtyg",
  authDomain: "schooltrade-9a6b8.firebaseapp.com",
  projectId: "schooltrade-9a6b8",
  storageBucket: "schooltrade-9a6b8.appspot.com",
  messagingSenderId: "34444383953",
  appId: "1:34444383953:web:f6402f9a3d6cd9ab5a97f0",
  measurementId: "G-G36C12L68B"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== Утилита для выборки элементов ======
function el(id) {
  return document.getElementById(id);
}

// ====== Основной код ======
document.addEventListener("DOMContentLoaded", async () => {
  el("registerBtn").addEventListener("click", register);

  // Загружаем все посты при старте
  await loadPosts();
});

// ====== Функция регистрации ======
async function register() {
  const nickname = el("nickname").value.trim();

  if (!nickname) {
    el("regMessage").innerText = "אנא הכנס כינוי!";
    return;
  }

  try {
    // Сохраняем ник локально
    localStorage.setItem("nickname", nickname);

    // Добавляем запись в Firestore (коллекция "users")
    await addDoc(collection(db, "users"), { nickname });

    el("regMessage").innerText = נרשמת בהצלחה! ברוך הבא, ${nickname};
  } catch (error) {
    console.error("שגיאה בהרשמה:", error);
    el("regMessage").innerText = "שגיאה בהרשמה, נסה שוב.";
  }
}

// ====== Загрузка постов (пример) ======
async function loadPosts() {
  const postsDiv = el("posts");
  postsDiv.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "posts"));
    snapshot.forEach((doc) => {
      const data = doc.data();
      const p = document.createElement("p");
      p.innerText = data.text || "(פוסט ריק)";
      postsDiv.appendChild(p);
    });
  } catch (err) {
    console.error("שגיאה בטעינת פוסטים:", err);
  }
}
