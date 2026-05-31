const LS_KEY = "courseTreeState.v1";
const THEME_KEY = "courseTreeTheme.v1";
const PROFILES_URL = "/static/profiles_PM.json";

const TYPE_COLORS = {
  fundamentals: "#45c7e8",
  core: "#6b5cff",
  selected: "#ffb24d",
  flex: "#8be596",
  unknown: "#c9d1dd",
};

const SCHEDULE_DAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота"
];

function getDefaultScheduleFilter() {
  return {
    enabled: true,
    onlyEligible: true,
    hideDone: true,
    avoidPlannedConflicts: false,
    onlyActiveProfile: false,
    days: [...SCHEDULE_DAYS]
  };
}

// const PRESET_DONE_TITLES = [
//   // fundamentals: все закрыты за первые 3 семестра
//   "Основы Python",
//   "SQL и базы данных",
//   "Продуктовая студия",
//   "Soft Skills Lab. 1 семестр",
//   "Soft Skills Lab. 2 семестр",
//   "Основы статистики",
//   "Machine Learning",
//   "Python для анализа данных",
//   "Метрики бизнеса и продукта",

//   // core: закрыты 4 из 5, этого достаточно по сценарию
//   "Case Evenings",
//   "Управление разработкой IT продукта",
//   "Генерация и валидация гипотез",
//   "Стратегический и финансовый менеджмент",
//   "Системный анализ",

//   // selected: 8 / 10 з.е., нужно добрать минимум 2 з.е.
//   "Лидерство и управление",
//   // "AI Beyond Fit-Predict",
//   // "Управление ML-продуктами",

//   // flex: 2 / 5 з.е., нужно добрать минимум 3 з.е.
//   // "Оценка инвестиционной привлекательности проектов"
// ];


// const TASK_HTML = `
//   <p><strong>Ты студент направления «Продуктовый менеджмент» перед 4 семестром.</strong></p>

//   <p>
//     Первые три семестра уже позади: часть курсов отмечена зелёной рамкой как пройденная.
//     Теперь тебе нужно выбрать курсы на последний семестр так, чтобы успешно завершить обучение.
//   </p>

//   <p>
//     Ориентируйся на блок <strong>«Счётчики»</strong> справа.
//     В нём видно, какие требования уже закрыты, а что ещё нужно добрать.
//     Не все видимые курсы обязательно нужно пройти: важны именно нормы, указанные в счётчиках.
//   </p>

//   <p>
//     Чтобы выбрать курсы, используй переключатель режимов в левом верхнем углу дерева.
//     Переключись в режим <strong>«Запланировать»</strong> и нажимай на курсы, которые хочешь добавить в расписание.
//   </p>

//   <p>
//     Обрати внимание: если карточка курса обведена красным, значит у выбранного курса есть пересечение
//     в расписании с другим выбранным курсом. Подробности можно посмотреть по кнопке
//     <strong>«Посмотреть расписание»</strong>.
//   </p>

//   <p>
//     У задания есть несколько правильных решений. Когда закончишь выбирать курсы,
//     нажми кнопку <strong>«Завершить»</strong>.
//   </p>
// `;

// const FORCE_TEST_PRESET_ON_LOAD = true;

// function showTaskPrompt() {
//   const modal = document.getElementById("taskModal");
//   const body = document.getElementById("taskModalBody");
//   body.innerHTML = TASK_HTML;
//   modal.classList.remove("hidden");
// }

// function hideTaskPrompt() {
//   document.getElementById("taskModal").classList.add("hidden");
// }

// function showFinishPrompt(title, html) {
//   const modal = document.getElementById("finishModal");
//   const titleEl = document.getElementById("finishModalTitle");
//   const bodyEl = document.getElementById("finishModalBody");

//   titleEl.textContent = title;
//   bodyEl.innerHTML = html;
//   modal.classList.remove("hidden");
// }

// function hideFinishPrompt() {
//   document.getElementById("finishModal").classList.add("hidden");
// }

// function normTitle(s) {
//   return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
// }

// function buildPresetDoneIds(graph) {
//   const wanted = new Set(PRESET_DONE_TITLES.map(normTitle));
//   return new Set(
//     graph.courses
//       .filter(c => wanted.has(normTitle(c.title)))
//       .map(c => c.id)
//   );
// }

// function applyPresetState(state, presetDoneIds) {
//   state.done = {};
//   state.planned = {};

//   for (const id of presetDoneIds) {
//     state.done[id] = true;
//   }
// }


function loadState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {
      done: {},
      planned: {},
      selectedCreditsTarget: 10,
      flexCreditsTarget: 5,
      activeProfileId: null,
      profileChoices: {},
      activeScheduleFilter: null
    };
  } catch {
    return {
      done: {},
      planned: {},
      selectedCreditsTarget: 10,
      flexCreditsTarget: 5,
      activeProfileId: null,
      profileChoices: {},
      activeScheduleFilter: null
    };
  }
}
function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function ensureProfileState(state) {
  if (!state.done) state.done = {};
  if (!state.planned) state.planned = {};
  if (!("activeProfileId" in state)) state.activeProfileId = null;
  if (!state.profileChoices || typeof state.profileChoices !== "object") {
    state.profileChoices = {};
  }
  if (!("activeScheduleFilter" in state)) state.activeScheduleFilter = null;
}

