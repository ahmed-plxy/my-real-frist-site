
const PAGE_MODE = document.body?.dataset.page === "general" ? "general" : "secondary";

const CONFIG = {
  secondary: {
    storageKey: "alMonjez_Pro_Data",
    typeOptions: [
      { value: "lec", label: "شرح" },
      { value: "rev", label: "مراجعة" },
      { value: "sol", label: "حل" },
    ],
    typeNames: { lec: "شرح", rev: "مراجعة", sol: "حل" },
    filters: ["all", "lec", "rev", "sol"],
    emptyTypeLabel: "مفيش مهام لسه ",
    subjectFallback: (task) => task.subject || "—",
    canUseSubjects: true,
  },
  general: {
    storageKey: "alMonjez_Pro_General_Data",
    typeOptions: [
      { value: "task", label: "مهمة" },
      { value: "lec", label: "شرح" },
      { value: "sol", label: "حل" },
      { value: "rev", label: "مراجعة" },
    ],
    typeNames: { task: "مهمة", lec: "شرح", sol: "حل", rev: "مراجعة" },
    filters: ["all", "task", "lec", "sol", "rev"],
    emptyTypeLabel: "مفيش مهام لسه ",
    subjectFallback: () => "عام",
    canUseSubjects: false,
  },
};

const ACTIVE_CONFIG = CONFIG[PAGE_MODE];

const subjects = {
  scientific: [
    "عربي",
    "فيزياء",
    "كيمياء",
    "أحياء",
    "إنجليزي",
    "رياضة بحتة",
    "رياضة تطبيقية",
  ],
  literary: [
    "عربي",
    "إنجليزي",
    "جغرافيا",
    "تاريخ",
    "إحصاء",
  ],
};

const monthNames = [
  { value: "1", label: "يناير", days: 31 },
  { value: "2", label: "فبراير", days: 28 },
  { value: "3", label: "مارس", days: 31 },
  { value: "4", label: "أبريل", days: 30 },
  { value: "5", label: "مايو", days: 31 },
  { value: "6", label: "يونيو", days: 30 },
  { value: "7", label: "يوليو", days: 31 },
  { value: "8", label: "أغسطس", days: 31 },
  { value: "9", label: "سبتمبر", days: 30 },
  { value: "10", label: "أكتوبر", days: 31 },
  { value: "11", label: "نوفمبر", days: 30 },
  { value: "12", label: "ديسمبر", days: 31 },
];

let userTasks = JSON.parse(localStorage.getItem(ACTIVE_CONFIG.storageKey)) || [];
let currentFilter = "all";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {
  populateTaskTypes();

  if (ACTIVE_CONFIG.canUseSubjects) {
    updateSubjects();
  }

  populateMonths();
  updateDayOptions();
  updateDatePreview();
  setActiveFilterButton(currentFilter);
  renderTasks();

  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      currentSearch = event.target.value || "";
      renderTasks();
      updateSearchClearState();
    });
  }
  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      currentSearch = "";
      if (searchInput) searchInput.value = "";
      renderTasks();
      updateSearchClearState();
      searchInput?.focus();
    });
  }
  updateSearchClearState();

  const monthInput = document.getElementById("monthInput");
  const dayInput = document.getElementById("dayInput");
  if (monthInput) {
    monthInput.addEventListener("change", () => {
      updateDayOptions();
      updateDatePreview();
    });
  }
  if (dayInput) dayInput.addEventListener("change", updateDatePreview);
});

function populateTaskTypes() {
  const typeSelect = document.getElementById("typeInput");
  if (!typeSelect) return;

  const currentValue = typeSelect.value;
  typeSelect.innerHTML =
    '<option value="" disabled selected>اختار النوع</option>' +
    ACTIVE_CONFIG.typeOptions
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("");

  if (ACTIVE_CONFIG.typeOptions.some((option) => option.value === currentValue)) {
    typeSelect.value = currentValue;
  } else {
    typeSelect.selectedIndex = 1;
  }
}

function updateSubjects() {
  if (!ACTIVE_CONFIG.canUseSubjects) return;

  const sectionEl = document.getElementById("sectionInput");
  const subSelect = document.getElementById("subjectInput");
  if (!sectionEl || !subSelect) return;

  const section = sectionEl.value;
  const currentValue = subSelect.value;

  subSelect.innerHTML =
    `<option value="" disabled selected>اختار المادة</option>` +
    subjects[section].map((s) => `<option value="${s}">${s}</option>`).join("");

  if (subjects[section].includes(currentValue)) {
    subSelect.value = currentValue;
  } else {
    subSelect.selectedIndex = 1;
  }
}

