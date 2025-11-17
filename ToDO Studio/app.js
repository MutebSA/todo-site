// ========== Utilities ==========

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = "todo_studio_state_v1";

const QUOTES = [
  "كل دقيقة تركّز تقرّبك من هدفك.",
  "ابدأ ولو بخطوة صغيرة اليوم.",
  "ثباتك أهم من حماسك المؤقت.",
  "أنت المنافس الوحيد الحقيقي لنفسك.",
  "كل ساعة مذاكرة هي استثمار في مستقبلك."
];

const POETS = [
  {
    name: "محمود درويش",
    tag: "شاعر المقاومة",
    avatarText: "م",
    poems: [
      "على هذه الأرض ما يستحق الحياة...",
      "ونحن نحب الحياة إذا ما استطعنا إليها سبيلا...",
      "أحن إلى خبز أمي وقهوة أمي..."
    ]
  },
  {
    name: "نزار قباني",
    tag: "شاعر الحب",
    avatarText: "ن",
    poems: [
      "علمني حبك أن أحزن وأنا محتاج منذ عصور...",
      "يا سيدتي، كنت أهم امرأة في تاريخي...",
      "إني خيرتك فاختاري ما بين الموت على صدري..."
    ]
  },
  {
    name: "غالب",
    tag: "رومنسي",
    avatarText: "غ",
    poems: [
      "قل للذي ينهى عن الوجد: لا تنهَ...",
      "تمشي الهوينا كأن الماء منحدر من خصرها...",
      "وللقلوب على القلوب شواهد..."
    ]
  }
];

let focusInterval = null;
let breathingInterval = null;

const DEFAULT_STATE = {
  user: {
    name: "متعب",
    stage: "طالب",
    major: "",
    email: "",
    gender: "",
    bio: ""
  },
  settings: {
    theme: "dark",
    language: "ar",
    quoteIndex: 0
  },
  view: "dashboard",
  tasks: [],
  habits: [],
  goals: [],
  streak: {
    days: 0,
    lastDate: null
  },
  stats: {
    completedTasks: 0,
    focusSessions: 0
  },
  timers: {
    focus: {
      running: false,
      remaining: 0,
      total: 0
    },
    breathing: {
      running: false,
      step: 0
    }
  },
  studyPlan: "",
  timeBlocks: [],
  notes: []            // 👈 هذي الجديدة
};

  
let state = structuredClone(DEFAULT_STATE);

// ===== اقتباس اليوم البسيط =====
const dailyQuotes = [
  "كل دقيقة تذاكر فيها تقرّبك من حلمك أكثر مما تتخيل.",
  "لا تنتظر المزاج؛ ابدأ، وسيأتي المزاج بعد أول صفحة.",
  "أصعب خطوة هي البداية، وبعدها كل شيء يهون.",
  "هدفك مو الكمال، هدفك تكون أفضل من أمس بـ 1٪.",
  "ركّز على التقدم، مو على السرعة.",
  "ساعتين تركيز حقيقي أفضل من يوم كامل تشتت.",
  "كل سؤال ما تفهمه اليوم، راح يسهّل عليك عشرات الأسئلة بعدين.",
  "أنت مو أقل من أي طالب نجح.. الفرق إنه استمر شوي أكثر.",
  "الدراسة الآن تعب بسيط.. بس مستقبلك هو المكافأة الكبيرة.",
  "لو تعبت.. خذ استراحة، بس لا تستسلم."
];

function pickQuoteForToday() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % dailyQuotes.length;
  return dailyQuotes[index];
}

function initDailyQuote() {
  const el = document.getElementById("daily-quote-text");
  if (!el) return;
  el.textContent = pickQuoteForToday();
}

// ========== Persistence ==========

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

// ========== Streak & Helpers ==========

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function updateStreak() {
  const today = todayKey();
  const last = state.streak.lastDate;
  if (!last) {
    state.streak.days = 1;
    state.streak.lastDate = today;
  } else if (last === today) {
    // nothing
  } else {
    const lastDate = new Date(last);
    const diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      state.streak.days += 1;
    } else {
      state.streak.days = 1;
    }
    state.streak.lastDate = today;
  }
}

// ========== Snackbar ==========

function showSnackbar(message) {
  const bar = $("#snackbar");
  if (!bar) return;
  bar.textContent = message;
  bar.classList.add("show");
  setTimeout(() => {
    bar.classList.remove("show");
  }, 2500);
}

// ========== Modal ==========

function openModal(title, bodyHTML, onMount) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = bodyHTML;
  $("#modal-backdrop").classList.remove("hidden");
  if (typeof onMount === "function") onMount();
}

function closeModal() {
  $("#modal-backdrop").classList.add("hidden");
  $("#modal-body").innerHTML = "";
}

// ========== Auth Overlay ==========

function showAuthIfNeeded() {
  if (!state.user || !state.user.email) {
    $("#auth-overlay").classList.remove("hidden");
  } else {
    $("#auth-overlay").classList.add("hidden");
  }
}

// ========== Rendering Shell ==========

function updateTopbarUser() {
  const name  = state.user.name  || "";
  const stage = state.user.stage || "";
  const major = state.user.major || "";

  // 🔹 البروفايل اللي يسار (كما هو)
  const userNameLabel  = $("#user-name-label");
  const userStageLabel = $("#user-stage-label");
  const avatarCircle   = $("#user-avatar-circle");
  const streakEl       = $("#streak-count");

  if (userNameLabel) {
    userNameLabel.textContent = name || "متعب";
  }

  if (userStageLabel) {
    userStageLabel.textContent =
      stage === "highschool"
        ? "طالب ثانوي"
        : stage === "university"
        ? (major ? `طالب ${major}` : "طالب جامعي")
        : "طالب";
  }

  if (avatarCircle) {
    const initials = (name || "M").trim().charAt(0).toUpperCase();
    avatarCircle.textContent = initials;
  }

  if (streakEl) {
    streakEl.textContent = state.streak.days || 0;
  }

  // 🔹 الهيدر اليمين (اللي أنت تقصده)
  const headerNameSpan  = document.getElementById("headerName");
  const headerLevelSpan = document.getElementById("headerLevel");

  if (headerNameSpan) {
    headerNameSpan.textContent = name || "Student";
  }

  if (headerLevelSpan) {
    let levelText;
    if (stage === "highschool") {
      levelText = "طالب ثانوي";
    } else if (stage === "university") {
      levelText = major ? `طالب ${major}` : "طالب جامعي";
    } else {
      levelText = "طالب";
    }
    headerLevelSpan.textContent = levelText;
  }
}


