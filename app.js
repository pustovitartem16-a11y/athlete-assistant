const STORAGE_KEY = "athlete-assistant-profile";
const FEEDBACK_KEY = "athlete-assistant-feedback";

const DEFAULT_PROFILE = {
  name: "Спортсмен",
  age: "28",
  sex: "male",
  city: "",
  height: "180",
  weight: "78",
  goal: "Поддержание формы",
  sessions: "4",
  sport: "Тренажерный зал",
  level: "Средний",
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
  const sexFactor = profile.sex === "female" ? -161 : 5;
  const base = 10 * weight + 6.25 * height - 5 * age + sexFactor;
  const activity = sessions >= 5 ? 1.62 : sessions >= 3 ? 1.48 : 1.34;
  const goalShift =
    profile.goal === "Похудение"
      ? -330
      : profile.goal === "Набор массы"
        ? 280
        : profile.goal === "Выносливость"
          ? 120
          : 0;
  const calories = Math.max(1700, Math.round((base * activity + goalShift) / 10) * 10);
  const protein = Math.round(weight * (profile.goal === "Набор массы" ? 2 : 1.75));
  const fat = Math.round(weight * 0.85);
  const carbs = Math.max(130, Math.round((calories - protein * 4 - fat * 9) / 4));

  return {
    calories,
    protein,
    fat,
    carbs,
    water: Math.max(2.1, Math.round(weight * 0.035 * 10) / 10),
    sessions,
  };
}

function onboardingTemplate() {
  const profile = state.profile ? currentProfile() : {};

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
          <div class="mini-metric"><strong>2 430</strong><span>ккал на день</span></div>
          <div class="mini-metric"><strong>4</strong><span>тренировки в неделю</span></div>
          <div class="mini-metric"><strong>7.5 ч</strong><span>цель сна</span></div>
        </div>
      </section>

      <section class="form-panel">
        <div class="form-wrap">
          <p class="section-kicker">Стартовая анкета</p>
          <h2>Соберем профиль спортсмена</h2>
          <p>Эти поля дадут приложению основу для расчета питания, тренировок и рекомендаций. Позже сюда можно добавить вход, синхронизацию и платные функции.</p>

          <form class="onboarding-card" id="profileForm">
            <div class="form-grid">
              ${field("name", "Имя", "text", profile.name || "", "Андрей")}
              ${field("age", "Возраст", "number", profile.age || "", "28")}
              <label class="field">
                <span>Пол</span>
                <select name="sex">
                  <option value="male" ${profile.sex === "male" ? "selected" : ""}>Мужской</option>
                  <option value="female" ${profile.sex === "female" ? "selected" : ""}>Женский</option>
                </select>
              </label>
              ${field("city", "Город", "text", profile.city || "", "Киев")}
              ${field("height", "Рост, см", "number", profile.height || "", "180")}
              ${field("weight", "Вес, кг", "number", profile.weight || "", "78")}
              <label class="field">
                <span>Основная цель</span>
                <select name="goal">
                  ${["Похудение", "Набор массы", "Выносливость", "Сила", "Поддержание формы"].map((goal) => `<option ${profile.goal === goal ? "selected" : ""}>${goal}</option>`).join("")}
                </select>
              </label>
              ${field("sessions", "Тренировок в неделю", "number", profile.sessions || "4", "4")}
              <label class="field">
                <span>Вид спорта</span>
                <select name="sport">
                  ${["Тренажерный зал", "Бег", "Футбол", "Бокс", "Плавание", "Кроссфит", "Другое"].map((sport) => `<option ${profile.sport === sport ? "selected" : ""}>${sport}</option>`).join("")}
                </select>
              </label>
              <label class="field">
                <span>Уровень</span>
                <select name="level">
                  ${["Начинающий", "Средний", "Продвинутый"].map((level) => `<option ${profile.level === level ? "selected" : ""}>${level}</option>`).join("")}
                </select>
              </label>
              <label class="field-wide">
                <span>Питание и ограничения</span>
                <textarea name="foodNotes" placeholder="Например: не ем свинину, аллергия на арахис, люблю рис и яйца">${escapeHtml(profile.foodNotes || "")}</textarea>
              </label>
              <label class="field-wide">
                <span>Инвентарь и травмы</span>
                <textarea name="trainingNotes" placeholder="Например: есть гантели, турник; беречь колено">${escapeHtml(profile.trainingNotes || "")}</textarea>
              </label>
            </div>

            <div class="form-actions">
              <span class="caption">Анкету можно изменить в любой момент.</span>
              <button class="button button-primary" type="submit">Открыть приложение</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  `;
}

function field(name, label, type, value, placeholder) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${name === "name" ? "required" : ""} />
    </label>
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
  const caloriesLeft = Math.round(plan.calories * 0.58);
  const workout = getTodayWorkout(profile);
  const weatherText = profile.city ? `Для ${escapeHtml(profile.city)}: перед уличной тренировкой проверь температуру и ветер.` : "Перед уличной тренировкой проверь температуру, ветер и покрытие.";

  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Сегодня</p>
        <h1>${greeting()}, ${escapeHtml(profile.name || "спортсмен")}</h1>
        <p>${escapeHtml(profile.goal)} · ${escapeHtml(profile.sport)} · ${plan.sessions} тренировки в неделю</p>
      </div>
      <div class="toolbar">
        <button class="button button-ghost" data-view-jump="meals" type="button">Питание</button>
        <button class="button button-primary" data-view-jump="training" type="button">Тренировка</button>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Показатели дня</h2>
            <p class="caption">Расчет по анкете и текущей цели.</p>
          </div>
          <span class="pill">день</span>
        </div>
        <div class="metric-grid">
          ${metricBox("Калории", `${caloriesLeft}`, `из ${plan.calories} ккал`, 42)}
          ${metricBox("Белок", `${Math.round(plan.protein * 0.45)} г`, `цель ${plan.protein} г`, 45)}
          ${metricBox("Вода", `${Math.round(plan.water * 0.45 * 10) / 10} л`, `цель ${plan.water} л`, 45)}
          ${metricBox("Сон", "7.5 ч", "цель 8 ч", 78)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Тренировка по плану</h2>
          <span class="pill">${workout.type}</span>
        </div>
        <ul class="today-list">
          ${workout.items.map((item) => `<li><span>${item[0]}</span><strong>${item[1]}</strong></li>`).join("")}
        </ul>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Что осталось сделать</h2>
          <span class="pill">фокус</span>
        </div>
        <ul class="clean-list">
          <li><span>Добрать калории</span><strong>${caloriesLeft} ккал</strong></li>
          <li><span>Сделать разминку</span><strong>10 мин</strong></li>
          <li><span>Оставить фидбек после тренировки</span><strong>${state.feedback.length} записей</strong></li>
        </ul>
      </div>

      <div class="panel">
        <div class="soft-band">
          <strong>Внешние условия</strong>
          <span>${weatherText} Для высокой нагрузки держи запас воды и план заминки.</span>
        </div>
      </div>
    </section>
  `;
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
        <p>Блоки рассчитаны от дневной цели ${plan.calories} ккал и распределены по четырем приемам пищи.</p>
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
        <span class="pill">${escapeHtml(profile.goal)}</span>
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
  const notes = currentProfile().foodNotes?.trim();
  const base = {
    breakfast: "Если тренировка утром, оставь часть углеводов до занятия и часть после.",
    lunch: "Основной прием пищи держим плотным: белок, крупа и овощи.",
    snack: "Перекус нужен, чтобы не провалиться по белку и энергии.",
    dinner: "Вечером делаем упор на восстановление, белок и спокойные углеводы.",
  }[key];

  return notes ? `${base} Учесть: ${escapeHtml(notes)}.` : base;
}