function populateMonths() {
  const monthSelect = document.getElementById("monthInput");
  if (!monthSelect) return;

  monthSelect.innerHTML =
    '<option value="" disabled selected>اختار الشهر</option>' +
    monthNames.map((m) => `<option value="${m.value}">${m.label}</option>`).join("");

  const today = new Date();
  monthSelect.value = String(today.getMonth() + 1);
}

function getDaysInMonth(monthValue) {
  const month = monthNames.find((m) => m.value === String(monthValue));
  return month ? month.days : 31;
}

function updateDayOptions() {
  const monthSelect = document.getElementById("monthInput");
  const daySelect = document.getElementById("dayInput");
  if (!monthSelect || !daySelect) return;

  const currentDay = daySelect.value;
  const days = getDaysInMonth(monthSelect.value || "1");

  daySelect.innerHTML =
    '<option value="" disabled selected>اختار اليوم</option>';
  for (let i = 1; i <= days; i++) {
    daySelect.innerHTML += `<option value="${i}">${i}</option>`;
  }

  if (currentDay && Number(currentDay) <= days) {
    daySelect.value = currentDay;
  } else {
    const today = new Date();
    const fallbackDay = String(Math.min(today.getDate(), days));
    daySelect.value = fallbackDay;
  }
}

function getMonthLabel(monthValue) {
  const month = monthNames.find((m) => m.value === String(monthValue));
  return month ? month.label : "";
}

function getDateLabel(day, monthValue) {
  if (!day || !monthValue) return "—";
  return `${getMonthLabel(monthValue)} ${day}`;
}

function updateDatePreview() {
  const monthEl = document.getElementById("monthInput");
  const dayEl = document.getElementById("dayInput");
  const preview = document.getElementById("dayPreview");
  if (!monthEl || !dayEl || !preview) return;

  const monthValue = monthEl.value;
  const dayValue = dayEl.value;
  preview.textContent =
    dayValue && monthValue ? getDateLabel(dayValue, monthValue) : "—";
}

function addNewTask() {
  const typeEl = document.getElementById("typeInput");
  const taskInput = document.getElementById("taskInput");
  const monthEl = document.getElementById("monthInput");
  const dayEl = document.getElementById("dayInput");
  const subjectEl = document.getElementById("subjectInput");

  if (!typeEl || !taskInput || !monthEl || !dayEl) return;

  const type = typeEl.value;
  const text = taskInput.value.trim();
  const month = monthEl.value;
  const day = dayEl.value;
  const subject = ACTIVE_CONFIG.canUseSubjects
    ? (subjectEl?.value || "")
    : "عام";

  if (
    (ACTIVE_CONFIG.canUseSubjects && !subject) ||
    !type ||
    !text ||
    !month ||
    !day
  ) {
    showToast("مستعجل علي ايه كمل البيانات 👀.");
    return;
  }

  const taskData = {
    id: Date.now(),
    subject: subject || ACTIVE_CONFIG.subjectFallback(),
    type,
    text,
    month,
    day,
    dateLabel: getDateLabel(day, month),
    done: false,
  };

  userTasks.push(taskData);
  saveAndRender();

  taskInput.value = "";
  showToast("علي الله تنجزها بس.");
}

function filterTasks(type) {
  currentFilter = type;
  setActiveFilterButton(type);
  renderTasks();
}

function setActiveFilterButton(type) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const filter = btn.dataset.filter || "";
    btn.classList.toggle("active", filter === type);
  });
}