function applyTheme() {
  if (state.settings.theme === "light") {
    document.documentElement.style.setProperty("--bg", "#f3f4f6");
    document.documentElement.style.setProperty("--bg-elevated", "#ffffff");
    document.documentElement.style.setProperty("--bg-elevated-soft", "#e5e7eb");
    document.documentElement.style.setProperty("--text", "#111827");
    document.documentElement.style.setProperty("--text-muted", "#6b7280");
  } else {
    document.documentElement.style.setProperty("--bg", "#050712");
    document.documentElement.style.setProperty("--bg-elevated", "#0d0f1c");
    document.documentElement.style.setProperty("--bg-elevated-soft", "#101322");
    document.documentElement.style.setProperty("--text", "#f9fafb");
    document.documentElement.style.setProperty("--text-muted", "#9ca3af");
  }
  $("#theme-toggle").textContent =
    state.settings.theme === "dark" ? "🌙" : "☀️";
}

// ========== Renderers ==========

function renderAll() {
  updateTopbarUser();
  applyTheme();
  const view = state.view || "dashboard";

  $$(".nav-item").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === view)
  );

  if (view === "dashboard") renderDashboard();
  else if (view === "tasks") renderTasks();
  else if (view === "habits") renderHabits();
  else if (view === "focus") renderFocus();
  else if (view === "diwan") renderDiwan();
  else if (view === "tips") renderTips();
  else if (view === "calendar") renderCalendar();
  else if (view === "study") renderStudyPlan();
  else if (view === "goals") renderGoals();
  else if (view === "profile") renderProfile();
  else if (view === "settings") renderSettings();
  else renderDashboard();
}
// ===== لوحة الإنجازات (Achievements) =====
function getAchievements(lang) {
  const totalTasks = state.tasks.length || 0;
  const completed = state.stats.completedTasks || 0;
  const focus = state.stats.focusSessions || 0;
  const streakDays = state.streak.days || 0;

  const t = (ar, en) => (lang === "ar" ? ar : en);

  return [
    {
      id: "first-task",
      unlocked: completed >= 1,
      icon: "✅",
      title: t("أول مهمة منجزة", "First task done"),
      desc: t("أكملت أول مهمة في التطبيق.", "You completed your first task.")
    },
    {
      id: "five-tasks",
      unlocked: completed >= 5,
      icon: "📝",
      title: t("5 مهام منجزة", "5 tasks completed"),
      desc: t("أنجزت 5 مهام دراسية أو يومية.", "You finished at least 5 tasks.")
    },
    {
      id: "first-focus",
      unlocked: focus >= 1,
      icon: "🎯",
      title: t("أول جلسة تركيز", "First focus session"),
      desc: t("استخدمت مؤقت التركيز لأول مرة.", "You used the focus timer at least once.")
    },
    {
      id: "three-focus",
      unlocked: focus >= 3,
      icon: "🔥",
      title: t("3 جلسات تركيز", "3 focus sessions"),
      desc: t("أنجزت 3 جلسات تركيز على الأقل.", "You completed 3 focus sessions.")
    },
    {
      id: "streak-3",
      unlocked: streakDays >= 3,
      icon: "📆",
      title: t("3 أيام ستريك متتالية", "3-day streak"),
      desc: t("استمريت 3 أيام متتالية في الدخول.", "You logged in for 3 days in a row.")
    },
    {
      id: "streak-7",
      unlocked: streakDays >= 7,
      icon: "🏆",
      title: t("7 أيام ستريك متتالية", "7-day streak"),
      desc: t("سبعة أيام استمرارية بدون انقطاع.", "You kept a 7-day streak.")
    }
  ];
}

