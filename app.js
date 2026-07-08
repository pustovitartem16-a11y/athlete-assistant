const STORAGE_KEY = "athlete-assistant-profile";
const FEEDBACK_KEY = "athlete-assistant-feedback";

const DEFAULT_PROFILE = {
  name: "Спортсмен",
  age: "28",
  sex: "male",
  city: "",
  height: "180",
  weight: "78",
  targetWeight: "",
  targetDate: "",
  goal: "Поддержание формы",
  priority: "Баланс формы и здоровья",
  sessions: "4",
  sessionMinutes: "60",
  trainingDays: "Пн, Ср, Пт, Сб",
  sport: "Тренажерный зал",
  level: "Средний",
  experience: "6-12 месяцев",
  equipment: "Тренажерный зал",
  injuries: "",
  sleepGoal: "8",
  stressLevel: "Средний",
  mealCount: "4",
  budget: "Средний",
  dietType: "Без ограничений",
  favoriteFoods: "",
  avoidFoods: "",
  availableProducts: "",
  foodNotes: "",
  trainingNotes: "",
};

const state = {
  profile: readStorage(STORAGE_KEY),
  feedback: readStorage(FEEDBACK_KEY) || [],
  view: "dashboard",
  effort: "normal",
};

const app = document.querySelector("#app");

