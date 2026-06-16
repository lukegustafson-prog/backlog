import "./styles.css";

const STORAGE_KEY = "backlog.tasks.v1";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const elements = {
  selectedDate: document.querySelector("#selectedDate"),
  previousDay: document.querySelector("#previousDay"),
  nextDay: document.querySelector("#nextDay"),
  calendarToggle: document.querySelector("#calendarToggle"),
  calendarBackdrop: document.querySelector("#calendarBackdrop"),
  previousMonth: document.querySelector("#previousMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  taskList: document.querySelector("#taskList"),
  taskForm: document.querySelector("#taskForm"),
  taskInput: document.querySelector("#taskInput"),
  emptyState: document.querySelector("#emptyState"),
  totalCount: document.querySelector("#totalCount"),
  completedCount: document.querySelector("#completedCount"),
  progressPercent: document.querySelector("#progressPercent"),
};

const today = startOfDay(new Date());
const state = {
  selectedDate: today,
  visibleMonth: new Date(today.getFullYear(), today.getMonth(), 1),
  tasksByDate: loadTasks(),
};

render();

elements.previousDay.addEventListener("click", () => {
  state.selectedDate = addDays(state.selectedDate, -1);
  syncVisibleMonth();
  render();
});

elements.nextDay.addEventListener("click", () => {
  if (isSameDay(state.selectedDate, today)) {
    return;
  }

  state.selectedDate = addDays(state.selectedDate, 1);
  syncVisibleMonth();
  render();
});

elements.calendarToggle.addEventListener("click", openCalendar);
elements.previousMonth.addEventListener("click", () => {
  state.visibleMonth = new Date(
    state.visibleMonth.getFullYear(),
    state.visibleMonth.getMonth() - 1,
    1,
  );
  renderCalendar();
});
elements.nextMonth.addEventListener("click", () => {
  state.visibleMonth = new Date(
    state.visibleMonth.getFullYear(),
    state.visibleMonth.getMonth() + 1,
    1,
  );
  renderCalendar();
});

elements.calendarBackdrop.addEventListener("click", (event) => {
  if (event.target === elements.calendarBackdrop) {
    closeCalendar();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isCalendarOpen()) {
    closeCalendar();
  }
});

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.taskInput.value.trim();

  if (!text) {
    return;
  }

  const dateKey = toDateKey(state.selectedDate);
  const newTask = {
    id: createTaskId(),
    text,
    completed: false,
    createdAt: Date.now(),
  };

  state.tasksByDate[dateKey] = [...getTasksForSelectedDate(), newTask];
  elements.taskInput.value = "";
  persistAndRender();
});

elements.taskList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-task]");
  const deleteButton = event.target.closest("[data-delete-task]");

  if (toggleButton) {
    toggleTask(toggleButton.dataset.taskId);
  }

  if (deleteButton) {
    deleteTask(deleteButton.dataset.taskId);
  }
});

function render() {
  elements.selectedDate.textContent = dateFormatter.format(state.selectedDate);
  elements.nextDay.disabled = isSameDay(state.selectedDate, today);
  elements.nextDay.classList.toggle("is-disabled", elements.nextDay.disabled);
  renderTasks();
  renderStats();
  renderCalendar();
}

function renderTasks() {
  const tasks = getTasksForSelectedDate();
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return a.createdAt - b.createdAt;
    }

    return Number(a.completed) - Number(b.completed);
  });

  elements.emptyState.classList.toggle("is-hidden", sortedTasks.length > 0);
  elements.taskList.innerHTML = sortedTasks
    .map(
      (task) => `
        <li class="task-item ${task.completed ? "is-complete" : ""}" data-task-row="${task.id}">
          <button
            class="task-checkbox"
            type="button"
            data-toggle-task
            data-task-id="${task.id}"
            aria-label="${task.completed ? "Mark task incomplete" : "Mark task complete"}"
            aria-pressed="${task.completed}"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9.1 16.6-3.7-3.7a1 1 0 0 1 1.4-1.4l2.3 2.29 7.59-7.58a1 1 0 1 1 1.4 1.41l-8.3 8.29a1 1 0 0 1-1.4 0Z" />
            </svg>
          </button>
          <span class="task-text">${escapeHtml(task.text)}</span>
          <button
            class="delete-task"
            type="button"
            data-delete-task
            data-task-id="${task.id}"
            aria-label="Delete task"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h1v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h1a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm1 2h4v1h-4V5Zm-2 2h8v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7Zm2 3a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
        </li>
      `,
    )
    .join("");
}