function renderDashboard() {
  const content = document.getElementById("content");
  const lang = state.settings.language || "ar";

  const today = new Date();
  const todayStrAr = today.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const todayStrEn = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const todayTasks = state.tasks.filter((t) => t.date === todayKey());
  const doneToday = todayTasks.filter((t) => t.done).length;
  const progress =
    todayTasks.length === 0
      ? 0
      : Math.round((doneToday / todayTasks.length) * 100);

  const quote =
    QUOTES[state.settings.quoteIndex % QUOTES.length] || QUOTES[0];

  const texts = {
    title: lang === "ar" ? "مرحباً" : "Welcome",
    subtitle:
      lang === "ar"
        ? quote
        : "Every focused minute moves you closer to your goals.",
    todayLabel: lang === "ar" ? "تاريخ اليوم" : "Today",
    tasksToday: lang === "ar" ? "مهام اليوم" : "Today's Tasks",
    progressLabel: lang === "ar" ? "نسبة الإنجاز" : "Progress",
    statsTitle: lang === "ar" ? "إحصائيات سريعة" : "Quick Stats",
    totalTasks: lang === "ar" ? "إجمالي المهام" : "Total tasks",
    doneTasks: lang === "ar" ? "المهام المكتملة" : "Completed tasks",
    focusSessions:
      lang === "ar"
        ? "جلسات التركيز المنجزة"
        : "Focus sessions done",
    habitsCount: lang === "ar" ? "عدد العادات" : "Habits count",
    streakHint:
      lang === "ar"
        ? "حافظ على الستريك! 🔥 دخولك اليومي:"
        : "Keep your streak! 🔥 Your current streak:",
    noTasksToday:
      lang === "ar" ? "لا توجد مهام لليوم." : "No tasks for today.",
    addTask: lang === "ar" ? "+ إضافة مهمة" : "+ Add task",
    streakTitle:
      lang === "ar" ? "الاتجاه العام (Streak)" : "Streak trend (7 days)",
    achievementsTitle:
      lang === "ar" ? "لوحة الإنجازات" : "Achievements",
    achievementsSubtitle:
      lang === "ar"
        ? "شاهد إنجازاتك وتقدمك بشكل مبسّط."
        : "See your progress and milestones.",
    timeBlockTitle:
      lang === "ar" ? "تقسيم اليوم (Time Blocking)" : "Time Blocking",
    timeBlockSubtitle:
      lang === "ar"
        ? "قسّم يومك إلى فترات واضحة (دراسة – راحة – مشروع…)."
        : "Split your day into clear blocks (study, rest, projects…).",
    timeBlockAdd:
      lang === "ar" ? "+ إضافة فترة" : "+ Add block",
    timeBlockEmpty:
      lang === "ar"
        ? "لا توجد فترات بعد. أضف أول تقسيمة لوقتك."
        : "No time blocks yet. Add your first block.",
    notesTitle:
      lang === "ar" ? "ملاحظات اليوم (Notes Timeline)" : "Notes timeline",
    notesSubtitle:
      lang === "ar"
        ? "اكتب ملخص يومك، أفكار، أو نقاط مهمة مرّت عليك."
        : "Write your thoughts, day summary, or important points.",
    notesAdd:
      lang === "ar" ? "+ إضافة ملاحظة" : "+ Add note",
    notesEmpty:
      lang === "ar"
        ? "لا توجد ملاحظات بعد. اكتب أول ملاحظة لك اليوم."
        : "No notes yet. Write your first note."
  };

  const todayStr = lang === "ar" ? todayStrAr : todayStrEn;

  // الإنجازات
  const achievements = getAchievements(lang);
  const achievementsHTML = achievements
    .map(
      (a) => `
      <div class="achievement-item ${
        a.unlocked ? "unlocked" : "locked"
      }">
        <div class="achievement-icon ${
          a.unlocked ? "unlocked" : "locked"
        }">${a.icon}</div>
        <div>
          <div class="achievement-title">${a.title}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
      </div>
    `
    )
    .join("");

  // Time blocks
  const timeBlocks = state.timeBlocks || [];

  // Notes timeline (آخر 10 ملاحظات، الأحدث أولاً)
  const notes = (state.notes || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const notesHTML = notes
    .map((n) => {
      const d = new Date(n.createdAt);
      const dateLabel = d.toLocaleString(
        lang === "ar" ? "ar-SA" : "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit"
        }
      );
      return `
        <div class="note-item" data-id="${n.id}">
          <div class="note-meta">
            <span class="note-dot"></span>
            <span class="note-date">${dateLabel}</span>
          </div>
          <div class="note-text">${n.text}</div>
          <div class="note-actions">
            <button class="icon-btn note-edit" title="تعديل">✏️</button>
            <button class="icon-btn note-delete" title="حذف">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");

  content.innerHTML = `
    <section class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">
              ${texts.title} ${
    state.user.name || (lang === "ar" ? "صديقي" : "my friend")
  } 👋
            </div>
            <div class="card-subtitle">${texts.subtitle}</div>
          </div>
          <div class="chip">
            📅 <span>${texts.todayLabel}: ${todayStr}</span>
          </div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div>
            <div class="muted tiny">${texts.tasksToday}</div>
            <div style="font-size:24px;font-weight:600;">
              ${doneToday}/${todayTasks.length || 0}
            </div>
          </div>
          <div>
            <div class="muted tiny">${texts.progressLabel}</div>
            <div class="progress-bar">
              <div class="progress-bar-inner" style="width:${progress}%;"></div>
            </div>
            <div class="muted tiny" style="margin-top:4px;">${progress}%</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">${texts.statsTitle}</div>
        </div>
        <ul class="stats-list" style="list-style:none;padding:0;margin:0;font-size:13px;">
          <li>${texts.totalTasks}: ${state.tasks.length}</li>
          <li>${texts.doneTasks}: ${state.stats.completedTasks}</li>
          <li>${texts.focusSessions}: ${state.stats.focusSessions}</li>
          <li>${texts.habitsCount}: ${state.habits.length}</li>
        </ul>
        <div style="margin-top:10px;" class="muted tiny">
          ${texts.streakHint} ${state.streak.days || 0}
        </div>
      </div>
    </section>

    <section class="dashboard-bottom">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${texts.tasksToday}</div>
            <div class="card-subtitle">${
              lang === "ar"
                ? "أضف مهامك لليوم وابدأ من الآن."
                : "Add your tasks for today and start now."
            }</div>
          </div>
          <button class="btn primary" id="dash-add-task">${texts.addTask}</button>
        </div>
        <div class="task-list" id="dash-task-list"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">${texts.streakTitle}</div>
        </div>
        <p class="muted tiny">
          ${
            lang === "ar"
              ? "رسم بسيط يوضح قوة استمرارك خلال الأيام القادمة."
              : "A simple bar that reflects how strong your streak is."
          }
        </p>
        <div class="progress-bar" style="height:14px;">
          <div class="progress-bar-inner" style="width:${
            Math.min(state.streak.days * 10, 100)
          }%;"></div>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:16px;">
      <div class="card-header">
        <div>
          <div class="card-title">${texts.achievementsTitle}</div>
          <div class="card-subtitle">${texts.achievementsSubtitle}</div>
        </div>
      </div>
      <div class="achievements-grid">
        ${achievementsHTML}
      </div>
    </section>

    <section class="card" style="margin-top:16px;">
      <div class="card-header">
        <div>
          <div class="card-title">${texts.timeBlockTitle}</div>
          <div class="card-subtitle">${texts.timeBlockSubtitle}</div>
        </div>
        <button class="btn outline" id="timeblock-add-btn">${texts.timeBlockAdd}</button>
      </div>
      <div class="timeblocks-list" id="timeblocks-list"></div>
    </section>

    <section class="card" style="margin-top:16px;">
      <div class="card-header">
        <div>
          <div class="card-title">${texts.notesTitle}</div>
          <div class="card-subtitle">${texts.notesSubtitle}</div>
        </div>
        <button class="btn outline" id="notes-add-btn">${texts.notesAdd}</button>
      </div>
      <div class="notes-timeline" id="notes-list"></div>
    </section>
  `;

  // مهام اليوم
  const list = document.getElementById("dash-task-list");
  if (todayTasks.length === 0) {
    list.innerHTML = `<div class="muted tiny">${texts.noTasksToday}</div>`;
  } else {
    list.innerHTML = todayTasks
      .map(
        (t) => `
      <div class="task-item ${t.done ? "done" : ""}" data-id="${t.id}">
        <span class="color-dot" style="background:${
          t.color || "#6366ff"
        }"></span>
        <div class="title">${t.title}</div>
        <button class="icon-btn toggle-task">✓</button>
      </div>`
      )
      .join("");
  }

  const addBtn = document.getElementById("dash-add-task");
  if (addBtn) {
    addBtn.addEventListener("click", () => openTaskModal());
  }

  list.querySelectorAll(".toggle-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".task-item");
      if (!parent) return;
      const id = parent.dataset.id;
      toggleTask(id);
    });
  });

  // Time Blocking
  const tbList = document.getElementById("timeblocks-list");
  if (timeBlocks.length === 0) {
    tbList.innerHTML = `<div class="muted tiny">${texts.timeBlockEmpty}</div>`;
  } else {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    tbList.innerHTML = timeBlocks
      .map((b) => {
        const [fh, fm] = b.from.split(":").map(Number);
        const [th, tm] = b.to.split(":").map(Number);
        const fromTotal = fh * 60 + fm;
        const toTotal = th * 60 + tm;
        const isNow =
          currentMinutes >= fromTotal && currentMinutes <= toTotal;

        return `
          <div class="timeblock-item ${isNow ? "current-block" : ""}" data-id="${b.id}">
            <div>
              <div class="timeblock-time">${b.from} - ${b.to}</div>
              <div class="timeblock-label">${b.label}</div>
            </div>
            <div class="timeblock-actions">
              <button class="icon-btn tb-edit" title="تعديل">✏️</button>
              <button class="icon-btn tb-delete" title="حذف">🗑️</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const tbAddBtn = document.getElementById("timeblock-add-btn");
  if (tbAddBtn) {
    tbAddBtn.addEventListener("click", () => openTimeBlockModal());
  }

  tbList.querySelectorAll(".tb-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".timeblock-item");
      if (!parent) return;
      const id = parent.dataset.id;
      deleteTimeBlock(id);
    });
  });

  tbList.querySelectorAll(".tb-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".timeblock-item");
      if (!parent) return;
      const id = parent.dataset.id;
      const block = (state.timeBlocks || []).find((b) => b.id === id);
      if (block) {
        openTimeBlockModal(block);
      }
    });
  });

  // Notes Timeline
  const notesList = document.getElementById("notes-list");
  if (notes.length === 0) {
    notesList.innerHTML = `<div class="muted tiny">${texts.notesEmpty}</div>`;
  } else {
    notesList.innerHTML = notesHTML;
  }

  const notesAddBtn = document.getElementById("notes-add-btn");
  if (notesAddBtn) {
    notesAddBtn.addEventListener("click", () => openNoteModal());
  }

  notesList.querySelectorAll(".note-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".note-item");
      if (!parent) return;
      const id = parent.dataset.id;
      deleteNote(id);
    });
  });

  notesList.querySelectorAll(".note-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".note-item");
      if (!parent) return;
      const id = parent.dataset.id;
      const note = (state.notes || []).find((n) => n.id === id);
      if (note) {
        openNoteModal(note);
      }
    });
  });
}


