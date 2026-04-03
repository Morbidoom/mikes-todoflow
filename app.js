// ===== Firebase Imports =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// ===== Firebase Init =====
const firebaseConfig = {
  apiKey: "AIzaSyCNhGiWX8J4mfa9iTocwEJFRgQJouwFvAE",
  authDomain: "mikes-todoflow-57050.firebaseapp.com",
  projectId: "mikes-todoflow-57050",
  storageBucket: "mikes-todoflow-57050.firebasestorage.app",
  messagingSenderId: "1026658998039",
  appId: "1:1026658998039:web:fc9c7bea8802b0b1e0c952",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);
const provider    = new GoogleAuthProvider();

// ===== State =====
let tasks           = [];
let currentFilter   = 'all';
let currentCategory = 'all';
let currentUser     = null;
let unsubscribeTasks = null;

// ===== Category config =====
const categories = {
  personal: { label: 'Pessoal',  icon: 'fa-user'      },
  work:     { label: 'Trabalho', icon: 'fa-briefcase'  },
  study:    { label: 'Estudo',   icon: 'fa-book'       },
  health:   { label: 'Saúde',   icon: 'fa-heart'      },
  other:    { label: 'Outro',    icon: 'fa-tag'        },
};

// ===== DOM Refs =====
const taskInput      = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn         = document.getElementById('addBtn');
const taskList       = document.getElementById('taskList');
const emptyState     = document.getElementById('emptyState');
const progressFill   = document.getElementById('progressFill');
const progressLabel  = document.getElementById('progressLabel');
const progressPercent= document.getElementById('progressPercent');
const countAll       = document.getElementById('countAll');
const countActive    = document.getElementById('countActive');
const countCompleted = document.getElementById('countCompleted');
const clearBtn       = document.getElementById('clearCompleted');
const toastEl        = document.getElementById('toast');
const dateDisplay    = document.getElementById('dateDisplay');
const loginScreen    = document.getElementById('loginScreen');
const appWrapper     = document.getElementById('appWrapper');
const loginBtn       = document.getElementById('loginBtn');
const logoutBtn      = document.getElementById('logoutBtn');
const userAvatar     = document.getElementById('userAvatar');
const userNameEl     = document.getElementById('userName');

// ===== Firestore Helpers =====
function tasksRef(uid) {
  return collection(db, 'users', uid, 'tasks');
}

function taskDocRef(uid, id) {
  return doc(db, 'users', uid, 'tasks', id);
}

// ===== Auth State =====
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    showApp(user);
    subscribeToTasks(user.uid);
  } else {
    currentUser = null;
    if (unsubscribeTasks) { unsubscribeTasks(); unsubscribeTasks = null; }
    tasks = [];
    showLogin();
  }
});

function showApp(user) {
  loginScreen.classList.remove('visible');
  appWrapper.classList.add('visible');
  userAvatar.src = user.photoURL || '';
  userAvatar.alt = user.displayName || '';
  userNameEl.textContent = (user.displayName || '').split(' ')[0];
  renderDate();
  renderTasks();
  setupEventListeners();
}

function showLogin() {
  loginScreen.classList.add('visible');
  appWrapper.classList.remove('visible');
}

// ===== Google Login / Logout =====
loginBtn.addEventListener('click', async () => {
  try {
    loginBtn.disabled = true;
    await signInWithPopup(auth, provider);
  } catch (e) {
    showToast('Erro ao fazer login. Tente novamente.');
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  showToast('Até logo!');
});

// ===== Firestore: Real-time listener =====
function subscribeToTasks(uid) {
  const q = query(tasksRef(uid), orderBy('createdAt', 'desc'));
  unsubscribeTasks = onSnapshot(q, snapshot => {
    tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTasks();
  });
}

// ===== Add Task =====
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) { shakeInput(); return; }
  if (!currentUser) return;

  addBtn.disabled = true;
  try {
    await addDoc(tasksRef(currentUser.uid), {
      text,
      category: categorySelect.value,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    showToast('Tarefa adicionada!');
    taskInput.value = '';
    taskInput.focus();
  } catch (e) {
    showToast('Erro ao adicionar tarefa.');
  } finally {
    addBtn.disabled = false;
  }
}

function shakeInput() {
  taskInput.parentElement.style.animation = 'none';
  taskInput.parentElement.offsetHeight;
  taskInput.parentElement.style.animation = 'shake 0.35s ease';
  setTimeout(() => taskInput.parentElement.style.animation = '', 400);
}

// ===== Toggle Complete =====
async function toggleTask(id) {
  if (!currentUser) return;
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  await updateDoc(taskDocRef(currentUser.uid, id), { completed: !task.completed });
  showToast(task.completed ? 'Tarefa reaberta!' : 'Tarefa concluída!');
}

// ===== Delete Task =====
function deleteTask(id) {
  if (!currentUser) return;
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    el.addEventListener('animationend', async () => {
      await deleteDoc(taskDocRef(currentUser.uid, id));
    }, { once: true });
  }
  showToast('Tarefa removida.');
}

