from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple
from collections import defaultdict, deque

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

APP_DIR = Path(__file__).resolve().parent
DATA_PATH = APP_DIR / "courses.json"
CALENDAR_JSON_PATH = APP_DIR / "calendar.json"

def _norm(s: str) -> str:
    s = (s or "").strip().replace("ё", "е").lower()
    s = s.replace("-", " ")
    s = re.sub(r"[()]", " ", s)
    s = re.sub(r"[^\w\s\.]", " ", s)  # keep dot for "levels"
    s = re.sub(r"\s+", " ", s).strip()
    return s

def _split_prereq(pr: str) -> List[str]:
    if not pr:
        return []
    low = pr.strip().lower()
    if low in {"нет", "не указано", "-"}:
        return []
    s = pr.replace(";", "|").replace(",", "|")
    return [p.strip() for p in s.split("|") if p.strip()]

def _match_course(pr_name: str, course_names: List[str], by_norm: Dict[str, str]) -> str | None:
    n = _norm(pr_name)
    if n in by_norm:
        return by_norm[n]

    # alias for "метрики продукта и бизнеса" -> "метрики бизнеса и продукта.*"
    if ("метрики" in n and "продукт" in n and "бизнес" in n) or ("метрики продукта и бизнеса" in n):
        for cand in course_names:
            if _norm(cand).startswith("метрики бизнеса и продукта"):
                return cand

    n_base = n.split(".")[0].strip()

    for cand_norm, cand in by_norm.items():
        if cand_norm == n_base:
            return cand
        if cand_norm.startswith(n) or n.startswith(cand_norm):
            return cand
        if cand_norm.startswith(n_base) or n_base.startswith(cand_norm):
            return cand
        if len(n) >= 8 and (n in cand_norm or cand_norm in n):
            return cand
    return None

def _load_courses() -> List[Dict[str, Any]]:
    raw = DATA_PATH.read_text(encoding="utf-8").strip()
    # Support both: array JSON or "objects separated by commas without []"
    if raw.startswith("["):
        return json.loads(raw)
    return json.loads("[" + raw + "]")

def _load_calendar_map() -> Dict[str, Dict[str, Any]]:
    if not CALENDAR_JSON_PATH.exists():
        return {}

    raw = CALENDAR_JSON_PATH.read_text(encoding="utf-8").strip()
    if not raw:
        return {}

    return json.loads(raw)

def _build_graph(courses: List[Dict[str, Any]]) -> Dict[str, Any]:
    names = [c["Название курса"] for c in courses]
    by_norm = {_norm(n): n for n in names}
    calendar_map = _load_calendar_map()

    # Build edges prereq -> course
    edges: List[Tuple[str, str]] = []
    prereq_map: Dict[str, List[str]] = {}

    for c in courses:
        cn = c["Название курса"]
        prereqs = []
        for pr in _split_prereq(c.get("Пререквизиты", "")):
            m = _match_course(pr, names, by_norm)
            if m:
                edges.append((m, cn))
                prereqs.append(m)
            else:
                # keep unknown as raw text
                prereqs.append(pr)
        prereq_map[cn] = prereqs

    # Compute depth = longest path from roots (0-based)
    succ = defaultdict(list)
    pred = defaultdict(list)
    for a, b in edges:
        succ[a].append(b)
        pred[b].append(a)

    all_nodes = set(names)
    in_deg = {n: len(pred[n]) for n in all_nodes}
    q = deque([n for n in all_nodes if in_deg[n] == 0])
    topo: List[str] = []
    while q:
        n = q.popleft()
        topo.append(n)
        for m in succ[n]:
            in_deg[m] -= 1
            if in_deg[m] == 0:
                q.append(m)

    depth = {n: 0 for n in all_nodes}
    for n in topo:
        for m in succ[n]:
            depth[m] = max(depth[m], depth[n] + 1)

    # Build response
    out_courses = []
    for c in courses:
        cn = c["Название курса"]
        out_courses.append({
            "id": cn,
            "title": cn,
            "type": c.get("Тип", "unknown"),
            "hours": {
                "lectures_per_week": c.get("Лекций в неделю"),
                "seminars_per_week": c.get("Семинаров в неделю"),
                "total_per_week": c.get("Всего занятий в неделю"),
            },
            "assessment": c.get("Тип итоговой оценки (зачёт / зачёт с оценкой / экзамен)"),
            "workload": {
                "homeworks": c.get("Домашних заданий (шт)"),
                "quizzes": c.get("Квизов / тестов (шт)"),
                "midterms": c.get("Промежуточных контролей (шт)"),
            },
            "difficulty": {
                "avg_homework_hours": c.get("Ср. время ДЗ"),
                "avg_homework_hours_per_week": c.get("Ср. время ДЗ/нед."),
            },
            "blockers": c.get("Блокеры"),
            "bonus": c.get("Бонусные баллы (да/нет или число)"),
            "syllabus_url": c.get("Ссылка на силлабус"),
            "prereqs": prereq_map.get(cn, []),
            "depth": depth.get(cn, 0),
            "credits": c.get("Зачетные единицы", 1),

            "calendar_id": c.get("calendar_id"),
            "schedule": calendar_map.get(
                str(c.get("calendar_id")).strip() if c.get("calendar_id") is not None else "",
                {
                    "calendar_id": c.get("calendar_id"),
                    "course": cn,
                    "is_offered_this_term": False,
                    "slots": [],
                }
            ),
        })

    out_edges = [{"source": a, "target": b} for a, b in edges]

    return {"courses": out_courses, "edges": out_edges, "max_depth": max(depth.values()) if depth else 0}

app = FastAPI(title="Course Tree Demo")

app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse(APP_DIR / "static" / "index.html")

@app.get("/lms", response_class=HTMLResponse)
def lms_demo():
    return FileResponse(APP_DIR / "static" / "lms.html")

@app.get("/api/graph")
def graph():
    courses = _load_courses()
    return _build_graph(courses)