function renderTasks() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">كل المهام</div>
          <div class="card-subtitle">إدارة مهامك اليومية والأسبوعية.</div>
        </div>
        <button class="btn primary" id="tasks-add-btn">+ إضافة مهمة</button>
      </div>
      <div class="task-list" id="tasks-list"></div>
    </section>
  `;

  const list = $("#tasks-list");
  if (state.tasks.length === 0) {
    list.innerHTML = `<div class="muted tiny">لا توجد مهام بعد.</div>`;
  } else {
    list.innerHTML = state.tasks
      .map(
        (t) => `
      <div class="task-item ${t.done ? "done" : ""}" data-id="${t.id}">
        <span class="color-dot" style="background:${
          t.color || "#6366ff"
        }"></span>
        <div class="title">
          ${t.title}
          <div class="muted tiny">${
            t.date === todayKey() ? "اليوم" : t.date || "بدون تاريخ"
          }</div>
        </div>
        <button class="icon-btn toggle-task">✓</button>
      </div>`
      )
      .join("");
  }

  $("#tasks-add-btn").addEventListener("click", () => openTaskModal());
  list.querySelectorAll(".toggle-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".task-item");
      const id = parent.dataset.id;
      toggleTask(id);
    });
  });
}

function renderHabits() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">العادات اليومية</div>
          <div class="card-subtitle">ابنِ عادات صغيرة ترفع مستواك.</div>
        </div>
        <button class="btn primary" id="habits-add-btn">+ إضافة عادة</button>
      </div>
      <div class="task-list" id="habits-list"></div>
    </section>
  `;

  const list = $("#habits-list");
  if (state.habits.length === 0) {
    list.innerHTML = `
      <div class="muted tiny">لا توجد عادات بعد. جرّب:
        <ul class="muted tiny" style="margin-top:4px;">
          <li>قراءة 10 صفحات</li>
          <li>مذاكرة 30 دقيقة</li>
          <li>رياضة خفيفة 15 دقيقة</li>
        </ul>
      </div>`;
  } else {
    list.innerHTML = state.habits
      .map(
        (h) => `
      <div class="task-item" data-id="${h.id}">
        <span class="color-dot" style="background:${h.color || "#22c55e"}"></span>
        <div class="title">
          ${h.title}
          <div class="muted tiny">عادة يومية</div>
        </div>
      </div>`
      )
      .join("");
  }

  $("#habits-add-btn").addEventListener("click", () => openHabitModal());
}
function renderFocus() {
  const content = $("#content");

  content.innerHTML = `
    <section class="card pomodoro-card">
      <header class="card-header">
        <h2>⏳ مؤقت المذاكرة (Pomodoro)</h2>
        <span id="pomodoro-phase-label">جاهز للبدء</span>
      </header>

      <div class="pomodoro-body">
        <div class="pomodoro-time" id="pomodoro-time-display">
          25:00
        </div>

        <div class="pomodoro-controls">
          <button id="pomodoro-start-btn" class="btn primary">ابدأ / استأنف</button>
          <button id="pomodoro-pause-btn" class="btn ghost">إيقاف مؤقت</button>
          <button id="pomodoro-reset-btn" class="btn danger">إعادة</button>
        </div>

        <p class="pomodoro-hint">
          النظام: 25 دقيقة تركيز 🔥 ثم 5 دقائق راحة 😌 – بعد 4 جلسات تركيز، راحة طويلة.
        </p>
      </div>
    </section>
  `;
}

