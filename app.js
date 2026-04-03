// ===== State =====
let tasks = JSON.parse(localStorage.getItem('todoflow_tasks') || '[]');
let currentFilter = 'all';
let currentCategory = 'all';

// ===== Category config =====
const categories = {
  personal: { label: 'Pessoal', icon: 'fa-user' },
  work:     { label: 'Trabalho', icon: 'fa-briefcase' },
  study:    { label: 'Estudo', icon: 'fa-book' },
  health:   { label: 'Saúde', icon: 'fa-heart' },
  other:    { label: 'Outro', icon: 'fa-tag' },
};

// ===== DOM refs =====
const taskInput     = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn        = document.getElementById('addBtn');
const taskList      = document.getElementById('taskList');
const emptyState    = document.getElementById('emptyState');
const progressFill  = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const progressPercent = document.getElementById('progressPercent');
const countAll      = document.getElementById('countAll');
const countActive   = document.getElementById('countActive');
const countCompleted = document.getElementById('countCompleted');
const clearBtn      = document.getElementById('clearCompleted');
const toastEl       = document.getElementById('toast');
const dateDisplay   = document.getElementById('dateDisplay');

// ===== Init =====
function init() {
  renderDate();
  renderTasks();
  setupEventListeners();
}

function renderDate() {
  const now = new Date();
  const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  dateDisplay.innerHTML = `${days[now.getDay()]}<br>${now.getDate()} de ${months[now.getMonth()]}`;
}

// ===== Save =====
function save() {
  localStorage.setItem('todoflow_tasks', JSON.stringify(tasks));
}

// ===== Add Task =====
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    shakeInput();
    return;
  }

  const task = {
    id: Date.now(),
    text,
    category: categorySelect.value,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  save();
  renderTasks();
  showToast('Tarefa adicionada!');

  taskInput.value = '';
  taskInput.focus();
}

function shakeInput() {
  taskInput.parentElement.style.animation = 'none';
  taskInput.parentElement.offsetHeight;
  taskInput.parentElement.style.animation = 'shake 0.35s ease';
  setTimeout(() => taskInput.parentElement.style.animation = '', 400);
}

// ===== Toggle Complete =====
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  save();
  renderTasks();
  showToast(task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta!');
}

// ===== Delete Task =====
function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    el.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      renderTasks();
    });
  }
  showToast('Tarefa removida.');
}

// ===== Edit Task =====
function startEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const item = document.querySelector(`[data-id="${id}"]`);
  const textEl = item.querySelector('.task-text');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'task-edit-input';
  input.maxLength = 120;

  textEl.replaceWith(input);
  input.focus();
  input.select();

  function saveEdit() {
    const newText = input.value.trim();
    if (newText && newText !== task.text) {
      task.text = newText;
      save();
      showToast('Tarefa atualizada!');
    }
    renderTasks();
  }

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = task.text; input.blur(); }
  });
}

// ===== Clear Completed =====
function clearCompleted() {
  const count = tasks.filter(t => t.completed).length;
  if (count === 0) { showToast('Nenhuma tarefa concluída.'); return; }
  tasks = tasks.filter(t => !t.completed);
  save();
  renderTasks();
  showToast(`${count} tarefa(s) removida(s).`);
}

// ===== Filter & Render =====
function getFilteredTasks() {
  return tasks.filter(task => {
    const matchStatus =
      currentFilter === 'all' ||
      (currentFilter === 'active' && !task.completed) ||
      (currentFilter === 'completed' && task.completed);
    const matchCat =
      currentCategory === 'all' || task.category === currentCategory;
    return matchStatus && matchCat;
  });
}

function renderTasks() {
  const filtered = getFilteredTasks();
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  const active = total - done;

  // Progress
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${done} de ${total} tarefa${total !== 1 ? 's' : ''} concluída${total !== 1 ? 's' : ''}`;
  progressPercent.textContent = `${pct}%`;

  // Counts
  countAll.textContent = total;
  countActive.textContent = active;
  countCompleted.textContent = done;

  // Render list
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach(task => {
      taskList.appendChild(createTaskEl(task));
    });
  }
}

function createTaskEl(task) {
  const li = document.createElement('li');
  li.className = `task-item cat-${task.category}${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;

  const cat = categories[task.category] || categories.other;
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
      <button class="task-action-btn edit" title="Editar tarefa">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="task-action-btn delete" title="Remover tarefa">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;

  li.querySelector('.task-check').addEventListener('change', () => toggleTask(task.id));
  li.querySelector('.edit').addEventListener('click', () => startEdit(task.id));
  li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));

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
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// ===== Event Listeners =====
function setupEventListeners() {
  addBtn.addEventListener('click', addTask);

  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  clearBtn.addEventListener('click', clearCompleted);

  // Status filter tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Category filter chips
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.cat;
      renderTasks();
    });
  });
}

// ===== Shake animation (inline) =====
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

// ===== Start =====
init();