// ===== Edit Task =====
function startEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task || !currentUser) return;

  const item   = document.querySelector(`[data-id="${id}"]`);
  const textEl = item.querySelector('.task-text');
  const input  = document.createElement('input');
  input.type      = 'text';
  input.value     = task.text;
  input.className = 'task-edit-input';
  input.maxLength = 120;

  textEl.replaceWith(input);
  input.focus();
  input.select();

  async function saveEdit() {
    const newText = input.value.trim();
    if (newText && newText !== task.text) {
      await updateDoc(taskDocRef(currentUser.uid, id), { text: newText });
      showToast('Tarefa atualizada!');
    } else {
      renderTasks();
    }
  }

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  input.blur();
    if (e.key === 'Escape') { input.value = task.text; input.blur(); }
  });
}

// ===== Clear Completed =====
async function clearCompleted() {
  if (!currentUser) return;
  const completed = tasks.filter(t => t.completed);
  if (completed.length === 0) { showToast('Nenhuma tarefa concluída.'); return; }
  await Promise.all(completed.map(t => deleteDoc(taskDocRef(currentUser.uid, t.id))));
  showToast(`${completed.length} tarefa(s) removida(s).`);
}

// ===== Filter & Render =====
function getFilteredTasks() {
  return tasks.filter(task => {
    const matchStatus =
      currentFilter === 'all' ||
      (currentFilter === 'active'    && !task.completed) ||
      (currentFilter === 'completed' &&  task.completed);
    const matchCat =
      currentCategory === 'all' || task.category === currentCategory;
    return matchStatus && matchCat;
  });
}

function renderTasks() {
  const filtered = getFilteredTasks();
  const total    = tasks.length;
  const done     = tasks.filter(t => t.completed).length;
  const active   = total - done;
  const pct      = total === 0 ? 0 : Math.round((done / total) * 100);

  progressFill.style.width    = `${pct}%`;
  progressLabel.textContent   = `${done} de ${total} tarefa${total !== 1 ? 's' : ''} concluída${total !== 1 ? 's' : ''}`;
  progressPercent.textContent = `${pct}%`;
  countAll.textContent       = total;
  countActive.textContent    = active;
  countCompleted.textContent = done;

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach(task => taskList.appendChild(createTaskEl(task)));
  }
}

function createTaskEl(task) {
  const li  = document.createElement('li');
  li.className  = `task-item cat-${task.category}${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;

  const cat     = categories[task.category] || categories.other;
  const dateStr = formatDate(task.createdAt);

  li.innerHTML = `
    <input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''} aria-label="Marcar tarefa">
    <div class="task-body">
      <span class="task-text">${escapeHtml(task.text)}</span>
      <div class="task-meta">
        <span class="task-category"><i class="fa-solid ${cat.icon}"></i> ${cat.label}</span>
        <span class="task-date">${dateStr}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="task-action-btn edit"   title="Editar tarefa"><i class="fa-solid fa-pen"></i></button>
      <button class="task-action-btn delete" title="Remover tarefa"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;

  li.querySelector('.task-check').addEventListener('change', () => toggleTask(task.id));
  li.querySelector('.edit').addEventListener('click',        () => startEdit(task.id));
  li.querySelector('.delete').addEventListener('click',      () => deleteTask(task.id));

  return li;
}

// ===== Helpers =====
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function renderDate() {
  const now    = new Date();
  const days   = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  dateDisplay.innerHTML = `${days[now.getDay()]}<br>${now.getDate()} de ${months[now.getMonth()]}`;
}

// ===== Event Listeners =====
let listenersAttached = false;
function setupEventListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  clearBtn.addEventListener('click', clearCompleted);

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.cat;
      renderTasks();
    });
  });
}

// ===== Shake animation =====
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);