function renderFocus() {
  const content = $("#content");
  const remaining = state.timers.focus.remaining || 0;
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");

  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">جلسة تركيز (Pomodoro)</div>
          <div class="card-subtitle">اختر مدة الجلسة وابدأ، وبعدها خذ راحة قصيرة.</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:10px;">
        <div id="focus-phase-label" class="muted tiny">جاهز للانطلاق</div>
        <div class="timer-display" id="focus-timer-display">${m}:${s}</div>
        <div class="timer-controls">
          <button class="btn primary" id="focus-25">25 دقيقة</button>
          <button class="btn outline" id="focus-50">50 دقيقة</button>
          <button class="btn outline" id="focus-custom">مخصص</button>
          <button class="btn outline" id="focus-stop">إيقاف</button>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:16px;">
      <div class="card-header">
        <div class="card-title">مؤقت التنفس (Breathing)</div>
      </div>
      <p class="muted tiny">
        استخدمه لما تحس بتشتت أو توتر: شهيق 4 ثواني – حبس 4 ثواني – زفير 4 ثواني.
      </p>
      <div style="text-align:center;">
        <div class="breathing-circle">
          <span id="breathing-label">اضغط ابدأ</span>
        </div>
        <div class="timer-controls" style="justify-content:center;">
          <button class="btn outline" id="breath-start">ابدأ التنفس</button>
          <button class="btn outline" id="breath-stop">إيقاف</button>
        </div>
      </div>
    </section>
  `;

  $("#focus-25").addEventListener("click", () => startFocusTimer(25));
  $("#focus-50").addEventListener("click", () => startFocusTimer(50));
  $("#focus-custom").addEventListener("click", () => {
    const mins = Number(prompt("كم دقيقة تركّز؟", "30")) || 30;
    startFocusTimer(mins);
  });
  $("#focus-stop").addEventListener("click", stopFocusTimer);

  $("#breath-start").addEventListener("click", startBreathing);
  $("#breath-stop").addEventListener("click", stopBreathing);
}

function renderDiwan() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">الديوان</div>
          <div class="card-subtitle">اختيار خفيف من الدواوين والقصائد.</div>
        </div>
      </div>
      <div class="poet-grid">
        ${POETS.map(
          (p, idx) => `
          <div class="card" data-poet-index="${idx}">
            <div class="poet-card-header">
              <div class="poet-avatar">${p.avatarText}</div>
              <div>
                <div>${p.name}</div>
                <div class="muted tiny">${p.tag}</div>
              </div>
            </div>
            <ol class="muted tiny">
              ${p.poems.map((poem) => `<li>${poem}</li>`).join("")}
            </ol>
          </div>`
        ).join("")}
      </div>
    </section>
  `;
}

function renderTips() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div class="card-title">دلائل ونصائح للطالب</div>
      </div>
      <div class="task-list">
        <div class="card" style="background:#022c22;">
          <div class="card-title" style="font-size:15px;">كيف ترفع الدوبامين الصحي؟</div>
          <ul class="tiny" style="margin-top:6px;">
            <li>نوم منتظم 7–8 ساعات.</li>
            <li>رياضة خفيفة 20–30 دقيقة.</li>
            <li>تقليل السكر والوجبات الثقيلة قبل المذاكرة.</li>
            <li>جلسات تركيز قصيرة (Pomodoro) بدل ضغط مستمر.</li>
          </ul>
        </div>
        <div class="card">
          <div class="card-title" style="font-size:15px;">نصائح لاختيار المواد وترتيب الجدول</div>
          <ul class="tiny">
            <li>ابدأ بالمواد الصعبة في بداية اليوم أو بعد القهوة.</li>
            <li>وزّع المهام بدل ما تجمعها في يوم واحد.</li>
            <li>خلّ يوم مراجعة أسبوعي ثابت.</li>
          </ul>
        </div>
        <div class="card">
          <div class="card-title" style="font-size:15px;">تقنيات مذاكرة سريعة</div>
          <ul class="tiny">
            <li>استخدم طريقة Feynman: اشرح المعلومة بصوت عالي وكأنك تدرّسها.</li>
            <li>استبدل التلخيص الطويل بأسئلة وأجوبة قصيرة.</li>
            <li>بعد كل جلسة، اكتب سطر واحد: أهم شيء فهمته.</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

function renderCalendar() {
  const content = $("#content");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();
  const startDay = first.getDay(); // 0-6

  const cells = [];
  const todayNum = now.getDate();

  for (let i = 0; i < startDay; i++) {
    cells.push(`<div></div>`);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === todayNum;
    cells.push(
      `<div class="calendar-day ${
        isToday ? "today" : ""
      }">${d}</div>`
    );
  }

  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div class="card-title">
          التقويم – ${now.toLocaleDateString("ar-SA", {
            month: "long",
            year: "numeric"
          })}
        </div>
      </div>
      <div class="calendar-grid">
        <div class="muted tiny">ح</div>
        <div class="muted tiny">ن</div>
        <div class="muted tiny">ث</div>
        <div class="muted tiny">ر</div>
        <div class="muted tiny">خ</div>
        <div class="muted tiny">ج</div>
        <div class="muted tiny">س</div>
        ${cells.join("")}
      </div>
    </section>
  `;
}

function renderStudyPlan() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div class="card-title">خطة الطالب</div>
      </div>
      <p class="muted tiny">
        هنا تقدر تكتب مخطط أسبوعك الدراسي (أيام × مواد × ساعات).
      </p>
      <textarea id="study-plan-text" placeholder="مثال:
الأحد: رياضيات - 1 ساعة، برمجة - 2 ساعة
الاثنين: فيزياء - 1 ساعة، إنجليزي - 1 ساعة
..."></textarea>
    </section>
  `;

  const textarea = $("#study-plan-text");
  textarea.value = state.studyPlan || "";
  textarea.addEventListener("input", () => {
    state.studyPlan = textarea.value;
    saveState();
  });
}