const icons = {
  dashboard: `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  meals: `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 3v18M10 3v8a4 4 0 0 1-8 0V3M17 3v18M17 3c3 2 4.5 5 4.5 9H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  training: `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M3 9v6M21 9v6M7 7v10M17 7v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  advice: `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3a7 7 0 0 0-4 12.75V19h8v-3.25A7 7 0 0 0 12 3Zm-3 18h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  profile: `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};

const mealTemplates = {
  breakfast: [
    ["Овсянка", "70 г"],
    ["Греческий йогурт", "180 г"],
    ["Банан", "120 г"],
    ["Орехи", "15 г"],
  ],
  lunch: [
    ["Куриная грудка", "170 г"],
    ["Рис или гречка", "90 г сухого продукта"],
    ["Овощи", "250 г"],
    ["Оливковое масло", "10 г"],
  ],
  snack: [
    ["Творог", "200 г"],
    ["Ягоды", "120 г"],
    ["Мед", "10 г"],
    ["Хлебцы", "2 шт"],
  ],
  dinner: [
    ["Лосось или индейка", "160 г"],
    ["Картофель", "230 г"],
    ["Салат", "250 г"],
    ["Авокадо", "60 г"],
  ],
};

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function currentProfile() {
  return { ...DEFAULT_PROFILE, ...(state.profile || {}) };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

function optionList(options, selectedValue) {
  return options
    .map((option) => {
      const value = Array.isArray(option) ? option[0] : option;
      const label = Array.isArray(option) ? option[1] : option;
      return `<option value="${escapeHtml(value)}" ${selectedValue === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function compactNumber(value, digits = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return parsed % 1 === 0 ? String(parsed) : parsed.toFixed(digits);
}

function numberValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getInitials(name = "A") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function estimatePlan(profile) {
  const weight = numberValue(profile.weight, 75);
  const height = numberValue(profile.height, 178);
  const age = numberValue(profile.age, 28);
  const sessions = numberValue(profile.sessions, 4);
  const sessionMinutes = numberValue(profile.sessionMinutes, 60);
  const sleepGoal = numberValue(profile.sleepGoal, 8);
  const sexFactor = profile.sex === "female" ? -161 : 5;
  const base = 10 * weight + 6.25 * height - 5 * age + sexFactor;
  const activity =
    sessions >= 5 || sessionMinutes >= 85 ? 1.62 : sessions >= 3 ? 1.48 : 1.34;
  const goalShift =
    profile.goal === "Похудение"
      ? -330
      : profile.goal === "Набор массы"
        ? 280
        : profile.goal === "Выносливость"
          ? 120
          : profile.goal === "Сила"
            ? 160
          : 0;
  const calories = Math.max(1700, Math.round((base * activity + goalShift) / 10) * 10);
  const proteinFactor =
    profile.goal === "Набор массы" || profile.goal === "Сила"
      ? 2
      : profile.goal === "Похудение"
        ? 1.9
        : 1.75;
  const protein = Math.round(weight * proteinFactor);
  const fat = Math.round(weight * 0.85);
  const carbs = Math.max(130, Math.round((calories - protein * 4 - fat * 9) / 4));
  const trainingWater = sessionMinutes >= 75 ? 0.5 : 0.35;

  return {
    calories,
    protein,
    fat,
    carbs,
    water: Math.max(2.1, Math.round((weight * 0.035 + trainingWater) * 10) / 10),
    sessions,
    sessionMinutes,
    sleepGoal,
  };
}

function getTargetPlan(profile) {
  const weight = numberValue(profile.weight, 78);
  const target = Number(profile.targetWeight);
  const dateValue = profile.targetDate ? new Date(`${profile.targetDate}T12:00:00`) : null;
  const today = new Date();
  const hasTarget = Number.isFinite(target) && target > 0;
  const daysLeft =
    dateValue && dateValue > today
      ? Math.max(1, Math.ceil((dateValue - today) / 86400000))
      : null;
  const delta = hasTarget ? Math.round((target - weight) * 10) / 10 : 0;
  const weeklyPace = hasTarget && daysLeft ? Math.abs(delta) / (daysLeft / 7) : null;

  return {
    hasTarget,
    target,
    delta,
    daysLeft,
    weeklyPace,
    direction: delta < 0 ? "снизить" : delta > 0 ? "набрать" : "удержать",
  };
}

function getReadiness(profile) {
  const last = state.feedback.at(-1);
  const sleepGoal = numberValue(profile.sleepGoal, 8);
  const stressPenalty = profile.stressLevel === "Высокий" ? 12 : profile.stressLevel === "Низкий" ? -4 : 4;
  const effortPenalty = last?.effort === "hard" ? 14 : last?.effort === "easy" ? -6 : 3;
  const energy = numberValue(last?.energy, 7);
  const score = Math.max(42, Math.min(96, Math.round(68 + energy * 3 - stressPenalty - effortPenalty + (sleepGoal >= 8 ? 4 : 0))));
  const label = score >= 82 ? "можно прогрессировать" : score >= 64 ? "держим план" : "лучше снизить объем";

  return { score, label, last };
}

function getMealTiming(profile) {
  const count = numberValue(profile.mealCount, 4);
  const fourMeals = [
    ["Завтрак", "08:00"],
    ["Обед", "13:00"],
    ["Перекус", "16:30"],
    ["Ужин", "20:00"],
  ];
  if (count <= 3) return fourMeals.filter((meal) => meal[0] !== "Перекус");
  if (count >= 5) return [...fourMeals, ["Поздний белок", "21:30"]];
  return fourMeals;
}

function getDailyFocus(profile, plan, readiness) {
  if (profile.injuries.trim()) return "Техника и контроль боли";
  if (readiness.score < 64) return "Восстановление и легкий объем";
  if (profile.goal === "Похудение") return `Держать ${plan.protein} г белка и шаги`;
  if (profile.goal === "Набор массы") return `Добрать ${plan.calories} ккал без пропусков`;
  if (profile.goal === "Выносливость") return "Пульс, дыхание и ровный темп";
  if (profile.goal === "Сила") return "Качество рабочих подходов";
  return "Ровный день без провалов";
}

function onboardingTemplate() {
  const profile = currentProfile();

  return `
    <main class="onboarding-layout">
      <section class="visual-panel" aria-label="Концепция Athlete Assistant">
        <div class="brand-lockup">
          <span class="brand-mark">${icons.training}</span>
          <span>Athlete Assistant</span>
        </div>

        <div class="visual-content">
          <div>
            <p class="section-kicker">Персональный старт</p>
            <h1>Личный план в одной ссылке</h1>
          </div>
          <p>Собери профиль, цель, питание и тренировочный ритм, чтобы каждый день видеть понятный план действий.</p>
          ${trackVisual()}
        </div>

        <div class="mini-metrics" aria-label="Пример показателей">
          <div class="mini-metric"><strong>цель</strong><span>вес и дата</span></div>
          <div class="mini-metric"><strong>план</strong><span>еда и тренировки</span></div>
          <div class="mini-metric"><strong>фидбек</strong><span>нагрузка и восстановление</span></div>
        </div>
      </section>

      <section class="form-panel">
        <div class="form-wrap">
          <p class="section-kicker">Стартовая анкета</p>
          <h2>Соберем профиль спортсмена</h2>
          <p>Чем точнее вводные, тем полезнее главный экран, питание и тренировочный план.</p>

          <form class="onboarding-card" id="profileForm">
            ${formSection(
              "Личные данные",
              `${field("name", "Имя", "text", profile.name, "Андрей", "required")}
              ${field("age", "Возраст", "number", profile.age, "28", "min='12' max='90'")}
              ${selectField("sex", "Пол", [["male", "Мужской"], ["female", "Женский"]], profile.sex)}
              ${field("city", "Город", "text", profile.city, "Киев")}
              ${field("height", "Рост, см", "number", profile.height, "180", "min='120' max='230'")}
              ${field("weight", "Текущий вес, кг", "number", profile.weight, "78", "min='35' max='220' step='0.1'")}`,
            )}

            ${formSection(
              "Цель",
              `${selectField("goal", "Основная цель", ["Похудение", "Набор массы", "Выносливость", "Сила", "Поддержание формы"], profile.goal)}
              ${field("targetWeight", "Желаемый вес, кг", "number", profile.targetWeight, "75", "min='35' max='220' step='0.1'")}
              ${field("targetDate", "Дата цели", "date", profile.targetDate, "", "")}
              ${selectField("priority", "Главный приоритет", ["Баланс формы и здоровья", "Быстрее увидеть результат", "Безопасное восстановление", "Спортивная форма к событию"], profile.priority)}
              ${selectField("level", "Уровень", ["Начинающий", "Средний", "Продвинутый"], profile.level)}
              ${selectField("experience", "Опыт тренировок", ["До 3 месяцев", "3-6 месяцев", "6-12 месяцев", "1-3 года", "3+ года"], profile.experience)}`,
            )}

            ${formSection(
              "Питание",
              `${selectField("mealCount", "Приемов пищи в день", ["3", "4", "5"], profile.mealCount)}
              ${selectField("budget", "Бюджет питания", ["Эконом", "Средний", "Свободный"], profile.budget)}
              ${selectField("dietType", "Тип питания", ["Без ограничений", "Без свинины", "Вегетарианское", "Без лактозы", "Низкоуглеводное"], profile.dietType)}
              ${textareaField("favoriteFoods", "Любимые продукты", profile.favoriteFoods, "яйца, рис, курица, творог")}
              ${textareaField("avoidFoods", "Не ем / аллергии", profile.avoidFoods, "арахис, молоко, морепродукты")}
              ${textareaField("availableProducts", "Что есть дома", profile.availableProducts, "овсянка, яйца, гречка, бананы")}`,
            )}

            ${formSection(
              "Тренировки",
              `${selectField("sport", "Вид спорта", ["Тренажерный зал", "Бег", "Футбол", "Бокс", "Плавание", "Кроссфит", "Другое"], profile.sport)}
              ${field("sessions", "Тренировок в неделю", "number", profile.sessions, "4", "min='1' max='10'")}
              ${field("sessionMinutes", "Длительность, мин", "number", profile.sessionMinutes, "60", "min='20' max='180'")}
              ${field("trainingDays", "Дни тренировок", "text", profile.trainingDays, "Пн, Ср, Пт, Сб")}
              ${selectField("equipment", "Инвентарь", ["Тренажерный зал", "Дом: гантели", "Дом: без инвентаря", "Улица / стадион", "Смешанный"], profile.equipment)}
              ${textareaField("injuries", "Травмы и ограничения", profile.injuries, "беречь колено, плечо не перегружать")}`,
            )}

            ${formSection(
              "Восстановление",
              `${field("sleepGoal", "Цель сна, часов", "number", profile.sleepGoal, "8", "min='5' max='12' step='0.5'")}
              ${selectField("stressLevel", "Стресс", ["Низкий", "Средний", "Высокий"], profile.stressLevel)}
              ${textareaField("foodNotes", "Комментарий по питанию", profile.foodNotes, "люблю простые блюда, хочу меньше сладкого")}
              ${textareaField("trainingNotes", "Комментарий по тренировкам", profile.trainingNotes, "хочу подтянуть технику приседа")}`,
            )}

            <div class="form-actions">
              <span class="caption">Анкету можно изменить в любой момент.</span>
              <button class="button button-primary" type="submit">Сохранить и открыть</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  `;
}

function field(name, label, type, value, placeholder, attrs = "") {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${attrs} />
    </label>
  `;
}

function selectField(name, label, options, value) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}">
        ${optionList(options, value)}
      </select>
    </label>
  `;
}

function textareaField(name, label, value, placeholder) {
  return `
    <label class="field field-wide">
      <span>${escapeHtml(label)}</span>
      <textarea name="${escapeHtml(name)}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value || "")}</textarea>
    </label>
  `;
}

function formSection(title, content) {
  return `
    <section class="form-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="form-grid">${content}</div>
    </section>
  `;
}

function trackVisual() {
  return `
    <svg class="track-visual" viewBox="0 0 620 376" role="img" aria-label="Схема прогресса спортсмена">
      <defs>
        <linearGradient id="trackGlow" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#20a67a" stop-opacity="0.68" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="618" height="374" rx="26" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" />
      <path d="M96 264c66-100 142-146 228-138 78 7 133 57 202-16" stroke="url(#trackGlow)" stroke-width="20" fill="none" stroke-linecap="round" />
      <path d="M96 264c66-100 142-146 228-138 78 7 133 57 202-16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7" />
      <circle cx="96" cy="264" r="16" fill="#f2b84b" />
      <circle cx="314" cy="126" r="16" fill="#20a67a" />
      <circle cx="526" cy="110" r="16" fill="#ffffff" />
      <g fill="rgba(255,255,255,.82)">
        <rect x="92" y="308" width="130" height="10" rx="5" />
        <rect x="260" y="70" width="96" height="10" rx="5" />
        <rect x="440" y="156" width="110" height="10" rx="5" />
      </g>
      <g stroke="rgba(255,255,255,.18)" stroke-width="2">
        <path d="M80 42h470" />
        <path d="M80 104h470" />
        <path d="M80 166h470" />
        <path d="M80 228h470" />
        <path d="M80 290h470" />
      </g>
    </svg>
  `;
}

function appTemplate() {
  const profile = currentProfile();
  const nav = [
    ["dashboard", "Главная", icons.dashboard],
    ["meals", "Питание", icons.meals],
    ["training", "Тренировки", icons.training],
    ["advice", "Рекомендации", icons.advice],
    ["profile", "Анкета", icons.profile],
  ];

  return `
    <div class="workspace">
      <aside class="sidebar">
        <div class="brand-lockup" style="color: var(--ink)">
          <span class="brand-mark" style="border-color: var(--line); background: #fff">${icons.training}</span>
          <span>Athlete Assistant</span>
        </div>

        <div class="profile-chip">
          <div class="avatar">${escapeHtml(getInitials(profile.name))}</div>
          <div>
            <strong>${escapeHtml(profile.name || "Спортсмен")}</strong>
            <span>${escapeHtml(profile.goal)} · ${escapeHtml(profile.level)}</span>
          </div>
        </div>

        <nav class="nav-list" aria-label="Разделы приложения">
          ${nav
            .map(
              ([id, label, icon]) => `
                <button class="nav-button ${state.view === id ? "is-active" : ""}" data-view="${id}" type="button">
                  <span class="nav-icon">${icon}</span>
                  <span>${label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
      </aside>

      <main class="main">
        ${renderView()}
      </main>
    </div>
  `;
}

function renderView() {
  if (state.view === "meals") return mealsView();
  if (state.view === "training") return trainingView();
  if (state.view === "advice") return adviceView();
  if (state.view === "profile") return profileView();
  return dashboardView();
}

function dashboardView() {
  const profile = currentProfile();
  const plan = estimatePlan(profile);
  const target = getTargetPlan(profile);
  const readiness = getReadiness(profile);
  const focus = getDailyFocus(profile, plan, readiness);
  const caloriesLeft = Math.round(plan.calories * 0.58);
  const proteinLeft = Math.round(plan.protein * 0.55);
  const workout = getTodayWorkout(profile);
  const weatherText = profile.city
    ? `Перед выходом в ${escapeHtml(profile.city)} проверь температуру, ветер и покрытие.`
    : "Перед уличной тренировкой проверь температуру, ветер и покрытие.";

  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Сегодня</p>
        <h1>${greeting()}, ${escapeHtml(profile.name || "спортсмен")}</h1>
        <p>${escapeHtml(profile.goal)} · ${escapeHtml(profile.sport)} · ${plan.sessions} тренировки в неделю · ${plan.sessionMinutes} мин</p>
      </div>
      <div class="toolbar">
        <button class="button button-ghost" data-view-jump="meals" type="button">Питание</button>
        <button class="button button-primary" data-view-jump="training" type="button">Тренировка</button>
      </div>
    </section>

    <section class="daily-hero">
      <div class="panel hero-panel">
        <div>
          <span class="pill">фокус дня</span>
          <h2>${escapeHtml(focus)}</h2>
          <p>${dailyFocusText(profile, target, readiness)}</p>
        </div>
        <div class="hero-actions">
          <button class="button button-primary" data-view-jump="training" type="button">Начать план</button>
          <button class="button button-ghost" data-view-jump="profile" type="button">Изменить анкету</button>
        </div>
      </div>

      <div class="panel readiness-panel">
        <div class="readiness-ring" style="--score: ${readiness.score}">
          <strong>${readiness.score}</strong>
          <span>готовность</span>
        </div>
        <div>
          <h2>${escapeHtml(readiness.label)}</h2>
          <p>${readinessText(readiness)}</p>
        </div>
      </div>
    </section>

    <section class="metric-grid metric-grid-wide">
      ${metricBox("Калории", `${caloriesLeft}`, `осталось из ${plan.calories} ккал`, 42)}
      ${metricBox("Белок", `${proteinLeft} г`, `добрать до ${plan.protein} г`, 45)}
      ${metricBox("Вода", `${compactNumber(plan.water)} л`, "цель на день", 68)}
      ${metricBox("Сон", `${compactNumber(plan.sleepGoal)} ч`, "цель восстановления", Math.min(100, Math.round((plan.sleepGoal / 9) * 100)))}
    </section>

    <section class="dashboard-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Путь к цели</h2>
            <p class="caption">${goalCaption(target)}</p>
          </div>
          <span class="pill">${escapeHtml(target.direction)}</span>
        </div>
        <div class="goal-grid">
          <div><span>Сейчас</span><strong>${compactNumber(profile.weight)} кг</strong></div>
          <div><span>Цель</span><strong>${target.hasTarget ? `${compactNumber(target.target)} кг` : "не задано"}</strong></div>
          <div><span>Срок</span><strong>${target.daysLeft ? `${target.daysLeft} дн.` : "свободно"}</strong></div>
          <div><span>Темп</span><strong>${target.weeklyPace ? `${compactNumber(target.weeklyPace)} кг/нед` : "мягкий"}</strong></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Тренировка по плану</h2>
          <span class="pill">${escapeHtml(workout.type)}</span>
        </div>
        <ul class="today-list">
          ${workout.items.map((item) => `<li><span>${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong></li>`).join("")}
        </ul>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Питание по времени</h2>
          <span class="pill">${escapeHtml(profile.mealCount)} приема</span>
        </div>
        <ul class="clean-list">
          ${getMealTiming(profile)
            .map(([name, time]) => `<li><span>${escapeHtml(name)}</span><strong>${escapeHtml(time)}</strong></li>`)
            .join("")}
        </ul>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Ближайшие действия</h2>
          <span class="pill">${state.feedback.length} фидбек</span>
        </div>
        <ul class="clean-list">
          ${dailyActions(profile, plan, workout)
            .map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`)
            .join("")}
        </ul>
      </div>

      <div class="panel full-span">
        <div class="soft-band">
          <strong>Внешние условия</strong>
          <span>${weatherText} Для высокой нагрузки держи запас воды и план заминки.</span>
        </div>
      </div>
    </section>
  `;
}

function dailyFocusText(profile, target, readiness) {
  if (profile.injuries.trim()) {
    return `Ограничения: ${escapeHtml(profile.injuries)}. Сегодня важнее контроль техники, чем рекорды.`;
  }
  if (target.weeklyPace && target.weeklyPace > 0.9) {
    return "Темп цели высокий. Держи питание ровно и не повышай объем тренировки без хорошего восстановления.";
  }
  if (readiness.score < 64) {
    return "Снизь интенсивность, сделай качественную разминку и закрой тренировку без лишнего добивания.";
  }
  return `${escapeHtml(profile.priority)}. План дня собран под текущую цель и недельную нагрузку.`;
}

function readinessText(readiness) {
  if (!readiness.last) return "Первый фидбек после тренировки сделает оценку точнее.";
  if (readiness.last.effort === "hard") return "Последняя тренировка была тяжелой: сегодня держи запас по технике.";
  if (readiness.last.effort === "easy") return "Последняя тренировка прошла легко: можно аккуратно добавить объем.";
  return "Последняя тренировка прошла ровно: оставляем рабочий план.";
}

function goalCaption(target) {
  if (!target.hasTarget) return "Добавь желаемый вес и дату в анкете, чтобы видеть темп.";
  if (!target.daysLeft) return "Цель по весу задана без жесткого срока.";
  const pace = target.weeklyPace ? compactNumber(target.weeklyPace) : "0";
  return `${target.daysLeft} дней до цели, ориентир ${pace} кг в неделю.`;
}

function dailyActions(profile, plan, workout) {
  const actions = [
    ["Добрать калории", `${Math.round(plan.calories * 0.58)} ккал`],
    ["Белок до конца дня", `${Math.round(plan.protein * 0.55)} г`],
    ["Разминка перед нагрузкой", "10 мин"],
    ["Фидбек после тренировки", "1 запись"],
  ];

  if (profile.availableProducts.trim()) {
    actions[0] = ["Собрать еду из продуктов", profile.availableProducts.split(",").slice(0, 2).join(", ")];
  }

  if (workout.type === "Бег") {
    actions[2] = ["Разминка + ускорения", "12 мин"];
  }

  return actions;
}

function metricBox(label, value, hint, progress) {
  return `
    <div class="metric-box">
      <span>${label}</span>
      <strong>${value}</strong>
      <span>${hint}</span>
      <div class="progress-track"><i style="width: ${progress}%"></i></div>
    </div>
  `;
}

function mealsView() {
  const profile = currentProfile();
  const plan = estimatePlan(profile);
  const meals = [
    ["breakfast", "Завтрак", 0.26],
    ["lunch", "Обед", 0.34],
    ["snack", "Перекус", 0.14],
    ["dinner", "Ужин", 0.26],
  ];

  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Генерация еды</p>
        <h1>Питание под цель</h1>
        <p>${escapeHtml(profile.dietType)} · ${escapeHtml(profile.budget)} бюджет · дневная цель ${plan.calories} ккал.</p>
      </div>
      <button class="button button-primary" id="shuffleMeals" type="button">Обновить варианты</button>
    </section>

    <section class="meal-grid">
      ${meals.map(([key, title, share]) => mealCard(key, title, share, plan)).join("")}
    </section>
  `;
}

function mealCard(key, title, share, plan) {
  const profile = currentProfile();
  const calories = Math.round((plan.calories * share) / 10) * 10;
  const protein = Math.round(plan.protein * share);
  const fat = Math.round(plan.fat * share);
  const carbs = Math.round(plan.carbs * share);
  const ingredients = mealTemplates[key];

  return `
    <article class="meal-card">
      <div class="meal-head">
        <div>
          <h3>${title}</h3>
          <p>${calories} ккал · вариант на сегодня</p>
        </div>
        <span class="pill">${escapeHtml(profile.budget)}</span>
      </div>
      <div class="macro-row">
        <span><b>${protein} г</b> белок</span>
        <span><b>${fat} г</b> жиры</span>
        <span><b>${carbs} г</b> углеводы</span>
      </div>
      <ul class="ingredient-list">
        ${ingredients.map(([name, amount]) => `<li><span>${name}</span><strong>${amount}</strong></li>`).join("")}
      </ul>
      <p>${mealAdvice(key)}</p>
    </article>
  `;
}

function mealAdvice(key) {
  const profile = currentProfile();
  const notes = profile.foodNotes?.trim();
  const avoid = profile.avoidFoods?.trim();
  const available = profile.availableProducts?.trim();
  const base = {
    breakfast: "Если тренировка утром, оставь часть углеводов до занятия и часть после.",
    lunch: "Основной прием пищи держим плотным: белок, крупа и овощи.",
    snack: "Перекус нужен, чтобы не провалиться по белку и энергии.",
    dinner: "Вечером делаем упор на восстановление, белок и спокойные углеводы.",
  }[key];

  const extras = [];
  if (available) extras.push(`используй дома: ${escapeHtml(available)}`);
  if (avoid) extras.push(`исключи: ${escapeHtml(avoid)}`);
  if (notes) extras.push(`учесть: ${escapeHtml(notes)}`);

  return extras.length ? `${base} ${extras.join("; ")}.` : base;
}

function trainingView() {
  const profile = currentProfile();
  const plan = estimatePlan(profile);
  const weeks = buildTrainingPlan(profile);

  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Период 4 недели</p>
        <h1>Тренировочный план</h1>
        <p>${escapeHtml(profile.trainingDays)} · ${escapeHtml(profile.equipment)} · ${plan.sessionMinutes} мин · цель “${escapeHtml(profile.goal.toLowerCase())}”.</p>
      </div>
    </section>

    <section class="weeks-grid">
      ${weeks.map((week) => workoutWeek(week)).join("")}
    </section>

    <section class="panel feedback-panel">
      <div class="panel-header">
        <div>
          <h2>Фидбек после тренировки</h2>
          <p class="caption">Запись добавится в журнал и повлияет на подсказку по следующему объему.</p>
        </div>
        <span class="pill">${state.feedback.length} записей</span>
      </div>
      <div class="segmented" role="group" aria-label="Оценка сложности">
        ${["easy", "normal", "hard"].map((id) => `<button class="segment ${state.effort === id ? "is-active" : ""}" data-effort="${id}" type="button">${effortLabel(id)}</button>`).join("")}
      </div>
      <div class="form-grid" style="margin-top: 14px">
        <label class="field">
          <span>Энергия, 1-10</span>
          <input id="energyInput" type="number" min="1" max="10" value="7" />
        </label>
        <label class="field">
          <span>Боль / ограничения</span>
          <input id="painInput" type="text" placeholder="например: тянет плечо" />
        </label>
      </div>
      <div class="feedback-actions" style="margin-top: 14px">
        <button class="button button-primary" id="saveFeedback" type="button">Закрыть тренировку</button>
        <span class="caption">${feedbackHint()}</span>
      </div>
    </section>
  `;
}

function workoutWeek(week) {
  return `
    <article class="workout-week">
      <div class="panel-header">
        <h3>${week.title}</h3>
        <span class="pill">${week.focus}</span>
      </div>
      ${week.days
        .map(
          (day) => `
            <div class="workout-day">
              <div>
                <strong>${escapeHtml(day.name)}</strong>
                <span>${escapeHtml(day.work)}</span>
              </div>
              <strong>${escapeHtml(day.volume)}</strong>
            </div>
          `,
        )
        .join("")}
    </article>
  `;
}

function adviceView() {
  const profile = currentProfile();
  const plan = estimatePlan(profile);
  const cards = [
    [
      "Восстановление",
      `При ${plan.sessions} тренировках в неделю держи хотя бы 1 полный день без тяжелой нагрузки. Цель сна: ${compactNumber(plan.sleepGoal)} ч.`,
    ],
    [
      "Питание",
      `Цель белка: около ${plan.protein} г. Бюджет: ${String(profile.budget).toLowerCase()}. Тип питания: ${String(profile.dietType).toLowerCase()}.`,
    ],
    [
      "Разминка",
      profile.sport === "Бег"
        ? "Перед бегом: 5 минут легкой ходьбы, суставная разминка, 3 коротких ускорения."
        : "Перед силовой: 5-8 минут легкого кардио, мобилизация рабочих суставов, 2 разминочных подхода.",
    ],
    [
      profile.injuries.trim() ? "Ограничения" : "Фидбек",
      profile.injuries.trim()
        ? `Сегодня не игнорируй ограничения: ${profile.injuries}. Боль выше 3/10 — повод снизить нагрузку.`
        : "Веди заметки после тренировок: сложность, боль, энергия, сон. Чем больше честного фидбека, тем точнее следующий план.",
    ],
  ];

  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Персональные подсказки</p>
        <h1>Рекомендации</h1>
        <p>Короткие подсказки под текущую цель, нагрузку и режим восстановления.</p>
      </div>
    </section>

    <section class="recommendation-grid">
      ${cards
        .map(
          ([title, body]) => `
            <article class="recommendation-card">
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(body)}</p>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function profileView() {
  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Данные профиля</p>
        <h1>Анкета</h1>
        <p>Можно изменить ответы и пересчитать питание с тренировками.</p>
      </div>
      <button class="button button-danger" id="resetProfile" type="button">Сбросить данные</button>
    </section>
    ${onboardingTemplate().match(/<form[\s\S]*<\/form>/)?.[0] || ""}
  `;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function getTodayWorkout(profile) {
  const sessionMinutes = numberValue(profile.sessionMinutes, 60);
  const hasInjuries = Boolean(profile.injuries.trim());

  if (profile.sport === "Бег") {
    return {
      type: "Бег",
      items: [
        ["Разминка", hasInjuries ? "12 мин мягко" : "10 мин"],
        ["Легкий бег", `${Math.max(25, sessionMinutes - 20)} мин`],
        ["Ускорения", hasInjuries ? "пропустить" : "4 x 20 сек"],
        ["Заминка", "8 мин"],
      ],
    };
  }

  if (profile.goal === "Выносливость") {
    return {
      type: "Смешанная",
      items: [
        ["Разминка", "10 мин"],
        ["Круговая работа", sessionMinutes >= 75 ? "6 кругов" : "4 круга"],
        ["Пульсовая зона", "умеренно"],
        ["Растяжка", "8 мин"],
      ],
    };
  }

  return {
    type: "Силовая",
    items: [
      ["Разминка", hasInjuries ? "12 мин + мобилити" : "10 мин"],
      ["Присед / жим", hasInjuries ? "3 x 8 техника" : "4 x 6-8"],
      ["Тяга / спина", sessionMinutes >= 75 ? "5 x 8-10" : "4 x 8-10"],
      ["Кор", "3 x 40 сек"],
    ],
  };
}

function buildTrainingPlan(profile) {
  const sessionMinutes = numberValue(profile.sessionMinutes, 60);
  const volume = sessionMinutes >= 75 ? "16-18 подходов" : sessionMinutes <= 45 ? "10-12 подходов" : "14-16 подходов";
  const baseDays =
    profile.sport === "Бег"
      ? [
          ["День 1", "Легкий бег + техника", "35-45 мин"],
          ["День 2", "Интервалы", "6 x 400 м"],
          ["День 3", "Длинная спокойная работа", "55-70 мин"],
        ]
      : [
          ["День 1", "Ноги + кор", volume],
          ["День 2", "Верх тела", volume],
          ["День 3", profile.equipment.includes("Дом") ? "Полное тело дома" : "Полное тело", sessionMinutes <= 45 ? "10 подходов" : "12-14 подходов"],
        ];

  const multiplier = state.feedback.at(-1)?.effort === "hard" ? "минус 10%" : state.feedback.at(-1)?.effort === "easy" ? "плюс 5%" : "база";

  return [1, 2, 3, 4].map((week) => ({
    title: `Неделя ${week}`,
    focus: week === 4 ? "разгрузка" : week === 1 ? "адаптация" : multiplier,
    days: baseDays.map(([name, work, volume]) => ({
      name,
      work,
      volume: week === 4 ? "70%" : volume,
    })),
  }));
}

function effortLabel(id) {
  return {
    easy: "Легко",
    normal: "Нормально",
    hard: "Тяжело",
  }[id];
}

function feedbackHint() {
  const last = state.feedback.at(-1);
  if (!last) return "После первой записи появится подсказка по объему.";
  if (last.effort === "hard") return "Следующий план лучше сделать легче на 5-10%.";
  if (last.effort === "easy") return "Можно аккуратно поднять объем на 5%.";
  return "Объем можно оставить без изменений.";
}

function attachEvents() {
  document.querySelector("#profileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    state.profile = data;
    writeStorage(STORAGE_KEY, data);
    state.view = "dashboard";
    render();
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll("[data-view-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.viewJump;
      render();
    });
  });

  document.querySelectorAll("[data-effort]").forEach((button) => {
    button.addEventListener("click", () => {
      state.effort = button.dataset.effort;
      render();
    });
  });

  document.querySelector("#saveFeedback")?.addEventListener("click", () => {
    const feedback = {
      date: new Date().toISOString(),
      effort: state.effort,
      energy: document.querySelector("#energyInput")?.value || "7",
      pain: document.querySelector("#painInput")?.value || "",
    };
    state.feedback = [...state.feedback, feedback].slice(-20);
    writeStorage(FEEDBACK_KEY, state.feedback);
    render();
  });

  document.querySelector("#resetProfile")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FEEDBACK_KEY);
    state.profile = null;
    state.feedback = [];
    state.view = "dashboard";
    render();
  });

  document.querySelector("#shuffleMeals")?.addEventListener("click", () => {
    rotateMeals();
    render();
  });
}

function rotateMeals() {
  Object.keys(mealTemplates).forEach((key) => {
    mealTemplates[key] = [...mealTemplates[key].slice(1), mealTemplates[key][0]];
  });
}

function render() {
  app.innerHTML = state.profile ? appTemplate() : onboardingTemplate();
  attachEvents();
}

render();