async function loadProfilesData() {
  try {
    const res = await fetch(`${PROFILES_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Не удалось загрузить profiles_PM.json:", err);
    return { profiles: [] };
  }
}

function normalizeProfileTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getProfilesList(profilesData) {
  return Array.isArray(profilesData?.profiles) ? profilesData.profiles : [];
}

function getProfileById(profilesData, profileId) {
  return getProfilesList(profilesData).find(p => p.id === profileId) || null;
}

function getProfileChoiceGroups(profile) {
  return Array.isArray(profile?.choiceGroups) ? profile.choiceGroups : [];
}

function getDefaultProfileChoices(profile) {
  const result = {};

  for (const group of getProfileChoiceGroups(profile)) {
    const firstOptionId = group.options?.[0]?.id || "";
    result[group.id] = group.defaultOptionId || firstOptionId;
  }

  return result;
}

function getProfileChoices(state, profile) {
  return {
    ...getDefaultProfileChoices(profile),
    ...(state.profileChoices?.[profile.id] || {})
  };
}

function findProfileChoiceOption(profile, groupId, optionId) {
  const group = getProfileChoiceGroups(profile).find(g => g.id === groupId);
  if (!group) return null;

  return group.options?.find(o => o.id === optionId) || group.options?.[0] || null;
}

function addProfileCourseTitles(targetSet, courses) {
  if (!Array.isArray(courses)) return;

  for (const title of courses) {
    if (typeof title === "string" && title.trim()) {
      targetSet.add(title.trim());
    }
  }
}

function collectProfileCourseTitles(profile, choices = {}) {
  const titles = new Set();

  // 1. Основной источник правды — курсы по семестрам.
  for (const semester of profile?.semesters || []) {
    addProfileCourseTitles(titles, semester.courses);

    for (const groupId of semester.choiceGroupIds || []) {
      const optionId = choices[groupId];
      const option = findProfileChoiceOption(profile, groupId, optionId);
      addProfileCourseTitles(titles, option?.courses);
    }
  }

  // 2. Дополнительные наборы тоже учитываем, чтобы профиль можно было менять без дублирования в семестрах.
  addProfileCourseTitles(titles, profile?.additionalCourses?.selected);
  addProfileCourseTitles(titles, profile?.additionalCourses?.flex);

  // Важно: additionalCourses.flexAlternatives намеренно не добавляем целиком,
  // чтобы не включить сразу все альтернативы. Альтернативы идут через choiceGroups.

  return titles;
}

function getCourseTitleMaps(graph) {
  const byTitle = new Map();
  const byId = new Map();

  for (const course of graph.courses || []) {
    byTitle.set(normalizeProfileTitle(course.title), course);
    byId.set(course.id, course);
  }

  return { byTitle, byId };
}

function getProfileCourseIds(profile, choices, graph) {
  if (!profile) return null;

  const { byTitle } = getCourseTitleMaps(graph);
  const titles = collectProfileCourseTitles(profile, choices);
  const ids = new Set();

  for (const title of titles) {
    const course = byTitle.get(normalizeProfileTitle(title));
    if (course) ids.add(course.id);
  }

  return ids;
}

function validateProfilesAgainstGraph(profilesData, graph) {
  const profiles = getProfilesList(profilesData);
  const { byTitle, byId } = getCourseTitleMaps(graph);

  for (const profile of profiles) {
    const variants = [];

    const defaultChoices = getDefaultProfileChoices(profile);
    variants.push({
      label: "вариант по умолчанию",
      choices: defaultChoices
    });

    for (const group of getProfileChoiceGroups(profile)) {
      for (const option of group.options || []) {
        variants.push({
          label: `${group.title || group.id}: ${option.label || option.id}`,
          choices: {
            ...defaultChoices,
            [group.id]: option.id
          }
        });
      }
    }

    for (const variant of variants) {
      const titles = collectProfileCourseTitles(profile, variant.choices);
      const ids = new Set();
      const unknownTitles = [];

      for (const title of titles) {
        const course = byTitle.get(normalizeProfileTitle(title));
        if (!course) {
          unknownTitles.push(title);
        } else {
          ids.add(course.id);
        }
      }

      const missingPrereqs = [];

      for (const edge of graph.edges || []) {
        if (!ids.has(edge.target)) continue;
        if (ids.has(edge.source)) continue;

        const target = byId.get(edge.target);
        const source = byId.get(edge.source);

        missingPrereqs.push({
          course: target?.title || edge.target,
          missingPrerequisite: source?.title || edge.source
        });
      }

      if (unknownTitles.length || missingPrereqs.length) {
        console.warn(
          `[Профиль "${profile.title}", ${variant.label}] есть проблемы:`,
          {
            unknownTitles,
            missingPrereqs
          }
        );
      }
    }
  }
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeProfileHtml(value) {
  return esc(String(value ?? ""));
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { }
}

function applyDocumentTheme(theme) {
  document.body.dataset.theme = theme;

  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.textContent = theme === "dark" ? "Светлая тема" : "Тёмная тема";
  }
}

function escAttr(s) {
  return esc(String(s || ""))
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prereqSatisfied(course, doneSet) {
  // Unknown prereqs (strings that are not course titles) are treated as NOT satisfied.
  return (course.prereqs || []).every(p => doneSet.has(p));
}

function computeEligibility(courses, state) {
  const doneSet = new Set(Object.keys(state.done).filter(k => state.done[k]));
  const eligible = {};
  for (const c of courses) {
    eligible[c.id] = prereqSatisfied(c, doneSet);
  }
  return { doneSet, eligible };
}

function getCourseCredits(course) {
  const raw = course?.credits;

  if (raw === 0) return 0;
  if (raw == null) return 1;
  if (typeof raw === "string" && raw.trim() === "") return 1;

  const num = Number(raw);
  return Number.isFinite(num) ? num : 1;
}

function creditsSum(coursesById, ids) {
  let s = 0;
  for (const id of ids) {
    const c = coursesById[id];
    if (!c) continue;
    s += getCourseCredits(c);
  }
  return s;
}

function getProgressStats(graph, state) {
  const courses = graph.courses;

  const doneIds = Object.keys(state.done).filter(k => state.done[k]);
  const plannedIds = Object.keys(state.planned).filter(k => state.planned[k]);

  const doneSet = new Set(doneIds);
  const plannedSet = new Set(plannedIds);
  const conflictingCourseIds = getConflictingCourseIds(graph, state);
  const hasScheduleConflicts = conflictingCourseIds.size > 0;

  const fundamentals = courses.filter(c => c.type === "fundamentals");
  const core = courses.filter(c => c.type === "core");
  const selected = courses.filter(c => c.type === "selected");
  const flex = courses.filter(c => c.type === "flex");

  function countCourses(list) {
    const doneCount = list.filter(c => doneSet.has(c.id)).length;
    const plannedCount = list.filter(c => plannedSet.has(c.id) && !doneSet.has(c.id)).length;
    const remaining = Math.max(0, list.length - doneCount - plannedCount);
    return {
      doneCount,
      plannedCount,
      remaining,
      total: list.length
    };
  }

  function countCredits(list) {
    const doneCredits = list
      .filter(c => doneSet.has(c.id))
      .reduce((sum, c) => sum + getCourseCredits(c), 0);

    const plannedCredits = list
      .filter(c => plannedSet.has(c.id) && !doneSet.has(c.id))
      .reduce((sum, c) => sum + getCourseCredits(c), 0);

    return { doneCredits, plannedCredits };
  }

  function sumPlannedPairHours(list) {
    return list
      .filter(c => plannedSet.has(c.id) && !doneSet.has(c.id))
      .reduce((sum, c) => {
        const pairCount = Number(c?.hours?.total_per_week || 0);
        return sum + pairCount * 1.5;
      }, 0);
  }

  function sumPlannedHomeworkHours(list) {
    return list
      .filter(c => plannedSet.has(c.id) && !doneSet.has(c.id))
      .reduce((sum, c) => {
        return sum + Number(c?.difficulty?.avg_homework_hours_per_week || 0);
      }, 0);
  }

  function loadLabel(hours) {
    if (hours <= 10) return "низкая";
    if (hours <= 15) return "средняя";
    if (hours <= 20) return "высокая";
    return "очень высокая";
  }

  const fundStat = countCourses(fundamentals);
  const coreStat = countCourses(core);

  const selectedCredits = countCredits(selected);
  const flexCredits = countCredits(flex);

  const selectedTarget = Number(state.selectedCreditsTarget || 10);
  const flexTarget = Number(state.flexCreditsTarget || 5);

  const selectedRemaining = Math.max(
    0,
    selectedTarget - selectedCredits.doneCredits - selectedCredits.plannedCredits
  );

  const flexRemaining = Math.max(
    0,
    flexTarget - flexCredits.doneCredits - flexCredits.plannedCredits
  );

  const selectedTotalNow = selectedCredits.doneCredits + selectedCredits.plannedCredits;
  const selectedOverflow = Math.max(0, selectedTotalNow - selectedTarget);

  const plannedPairHours = sumPlannedPairHours(courses);
  const plannedHomeworkHours = sumPlannedHomeworkHours(courses);
  const plannedTotalHours = plannedPairHours + plannedHomeworkHours;
  const plannedLoadLabel = loadLabel(plannedTotalHours);

  const closesAll = (
    fundStat.remaining === 0 &&
    coreStat.remaining === 0 &&
    selectedRemaining === 0 &&
    flexRemaining === 0
  );

  return {
    doneIds,
    plannedIds,
    doneSet,
    plannedSet,
    hasScheduleConflicts,
    fundStat,
    coreStat,
    selectedCredits,
    flexCredits,
    selectedTarget,
    flexTarget,
    selectedRemaining,
    flexRemaining,
    selectedOverflow,
    plannedPairHours,
    plannedHomeworkHours,
    plannedTotalHours,
    plannedLoadLabel,
    closesAll
  };
}


// function handleFinishCheck(graph, state) {
//   const stats = getProgressStats(graph, state);

//   if (!stats.closesAll) {
//     const parts = [];
//     if (stats.fundStat.remaining > 0) parts.push(`fundamentals: осталось ${stats.fundStat.remaining}`);
//     if (stats.coreStat.remaining > 0) parts.push(`core: осталось ${stats.coreStat.remaining}`);
//     if (stats.selectedRemaining > 0) parts.push(`selected: осталось ${stats.selectedRemaining} з.е.`);
//     if (stats.flexRemaining > 0) parts.push(`flex: осталось ${stats.flexRemaining} з.е.`);

//     showFinishPrompt(
//       "Попробуй ещё раз",
//       `
//         <p><strong>К сожалению, выбранный тобой набор курсов не закрывает все потребности для получения диплома.</strong></p>
//         <p>Предлагаем попробовать ещё раз.</p>
//         <p>${parts.join("<br/>")}</p>
//         <p>Также, после этого просим вернуться к опросу об удобстве выбора пар через Дерево решений и дать нам обратную связь.</p>
//       `
//     );
//     return;
//   }

//   if (stats.hasScheduleConflicts) {
//     showFinishPrompt(
//       "Есть пересечения",
//       `
//         <p><strong>Поздравляю, ты успешно набрал курсы, чтобы завершить обучение, но обрати внимание: у тебя есть пересечения в расписании.</strong></p>
//         <p>Просим тебя вернуться к опросу об удобстве выбора пар через Дерево решений и дать нам обратную связь.</p>
//       `
//     );
//     return;
//   }

//   showFinishPrompt(
//     "Отличный выбор",
//     `
//       <p><strong>Молодец, ты составил шикарное расписание на предстоящий семестр ☺️</strong></p>
//       <p>Просим тебя вернуться к опросу об удобстве выбора пар через Дерево решений и дать нам обратную связь.</p>
//     `
//   );
// }


function updateCounters(graph, state) {
  const stats = getProgressStats(graph, state);
  const {
    doneIds,
    plannedIds,
    doneSet,
    hasScheduleConflicts,
    fundStat,
    coreStat,
    selectedCredits,
    flexCredits,
    selectedTarget,
    flexTarget,
    selectedRemaining,
    flexRemaining,
    plannedPairHours,
    plannedHomeworkHours,
    plannedTotalHours,
    plannedLoadLabel
  } = stats;

  const el = document.getElementById("counters");
  el.innerHTML = `
    <div class="counterGrid">
      <div>
        <span class="counterType type-fundamentals">fundamentals:</span> <b>${fundStat.doneCount}</b> / ${fundStat.total}<br/>
        <span class="small counterMeta">выбрано ${fundStat.plannedCount}, останется ${fundStat.remaining}</span>
      </div>

      <div>
        <span class="counterType type-core">core:</span> <b>${coreStat.doneCount}</b> / ${coreStat.total}<br/>
        <span class="small counterMeta">выбрано ${coreStat.plannedCount}, останется ${coreStat.remaining}</span>
      </div>

      <div>
        <span class="counterType type-selected">selected:</span> <b>${selectedCredits.doneCredits}</b> / ${selectedTarget} з.е.<br/>
        <span class="small counterMeta">выбрано ${selectedCredits.plannedCredits}, останется ${selectedRemaining}</span>
      </div>

      <div>
        <span class="counterType type-flex">flex:</span> <b>${flexCredits.doneCredits}</b> / ${flexTarget} з.е.<br/>
        <span class="small counterMeta">выбрано ${flexCredits.plannedCredits}, останется ${flexRemaining}</span>
      </div>
    </div>

    <div class="counterFoot">
      <div class="small">
        Пройдено всего: ${doneIds.length}. Запланировано: ${plannedIds.filter(id => !doneSet.has(id)).length}.
      </div>

      ${hasScheduleConflicts ? `<div class="warningText">⚠ Выбранные пары имеют пересечения по времени.</div>` : ""}
    </div>

    <hr/>

    <div class="counterLoad">
      <div class="counterLoadTitle">Прогнозируемая нагрузка</div>
      <div class="counterLoadNote">
        считается в часах в неделю по запланированным курсам: пары и домашки
      </div>

      <div class="counterLoadGrid">
        <div class="counterLoadItem"><span>пары</span><b>${plannedPairHours.toFixed(1)} ч/нед.</b></div>
        <div class="counterLoadItem"><span>домашки</span><b>${plannedHomeworkHours.toFixed(1)} ч/нед.</b></div>
        <div class="counterLoadItem"><span>всего</span><b>${plannedTotalHours.toFixed(1)} ч/нед.</b></div>
        <div class="counterLoadItem"><span>уровень</span><b>${plannedLoadLabel}</b></div>
      </div>
    </div>
  `;
}

function makeDetails(course) {
  if (!course) return "Выбери курс, чтобы увидеть пререквизиты, расписание и нагрузку.";

  const h = [];
  h.push(`<div><b>${esc(course.title)}</b></div>`);
  h.push(`<div class="small">тип: ${esc(course.type)} · глубина пререквизитов: ${course.depth}</div>`);

  if (course.syllabus_url) {
    h.push(`<div style="margin-top:6px"><a href="${esc(course.syllabus_url)}" target="_blank" rel="noreferrer">Открыть силлабус</a></div>`);
  }

  h.push(`<hr/>`);

  if (course.prereqs && course.prereqs.length) {
    h.push(`<div><b>Пререквизиты:</b><br/>${course.prereqs.map(esc).join("<br/>")}</div>`);
  } else {
    h.push(`<div><b>Пререквизиты:</b> нет</div>`);
  }

  h.push(`<hr/>`);

  const isOffered = !!course?.schedule?.is_offered_this_term;
  if (isOffered) {
    const slots = course.schedule.slots || [];
    const slotsHtml = slots.length
      ? slots.map(s => `${esc(s.day)}, ${esc(s.start)}–${esc(s.end)} — ${esc(s.kind)}`).join("<br/>")
      : "есть в семестре, но слоты не указаны";

    h.push(`<div><b>Читается в этом семестре:</b> да</div>`);
    h.push(`<div style="margin-top:4px"><b>Расписание:</b><br/>${slotsHtml}</div>`);
  } else {
    h.push(`<div style="color:#ffb3b3"><b>Читается в этом семестре:</b> нет</div>`);
  }

  h.push(`<hr/>`);

  h.push(`<div><b>Нагрузка (в неделю):</b> лекции ${course.hours?.lectures_per_week ?? "—"}, семинары ${course.hours?.seminars_per_week ?? "—"}, всего ${course.hours?.total_per_week ?? "—"}</div>`);
  h.push(`<div><b>Активности:</b> ДЗ ${course.workload?.homeworks ?? "—"}, квизы ${course.workload?.quizzes ?? "—"}, контрольные ${course.workload?.midterms ?? "—"}</div>`);

  if (course?.difficulty?.avg_homework_hours_per_week != null) {
    h.push(`<div><b>Домашки (ср.):</b> ${esc(String(course.difficulty.avg_homework_hours_per_week))} ч/нед.</div>`);
  }

  h.push(`<div><b>Итог:</b> ${esc(course.assessment || "—")}</div>`);
  if (course.blockers) h.push(`<div><b>Блокеры:</b> ${esc(course.blockers)}</div>`);
  if (course.bonus) h.push(`<div><b>Бонусы:</b> ${esc(course.bonus)}</div>`);

  return h.join("");
}

function buildElements(graph, state) {
  const { doneSet, eligible } = computeEligibility(graph.courses, state);
  const conflictingCourseIds = getConflictingCourseIds(graph, state);
  const candidateConflictWithPlannedIds = getCandidateConflictWithPlannedCourseIds(graph, state);
  const displayDepths = computeDisplayDepths(graph.courses);

  const nodes = graph.courses.map(c => {
    const t = c.type || "unknown";

    const isLocked = !eligible[c.id];
    const isNotOffered = !isLocked && !doneSet.has(c.id) && !c?.schedule?.is_offered_this_term;

    return {
      data: {
        id: c.id,
        label: c.title,
        type: t,
        rawType: c.type || "unknown",
        depth: c.depth || 0,
        displayDepth: displayDepths.get(c.id) ?? 0,
        credits: c.credits || 1,
        syllabus_url: c.syllabus_url || "",
        isOfferedThisTerm: !!c?.schedule?.is_offered_this_term,
      },
      classes: [
        doneSet.has(c.id) ? "done" : "",
        state.planned[c.id] ? "planned" : "",
        isLocked ? "locked" : "eligible",
        isNotOffered ? "notOffered" : "",
        conflictingCourseIds.has(c.id) ? "scheduleConflict" : "",
        candidateConflictWithPlannedIds.has(c.id) ? "candidateScheduleConflict" : "",
      ].filter(Boolean).join(" ")
    };
  });

  const edges = graph.edges.map(e => ({
    data: {
      id: `${e.source}__${e.target}`,
      source: e.source,
      target: e.target
    }
  }));

  return { nodes, edges };
}

function applySearch(cy, q) {
  const query = (q || "").trim().toLowerCase();

  cy.nodes().removeClass("searchHit");
  cy.nodes().removeClass("searchDim");
  cy.edges().removeClass("searchDim");

  if (!query) return;

  const courseNodes = cy.nodes().filter(n => isCourseNode(n));
  const hits = [];

  courseNodes.forEach(n => {
    const label = (n.data("label") || "").toLowerCase();
    if (label.includes(query)) hits.push(n);
  });

  hits.forEach(n => n.addClass("searchHit"));

  courseNodes.forEach(n => {
    if (!n.hasClass("searchHit")) n.addClass("searchDim");
  });

  cy.edges().forEach(e => {
    const sHit = e.source().hasClass("searchHit");
    const tHit = e.target().hasClass("searchHit");
    if (!(sHit || tHit)) e.addClass("searchDim");
  });
}

function getTypeOrder(type) {
  const order = {
    fundamentals: 0,
    core: 1,
    selected: 2,
    flex: 3,
    unknown: 4
  };
  return order[type] ?? 99;
}



const TREE_LAYOUT = {
  leftPad: 40,
  colGap: 250,
  rowGap: 88,
  headerY: 38,
  firstNodeY: 132
};

const START_VIEW = {
  zoom: 0.50,
  leftPadding: 120,
  topPadding: 120
};

const PREP_COURSE_TITLES = new Set([
  "Основы Python"
]);

let CURRENT_LAYOUT_CONFIG = null;

function getProfileLayoutInfo(profile, choices, graph) {
  if (!profile) return null;

  const { byTitle } = getCourseTitleMaps(graph);
  const courseIds = new Set();
  const courseColumnById = new Map();

  const columns = [];
  const seenColumnKeys = new Set();
  const prepTitleKeys = new Set(
    Array.from(PREP_COURSE_TITLES).map(title => normalizeProfileTitle(title))
  );

  const addColumn = (key, text) => {
    if (seenColumnKeys.has(key)) return;
    columns.push({ key, text });
    seenColumnKeys.add(key);
  };

  const addCourseToColumn = (title, columnKey) => {
    if (typeof title !== "string" || !title.trim()) return;

    const course = byTitle.get(normalizeProfileTitle(title));
    if (!course) return;

    courseIds.add(course.id);

    const normalizedCourseTitle = normalizeProfileTitle(course.title);

    if (prepTitleKeys.has(normalizedCourseTitle)) {
      courseColumnById.set(course.id, -1);
      return;
    }

    // Важно: если курс уже явно попал в семестр из profile.semesters,
    // не даём additionalCourses перезаписать его в последний семестр.
    if (!courseColumnById.has(course.id)) {
      courseColumnById.set(course.id, columnKey);
    }
  };

  addColumn(-1, "Подготовительные курсы");

  for (const semester of profile?.semesters || []) {
    const semesterNumber = Number(semester?.number);
    if (!Number.isFinite(semesterNumber)) continue;

    addColumn(semesterNumber, `Курсы ${semesterNumber} семестра`);

    for (const title of semester.courses || []) {
      addCourseToColumn(title, semesterNumber);
    }

    for (const groupId of semester.choiceGroupIds || []) {
      const optionId = choices[groupId];
      const option = findProfileChoiceOption(profile, groupId, optionId);

      for (const title of option?.courses || []) {
        addCourseToColumn(title, semesterNumber);
      }
    }
  }

  const semesterColumns = columns.filter(col => col.key >= 1);
  const fallbackSemester = semesterColumns.length
    ? semesterColumns[semesterColumns.length - 1].key
    : 1;

  for (const title of profile?.additionalCourses?.selected || []) {
    addCourseToColumn(title, fallbackSemester);
  }

  for (const title of profile?.additionalCourses?.flex || []) {
    addCourseToColumn(title, fallbackSemester);
  }

  for (const prepTitle of PREP_COURSE_TITLES) {
    addCourseToColumn(prepTitle, -1);
  }

  return {
    courseIds,
    courseColumnById,
    columns
  };
}

function getLayoutColumnKey(node) {
  if (CURRENT_LAYOUT_CONFIG?.mode === "profile") {
    return Number(node.data("profileSemesterColumn") ?? 0);
  }

  return Number(node.data("displayDepth") ?? 0);
}

function getOrderedLayoutColumns(visibleNodes) {
  if (CURRENT_LAYOUT_CONFIG?.mode === "profile" && Array.isArray(CURRENT_LAYOUT_CONFIG.columns)) {
    return CURRENT_LAYOUT_CONFIG.columns.map(col => col.key);
  }

  return Array.from(new Set(visibleNodes.map(n => getLayoutColumnKey(n)))).sort((a, b) => a - b);
}

function computeDisplayDepths(courses) {
  const byId = new Map(courses.map(c => [c.id, c]));
  const memo = new Map();
  const visiting = new Set();

  function isPrepCourse(id) {
    return PREP_COURSE_TITLES.has(id);
  }

  function getRealPrereqs(course) {
    return (course.prereqs || [])
      .filter(pr => byId.has(pr))
      .filter(pr => !isPrepCourse(pr));
  }

  function depthOf(id) {
    if (memo.has(id)) return memo.get(id);

    if (isPrepCourse(id)) {
      memo.set(id, -1);
      return -1;
    }

    if (visiting.has(id)) {
      return 0;
    }

    visiting.add(id);

    const course = byId.get(id);
    if (!course) {
      visiting.delete(id);
      return 0;
    }

    const realPrereqs = getRealPrereqs(course);

    let depth = 0;
    if (realPrereqs.length) {
      depth = Math.max(...realPrereqs.map(pr => depthOf(pr))) + 1;
    }

    visiting.delete(id);
    memo.set(id, depth);
    return depth;
  }

  for (const course of courses) {
    depthOf(course.id);
  }

  return memo;
}

function isCourseNode(node) {
  return !node.hasClass("columnHeader");
}

function getColumnGroups(usedDepths) {
  const groups = [];

  if (usedDepths.includes(-1)) {
    groups.push({
      text: "Подготовительные курсы",
      depths: [-1]
    });
  }

  if (usedDepths.includes(0)) {
    groups.push({
      text: "Курсы без преквизитов",
      depths: [0]
    });
  }

  const prereqDepths = usedDepths.filter(d => d >= 1);
  if (prereqDepths.length) {
    groups.push({
      text: "Курсы с преквизитами",
      depths: prereqDepths
    });
  }

  return groups;
}

function getDisplayDepth(node) {
  return getLayoutColumnKey(node);
}

function getVisibleCourseNodes(cy) {
  return cy.nodes().filter(n => isCourseNode(n) && n.style("display") !== "none");
}

function presetPositionsByDepth(cy) {
  const visibleNodes = getVisibleCourseNodes(cy);
  if (!visibleNodes.length) return;

  const depthMap = new Map();

  visibleNodes.forEach(n => {
    const d = getDisplayDepth(n);
    if (!depthMap.has(d)) depthMap.set(d, []);
    depthMap.get(d).push(n);
  });

  const orderedColumns = getOrderedLayoutColumns(visibleNodes);
  const depthToColIndex = new Map(orderedColumns.map((d, i) => [d, i]));

  for (const d of orderedColumns) {
    const col = depthMap.get(d);
    if (!col?.length) continue;

    col.sort((a, b) => {
      const aTitle = a.data("label") || "";
      const bTitle = b.data("label") || "";

      if (aTitle === "Основы Python" && bTitle !== "Основы Python") return -1;
      if (bTitle === "Основы Python" && aTitle !== "Основы Python") return 1;

      const typeDiff = getTypeOrder(a.data("type")) - getTypeOrder(b.data("type"));
      if (typeDiff !== 0) return typeDiff;

      return aTitle.localeCompare(bTitle, "ru");
    });

    const colIndex = depthToColIndex.get(d);

    col.forEach((n, i) => {
      n.position({
        x: TREE_LAYOUT.leftPad + colIndex * TREE_LAYOUT.colGap,
        y: TREE_LAYOUT.firstNodeY + i * TREE_LAYOUT.rowGap
      });
    });
  }
}

function syncColumnHeaders(cy) {
  cy.nodes(".columnHeader").remove();

  const visibleNodes = getVisibleCourseNodes(cy);

  if (CURRENT_LAYOUT_CONFIG?.mode === "profile" && Array.isArray(CURRENT_LAYOUT_CONFIG.columns)) {
    const headerNodes = CURRENT_LAYOUT_CONFIG.columns.map((column, index) => ({
      data: {
        id: `__column_header_${index}`,
        label: column.text,
        width: 230
      },
      position: {
        x: TREE_LAYOUT.leftPad + index * TREE_LAYOUT.colGap,
        y: TREE_LAYOUT.headerY
      },
      classes: "columnHeader",
      selectable: false,
      grabbable: false
    }));

    cy.add(headerNodes);
    cy.nodes(".columnHeader").ungrabify();
    return;
  }

  if (!visibleNodes.length) return;

  const usedDepths = Array.from(
    new Set(visibleNodes.map(n => getDisplayDepth(n)))
  ).sort((a, b) => a - b);

  const depthToColIndex = new Map(usedDepths.map((d, i) => [d, i]));
  const groups = getColumnGroups(usedDepths);

  const headerNodes = groups.map((group, index) => {
    const colIndexes = group.depths
      .map(d => depthToColIndex.get(d))
      .filter(v => v !== undefined)
      .sort((a, b) => a - b);

    if (!colIndexes.length) return null;

    const firstX = TREE_LAYOUT.leftPad + colIndexes[0] * TREE_LAYOUT.colGap;
    const lastX = TREE_LAYOUT.leftPad + colIndexes[colIndexes.length - 1] * TREE_LAYOUT.colGap;
    const centerX = (firstX + lastX) / 2;

    const width = Math.max(230, (lastX - firstX) + 210);

    return {
      data: {
        id: `__column_header_${index}`,
        label: group.text,
        width
      },
      position: {
        x: centerX,
        y: TREE_LAYOUT.headerY
      },
      classes: "columnHeader",
      selectable: false,
      grabbable: false
    };
  }).filter(Boolean);

  cy.add(headerNodes);
  cy.nodes(".columnHeader").ungrabify();
}

function setStartViewport(cy) {
  const courseNodes = getVisibleCourseNodes(cy);
  if (!courseNodes.length) return;

  const zoom = START_VIEW.zoom;
  const courseBox = courseNodes.boundingBox({ includeLabels: false });
  const headerNodes = cy.nodes(".columnHeader");
  const headerBox = headerNodes.length
    ? headerNodes.boundingBox({ includeLabels: false })
    : courseBox;

  const contentBox = {
    x1: Math.min(courseBox.x1, headerBox.x1),
    y1: Math.min(courseBox.y1, headerBox.y1)
  };

  cy.zoom(zoom);
  cy.pan({
    x: START_VIEW.leftPadding - contentBox.x1 * zoom,
    y: START_VIEW.topPadding - contentBox.y1 * zoom
  });
}

function getCurrentViewport(cy) {
  return {
    zoom: cy.zoom(),
    pan: { ...cy.pan() }
  };
}

function getCurrentNodePositions(cy) {
  const positions = {};

  getVisibleCourseNodes(cy).forEach(n => {
    positions[n.id()] = {
      x: n.position("x"),
      y: n.position("y")
    };
  });

  return positions;
}

function restoreNodePositions(cy, positions) {
  if (!positions) return false;

  const visibleNodes = getVisibleCourseNodes(cy);
  if (!visibleNodes.length) return false;

  const hasNewVisibleNodes = visibleNodes.some(n => !positions[n.id()]);
  if (hasNewVisibleNodes) {
    return false;
  }

  visibleNodes.forEach(n => {
    n.position(positions[n.id()]);
  });

  return true;
}

function getCourseColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.unknown;
}

function dayOrder(day) {
  const map = {
    "Понедельник": 0,
    "Вторник": 1,
    "Среда": 2,
    "Четверг": 3,
    "Пятница": 4,
    "Суббота": 5,
    "Воскресенье": 6,
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
  };
  return map[day] ?? 99;
}

function timeToMinutes(t) {
  if (!t || !String(t).includes(":")) return null;
  const [hh, mm] = String(t).split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function normalizeCourseScheduleItems(courses) {
  const items = [];

  for (const c of courses) {
    if (!c?.schedule?.is_offered_this_term) continue;

    const slots = c?.schedule?.slots || [];
    for (const s of slots) {
      items.push({
        courseId: c.id,
        title: c.title,
        type: c.type,
        course: c,
        kind: s.kind || "",
        day: s.day || "",
        start: s.start || "",
        end: s.end || "",
        startMin: timeToMinutes(s.start),
        endMin: timeToMinutes(s.end),
      }); 
    }
  }

  return items
    .filter(x => dayOrder(x.day) < 6 && x.startMin != null && x.endMin != null)
    .sort((a, b) => {
      const d = dayOrder(a.day) - dayOrder(b.day);
      if (d !== 0) return d;
      return a.startMin - b.startMin;
    });
}

function courseFitsSelectedDays(course, selectedDays) {
  const allowed = new Set(selectedDays || []);
  if (!allowed.size) return false;

  const slots = course?.schedule?.slots || [];
  if (!slots.length) return false;

  return slots.every(slot => allowed.has(slot.day));
}

function scheduleItemsOverlap(a, b) {
  if (a.day !== b.day) return false;
  if (a.startMin == null || a.endMin == null || b.startMin == null || b.endMin == null) return false;

  return a.startMin < b.endMin && b.startMin < a.endMin;
}

function courseConflictsWithItems(course, items) {
  const courseItems = normalizeCourseScheduleItems([course]);

  return courseItems.some(a =>
    items.some(b => a.courseId !== b.courseId && scheduleItemsOverlap(a, b))
  );
}

function getScheduleFilteredCourses(graph, state, filter, activeProfileCourseIds = null) {
  const realFilter = {
    ...getDefaultScheduleFilter(),
    ...(filter || {})
  };

  const { doneSet, eligible } = computeEligibility(graph.courses, state);
  const plannedItems = normalizeScheduleItems(graph, state);

  return graph.courses.filter(course => {
    if (!course?.schedule?.is_offered_this_term) return false;

    if (realFilter.hideDone && doneSet.has(course.id)) return false;

    if (realFilter.onlyEligible && !eligible[course.id]) return false;

    if (
      realFilter.onlyActiveProfile &&
      activeProfileCourseIds &&
      !activeProfileCourseIds.has(course.id)
    ) {
      return false;
    }

    if (!courseFitsSelectedDays(course, realFilter.days)) return false;

    if (
      realFilter.avoidPlannedConflicts &&
      courseConflictsWithItems(course, plannedItems)
    ) {
      return false;
    }

    return true;
  });
}

function getScheduleFilteredCourseIds(graph, state, filter, activeProfileCourseIds = null) {
  return new Set(
    getScheduleFilteredCourses(graph, state, filter, activeProfileCourseIds)
      .map(course => course.id)
  );
}

function normalizeScheduleItems(graph, state) {
  const plannedSet = new Set(Object.keys(state.planned).filter(k => state.planned[k]));
  const doneSet = new Set(Object.keys(state.done).filter(k => state.done[k]));

  const plannedCourses = graph.courses.filter(course =>
    plannedSet.has(course.id) && !doneSet.has(course.id)
  );

  return normalizeCourseScheduleItems(plannedCourses);
}

function detectConflicts(items) {
  const conflicts = new Set();

  const byDay = new Map();
  for (const item of items) {
    if (!byDay.has(item.day)) byDay.set(item.day, []);
    byDay.get(item.day).push(item);
  }

  for (const [day, arr] of byDay.entries()) {
    arr.sort((a, b) => a.startMin - b.startMin);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (b.startMin < a.endMin) {
          conflicts.add(`${a.courseId}|${a.day}|${a.start}|${a.end}|${a.kind}`);
          conflicts.add(`${b.courseId}|${b.day}|${b.start}|${b.end}|${b.kind}`);
        } else {
          break;
        }
      }
    }
  }

  return conflicts;
}

function getConflictingCourseIds(graph, state) {
  const items = normalizeScheduleItems(graph, state);
  const conflicts = detectConflicts(items);
  const ids = new Set();

  for (const item of items) {
    const key = `${item.courseId}|${item.day}|${item.start}|${item.end}|${item.kind}`;
    if (conflicts.has(key)) {
      ids.add(item.courseId);
    }
  }

  return ids;
}

function getCandidateConflictWithPlannedCourseIds(graph, state) {
  const plannedItems = normalizeScheduleItems(graph, state);
  if (!plannedItems.length) return new Set();

  const { doneSet, eligible } = computeEligibility(graph.courses, state);
  const ids = new Set();

  for (const course of graph.courses) {
    if (doneSet.has(course.id)) continue;
    if (state.planned[course.id]) continue;
    if (!course?.schedule?.is_offered_this_term) continue;
    if (!eligible[course.id]) continue;

    if (courseConflictsWithItems(course, plannedItems)) {
      ids.add(course.id);
    }
  }

  return ids;
}

function getScheduleTextColor(type) {
  return type === "core" ? "#ffffff" : "#202124";
}

function getScheduleRange(items) {
  if (!items.length) {
    return { startHour: 18, endHour: 23 };
  }

  const minStart = Math.min(...items.map(x => x.startMin));
  const maxEnd = Math.max(...items.map(x => x.endMin));

  let startHour = Math.max(8, Math.floor((minStart - 30) / 60));
  let endHour = Math.min(24, Math.ceil((maxEnd + 30) / 60));

  if (endHour - startHour < 5) {
    endHour = Math.min(24, startHour + 5);
  }

  return { startHour, endHour };
}

function splitIntoClusters(dayItems) {
  const arr = [...dayItems].sort((a, b) => a.startMin - b.startMin);
  const clusters = [];

  let current = [];
  let currentEnd = -1;

  for (const item of arr) {
    if (!current.length) {
      current = [item];
      currentEnd = item.endMin;
      continue;
    }

    if (item.startMin < currentEnd) {
      current.push(item);
      currentEnd = Math.max(currentEnd, item.endMin);
    } else {
      clusters.push(current);
      current = [item];
      currentEnd = item.endMin;
    }
  }

  if (current.length) {
    clusters.push(current);
  }

  return clusters;
}

function assignLanes(cluster) {
  const sorted = [...cluster].sort((a, b) => a.startMin - b.startMin);
  const laneEnds = [];

  for (const item of sorted) {
    let lane = laneEnds.findIndex(end => end <= item.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMin);
    } else {
      laneEnds[lane] = item.endMin;
    }
    item._lane = lane;
  }

  const laneCount = laneEnds.length;
  for (const item of cluster) {
    item._laneCount = laneCount;
  }
}