function matchesSearch(task, term) {
  if (!term) return true;
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    task.text,
    task.subject,
    task.dateLabel,
    task.month,
    task.day,
    getTypeName(task.type),
    formatLegacyDate(task.date),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function renderTasks() {
  const list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";

  const filteredByType =
    currentFilter === "all"
      ? [...userTasks]
      : userTasks.filter((t) => t.type === currentFilter);

  const tasksToShow = filteredByType.filter((task) =>
    matchesSearch(task, currentSearch)
  );

  if (tasksToShow.length === 0) {
    const hasAnyTasks = userTasks.length > 0;
    const emptyTitle = currentSearch
      ? "مفيش نتيجة مطابقة 👀"
      : "مش ناوي تبدأ ولا ايه 👀";
    const emptyMessage = currentSearch
      ? "جرّب كلمة أقصر أو امسح البحث وشوف باقي المهام."
      : "ضيف اول مهامك للجدول وتابعها.";

    list.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">${ACTIVE_CONFIG.emptyTypeLabel}</div>
                <h4>${emptyTitle}</h4>
                <p>${emptyMessage}</p>
            </div>
        `;
    updateProgress();
    updateStats();
    return;
  }

  tasksToShow.forEach((task) => {
    const card = document.createElement("div");
    card.className = `day-card ${task.done ? "locked" : ""}`;
    card.innerHTML = `
            <div class="check-container">
                <input type="checkbox" ${task.done ? "checked disabled" : ""} onchange="confirmTask(${task.id}, this)">
            </div>
            <div class="content">
                <div class="card-top-row">
                    <div class="date">التاريخ: ${task.dateLabel || formatLegacyDate(task.date)}</div>
                    ${task.done ? '<span class="status-pill">تمت بنجاح</span>' : ""}
                </div>
                <div class="task">${escapeHtml(task.text)}</div>
                <div class="tag-container">
                    <span class="tag tag-subject">${escapeHtml(task.subject || ACTIVE_CONFIG.subjectFallback(task))}</span>
                    <span class="tag tag-type">${escapeHtml(getTypeName(task.type))}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="requestDeleteTask(${task.id})" aria-label="حذف المهمة">🗑️</button>
        `;
    list.appendChild(card);
  });

  updateProgress();
}

function confirmTask(id, checkboxEl) {
  const task = userTasks.find((t) => t.id === id);
  if (!task || task.done) return;

  openModal({
    title: "تأكيد الانجاز",
    message: "متأكد انك خلصتها؟ اصل مفيش رجعه 🤷‍♂️",
    confirmText: "خلصت",
    cancelText: "لسه",
    onConfirm: () => {
      task.done = true;
      const bar = document.getElementById("bar-fill");
      if (bar) {
        bar.classList.add("glow-success");
        setTimeout(() => bar.classList.remove("glow-success"), 1500);
      }
      saveAndRender();
      showToast("عاش يبطل 💪.");
    },
    onCancel: () => {
      checkboxEl.checked = false;
    },
  });
}

function requestDeleteTask(id) {
  openModal({
    title: "حذف المهمة",
    message: "متأكد انك عايز تحذف المهمة",
    confirmText: "حذف",
    cancelText: "رجوع",
    onConfirm: () => {
      userTasks = userTasks.filter((t) => t.id !== id);
      saveAndRender();
      showToast("تم الحذف.");
    },
  });
}

function getTypeName(type) {
  return ACTIVE_CONFIG.typeNames[type] || type;
}

function formatLegacyDate(dateValue) {
  if (!dateValue) return "—";
  const dt = new Date(dateValue);
  if (Number.isNaN(dt.getTime())) return String(dateValue);
  return dt.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
  });
}

function updateProgress() {
  const total = userTasks.length;
  const done = userTasks.filter((t) => t.done).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const barFill = document.getElementById("bar-fill");
  const percentVal = document.getElementById("percent-val");
  if (barFill) barFill.style.width = percent + "%";
  if (percentVal) percentVal.innerText = percent + "%";
}

function saveAndRender() {
  localStorage.setItem(ACTIVE_CONFIG.storageKey, JSON.stringify(userTasks));
  renderTasks();
  updateStats();
  updateSearchClearState();
}


function updateStats() {
  const total = userTasks.length;
  const done = userTasks.filter((t) => t.done).length;
  const pending = Math.max(total - done, 0);

  const totalEl = document.getElementById("totalCount");
  const doneEl = document.getElementById("doneCount");
  const pendingEl = document.getElementById("pendingCount");

  if (totalEl) totalEl.textContent = String(total);
  if (doneEl) doneEl.textContent = String(done);
  if (pendingEl) pendingEl.textContent = String(pending);
}

function updateSearchClearState() {
  const clearBtn = document.getElementById("clearSearch");
  const searchInput = document.getElementById("searchInput");
  if (!clearBtn) return;

  const hasValue = Boolean((searchInput?.value || currentSearch || "").trim());
  clearBtn.classList.toggle("visible", hasValue);
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}

function openModal({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  const overlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const confirmBtn = document.getElementById("modalConfirm");
  const cancelBtn = document.getElementById("modalCancel");

  if (!overlay || !modalTitle || !modalMessage || !confirmBtn || !cancelBtn) {
    return;
  }

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  confirmBtn.textContent = confirmText || "تأكيد";
  cancelBtn.textContent = cancelText || "إلغاء";

  const closeModal = () => {
    overlay.hidden = true;
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
    document.removeEventListener("keydown", handleEsc);
  };

  const handleEsc = (event) => {
    if (event.key === "Escape") {
      closeModal();
      if (typeof onCancel === "function") onCancel();
    }
  };

  confirmBtn.onclick = () => {
    closeModal();
    if (typeof onConfirm === "function") onConfirm();
  };

  cancelBtn.onclick = () => {
    closeModal();
    if (typeof onCancel === "function") onCancel();
  };

  overlay.hidden = false;
  document.addEventListener("keydown", handleEsc);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
