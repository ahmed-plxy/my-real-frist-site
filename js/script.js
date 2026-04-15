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
    "فلسفة",
    "علم نفس",
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

let userTasks = JSON.parse(localStorage.getItem("alMonjez_Pro_Data")) || [];
let currentFilter = "all";
let pendingAction = null;

document.addEventListener("DOMContentLoaded", () => {
  updateSubjects();
  populateMonths();
  updateDayOptions();
  updateDatePreview();
  renderTasks();

  const monthInput = document.getElementById("monthInput");
  const dayInput = document.getElementById("dayInput");
  if (monthInput)
    monthInput.addEventListener("change", () => {
      updateDayOptions();
      updateDatePreview();
    });
  if (dayInput) dayInput.addEventListener("change", updateDatePreview);
});

function updateSubjects() {
  const section = document.getElementById("sectionInput").value;
  const subSelect = document.getElementById("subjectInput");
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
  monthSelect.innerHTML =
    '<option value="" disabled selected>اختار الشهر</option>' +
    monthNames
      .map((m) => `<option value="${m.value}">${m.label}</option>`)
      .join("");

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
  const monthValue = document.getElementById("monthInput").value;
  const dayValue = document.getElementById("dayInput").value;
  const preview = document.getElementById("dayPreview");
  if (!preview) return;
  preview.textContent =
    dayValue && monthValue ? getDateLabel(dayValue, monthValue) : "—";
}

function addNewTask() {
  const subject = document.getElementById("subjectInput").value;
  const type = document.getElementById("typeInput").value;
  const text = document.getElementById("taskInput").value.trim();
  const month = document.getElementById("monthInput").value;
  const day = document.getElementById("dayInput").value;

  if (!subject || !text || !month || !day) {
    showToast("مستعجل علي ايه كمل البيانات 👀.");
    return;
  }

  const taskData = {
    id: Date.now(),
    subject,
    type,
    text,
    month,
    day,
    dateLabel: getDateLabel(day, month),
    done: false,
  };

  userTasks.push(taskData);
  saveAndRender();

  document.getElementById("taskInput").value = "";
  showToast("علي الله تنجزها بس.");
}

function filterTasks(type) {
  currentFilter = type;
  setActiveFilterButton(type);
  renderTasks();
}

function setActiveFilterButton(type) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const buttons = [...document.querySelectorAll(".filter-btn")];
  const found = buttons.find((btn) =>
    btn.getAttribute("onclick")?.includes(`'${type}'`),
  );
  if (found) found.classList.add("active");
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const tasksToShow =
    currentFilter === "all"
      ? [...userTasks]
      : userTasks.filter((t) => t.type === currentFilter);

  if (tasksToShow.length === 0) {
    list.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">مفيش مفهام لسه </div>
                <h4> مش ناوي تبدأ ولا ايه 👀 </h4>
                <p>ضيف اول مهامك للجدول وتابعها.</p>
            </div>
        `;
    updateProgress();
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
                    <span class="tag tag-subject">${escapeHtml(task.subject)}</span>
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
      bar.classList.add("glow-success");
      setTimeout(() => bar.classList.remove("glow-success"), 1500);
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
  const names = { lec: "شرح", rev: "مراجعة", sol: "حل" };
  return names[type] || type;
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

  document.getElementById("bar-fill").style.width = percent + "%";
  document.getElementById("percent-val").innerText = percent + "%";
}

function saveAndRender() {
  localStorage.setItem("alMonjez_Pro_Data", JSON.stringify(userTasks));
  renderTasks();
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