function prepareDayLayout(items) {
  const byDay = new Map();

  for (const item of items) {
    if (!byDay.has(item.day)) byDay.set(item.day, []);
    byDay.get(item.day).push(item);
  }

  for (const [day, dayItems] of byDay.entries()) {
    const clusters = splitIntoClusters(dayItems);
    for (const cluster of clusters) {
      assignLanes(cluster);
    }
  }

  return byDay;
}

function buildScheduleTooltipHtml(item, options = {}) {
  const course = item.course || {};

  const prereqs = Array.isArray(course.prereqs) && course.prereqs.length
    ? course.prereqs.map(esc).join("<br/>")
    : "нет";

  const lectures = course?.hours?.lectures_per_week ?? "—";
  const seminars = course?.hours?.seminars_per_week ?? "—";
  const totalPairs = course?.hours?.total_per_week ?? "—";
  const homework = course?.difficulty?.avg_homework_hours_per_week ?? "—";

  return `
    <div class="scheduleTooltip">
      <div class="scheduleTooltipTitle">${esc(course.title || item.title)}</div>
      <div class="scheduleTooltipMeta">${esc(course.type || item.type || "unknown")}</div>

      <div class="scheduleTooltipSection">
        <b>Пререквизиты:</b><br/>
        ${prereqs}
      </div>

      <div class="scheduleTooltipSection">
        <b>Нагрузка:</b><br/>
        лекции ${esc(String(lectures))}/нед. ·
        семинары ${esc(String(seminars))}/нед. ·
        всего ${esc(String(totalPairs))}/нед.<br/>
        домашки ${esc(String(homework))} ч/нед.
      </div>

      ${options.allowSyllabusOpen && course?.syllabus_url
        ? `<div class="scheduleTooltipLink">Двойной клик по карточке — открыть силлабус ↗</div>`
        : ""
      }
    </div>
  `;
}