function renderGoals() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">الأهداف</div>
          <div class="card-subtitle">أهداف شهرية وسنوية.</div>
        </div>
        <button class="btn primary" id="goals-add-btn">+ إضافة هدف</button>
      </div>
      <div class="task-list" id="goals-list"></div>
    </section>
  `;

  const list = $("#goals-list");
  if (state.goals.length === 0) {
    list.innerHTML = `<div class="muted tiny">لا توجد أهداف بعد.</div>`;
  } else {
    list.innerHTML = state.goals
      .map(
        (g, idx) => `
      <div class="task-item">
        <div class="title">
          ${g.title}
          <div class="muted tiny">
            النوع: ${g.type === "yearly" ? "سنوي" : "شهري"} – حتى ${g.targetDate ||
          "غير محدد"}
          </div>
        </div>
      </div>`
      )
      .join("");
  }

  $("#goals-add-btn").addEventListener("click", () => openGoalModal());
}


function renderProfile() {
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div class="card-title">البروفايل</div>
      </div>
      <div class="row">
        <div>
          <label>الاسم الكامل
            <input type="text" id="profile-name" value="${state.user.name || ""}" />
          </label>
          <label>المرحلة
            <select id="profile-stage">
              <option value="">اختر المرحلة</option>
              <option value="highschool" ${
                state.user.stage === "highschool" ? "selected" : ""
              }>ثانوي</option>
              <option value="foundation" ${
                state.user.stage === "foundation" ? "selected" : ""
              }>سنة تحضيرية</option>
              <option value="university" ${
                state.user.stage === "university" ? "selected" : ""
              }>جامعة</option>
              <option value="other" ${
                state.user.stage === "other" ? "selected" : ""
              }>أخرى</option>
            </select>
          </label>
          <label>التخصص (إن وجد)
            <input type="text" id="profile-major" value="${
              state.user.major || ""
            }" />
          </label>
        </div>
        <div>
          <label>الجنس
            <select id="profile-gender">
              <option value="">غير محدد</option>
              <option value="male" ${
                state.user.gender === "male" ? "selected" : ""
              }>ذكر</option>
              <option value="female" ${
                state.user.gender === "female" ? "selected" : ""
              }>أنثى</option>
            </select>
          </label>
          <label>نبذة عنك
            <textarea id="profile-bio">${
              state.user.bio || ""
            }</textarea>
          </label>
          <label>البريد الإلكتروني
            <input type="email" id="profile-email" value="${
              state.user.email || ""
            }" />
          </label>
        </div>
      </div>
      <button class="btn primary" id="profile-save" style="margin-top:12px;">حفظ البروفايل</button>
    </section>
  `;

  $("#profile-save").addEventListener("click", () => {
    state.user.name = $("#profile-name").value.trim();
    state.user.stage = $("#profile-stage").value;
    state.user.major = $("#profile-major").value.trim();
    state.user.gender = $("#profile-gender").value;
    state.user.bio = $("#profile-bio").value.trim();
    state.user.email = $("#profile-email").value.trim();
    saveState();
    updateTopbarUser();
    showSnackbar("تم حفظ البروفايل ✅");
  });
}