function renderStats() {
  const tasks = getTasksForSelectedDate();
  const completed = tasks.filter((task) => task.completed).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  elements.totalCount.textContent = String(tasks.length);
  elements.completedCount.textContent = String(completed);
  elements.progressPercent.textContent = `${progress}%`;
}

function renderCalendar() {
  elements.calendarTitle.textContent = monthFormatter.format(state.visibleMonth);
  elements.calendarGrid.innerHTML = "";
  elements.nextMonth.disabled = isSameMonth(state.visibleMonth, today) || state.visibleMonth > today;

  const year = state.visibleMonth.getFullYear();
  const month = state.visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let index = 0; index < startOffset; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    elements.calendarGrid.append(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const isFutureDate = date > today;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.setAttribute("aria-label", dateFormatter.format(date));
    button.textContent = String(day);

    if (isSameDay(date, today)) {
      button.classList.add("is-today");
    }

    if (isSameDay(date, state.selectedDate)) {
      button.classList.add("is-selected");
    }

    if (hasCompletedTask(dateKey)) {
      button.classList.add("has-completed");
      button.setAttribute("aria-label", `${dateFormatter.format(date)}, completed tasks`);
    }

    if (isFutureDate) {
      button.classList.add("is-future");
      button.disabled = true;
      button.setAttribute("aria-label", `${dateFormatter.format(date)}, future date unavailable`);
    }

    button.addEventListener("click", () => {
      state.selectedDate = date;
      syncVisibleMonth();
      closeCalendar();
      render();
    });

    elements.calendarGrid.append(button);
  }
}

function toggleTask(taskId) {
  const dateKey = toDateKey(state.selectedDate);
  state.tasksByDate[dateKey] = getTasksForSelectedDate().map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task,
  );
  persistAndRender();
}

function deleteTask(taskId) {
  const dateKey = toDateKey(state.selectedDate);
  state.tasksByDate[dateKey] = getTasksForSelectedDate().filter((task) => task.id !== taskId);

  if (state.tasksByDate[dateKey].length === 0) {
    delete state.tasksByDate[dateKey];
  }

  persistAndRender();
}

function persistAndRender() {
  saveTasks(state.tasksByDate);
  render();
}

function openCalendar() {
  syncVisibleMonth();
  elements.calendarBackdrop.classList.add("is-open");
  elements.calendarBackdrop.setAttribute("aria-hidden", "false");
}

function closeCalendar() {
  elements.calendarBackdrop.classList.remove("is-open");
  elements.calendarBackdrop.setAttribute("aria-hidden", "true");
  elements.calendarToggle.focus();
}

function isCalendarOpen() {
  return elements.calendarBackdrop.classList.contains("is-open");
}

function syncVisibleMonth() {
  state.visibleMonth = new Date(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), 1);
}

function getTasksForSelectedDate() {
  return state.tasksByDate[toDateKey(state.selectedDate)] ?? [];
}

function hasCompletedTask(dateKey) {
  return state.tasksByDate[dateKey]?.some((task) => task.completed) ?? false;
}

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return storedTasks && typeof storedTasks === "object" ? storedTasks : {};
  } catch {
    return {};
  }
}

function saveTasks(tasksByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDay(nextDate);
}

function isSameDay(firstDate, secondDate) {
  return toDateKey(firstDate) === toDateKey(secondDate);
}

function isSameMonth(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}

function toDateKey(date) {
  return isoFormatter.format(date);
}

function createTaskId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}