function buildScheduleHtmlFromItems(
  items,
  emptyMessage = "Нет курсов для отображения.",
  options = {}
) {
  const days = SCHEDULE_DAYS;
  const markConflicts = options.markConflicts ?? true;
  const calendarClass = options.calendarClass || "";
  const allowSyllabusOpen = options.allowSyllabusOpen ?? false;
  const conflicts = detectConflicts(items);
  const { startHour, endHour } = getScheduleRange(items);

  const pxPerHour = 88;
  const totalHeight = (endHour - startHour) * pxPerHour;
  const byDay = prepareDayLayout(items);

  let html = "";

  if (!items.length) {
    html += `<div class="scheduleEmpty">${esc(emptyMessage)}</div>`;
  }

  html += `<div class="scheduleCalendar ${calendarClass}">`;
  html += `<div class="scheduleHeader">`;
  html += `<div class="scheduleHeaderCell scheduleCorner"></div>`;
  for (const day of days) {
    html += `<div class="scheduleHeaderCell">${esc(day)}</div>`;
  }
  html += `</div>`;

  html += `<div class="scheduleBody">`;
  html += `<div class="scheduleTimeCol" style="height:${totalHeight}px">`;

  for (let h = startHour; h <= endHour; h++) {
    const top = (h - startHour) * pxPerHour;
    if (h < endHour) {
      html += `<div class="scheduleHourLine" style="top:${top}px"></div>`;
      html += `<div class="scheduleHalfLine" style="top:${top + pxPerHour / 2}px"></div>`;
    }
    if (h < 24) {
      html += `<div class="scheduleTimeLabel" style="top:${top}px">${String(h).padStart(2, "0")}:00</div>`;
    }
  }

  html += `</div>`;

  for (const [dayIndex, day] of days.entries()) {
    const dayItems = byDay.get(day) || [];
    html += `<div class="scheduleDayCol" style="height:${totalHeight}px">`;

    for (let h = startHour; h <= endHour; h++) {
      const top = (h - startHour) * pxPerHour;
      if (h < endHour) {
        html += `<div class="scheduleHourLine" style="top:${top}px"></div>`;
        html += `<div class="scheduleHalfLine" style="top:${top + pxPerHour / 2}px"></div>`;
      }
    }

    for (const item of dayItems) {
      const top = ((item.startMin - startHour * 60) / 60) * pxPerHour;
      const height = Math.max(42, ((item.endMin - item.startMin) / 60) * pxPerHour - 4);

      const laneCount = item._laneCount || 1;
      const lane = item._lane || 0;
      const widthPct = 100 / laneCount;
      const leftPct = lane * widthPct;

      const conflictKey = `${item.courseId}|${item.day}|${item.start}|${item.end}|${item.kind}`;
      const conflictClass = markConflicts && conflicts.has(conflictKey) ? "conflict" : "";

      const bg = getCourseColor(item.type);
      const color = getScheduleTextColor(item.type);

      const syllabusUrl = allowSyllabusOpen ? (item.course?.syllabus_url || "") : "";
      const syllabusAttr = syllabusUrl ? `data-syllabus-url="${escAttr(syllabusUrl)}"` : "";
      const syllabusClass = syllabusUrl ? "scheduleItem--syllabus" : "";
      const tooltipBelowClass = "";

      let tooltipSideClass = "";
      if (dayIndex <= 1) {
        tooltipSideClass = "scheduleItem--tooltipRight";
      } else if (dayIndex >= 4) {
        tooltipSideClass = "scheduleItem--tooltipLeft";
      }

      html += `
        <div
          class="scheduleItem ${conflictClass} ${syllabusClass} ${tooltipBelowClass} ${tooltipSideClass}"
          ${syllabusAttr}
          style="
            top:${top + 2}px;
            height:${height}px;
            left:calc(${leftPct}% + 4px);
            width:calc(${widthPct}% - 8px);
            background:${bg};
            color:${color};
          "
        >
          <div class="scheduleItemInner">
            <div class="scheduleItemTitle">${esc(item.title)}</div>
            <div class="scheduleItemMeta">${esc(item.kind)} · ${esc(item.start)}–${esc(item.end)}</div>
          </div>

          ${buildScheduleTooltipHtml(item, {
            allowSyllabusOpen: allowSyllabusOpen && !!syllabusUrl
          })}
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `</div></div>`;

  const initialScrollTop = Math.max(
    0,
    ((Math.min(...(items.map(x => x.startMin))) || startHour * 60) - startHour * 60 - 30) / 60 * pxPerHour
  );

  return {
    html,
    conflictCount: conflicts.size,
    initialScrollTop: Number.isFinite(initialScrollTop) ? initialScrollTop : 0
  };
}

function buildScheduleHtml(graph, state) {
  return buildScheduleHtmlFromItems(
    normalizeScheduleItems(graph, state),
    "Запланированные курсы текущего семестра не выбраны.",
    {
      allowSyllabusOpen: false
    }
  );
}

function buildOfferedScheduleHtml(graph, state, filter, activeProfileCourseIds = null) {
  const courses = getScheduleFilteredCourses(graph, state, filter, activeProfileCourseIds);
  const result = buildScheduleHtmlFromItems(
    normalizeCourseScheduleItems(courses),
    "По выбранным фильтрам курсов не найдено.",
    {
      markConflicts: false,
      calendarClass: "scheduleCalendarAll",
      allowSyllabusOpen: true
    }
  );

  return {
    ...result,
    courseCount: courses.length
  };
}

async function main() {
  const state = loadState();
  ensureProfileState(state);
  let clickMode = "info";
  let currentTheme = loadTheme();

  applyDocumentTheme(currentTheme);

  if (state.nodeDragLocked === undefined) {
    state.nodeDragLocked = true;
  }

  // const graph = await fetch("/api/graph").then(r => r.json());

  // const presetDoneIds = buildPresetDoneIds(graph);

  // if (FORCE_TEST_PRESET_ON_LOAD) {
  //   applyPresetState(state, presetDoneIds);
  //   saveState(state);
  // }
  const graph = await fetch("/api/graph").then(r => r.json());
  let profilesData = await loadProfilesData();
  validateProfilesAgainstGraph(profilesData, graph);

  function renderProfileCourseLink(title, suffix = "") {
    const { byTitle } = getCourseTitleMaps(graph);
    const course = byTitle.get(normalizeProfileTitle(title));

    const safeTitle = escapeProfileHtml(title);
    const safeSuffix = suffix || "";

    if (!course?.syllabus_url) {
      return `<span class="profileCourseName">${safeTitle}</span>${safeSuffix}`;
    }

    return `
      <a
        class="profileCourseLink"
        href="${escapeProfileHtml(course.syllabus_url)}"
        target="_blank"
        rel="noopener noreferrer"
        title="Открыть силлабус"
      >${safeTitle}</a>${safeSuffix}
    `;
  }



  function renderProfilesModal() {
    const body = document.getElementById("profilesModalBody");
    if (!body) return;

    const profiles = getProfilesList(profilesData);

    if (!profiles.length) {
      body.innerHTML = `<div class="profileEmpty">Профили не найдены.</div>`;
      return;
    }

    body.innerHTML = `
      <div class="profileGrid">
        ${profiles.map(profile => {
      const choices = getProfileChoices(state, profile);

      const choicesHtml = getProfileChoiceGroups(profile).map(group => `
            <div class="profileChoice">
              <label>${escapeProfileHtml(group.title || "Вариант")}</label>
              <select data-profile-id="${escapeProfileHtml(profile.id)}" data-choice-group-id="${escapeProfileHtml(group.id)}">
                ${(group.options || []).map(option => `
                  <option value="${escapeProfileHtml(option.id)}" ${choices[group.id] === option.id ? "selected" : ""}>
                    ${escapeProfileHtml(option.label || option.id)}
                  </option>
                `).join("")}
              </select>
            </div>
          `).join("");

      const semestersHtml = (profile.semesters || []).map(semester => `
        <div class="profileSemester">
          <div class="profileSemesterTitle">${escapeProfileHtml(semester.title || `Семестр ${semester.number || ""}`)}</div>
          <ul class="profileList">
            ${(semester.courses || []).map(course => `
              <li>${renderProfileCourseLink(course)}</li>
            `).join("")}

            ${(semester.choiceGroupIds || []).map(groupId => {
      const option = findProfileChoiceOption(profile, groupId, choices[groupId]);

      return (option?.courses || []).map(course => `
                <li>
                  ${renderProfileCourseLink(course, ` <span class="small">(вариант)</span>`)}
                </li>
              `).join("");
    }).join("")}
          </ul>
        </div>
      `).join("");

      return `
            <article class="profileCard">
              <div class="profileCardHeader">
                <h4>${escapeProfileHtml(profile.title)}</h4>
                <div class="profileTags">
                  <span class="profileTag">${escapeProfileHtml(profile.goalType)}</span>
                  <span class="profileTag">${escapeProfileHtml(profile.difficultyLevel)}</span>
                </div>
              </div>

              <div class="profileCardBody">
                <div class="profileBlock">
                  <div class="profileBlockTitle">Кто это</div>
                  <div class="profileBlockText">${escapeProfileHtml(profile.audience)}</div>
                </div>

                <div class="profileBlock">
                  <div class="profileBlockTitle">Цель</div>
                  <div class="profileBlockText">${escapeProfileHtml(profile.goal)}</div>
                </div>

                <div class="profileBlock">
                  <div class="profileBlockTitle">Нагрузка</div>
                  <div class="profileBlockText">${escapeProfileHtml(profile.workload)}</div>
                </div>

                <div class="profileBlock">
                  <div class="profileBlockTitle">Баланс сложности</div>
                  <div class="profileBlockText">${escapeProfileHtml(profile.difficultyBalance)}</div>
                </div>

                <div class="profileBlock">
                  <div class="profileBlockTitle">Логика набора</div>
                  <ul class="profileList">
                    ${(profile.selectionLogic || []).map(item => `<li>${escapeProfileHtml(item)}</li>`).join("")}
                  </ul>
                </div>

                ${choicesHtml}

                <div class="profileBlock">
                  <div class="profileBlockTitle">Курсы по семестрам</div>
                  ${semestersHtml}
                </div>
              </div>

              <div class="profileCardFooter">
                <button class="profileApplyBtn" type="button" data-apply-profile-id="${escapeProfileHtml(profile.id)}">
                  Показать на дереве
                </button>
              </div>
            </article>
          `;
    }).join("")}
      </div>
    `;

    body.querySelectorAll("select[data-profile-id][data-choice-group-id]").forEach(select => {
      select.addEventListener("change", () => {
        const profileId = select.dataset.profileId;
        const groupId = select.dataset.choiceGroupId;

        if (!state.profileChoices[profileId]) state.profileChoices[profileId] = {};
        state.profileChoices[profileId][groupId] = select.value;

        saveState(state);
        renderProfilesModal();

        if (state.activeProfileId === profileId) {
          render({ preserveViewport: false, resetPositions: true });
        }
      });
    });

    body.querySelectorAll("[data-apply-profile-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const profileId = btn.dataset.applyProfileId;
        state.activeProfileId = profileId;

        const profile = getProfileById(profilesData, profileId);
        if (profile && !state.profileChoices[profileId]) {
          state.profileChoices[profileId] = getDefaultProfileChoices(profile);
        }

        enableAllLegendFilters();

        saveState(state);
        closeProfilesModal();
        render({ preserveViewport: false, resetPositions: true });
      });
    });
  }

  async function openProfilesModal() {
    const modal = document.getElementById("profilesModal");
    if (!modal) return;

    profilesData = await loadProfilesData();
    validateProfilesAgainstGraph(profilesData, graph);

    renderProfilesModal();
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeProfilesModal() {
    const modal = document.getElementById("profilesModal");
    if (!modal) return;

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function updateActiveProfileBanner() {
    const banner = document.getElementById("activeProfileBanner");
    if (!banner) return;

    const profile = getProfileById(profilesData, state.activeProfileId);

    if (!profile) {
      banner.classList.add("hidden");
      banner.innerHTML = "";
      return;
    }

    banner.classList.remove("hidden");
    banner.innerHTML = `
      <div class="activeProfileBannerText">
        Активен профиль: <b>${escapeProfileHtml(profile.title)}</b>
      </div>
      <button id="resetProfileBtn" type="button">Сбросить профиль</button>
    `;

    const resetBtn = document.getElementById("resetProfileBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.activeProfileId = null;
        saveState(state);
        render({ preserveViewport: false, resetPositions: true });
      });
    }
  }

  function getActiveProfileLayoutInfo() {
    const profile = getProfileById(profilesData, state.activeProfileId);
    if (!profile) return null;

    const choices = getProfileChoices(state, profile);
    return getProfileLayoutInfo(profile, choices, graph);
  }

  function getActiveProfileCourseIds() {
    const activeProfileLayoutInfo = getActiveProfileLayoutInfo();
    return activeProfileLayoutInfo?.courseIds || null;
  }

  function getActiveScheduleFilterCourseIds() {
    const filter = state.activeScheduleFilter;
    if (!filter?.enabled) return null;

    return getScheduleFilteredCourseIds(
      graph,
      state,
      filter,
      getActiveProfileCourseIds()
    );
  }

  function describeScheduleFilter(filter) {
    if (!filter?.enabled) return "";

    const parts = [];

    if (filter.onlyEligible) parts.push("доступные по пререквизитам");
    if (filter.hideDone) parts.push("без пройденных");
    if (filter.avoidPlannedConflicts) parts.push("без пересечений с запланированными");
    if (filter.onlyActiveProfile) parts.push("только активный профиль");

    const days = filter.days || [];
    if (days.length && days.length < SCHEDULE_DAYS.length) {
      const shortDays = {
        "Понедельник": "Пн",
        "Вторник": "Вт",
        "Среда": "Ср",
        "Четверг": "Чт",
        "Пятница": "Пт",
        "Суббота": "Сб"
      };

      parts.push(`дни: ${days.map(day => shortDays[day] || day).join(", ")}`);
    }

    return parts.join(", ");
  }

  function updateActiveScheduleFilterBanner() {
    const banner = document.getElementById("activeScheduleFilterBanner");
    if (!banner) return;

    const filter = state.activeScheduleFilter;

    if (!filter?.enabled) {
      banner.classList.add("hidden");
      banner.innerHTML = "";
      return;
    }

    banner.classList.remove("hidden");
    banner.innerHTML = `
      <div class="activeProfileBannerText">
        Активен фильтр расписания: <b>${esc(describeScheduleFilter(filter) || "настроенный фильтр")}</b>
      </div>
      <button id="resetScheduleFilterBtn" type="button">Сбросить фильтр расписания</button>
    `;

    const resetBtn = document.getElementById("resetScheduleFilterBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.activeScheduleFilter = null;
        saveState(state);
        render({ preserveViewport: false, resetPositions: true });
      });
    }
  }

  function enableAllLegendFilters() {
  [
    "fFund",
    "fCore",
    "fSelected",
    "fFlex",
    "fDone",
    "fPlanned",
    "fLocked",
    "fNotOffered",
    "fConflictWithPlanned"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  });
  }

  const cy = cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    wheelSensitivity: 0.15,
    minZoom: 0.35,
    maxZoom: 2.5,
    userZoomingEnabled: false,
    style: [
      {
        selector: "node",
        style: {
          "shape": "round-rectangle",
          "label": "data(label)",
          "font-size": 14,
          "text-valign": "center",
          "text-halign": "center",
          "text-wrap": "wrap",
          "text-max-width": 200,
          "background-color": (ele) => TYPE_COLORS[ele.data("type")] || TYPE_COLORS.unknown,
          "color": "#0b1020",
          "text-outline-width": 0,
          "width": 210,
          "height": 58,
          "z-index-compare": "manual",
          "z-index": 100,
          "border-width": 2,
          "border-color": "rgba(255,255,255,0.22)",
          "padding": "7px",
        }
      },
      {
        selector: ".columnHeader",
        style: {
          "shape": "round-rectangle",
          "width": "data(width)",
          "height": 46,
          "label": "data(label)",
          "font-size": 16,
          "font-weight": 700,
          "text-wrap": "none",
          "text-max-width": "data(width)",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": "#f7f9ff",
          "border-width": 2,
          "border-color": "#d8dde8",
          "color": "#202124",
          "z-index": 220,
          "padding": "8px",
          "shadow-blur": 16,
          "shadow-opacity": 0.20,
          "shadow-color": "rgba(20,28,45,0.18)",
          "shadow-offset-y": 4
        }
      },
      {
        selector: ".done",
        style: {
          "border-width": 12,
          "border-color": "rgba(28, 176, 35, 1)",
          "shadow-color": "rgba(28, 176, 35, 0.34)",
          "shadow-blur": 18,
          "shadow-opacity": 0.34,
          "padding": "6px"
        }
      },
      {
        selector: ".planned",
        style: {
          "border-width": 12,
          "border-color": "rgba(198, 0, 235, 1)",
          "shadow-color": "rgba(198, 0, 235, 0.34)",
          "shadow-blur": 18,
          "shadow-opacity": 0.34,
          "padding": "1px"
        }
      },
      {
        selector: ".planned.scheduleConflict",
        style: {
          "border-width": 12,
          "border-color": "rgba(255, 56, 56, 1)",
          "shadow-color": "rgba(255, 56, 56, 0.66)",
          "shadow-blur": 20,
          "shadow-opacity": 0.44
        }
      },
      {
        selector: ".candidateScheduleConflict",
        style: {
          "border-width": 8,
          "border-style": "dashed",
          "border-color": "rgba(255, 128, 32, 1)",
          "shadow-color": "rgba(255, 128, 32, 0.34)",
          "shadow-blur": 16,
          "shadow-opacity": 0.34
        }
      },
      {
        selector: 'node[type = "core"]',
        style: {
          "color": "rgba(255,255,255,0.92)",
          "text-outline-width": 1,
          "text-outline-color": "rgba(0,0,0,0.25)"
        }
      },
      {
        selector: "edge",
        style: {
          "width": 0.7,
          "line-color": "rgba(54, 65, 82, 0.22)",
          "target-arrow-color": "rgba(54, 65, 82, 0.22)",
          "opacity": 0.32,
          "curve-style": "bezier",
          "control-point-step-size": 60,
          "arrow-scale": 0.55
        }
      },
      {
        selector: "edge.highlightIn",
        style: {
          "line-color": "rgba(80, 180, 255, 0.85)",
          "target-arrow-color": "rgba(80, 180, 255, 0.85)",
          "width": 2.2,
          "opacity": 1
        }
      },
      {
        selector: "edge.highlightOut",
        style: {
          "line-color": "rgba(120, 255, 180, 0.85)",
          "target-arrow-color": "rgba(120, 255, 180, 0.85)",
          "width": 2.2,
          "opacity": 1
        }
      },
      {
        selector: "node.highlight",
        style: {
          "border-width": 4,
          "border-color": "#477dff",
          "shadow-blur": 20,
          "shadow-opacity": 0.6,
          "shadow-color": "rgba(71,125,255,0.35)",
          "text-outline-width": 0
        }
      },
      {
        selector: ".locked",
        style: {
          "opacity": 0.34,
          "color": "rgba(48, 55, 69, 0.74)",
          "text-outline-width": 0
        }
      },
      {
        selector: ".notOffered",
        style: {
          "background-blacken": 0.12,
          "background-opacity": 0.82,

          "border-style": "dotted",
          "border-width": 8,
          "border-color": "rgba(170,70,70,0.95)"
        }
      },
      {
        selector: "node:selected",
        style: {
          "border-width": 4,
          "border-color": "#477dff",
          "shadow-blur": 18,
          "shadow-opacity": 0.45,
          "shadow-color": "rgba(71,125,255,0.35)",
          "shadow-offset-x": 0,
          "shadow-offset-y": 2
        }
      },
      {
        selector: "node.searchHit",
        style: {
          "opacity": 1,
          "background-blacken": 0,
          "background-opacity": 1,
          // "color": "rgba(255,255,255,0.98)",
          // "text-outline-width": 1,
          // "text-outline-color": "rgba(0,0,0,0.45)",
          "shadow-blur": 28,
          "shadow-opacity": 0.75,
          "shadow-color": "rgba(71,125,255,0.42)",
          "border-width": 5,
          "border-color": "#477dff",
          "z-index": 160
        }
      },
      {
        selector: 'node.searchHit[type = "fundamentals"]',
        style: {
          "color": "rgba(4, 12, 24, 0.94)",
          "text-outline-width": 0
        }
      },
      {
        selector: 'node.searchHit[type = "selected"]',
        style: {
          "color": "rgba(4, 12, 24, 0.94)",
          "text-outline-width": 0
        }
      },
      {
        selector: 'node.searchHit[type = "flex"]',
        style: {
          "color": "rgba(4, 12, 24, 0.94)",
          "text-outline-width": 0
        }
      },
      {
        selector: 'node.searchHit[type = "core"]',
        style: {
          "color": "rgba(255,255,255,0.96)",
          "text-outline-width": 1,
          "text-outline-color": "rgba(0,0,0,0.45)"
        }
      },
      {
        selector: "node.locked.searchHit",
        style: {
          "opacity": 0.62,
          "background-opacity": 0.9,
          // "color": "rgba(255,255,255,0.95)",
          "shadow-blur": 24,
          "shadow-opacity": 0.55,
          "border-width": 5,
          "border-color": "rgba(71,125,255,0.72)",
          "z-index": 150
        }
      },
      {
        selector: "node.notOffered.searchHit",
        style: {
          "opacity": 0.78,
          "background-opacity": 0.92,
          "shadow-opacity": 0.58,
          "border-color": "rgba(255,210,210,0.9)"
        }
      },
      {
        selector: "node.searchDim",
        style: {
          "opacity": 0.13
        }
      },
      {
        selector: "edge.searchDim",
        style: {
          "opacity": 0.055
        }
      },
    ]
  });


  function applyCytoscapeTheme(theme) {
    const isDark = theme === "dark";

    cy.style()
      .selector(".columnHeader")
      .style({
        "background-color": isDark ? "rgba(17, 25, 54, 0.96)" : "#f7f9ff",
        "border-color": isDark ? "rgba(255,255,255,0.18)" : "#d8dde8",
        "color": isDark ? "rgba(233,238,255,0.96)" : "#202124",
        "shadow-color": isDark ? "rgba(0,0,0,0.65)" : "rgba(20,28,45,0.18)"
      })
      .selector("edge")
      .style({
        "line-color": isDark ? "rgba(255,255,255,0.05)" : "rgba(54, 65, 82, 0.22)",
        "target-arrow-color": isDark ? "rgba(255,255,255,0.05)" : "rgba(54, 65, 82, 0.22)",
        "opacity": isDark ? 0.15 : 0.32
      })
      .selector("edge.highlightIn")
      .style({
        "line-color": isDark ? "rgba(80, 180, 255, 0.85)" : "rgba(37, 99, 235, 0.9)",
        "target-arrow-color": isDark ? "rgba(80, 180, 255, 0.85)" : "rgba(37, 99, 235, 0.9)"
      })
      .selector("edge.highlightOut")
      .style({
        "line-color": isDark ? "rgba(120, 255, 180, 0.85)" : "rgba(22, 163, 74, 0.9)",
        "target-arrow-color": isDark ? "rgba(120, 255, 180, 0.85)" : "rgba(22, 163, 74, 0.9)"
      })
      .selector("node.highlight")
      .style({
        "border-color": isDark ? "rgba(255,255,255,0.95)" : "#477dff",
        "shadow-color": isDark ? "rgba(255,255,255,0.75)" : "rgba(71,125,255,0.35)"
      })
      .selector("node:selected")
      .style({
        "border-color": isDark ? "rgba(255,255,255,0.98)" : "#477dff",
        "shadow-color": isDark ? "rgba(255,255,255,0.75)" : "rgba(71,125,255,0.35)"
      })
      .selector(".candidateScheduleConflict")
      .style({
        "border-color": isDark ? "rgba(255, 186, 110, 1)" : "rgba(255, 128, 32, 1)",
        "shadow-color": isDark ? "rgba(255, 186, 110, 0.38)" : "rgba(255, 128, 32, 0.34)"
      })
      .selector(".locked")
      .style({
        "opacity": 0.34,
        "color": isDark ? "rgba(210, 220, 235, 0.72)" : "rgba(48, 55, 69, 0.74)",
        "text-outline-width": isDark ? 1 : 0,
        "text-outline-color": isDark ? "rgba(0,0,0,0.25)" : "transparent"
      })
      .selector("node.searchHit")
      .style({
        "opacity": 1,
        "background-blacken": 0,
        "background-opacity": 1,
        "border-width": 7,
        "border-color": isDark ? "rgba(255,255,255,0.96)" : "#477dff",
        "shadow-blur": 34,
        "shadow-opacity": isDark ? 0.95 : 0.78,
        "shadow-color": isDark ? "rgba(255,255,255,0.86)" : "rgba(71,125,255,0.46)",
        "z-index": 190
      })
      .selector("node.locked.searchHit")
      .style({
        "opacity": isDark ? 0.48 : 0.44,
        "background-blacken": isDark ? 0.28 : 0.18,
        "background-opacity": isDark ? 0.78 : 0.72,
        "border-width": 5,
        "border-color": isDark ? "rgba(150,160,180,0.78)" : "rgba(120,130,150,0.58)",
        "shadow-blur": 12,
        "shadow-opacity": isDark ? 0.18 : 0.14,
        "shadow-color": isDark ? "rgba(180,190,210,0.35)" : "rgba(120,130,150,0.30)",
        "color": isDark ? "rgba(220,225,238,0.58)" : "rgba(45,55,70,0.56)",
        "text-outline-width": isDark ? 1 : 0,
        "text-outline-color": isDark ? "rgba(0,0,0,0.35)" : "transparent",
        "z-index": 170
      })
      .selector("node.notOffered.searchHit")
      .style({
        "opacity": isDark ? 0.9 : 0.82,
        "background-opacity": 0.96,
        "border-width": 7,
        "border-color": isDark ? "rgba(255,225,225,0.95)" : "rgba(255,120,120,0.9)",
        "shadow-blur": 32,
        "shadow-opacity": 0.72,
        "shadow-color": "rgba(255,140,140,0.56)",
        "z-index": 186
      })
      .selector("node.searchDim")
      .style({
        "opacity": isDark ? 0.18 : 0.13
      })
      .selector("edge.searchDim")
      .style({
        "opacity": isDark ? 0.08 : 0.055
      })
      .update();
  }

  applyCytoscapeTheme(currentTheme);

  const cyContainer = document.getElementById("cy");

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  cyContainer.addEventListener("wheel", (e) => {
    // работаем только внутри дерева
    e.preventDefault();

    const rect = cyContainer.getBoundingClientRect();
    const renderedPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // На большинстве браузеров pinch на тачпаде приходит как wheel + ctrlKey=true
    const isPinchGesture = e.ctrlKey;

    if (isPinchGesture) {
      const currentZoom = cy.zoom();
      const zoomFactor = Math.exp(-e.deltaY * 0.01);
      const nextZoom = clamp(currentZoom * zoomFactor, cy.minZoom(), cy.maxZoom());

      cy.zoom({
        level: nextZoom,
        renderedPosition
      });

      updateZoomLabel();
      return;
    }

    // Обычное движение двумя пальцами = панорамирование
    cy.panBy({
      x: -e.deltaX,
      y: -e.deltaY
    });

    updateZoomLabel();
  }, { passive: false });

  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomLabel = document.getElementById("zoomLabel");
  const toggleDragBtn = document.getElementById("toggleDragBtn");
  const resetViewBtn = document.getElementById("resetViewBtn");
  // const taskBtn = document.getElementById("taskBtn");
  // const completeBtn = document.getElementById("completeBtn");
  // const closeFinishModalBtn = document.getElementById("closeFinishModal");
  // const finishModalBackdrop = document.querySelector("#finishModal .taskModalBackdrop");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const profilesBtn = document.getElementById("profilesBtn");
  const closeProfilesModalBtn = document.getElementById("closeProfilesModal");
  const profilesModalBackdrop = document.querySelector("#profilesModal .profilesModalBackdrop");

  if (profilesBtn) {
    profilesBtn.addEventListener("click", openProfilesModal);
  }

  if (closeProfilesModalBtn) {
    closeProfilesModalBtn.addEventListener("click", closeProfilesModal);
  }

  if (profilesModalBackdrop) {
    profilesModalBackdrop.addEventListener("click", closeProfilesModal);
  }

  // if (completeBtn) {
  //   completeBtn.addEventListener("click", () => handleFinishCheck(graph, state));
  // }

  // if (closeFinishModalBtn) {
  //   closeFinishModalBtn.addEventListener("click", hideFinishPrompt);
  // }

  // if (finishModalBackdrop) {
  //   finishModalBackdrop.addEventListener("click", hideFinishPrompt);
  // }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      saveTheme(currentTheme);
      applyDocumentTheme(currentTheme);
      applyCytoscapeTheme(currentTheme);
    });
  }


  function updateZoomLabel() {
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(cy.zoom() * 100)}%`;
    }
  }

  function applyNodeDragMode() {
    if (state.nodeDragLocked) {
      cy.nodes().ungrabify();
      if (toggleDragBtn) toggleDragBtn.textContent = "Разблокировать узлы";
    } else {
      cy.nodes().grabify();
      if (toggleDragBtn) toggleDragBtn.textContent = "Зафиксировать узлы";
    }
    cy.nodes(".columnHeader").ungrabify();
  }

  function zoomAroundCenter(multiplier) {
    const currentZoom = cy.zoom();
    const newZoom = Math.max(0.35, Math.min(2.5, currentZoom * multiplier));

    cy.zoom({
      level: newZoom,
      renderedPosition: {
        x: cy.width() / 2,
        y: cy.height() / 2
      }
    });

    updateZoomLabel();
  }


  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => zoomAroundCenter(1.2));
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => zoomAroundCenter(1 / 1.2));
  }

  if (toggleDragBtn) {
    toggleDragBtn.addEventListener("click", () => {
      state.nodeDragLocked = !state.nodeDragLocked;
      saveState(state);
      applyNodeDragMode();
    });
  }

  if (resetViewBtn) {
    resetViewBtn.addEventListener("click", () => {
      render({ preserveViewport: false, resetPositions: true });
    });
  }

  cy.on("zoom pan", () => {
    updateZoomLabel();
  });

  const openScheduleBtn = document.getElementById("openSchedule");
  const closeScheduleBtn = document.getElementById("closeSchedule");
  const scheduleBackdrop = document.getElementById("scheduleBackdrop");
  const scheduleModal = document.getElementById("scheduleModal");
  const scheduleGrid = document.getElementById("scheduleGrid");
  const scheduleConflicts = document.getElementById("scheduleConflicts");

  const scheduleTabPlanned = document.getElementById("scheduleTabPlanned");
  const scheduleTabAll = document.getElementById("scheduleTabAll");
  const scheduleAllControls = document.getElementById("scheduleAllControls");
  const applyScheduleFilterToTreeBtn = document.getElementById("applyScheduleFilterToTree");

  let scheduleViewMode = "planned";

  function getScheduleFilterStateFromControls() {
    const selectedDays = Array.from(document.querySelectorAll("[data-schedule-day]"))
      .filter(input => input.checked)
      .map(input => input.dataset.scheduleDay);

    return {
      ...getDefaultScheduleFilter(),
      onlyEligible: document.getElementById("sfEligible")?.checked ?? true,
      hideDone: document.getElementById("sfHideDone")?.checked ?? true,
      avoidPlannedConflicts: document.getElementById("sfNoPlannedConflicts")?.checked ?? false,
      onlyActiveProfile: document.getElementById("sfActiveProfile")?.checked ?? false,
      days: selectedDays
    };
  }

  function updateScheduleTabsUi() {
    scheduleTabPlanned?.classList.toggle("is-active", scheduleViewMode === "planned");
    scheduleTabAll?.classList.toggle("is-active", scheduleViewMode === "all");

    if (scheduleAllControls) {
      scheduleAllControls.classList.toggle("hidden", scheduleViewMode !== "all");
    }

    const activeProfileCheckbox = document.getElementById("sfActiveProfile");
    if (activeProfileCheckbox) {
      activeProfileCheckbox.disabled = !state.activeProfileId;

      if (!state.activeProfileId) {
        activeProfileCheckbox.checked = false;
      }
    }
  }

  function measureScheduleTooltipHeight(itemEl) {
    const tooltipEl = itemEl.querySelector(".scheduleTooltip");
    if (!tooltipEl) return 220;

    const prevDisplay = tooltipEl.style.display;
    const prevVisibility = tooltipEl.style.visibility;

    tooltipEl.style.display = "block";
    tooltipEl.style.visibility = "hidden";

    const height = tooltipEl.getBoundingClientRect().height || 220;

    tooltipEl.style.display = prevDisplay;
    tooltipEl.style.visibility = prevVisibility;

    return height;
  }

  function updateScheduleTooltipDirections() {
    if (!scheduleGrid) return;

    const wrapRect = scheduleGrid.getBoundingClientRect();
    const itemEls = scheduleGrid.querySelectorAll(".scheduleItem");

    itemEls.forEach(itemEl => {
      itemEl.classList.remove("scheduleItem--tooltipBelow");

      const itemRect = itemEl.getBoundingClientRect();
      const tooltipHeight = measureScheduleTooltipHeight(itemEl);
      const gap = 12;

      const spaceAbove = itemRect.top - wrapRect.top;
      const spaceBelow = wrapRect.bottom - itemRect.bottom;

      const shouldOpenBelow =
        (spaceBelow >= tooltipHeight + gap) ||
        (spaceBelow > spaceAbove);

      if (shouldOpenBelow) {
        itemEl.classList.add("scheduleItem--tooltipBelow");
      }
    });
  }

  function renderScheduleModal() {
    updateScheduleTabsUi();

    const result = scheduleViewMode === "all"
      ? buildOfferedScheduleHtml(
          graph,
          state,
          getScheduleFilterStateFromControls(),
          getActiveProfileCourseIds()
        )
      : buildScheduleHtml(graph, state);

    scheduleGrid.innerHTML = result.html;

    if (scheduleViewMode === "all") {
      const countText = `Найдено курсов: ${result.courseCount ?? 0}.`;
      scheduleConflicts.textContent =
        `${countText} Наведи на карточку курса, чтобы увидеть детали. Двойной клик по карточке откроет силлабус.`;
    } else {
      if (result.conflictCount > 0) {
        scheduleConflicts.textContent = `Обнаружены пересечения в расписании. Проверь конфликтующие пары.`;
      } else {
        scheduleConflicts.textContent = `Пересечений не найдено.`;
      }
    }

    requestAnimationFrame(() => {
      scheduleGrid.scrollTop = result.initialScrollTop || 0;

      requestAnimationFrame(() => {
        updateScheduleTooltipDirections();
      });
    });
  }

  function openScheduleModal() {
    scheduleViewMode = "planned";
    renderScheduleModal();
    scheduleModal.classList.remove("hidden");
  }

  function closeScheduleModal() {
    scheduleModal.classList.add("hidden");
  }

  if (openScheduleBtn) {
    openScheduleBtn.addEventListener("click", openScheduleModal);
  }

  if (closeScheduleBtn) {
    closeScheduleBtn.addEventListener("click", closeScheduleModal);
  }

  if (scheduleBackdrop) {
    scheduleBackdrop.addEventListener("click", closeScheduleModal);
  }

  if (scheduleTabPlanned) {
    scheduleTabPlanned.addEventListener("click", () => {
      scheduleViewMode = "planned";
      renderScheduleModal();
    });
  }

  if (scheduleGrid) {
    scheduleGrid.addEventListener("dblclick", (evt) => {
      if (scheduleViewMode !== "all") return;

      const card = evt.target.closest(".scheduleItem");
      if (!card) return;

      const url = card.dataset.syllabusUrl;
      if (!url) return;

      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  if (scheduleGrid) {
    scheduleGrid.addEventListener("scroll", () => {
      if (!scheduleModal.classList.contains("hidden")) {
        updateScheduleTooltipDirections();
      }
    });
  }

  if (scheduleTabAll) {
    scheduleTabAll.addEventListener("click", () => {
      scheduleViewMode = "all";
      renderScheduleModal();
    });
  }

  document.querySelectorAll(
    "#sfEligible, #sfHideDone, #sfNoPlannedConflicts, #sfActiveProfile, [data-schedule-day]"
  ).forEach(input => {
    input.addEventListener("change", () => {
      if (scheduleViewMode === "all") {
        renderScheduleModal();
      }
    });
  });

  if (applyScheduleFilterToTreeBtn) {
    applyScheduleFilterToTreeBtn.addEventListener("click", () => {
      state.activeScheduleFilter = getScheduleFilterStateFromControls();

      saveState(state);
      closeScheduleModal();
      render({ preserveViewport: false, resetPositions: true });
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (!scheduleModal.classList.contains("hidden")) {
      closeScheduleModal();
    }

    const profilesModal = document.getElementById("profilesModal");
    if (profilesModal && !profilesModal.classList.contains("hidden")) {
      closeProfilesModal();
    }

    // const taskModal = document.getElementById("taskModal");
    // if (taskModal && !taskModal.classList.contains("hidden")) {
    //   hideTaskPrompt();
    // }

    // const finishModal = document.getElementById("finishModal");
    // if (finishModal && !finishModal.classList.contains("hidden")) {
    //   hideFinishPrompt();
    // }
  });

  function setCardCollapsed(cardEl, collapsed) {
    if (!cardEl) return;
    cardEl.classList.toggle("is-collapsed", collapsed);

    const btn = cardEl.querySelector(".cardToggle");
    if (btn) {
      btn.setAttribute("aria-expanded", String(!collapsed));
    }
  }

  document.querySelectorAll(".cardToggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".cardCollapsible");
      if (!card) return;
      setCardCollapsed(card, !card.classList.contains("is-collapsed"));
    });
  });

  function render({ preserveViewport = false, resetPositions = false } = {}) {
    const groupByDepth = true;

    const prevViewport = preserveViewport && cy.nodes().length
      ? getCurrentViewport(cy)
      : null;

    const prevPositions = preserveViewport && !resetPositions && cy.nodes().length
      ? getCurrentNodePositions(cy)
      : null;

    const { nodes, edges } = buildElements(graph, state);

    cy.elements().remove();
    cy.add(nodes);
    cy.add(edges);

    const activeProfileLayoutInfo = getActiveProfileLayoutInfo();
    const activeProfileCourseIds = activeProfileLayoutInfo?.courseIds || null;
    const activeScheduleCourseIds = getActiveScheduleFilterCourseIds();

    CURRENT_LAYOUT_CONFIG = activeProfileLayoutInfo
      ? {
          mode: "profile",
          columns: activeProfileLayoutInfo.columns
        }
      : null;

    cy.nodes().forEach(node => {
      const profileColumn = activeProfileLayoutInfo?.courseColumnById.get(node.id());
      node.data("profileSemesterColumn", profileColumn ?? null);
    });

    const filters = {
      fundamentals: document.getElementById("fFund")?.checked ?? true,
      core: document.getElementById("fCore")?.checked ?? true,
      selected: document.getElementById("fSelected")?.checked ?? true,
      flex: document.getElementById("fFlex")?.checked ?? true,
      done: document.getElementById("fDone")?.checked ?? true,
      planned: document.getElementById("fPlanned")?.checked ?? true,
      locked: document.getElementById("fLocked")?.checked ?? true,
      notOffered: document.getElementById("fNotOffered")?.checked ?? true,
      conflictWithPlanned: document.getElementById("fConflictWithPlanned")?.checked ?? true,
    };

    cy.nodes().forEach(node => {
      const t = node.data("type");
      const isDone = node.hasClass("done");
      const isPlanned = node.hasClass("planned");
      const isLocked = node.hasClass("locked");
      const isNotOffered = node.hasClass("notOffered");
      const isConflictWithPlanned = node.hasClass("candidateScheduleConflict");

      let show = true;

      if (t === "fundamentals" && !filters.fundamentals) show = false;
      if (t === "core" && !filters.core) show = false;
      if (t === "selected" && !filters.selected) show = false;
      if (t === "flex" && !filters.flex) show = false;

      if (isDone && !filters.done) show = false;
      if (isPlanned && !filters.planned) show = false;
      if (isLocked && !filters.locked) show = false;
      if (isNotOffered && !filters.notOffered) show = false;
      if (isConflictWithPlanned && !filters.conflictWithPlanned) show = false;

      if (activeProfileCourseIds && !activeProfileCourseIds.has(node.id())) {
        show = false;
      }

      if (activeScheduleCourseIds && !activeScheduleCourseIds.has(node.id())) {
        show = false;
      }

      node.style("display", show ? "element" : "none");
    });

    cy.edges().forEach(e => {
      const s = e.source();
      const t = e.target();
      const show = s.style("display") !== "none" && t.style("display") !== "none";
      e.style("display", show ? "element" : "none");
    });

    if (groupByDepth) {
      const restored = preserveViewport && !resetPositions
        ? restoreNodePositions(cy, prevPositions)
        : false;

      if (!restored) {
        presetPositionsByDepth(cy);
      }
    }

    syncColumnHeaders(cy);
    applyNodeDragMode();
    updateCounters(graph, state);
    updateActiveProfileBanner();
    updateActiveScheduleFilterBanner();

    if (prevViewport) {
      cy.zoom(prevViewport.zoom);
      cy.pan(prevViewport.pan);
    } else {
      setStartViewport(cy);
    }

    updateZoomLabel();
  }

  function updateClickModeUi() {
    const buttons = document.querySelectorAll(".modeBtn[data-mode]");
    buttons.forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.mode === clickMode);
    });

    const hint = document.getElementById("modeHint");
    if (!hint) return;

    if (clickMode === "done") {
      hint.textContent = "Клик по курсу отметит его пройденным";
    } else if (clickMode === "planned") {
      hint.textContent = "Клик по курсу запланирует курс";
    } else {
      hint.textContent = "Клик по курсу откроет информацию";
    }
  }

  document.querySelectorAll(".modeBtn[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      clickMode = btn.dataset.mode || "info";
      updateClickModeUi();
    });
  });

  updateClickModeUi();

  const TUTORIAL_STORAGE_KEY = "courseTreeTutorialSeen.v1";
  let tutorialIndex = 0;
  let tutorialIsOpen = false;
  // let tutorialShowTaskAfterClose = false;

  const tutorialSteps = [
    {
      selector: "#cy",
      title: "Это дерево курсов",
      text: `
        <p>Здесь показаны все курсы магистратуры и связи между ними.</p>
        <p>Линии показывают пререквизиты: какие курсы нужно пройти раньше, чтобы открыть следующие.</p>
      `
    },
    {
      selector: ".modeToolbar",
      title: "Режим клика",
      text: `
        <p>Этот блок задаёт, что произойдёт при обычном клике по курсу.</p>
        <p><strong>Информация</strong> открывает описание курса справа, <strong>Пройдено</strong> отмечает курс зелёной рамкой, а <strong>Запланировать</strong> добавляет курс в выбор и отмечает его фиолетовой рамкой.</p>
      `
    },
    {
      selector: "#detailsCard",
      title: "Карточка курса",
      text: `
        <p>Здесь показывается подробная информация о выбранном курсе.</p>
        <p>В карточке можно посмотреть пререквизиты, расписание, нагрузку и перейти в силлабус.</p>
        <p>Чтобы открыть карточку, выбери режим <strong>«Информация»</strong> и нажми на курс.</p>
      `
    },
    {
      selector: ".treeToolbar",
      title: "Управление видом дерева",
      text: `
        <p>Кнопки <strong>−</strong> и <strong>+</strong> меняют масштаб дерева, а число между ними показывает текущий масштаб.</p>
        <p><strong>Разблокировать узлы</strong> позволяет вручную перетаскивать карточки курсов. Когда расположение тебя устраивает, нажми <strong>«Зафиксировать узлы»</strong>.</p>
        <p><strong>Сбросить вид</strong> возвращает удобный обзор дерева, но не удаляет твои отметки и планы.</p>
      `
    },
    {
      selector: ".searchWrap",
      title: "Поиск курса",
      text: `
        <p>Начни вводить название курса — подходящие карточки подсветятся на дереве.</p>
        <p>Это удобно, когда нужный курс сложно найти глазами.</p>
      `
    },
    {
      selector: "#legendCard",
      title: "Легенда и фильтры",
      text: `
        <p>Легенда объясняет цвета карточек и рамки статусов.</p>
        <p>Галочки в легенде — это фильтры: ими можно временно скрывать типы курсов и отдельные статусы, чтобы дерево было проще читать.</p>
      `
    },
    {
      selector: "#countersCard",
      title: "Счётчики",
      text: `
        <p>Здесь видно, сколько требований уже закрыто и сколько ещё осталось добрать.</p>
        <p>Этот блок помогает понимать прогресс по типам курсов, зачётным единицам и прогнозируемой недельной нагрузке.</p>
      `
    },
    {
      selector: "#profilesBtn",
      title: "Готовые профили",
      placement: "bottom-center",
      popupWidth: 380,
      text: `
        <p>Кнопка <strong>«Профили»</strong> открывает готовые траектории выбора курсов.</p>
        <p>Профиль не отмечает курсы автоматически как пройденные или запланированные — он только временно показывает на дереве курсы выбранной траектории.</p>
      `
    },
    {
      selector: "#openSchedule",
      title: "Расписание",
      placement: "bottom-center",
      popupWidth: 390,
      text: `
        <p>Кнопка <strong>«Посмотреть расписание»</strong> открывает недельное расписание.</p>
        <p>Во вкладке <strong>«Запланированные курсы»</strong> можно проверить пересечения у уже выбранных предметов.</p>
        <p>Во вкладке <strong>«Все читаемые курсы»</strong> можно смотреть все курсы текущего семестра, применять фильтры и потом показать подходящие курсы на дереве.</p>
      `
    },
    {
      selector: "#reset",
      title: "Сброс",
      placement: "bottom-center",
      popupWidth: 360,
      text: `
        <p>Кнопка <strong>«Сброс»</strong> очищает твой текущий выбор.</p>
        <p>Она снимает отметки <strong>«пройдено»</strong> и <strong>«запланировано»</strong>, а также сбрасывает активный профиль и фильтр расписания.</p>
        <p>Обучение при этом заново автоматически не запускается.</p>
      `
    },
  ];

  const tutorialLayer = document.getElementById("tutorialLayer");
  const tutorialSpotlight = document.getElementById("tutorialSpotlight");
  const tutorialPopup = document.getElementById("tutorialPopup");
  const tutorialTitle = document.getElementById("tutorialTitle");
  const tutorialText = document.getElementById("tutorialText");
  const tutorialStepCounter = document.getElementById("tutorialStepCounter");
  const tutorialPrevBtn = document.getElementById("tutorialPrevBtn");
  const tutorialNextBtn = document.getElementById("tutorialNextBtn");
  const tutorialSkipBtn = document.getElementById("tutorialSkipBtn");
  const tutorialBtn = document.getElementById("tutorialBtn");

  function getTutorialSeen() {
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setTutorialSeen() {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    } catch (e) { }
  }

  function tutorialClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getTutorialTarget(step) {
    if (!step || !step.selector) return null;
    return document.querySelector(step.selector);
  }

  // function maybeShowTaskAfterTutorial() {
  //   if (!tutorialShowTaskAfterClose) return;
  //   tutorialShowTaskAfterClose = false;

  //   setTimeout(() => {
  //     showTaskPrompt();
  //   }, 250);
  // }

  // function closeTutorial() {
  //   tutorialIsOpen = false;
  //   setTutorialSeen();

  //   if (tutorialLayer) {
  //     tutorialLayer.classList.add("hidden");
  //     tutorialLayer.setAttribute("aria-hidden", "true");
  //   }

  //   maybeShowTaskAfterTutorial();
  // }

  function closeTutorial() {
    tutorialIsOpen = false;
    setTutorialSeen();

    if (tutorialLayer) {
      tutorialLayer.classList.add("hidden");
      tutorialLayer.setAttribute("aria-hidden", "true");
    }
  }

  function positionTutorialPopup(targetRect, step) {
    if (!tutorialPopup) return;

    const gap = 16;
    const margin = 14;

    // можно задавать индивидуальную ширину попапа для конкретного шага
    const popupWidth = step?.popupWidth || 410;
    tutorialPopup.style.width = `min(${popupWidth}px, calc(100vw - 32px))`;

    const popupRect = tutorialPopup.getBoundingClientRect();

    // Специальный режим для маленьких кнопок в верхней панели:
    // показываем попап под кнопкой, по центру.
    if (step?.placement === "bottom-center") {
      let left = targetRect.left + targetRect.width / 2 - popupRect.width / 2;
      let top = targetRect.bottom + gap;

      // если снизу не влезает — пробуем сверху
      if (top + popupRect.height > window.innerHeight - margin) {
        top = targetRect.top - popupRect.height - gap;
      }

      left = tutorialClamp(left, margin, window.innerWidth - popupRect.width - margin);
      top = tutorialClamp(top, margin, window.innerHeight - popupRect.height - margin);

      tutorialPopup.style.left = `${left}px`;
      tutorialPopup.style.top = `${top}px`;
      return;
    }

    // Общий режим для остальных шагов
    const candidates = [
      // справа от элемента
      {
        left: targetRect.right + gap,
        top: targetRect.top + targetRect.height / 2 - popupRect.height / 2
      },

      // слева от элемента
      {
        left: targetRect.left - popupRect.width - gap,
        top: targetRect.top + targetRect.height / 2 - popupRect.height / 2
      },

      // снизу
      {
        left: targetRect.left,
        top: targetRect.bottom + gap
      },

      // сверху
      {
        left: targetRect.left,
        top: targetRect.top - popupRect.height - gap
      }
    ];

    function fits(pos) {
      return (
        pos.left >= margin &&
        pos.top >= margin &&
        pos.left + popupRect.width <= window.innerWidth - margin &&
        pos.top + popupRect.height <= window.innerHeight - margin
      );
    }

    let pos = candidates.find(fits) || candidates[0];

    pos = {
      left: tutorialClamp(pos.left, margin, window.innerWidth - popupRect.width - margin),
      top: tutorialClamp(pos.top, margin, window.innerHeight - popupRect.height - margin)
    };

    tutorialPopup.style.left = `${pos.left}px`;
    tutorialPopup.style.top = `${pos.top}px`;
  }

  function renderTutorialStep() {
    if (!tutorialIsOpen) return;

    let step = tutorialSteps[tutorialIndex];
    let target = getTutorialTarget(step);

    while (!target && tutorialIndex < tutorialSteps.length - 1) {
      tutorialIndex += 1;
      step = tutorialSteps[tutorialIndex];
      target = getTutorialTarget(step);
    }

    if (!target) {
      closeTutorial();
      return;
    }

    target.scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "center"
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const padding = 8;

        if (tutorialSpotlight) {
          tutorialSpotlight.style.left = `${rect.left - padding}px`;
          tutorialSpotlight.style.top = `${rect.top - padding}px`;
          tutorialSpotlight.style.width = `${rect.width + padding * 2}px`;
          tutorialSpotlight.style.height = `${rect.height + padding * 2}px`;
          tutorialSpotlight.style.borderRadius = rect.height < 64 ? "14px" : "20px";
        }

        if (tutorialTitle) tutorialTitle.textContent = step.title;
        if (tutorialText) tutorialText.innerHTML = step.text;

        if (tutorialStepCounter) {
          tutorialStepCounter.textContent = `${tutorialIndex + 1} / ${tutorialSteps.length}`;
        }

        if (tutorialPrevBtn) {
          tutorialPrevBtn.disabled = tutorialIndex === 0;
        }

        if (tutorialNextBtn) {
          tutorialNextBtn.textContent = tutorialIndex === tutorialSteps.length - 1
            ? "Готово"
            : "Далее";
        }

        positionTutorialPopup(rect, step);
      });
    });
  }

  // function startTutorial({ force = false, showTaskWhenDone = false } = {}) {
  //   if (!tutorialLayer) return;

  //   tutorialShowTaskAfterClose = showTaskWhenDone;

  //   if (!force && getTutorialSeen()) {
  //     maybeShowTaskAfterTutorial();
  //     return;
  //   }

  //   tutorialIndex = 0;
  //   tutorialIsOpen = true;

  //   tutorialLayer.classList.remove("hidden");
  //   tutorialLayer.setAttribute("aria-hidden", "false");

  //   renderTutorialStep();
  // }

  function startTutorial({ force = false } = {}) {
    if (!tutorialLayer) return;

    if (!force && getTutorialSeen()) {
      return;
    }

    tutorialIndex = 0;
    tutorialIsOpen = true;

    tutorialLayer.classList.remove("hidden");
    tutorialLayer.setAttribute("aria-hidden", "false");

    renderTutorialStep();
  }

  if (tutorialBtn) {
    tutorialBtn.addEventListener("click", () => {
      startTutorial({
        force: true,
        // showTaskWhenDone: false
      });
    });
  }

  if (tutorialSkipBtn) {
    tutorialSkipBtn.addEventListener("click", closeTutorial);
  }

  if (tutorialPrevBtn) {
    tutorialPrevBtn.addEventListener("click", () => {
      tutorialIndex = Math.max(0, tutorialIndex - 1);
      renderTutorialStep();
    });
  }

  if (tutorialNextBtn) {
    tutorialNextBtn.addEventListener("click", () => {
      if (tutorialIndex >= tutorialSteps.length - 1) {
        closeTutorial();
        return;
      }

      tutorialIndex += 1;
      renderTutorialStep();
    });
  }

  window.addEventListener("resize", () => {
    if (tutorialIsOpen) renderTutorialStep();

    if (!scheduleModal.classList.contains("hidden")) {
      updateScheduleTooltipDirections();
    }
  });

  document.addEventListener("keydown", (evt) => {
    if (!tutorialIsOpen) return;

    const tag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = tag === "input" || tag === "textarea";

    if (evt.key === "Escape") {
      evt.preventDefault();
      closeTutorial();
    }

    if (evt.key === "ArrowRight") {
      evt.preventDefault();
      tutorialNextBtn?.click();
    }

    if (evt.key === "ArrowLeft") {
      evt.preventDefault();
      tutorialPrevBtn?.click();
    }

    if (evt.key === " " && !isTyping) {
      evt.preventDefault();
      tutorialNextBtn?.click();
    }
  });

  render();

  // setTimeout(() => {
  //   startTutorial({
  //     force: false,
  //     showTaskWhenDone: true
  //   });
  // }, 700);
  setTimeout(() => {
    startTutorial({ force: false });
  }, 700);

  function showCourseInfo(n) {
    const id = n.id();
    const details = graph.courses.find(c => c.id === id);
    document.getElementById("details").innerHTML = makeDetails(details);

    cy.edges().removeClass("highlightIn highlightOut");
    cy.nodes().removeClass("highlight");

    n.addClass("highlight");

    n.incomers("edge").addClass("highlightIn");
    n.incomers("node").addClass("highlight");

    n.outgoers("edge").addClass("highlightOut");
    n.outgoers("node").addClass("highlight");
  }

  function shouldRelayoutAfterSelectionChange() {
    return !(document.getElementById("fConflictWithPlanned")?.checked ?? true);
  }

  function togglePlannedCourse(n) {
    const id = n.id();
    const isOfferedThisTerm = !!n.data("isOfferedThisTerm");
    const isLocked = n.hasClass("locked");

    if (!isOfferedThisTerm) {
      alert("Этот курс не читается в текущем семестре, его нельзя запланировать.");
      return;
    }

    if (isLocked) {
      alert("Этот курс пока недоступен: не хватает пререквизитов.");
      return;
    }

    if (state.done[id]) {
      alert("Этот курс уже отмечен как пройденный. Чтобы запланировать его, сначала снимите отметку «пройдено».");
      return;
    }

    state.planned[id] = !state.planned[id];
    saveState(state);

    render({
      preserveViewport: true,
      resetPositions: shouldRelayoutAfterSelectionChange()
    });
  }

  function toggleDoneCourse(n) {
    const id = n.id();
    const isLocked = n.hasClass("locked");

    if (isLocked) {
      alert("Этот курс пока недоступен: не хватает пререквизитов.");
      return;
    }

    // if (presetDoneIds.has(id) && state.done[id]) {
    //   alert("Этот курс уже отмечен как пройденный в тестовом сценарии и не может быть снят.");
    //   return;
    // }

    state.done[id] = !state.done[id];
    if (state.done[id]) state.planned[id] = false;

    saveState(state);

    render({
      preserveViewport: true,
      resetPositions: shouldRelayoutAfterSelectionChange()
    });
  }

  cy.on("tap", "node", (evt) => {
    const n = evt.target;
    if (n.hasClass("columnHeader")) return;

    const oe = evt.originalEvent || {};
    const isShift = !!oe.shiftKey;
    const isCtrl = !!oe.ctrlKey || !!oe.metaKey;

    // Старая механика остаётся как скрытая возможность:
    // Shift+клик — запланировать, Ctrl/Cmd+клик — отметить пройденным.
    if (isShift && !isCtrl) {
      togglePlannedCourse(n);
      return;
    }

    if (isCtrl) {
      toggleDoneCourse(n);
      return;
    }

    if (clickMode === "planned") {
      togglePlannedCourse(n);
      return;
    }

    if (clickMode === "done") {
      toggleDoneCourse(n);
      return;
    }

    showCourseInfo(n);
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) {
      cy.edges().removeClass("highlightIn highlightOut");
      cy.nodes().removeClass("highlight");
      document.getElementById("details").innerHTML = "Выбери курс, чтобы увидеть пререквизиты, расписание и нагрузку.";
    }
  });

  // double click => open syllabus (if exists)
  let lastTap = 0;
  cy.on("tap", "node", (evt) => {
    if (evt.target.hasClass("columnHeader")) return;

    // Силлабус открываем только в режиме информации,
    // чтобы в режимах выбора двойной клик случайно не открывал новую вкладку.
    if (clickMode !== "info") {
      lastTap = 0;
      return;
    }

    const oe = evt.originalEvent || {};
    if (oe.shiftKey || oe.ctrlKey || oe.metaKey) {
      lastTap = 0;
      return;
    }

    const now = Date.now();
    if (now - lastTap < 300) {
      const n = evt.target;
      const url = n.data("syllabus_url");
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
    lastTap = now;
  });

  document.getElementById("search").addEventListener("input", (e) => {
    applySearch(cy, e.target.value);
  });
  const searchEl = document.getElementById("search");
  const searchClear = document.getElementById("searchClear");

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      searchEl.value = "";
      applySearch(cy, "");
      searchEl.focus();
    });
  }

  // document.getElementById("reset").addEventListener("click", () => {
  //   localStorage.removeItem(LS_KEY);
  //   Object.assign(state, loadState());

  //   if (state.nodeDragLocked === undefined) {
  //     state.nodeDragLocked = true;
  //   }

  //   applyPresetState(state, presetDoneIds);
  //   saveState(state);

  //   document.getElementById("details").innerHTML = "Выбери курс, чтобы увидеть пререквизиты, расписание и нагрузку.";
  //   render({ preserveViewport: false, resetPositions: true });
  // });

  document.getElementById("reset").addEventListener("click", () => {
    localStorage.removeItem(LS_KEY);

    const freshState = loadState();
    Object.keys(state).forEach(key => delete state[key]);
    Object.assign(state, freshState);

    state.activeProfileId = null;
    state.profileChoices = {};
    state.activeScheduleFilter = null;

    if (state.nodeDragLocked === undefined) {
      state.nodeDragLocked = true;
    }

    document.getElementById("details").innerHTML = "Выбери курс, чтобы увидеть пререквизиты, расписание и нагрузку.";
    render({ preserveViewport: false, resetPositions: true });
  });



  ["fFund", "fCore", "fSelected", "fFlex", "fDone", "fPlanned", "fLocked", "fNotOffered", "fConflictWithPlanned"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => render({
        preserveViewport: false,
        resetPositions: true
      }));
    }
  });
}

main().catch(err => {
  console.error(err);
  alert("Ошибка загрузки графа. Смотри консоль.");
});