function renderSettings() { 
  const content = $("#content");
  content.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div class="card-title">الإعدادات</div>
      </div>
      <div class="task-list">
        <div class="task-item">
          <div class="title">
            الثيم
            <div class="muted tiny">داكن / فاتح</div>
          </div>
          <button class="btn outline" id="settings-theme-toggle">
            ${state.settings.theme === "dark" ? "فاتح" : "داكن"}
          </button>
        </div>
        <div class="task-item">
          <div class="title">
            إعادة تعيين البيانات
            <div class="muted tiny">يحذف كل المهام والعادات والأهداف (انتبه!).</div>
          </div>
          <button class="btn outline" id="settings-reset">إعادة ضبط</button>
        </div>
      </div>
    </section>
  `;

  $("#settings-theme-toggle").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveState();
    renderAll();
  });

  $("#settings-reset").addEventListener("click", () => {
    if (confirm("متأكد إنك تبي تعيد تعيين كل شيء؟")) {
      localStorage.removeItem(STORAGE_KEY);
      state = structuredClone(DEFAULT_STATE);
      updateStreak();
      saveState();
      showAuthIfNeeded();
      renderAll();
    }
  });
}


// ========== Modals Logic ==========

function openTaskModal() {
  const today = todayKey();
  openModal(
    "إضافة مهمة",
    `
    <form id="task-form">
      <label>عنوان المهمة
        <input type="text" id="task-title" required />
      </label>
      <label>تاريخ المهمة
        <input type="date" id="task-date" value="${today}" />
      </label>
      <label>لون المهمة
        <input type="color" id="task-color" value="#6366ff" />
      </label>
      <button type="submit" class="btn primary full" style="margin-top:12px;">حفظ المهمة</button>
    </form>
  `,
    () => {
      $("#task-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const title = $("#task-title").value.trim();
        if (!title) return;
        const date = $("#task-date").value || today;
        const color = $("#task-color").value || "#6366ff";
        const id = Date.now().toString();
        state.tasks.push({ id, title, date, color, done: false });
        saveState();
        closeModal();
        renderAll();
      });
    }
  );
}

function openHabitModal() {
  openModal(
    "إضافة عادة",
    `
    <form id="habit-form">
      <label>اسم العادة
        <input type="text" id="habit-title" required />
      </label>
      <label>لون العادة
        <input type="color" id="habit-color" value="#22c55e" />
      </label>
      <button type="submit" class="btn primary full" style="margin-top:12px;">حفظ العادة</button>
    </form>
  `,
    () => {
      $("#habit-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const title = $("#habit-title").value.trim();
        if (!title) return;
        const color = $("#habit-color").value || "#22c55e";
        const id = Date.now().toString();
        state.habits.push({ id, title, color });
        saveState();
        closeModal();
        renderAll();
      });
    }
  );
}

function openGoalModal() {
  openModal(
    "إضافة هدف",
    `
    <form id="goal-form">
      <label>عنوان الهدف
        <input type="text" id="goal-title" required />
      </label>
      <label>نوع الهدف
        <select id="goal-type">
          <option value="monthly">شهري</option>
          <option value="yearly">سنوي</option>
        </select>
      </label>
      <label>تاريخ الإنجاز المستهدف
        <input type="date" id="goal-date" />
      </label>
      <button type="submit" class="btn primary full" style="margin-top:12px;">حفظ الهدف</button>
    </form>
  `,
    () => {
      $("#goal-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const title = $("#goal-title").value.trim();
        if (!title) return;
        const type = $("#goal-type").value;
        const targetDate = $("#goal-date").value;
        state.goals.push({ title, type, targetDate });
        saveState();
        closeModal();
        renderGoals();
      });
    }
  );
}



function openTimeBlockModal(existingBlock) {
  const lang = state.settings.language || "ar";
  const t = (ar, en) => (lang === "ar" ? ar : en);

  const isEdit = !!existingBlock;

  openModal(
    isEdit
      ? t("تعديل فترة", "Edit time block")
      : t("إضافة فترة في اليوم", "Add a time block"),
    `
    <form id="timeblock-form">
      <label>${t("من الساعة", "From")}
        <input type="time" id="tb-from" required value="${existingBlock ? existingBlock.from : ""}" />
      </label>
      <label>${t("إلى الساعة", "To")}
        <input type="time" id="tb-to" required value="${existingBlock ? existingBlock.to : ""}" />
      </label>
      <label>${t("الوصف (مثال: مذاكرة برمجة)", "Label (e.g. Study Programming)")}
        <input type="text" id="tb-label" required value="${existingBlock ? existingBlock.label.replace(/"/g, "&quot;") : ""}" />
      </label>
      <button type="submit" class="btn primary full" style="margin-top:12px;">
        ${
          isEdit
            ? t("حفظ التعديل", "Save changes")
            : t("حفظ الفترة", "Save block")
        }
      </button>
    </form>
    `,
    () => {
      const form = document.getElementById("timeblock-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const from = document.getElementById("tb-from").value;
        const to = document.getElementById("tb-to").value;
        const label = document.getElementById("tb-label").value.trim();
        if (!from || !to || !label) return;

        if (!state.timeBlocks) state.timeBlocks = [];

        if (isEdit) {
          // تعديل
          const idx = state.timeBlocks.findIndex(
            (b) => b.id === existingBlock.id
          );
          if (idx !== -1) {
            state.timeBlocks[idx] = {
              ...state.timeBlocks[idx],
              from,
              to,
              label
            };
          }
        } else {
          // إضافة جديدة
          state.timeBlocks.push({
            id: Date.now().toString(),
            from,
            to,
            label
          });
        }

        saveState();
        closeModal();
        renderDashboard();
      });
    }
  );
}

function deleteTimeBlock(id) {
  if (!state.timeBlocks) return;
  state.timeBlocks = state.timeBlocks.filter((b) => b.id !== id);
  saveState();
  renderDashboard();
}


// ========== Tasks Helpers ==========

function toggleTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) state.stats.completedTasks += 1;
  saveState();
  renderAll();
}

// ========== Focus Timer Logic ==========

function updateFocusDisplay() {
  const remaining = state.timers.focus.remaining || 0;
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  const el = $("#focus-timer-display");
  if (el) el.textContent = `${m}:${s}`;
}

function startFocusTimer(minutes) {
  if (focusInterval) clearInterval(focusInterval);
  state.timers.focus.total = minutes * 60;
  state.timers.focus.remaining = minutes * 60;
  state.timers.focus.running = true;
  saveState();
  updateFocusDisplay();

  const label = $("#focus-phase-label");
  if (label) label.textContent = `جلسة تركيز لمدة ${minutes} دقيقة`;

  focusInterval = setInterval(() => {
    if (state.timers.focus.remaining <= 0) {
      clearInterval(focusInterval);
      state.timers.focus.running = false;
      state.stats.focusSessions += 1;
      saveState();
      updateFocusDisplay();
      showSnackbar("تم إنجاز جلسة التركيز 💪");
      return;
    }
    state.timers.focus.remaining -= 1;
    updateFocusDisplay();
  }, 1000);
}

function stopFocusTimer() {
  if (focusInterval) clearInterval(focusInterval);
  state.timers.focus.running = false;
  state.timers.focus.remaining = 0;
  saveState();
  updateFocusDisplay();
  const label = $("#focus-phase-label");
  if (label) label.textContent = "تم إيقاف المؤقت";
}

// ========== Breathing Timer ==========

function startBreathing() {
  if (breathingInterval) clearInterval(breathingInterval);
  const steps = ["شهيق 5 ثواني", "حبس النفس 5 ثواني", "زفير 5 ثواني"];
  let idx = 0;
  const label = $("#breathing-label");
  if (!label) return;
  label.textContent = steps[idx];
  breathingInterval = setInterval(() => {
    idx = (idx + 1) % steps.length;
    label.textContent = steps[idx];
  }, 4000);
}

function stopBreathing() {
  if (breathingInterval) clearInterval(breathingInterval);
  const label = $("#breathing-label");
  if (button) button.textContent = "اضغط ابدأ";
}


// ========== Event Listeners & Init ==========

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateStreak();
  saveState();
 initDailyQuote();
 applyLanguage();
 
  // Auth overlay logic
  $("#auth-stage").addEventListener("change", () => {
    const val = $("#auth-stage").value;
    const wrapper = $("#auth-major-wrapper");
    if (val === "university") wrapper.classList.remove("hidden");
    else wrapper.classList.add("hidden");
  });

  $("#auth-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.user.name = $("#auth-name").value.trim();
    state.user.stage = $("#auth-stage").value;
    state.user.major = $("#auth-major").value.trim();
    state.user.email = $("#auth-email").value.trim();
    // كلمة المرور نخزنها لو حاب، بس هنا ما نستخدمها فعليًا
    state.user.password = $("#auth-password").value;
    saveState();
    $("#auth-overlay").classList.add("hidden");
    renderAll();
  });

  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  // Nav buttons
  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      saveState();
      renderAll();
    });
  });

  // FAB: يضيف مهمة حسب الوضع الحالي
  $("#fab-btn").addEventListener("click", () => {
    if (state.view === "habits") openHabitModal();
    else if (state.view === "goals") openGoalModal();
    else openTaskModal();
  });

  // Theme toggle في الأعلى
  $("#theme-toggle").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });

  // تغيير اللغة   عند الضغط على AR 
 const langBtn = document.getElementById("lang-toggle");

if (langBtn) {
  langBtn.addEventListener("click", () => {
    // بدّل بين ar و en
    state.settings.language =
      state.settings.language === "en" ? "ar" : "en";

    saveState();
    applyLanguage();   // نحدّث النصوص
    renderAll();       // نرسم الواجهة من جديد
  });
}


// =======================
// Pomodoro Timer
// =======================

const pomodoroConfig = {
  focus: 25 * 60,        // 25 دقيقة تركيز
  shortBreak: 5 * 60,    // 5 دقائق راحة قصيرة
  longBreak: 15 * 60,    // 15 دقيقة راحة طويلة
  cyclesBeforeLong: 4
};

let pomodoroState = {
  phase: "idle",          // idle | focus | shortBreak | longBreak
  remaining: pomodoroConfig.focus,
  completedFocus: 0,
  intervalId: null
};

const pomodoroTimeEl = document.getElementById("pomodoro-time-display");
const pomodoroPhaseEl = document.getElementById("pomodoro-phase-label");
const pomodoroStartBtn = document.getElementById("pomodoro-start-btn");
const pomodoroPauseBtn = document.getElementById("pomodoro-pause-btn");
const pomodoroResetBtn = document.getElementById("pomodoro-reset-btn");

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updatePomodoroUI() {
  if (pomodoroTimeEl) {
    pomodoroTimeEl.textContent = formatTime(pomodoroState.remaining);
  }

  if (pomodoroPhaseEl) {
    let label = "";
    switch (pomodoroState.phase) {
      case "focus":
        label = "جلسة تركيز 🔥";
        break;
      case "shortBreak":
        label = "استراحة قصيرة 😌";
        break;
      case "longBreak":
        label = "استراحة طويلة 😴";
        break;
      default:
        label = "جاهز للبدء";
    }
    pomodoroPhaseEl.textContent = label;
  }
}

function switchPomodoroPhase(nextPhase) {
  pomodoroState.phase = nextPhase;
  if (nextPhase === "focus") {
    pomodoroState.remaining = pomodoroConfig.focus;
  } else if (nextPhase === "shortBreak") {
    pomodoroState.remaining = pomodoroConfig.shortBreak;
  } else if (nextPhase === "longBreak") {
    pomodoroState.remaining = pomodoroConfig.longBreak;
  }
  updatePomodoroUI();
}

function startPomodoro() {
  // لو أول مرة أو بعد إعادة، نبدأ تركيز
  if (pomodoroState.phase === "idle") {
    switchPomodoroPhase("focus");
  }

  if (pomodoroState.intervalId) return; // شغال أصلاً

  pomodoroState.intervalId = setInterval(() => {
    pomodoroState.remaining -= 1;
    if (pomodoroState.remaining <= 0) {
      handlePomodoroEnd();
    }
    updatePomodoroUI();
  }, 1000);
}

function pausePomodoro() {
  if (pomodoroState.intervalId) {
    clearInterval(pomodoroState.intervalId);
    pomodoroState.intervalId = null;
  }
}

function resetPomodoro() {
  pausePomodoro();
  pomodoroState.phase = "idle";
  pomodoroState.remaining = pomodoroConfig.focus;
  updatePomodoroUI();
}

function handlePomodoroEnd() {
  pausePomodoro();

  if (pomodoroState.phase === "focus") {
    pomodoroState.completedFocus += 1;
    showSnackbar("👏 تم إنجاز جلسة تركيز! خذ استراحة مستحقة.");

    // بعد 4 جلسات تركيز → راحة طويلة
    if (pomodoroState.completedFocus % pomodoroConfig.cyclesBeforeLong === 0) {
      switchPomodoroPhase("longBreak");
    } else {
      switchPomodoroPhase("shortBreak");
    }
  } else {
    // أي استراحة → نرجع تركيز
    showSnackbar("عدنا للتركيز 💪");
    switchPomodoroPhase("focus");
  }

  startPomodoro(); // نكمّل تلقائيًا للمرحلة اللي بعدها
}

// Snackbar بسيط (لو ما هو موجود عندك)
function showSnackbar(message) {
  const bar = document.getElementById("snackbar");
  if (!bar) {
    alert(message);
    return;
  }
  bar.textContent = message;
  bar.classList.add("show");
  setTimeout(() => bar.classList.remove("show"), 3300);
}

// ربط الأزرار
if (pomodoroStartBtn) {
  pomodoroStartBtn.addEventListener("click", startPomodoro);
}
if (pomodoroPauseBtn) {
  pomodoroPauseBtn.addEventListener("click", pausePomodoro);
}
if (pomodoroResetBtn) {
  pomodoroResetBtn.addEventListener("click", resetPomodoro);
}

// أول تحديث للواجهة
updatePomodoroUI();

  showAuthIfNeeded();
  renderAll();
});
// تشغيل اقتباس اليوم بعد تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  initDailyQuote();
});
function applyLanguage() {
  const lang = state.settings.language || "ar";

  // زر اللغة نفسه
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = lang === "ar" ? "AR" : "EN";
  }

  // اتجاه الصفحة
  const root = document.documentElement;
  if (lang === "ar") {
    root.setAttribute("lang", "ar");
    root.setAttribute("dir", "rtl");
  } else {
    root.setAttribute("lang", "en");
    root.setAttribute("dir", "ltr");
  }

  // أسماء العناصر في القائمة الجانبية
  const navLabels = {
    dashboard: { ar: "الرئيسية", en: "Home" },
    tasks:     { ar: "المهام",   en: "Tasks" },
    habits:    { ar: "العادات",  en: "Habits" },
    focus:     { ar: "التركيز",  en: "Focus" },
    diwan:     { ar: "الديوان",  en: "Poems" },
    tips:      { ar: "نصائح الطالب", en: "Student Tips" },
    calendar:  { ar: "التقويم",  en: "Calendar" },
    study:     { ar: "خطة الطالب", en: "Study Plan" },
    goals:     { ar: "الأهداف",  en: "Goals" },
    profile:   { ar: "البروفايل", en: "Profile" },
    settings:  { ar: "الإعدادات", en: "Settings" },
  };

  const navIcons = {
    dashboard: "🏠 ",
    tasks:     "📝 ",
    habits:    "🔁 ",
    focus:     "🎯 ",
    diwan:     "📚 ",
    tips:      "💡 ",
    calendar:  "📅 ",
    study:     "📘 ",
    goals:     "🎖️ ",
    profile:   "👤 ",
    settings:  "⚙️ ",
  };

  document.querySelectorAll(".nav-item").forEach((btn) => {
    const view = btn.dataset.view;
    if (navLabels[view]) {
      btn.textContent = navIcons[view] + navLabels[view][lang];
    }
  });
}