function trainingView() {
  const profile = currentProfile();
  const weeks = buildTrainingPlan(profile);

  return `
    <section class="topbar">
      <div>
        <p class="section-kicker">Период 4 недели</p>
        <h1>Тренировочный план</h1>
        <p>План под ${escapeHtml(profile.sport.toLowerCase())} и цель “${escapeHtml(profile.goal.toLowerCase())}”. После закрытия тренировки фидбек помогает менять объем.</p>
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
                <strong>${day.name}</strong>
                <span>${day.work}</span>
              </div>
              <strong>${day.volume}</strong>
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
      `При ${plan.sessions} тренировках в неделю держи хотя бы 1 полный день без тяжелой нагрузки. Если сон ниже 7 часов, объем лучше не повышать.`,
    ],
    [
      "Питание",
      `Цель белка на день: около ${plan.protein} г. Разбей на 3-4 приема, так легче держать норму без перегруза одного блюда.`,
    ],
    [
      "Разминка",
      profile.sport === "Бег"
        ? "Перед бегом: 5 минут легкой ходьбы, суставная разминка, 3 коротких ускорения."
        : "Перед силовой: 5-8 минут легкого кардио, мобилизация рабочих суставов, 2 разминочных подхода.",
    ],
    [
      "Следующий слой",
      "Веди заметки после тренировок: сложность, боль, энергия, сон. Чем больше честного фидбека, тем точнее следующий план.",
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
              <h3>${title}</h3>
              <p>${body}</p>
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
  if (profile.sport === "Бег") {
    return {
      type: "Бег",
      items: [
        ["Разминка", "10 мин"],
        ["Легкий бег", "35 мин"],
        ["Ускорения", "4 x 20 сек"],
        ["Заминка", "8 мин"],
      ],
    };
  }

  if (profile.goal === "Выносливость") {
    return {
      type: "Смешанная",
      items: [
        ["Разминка", "10 мин"],
        ["Круговая работа", "5 кругов"],
        ["Пульсовая зона", "умеренно"],
        ["Растяжка", "8 мин"],
      ],
    };
  }

  return {
    type: "Силовая",
    items: [
      ["Разминка", "10 мин"],
      ["Присед / жим", "4 x 6-8"],
      ["Тяга / спина", "4 x 8-10"],
      ["Кор", "3 x 40 сек"],
    ],
  };
}

function buildTrainingPlan(profile) {
  const baseDays =
    profile.sport === "Бег"
      ? [
          ["День 1", "Легкий бег + техника", "35-45 мин"],
          ["День 2", "Интервалы", "6 x 400 м"],
          ["День 3", "Длинная спокойная работа", "55-70 мин"],
        ]
      : [
          ["День 1", "Ноги + кор", "14-16 подходов"],
          ["День 2", "Верх тела", "14-16 подходов"],
          ["День 3", "Полное тело", "12-14 подходов"],
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
