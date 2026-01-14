import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "";


async function request(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const api = {
  getProjects: () => request("/api/projects"),
  createProject: (payload) =>
    request("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
  addDeliverable: (projectId, payload) =>
    request(`/api/projects/${projectId}/deliverables`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myJuries: (jurorName) =>
    request(`/api/juries/my?juror_name=${encodeURIComponent(jurorName)}`),
  submitEvaluation: (payload) =>
    request("/api/evaluations", { method: "POST", body: JSON.stringify(payload) }),
  teacherProjectScores: (projectId) =>
    request(`/api/teacher/projects/${projectId}/scores`),
};

function clampScore(value) {
  if (value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  const rounded = Math.round(n * 100) / 100; // max 2 zecimale
  return String(rounded);
}

export default function App() {
  const [tab, setTab] = useState("projects"); // projects | juries | teacher
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // demo "identitate" (fără auth real încă)
  const [jurorName, setJurorName] = useState("student1");

  // data
  const [projects, setProjects] = useState([]);
  const [myJuries, setMyJuries] = useState([]);

  // form proiect
  const [newProjectName, setNewProjectName] = useState("");
  const [teamName, setTeamName] = useState("Echipa A");

  // form evaluare
  const [evaluation, setEvaluation] = useState({
    juryId: "",
    score: "",
    comment: "",
  });

  const canSubmit = useMemo(() => {
    const s = Number(evaluation.score);
    return evaluation.juryId && !Number.isNaN(s) && s >= 1 && s <= 10;
  }, [evaluation]);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getProjects();
      setProjects(Array.isArray(data) ? data : (data?.projects ?? data?.data ?? []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadJuries() {
    setLoading(true);
    setError("");
    try {
      const data = await api.myJuries(jurorName);
      setMyJuries(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (tab === "juries") loadJuries();
  }, [tab, jurorName]);

  async function onCreateProject(e) {
    e.preventDefault();
    setError("");

    if (!newProjectName.trim()) {
      setError("Numele proiectului este obligatoriu.");
      return;
    }

    setLoading(true);
    try {
      await api.createProject({ title: newProjectName.trim(), creator_name: jurorName });
      setNewProjectName("");
      await loadProjects();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitEvaluation(e) {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Completează corect juryId și scor (1–10).");
      return;
    }

    setLoading(true);
    try {
      await api.submitEvaluation({
        juror_name: jurorName,
        juryId: evaluation.juryId,
        score: Number(evaluation.score),
        comment: evaluation.comment?.trim() || null,
      });
      setEvaluation({ juryId: "", score: "", comment: "" });
      await loadJuries();
      alert("Nota a fost salvată!");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Note anonime – SPA (React)</h1>

        <div className="row">
          <button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>
            Proiecte
          </button>
          <button className={tab === "juries" ? "active" : ""} onClick={() => setTab("juries")}>
            Jurii (student)
          </button>
          <button className={tab === "teacher" ? "active" : ""} onClick={() => setTab("teacher")}>
            Profesor
          </button>
        </div>

        <div className="row">
          <label>Juror name (demo):</label>
          <input value={jurorName} onChange={(e) => setJurorName(e.target.value)} />
        </div>

        {loading && <p>Se încarcă…</p>}
        {error && <p className="error">{error}</p>}
      </header>

      {tab === "projects" && (
        <section className="card">
          <h2>Proiecte</h2>

          <form onSubmit={onCreateProject} className="form">
            <input
              placeholder="Nume proiect"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <input
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              Adaugă proiect
            </button>
          </form>

          <ul className="list">
            {projects.map((p) => (
              <li key={p.id} className="item">
                <div className="itemTitle">
                  <strong>{p.name}</strong> <span className="muted">({p.teamName})</span>
                </div>

                <div className="muted">ID: {p.id}</div>

                {p.deliverables?.length ? (
                  <ul className="sublist">
                    {p.deliverables.map((d) => (
                      <li key={d.id}>
                        <span>{d.title}</span>
                        {d.dueDate ? (
                          <span className="muted"> — {new Date(d.dueDate).toLocaleString()}</span>
                        ) : null}
                        {d.videoUrl ? <span className="muted"> — video</span> : null}
                        {d.liveUrl ? <span className="muted"> — live</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">Fără livrabile încă.</div>
                )}
              </li>
            ))}
          </ul>

          <button onClick={loadProjects} disabled={loading}>
            Refresh
          </button>
        </section>
      )}

      {tab === "juries" && (
        <section className="card">
          <h2>Jurii în care sunt asignat</h2>
          <p className="muted">Poți nota doar dacă ai fost asignat în juriu.</p>

          <button onClick={loadJuries} disabled={loading}>
            Refresh jurii
          </button>

          <ul className="list">
            {myJuries.map((j) => (
              <li key={j.id} className="item">
                <div className="itemTitle">
                  <strong>Jury #{j.id}</strong>
                </div>
                <div className="muted">
                  Project: {j.project?.name || j.projectId} | Deliverable:{" "}
                  {j.deliverable?.title || j.deliverableId}
                </div>
              </li>
            ))}
          </ul>

          <hr />

          <h3>Trimite / modifică nota mea</h3>
          <form onSubmit={onSubmitEvaluation} className="form">
            <input
              placeholder="juryId"
              value={evaluation.juryId}
              onChange={(e) => setEvaluation((x) => ({ ...x, juryId: e.target.value }))}
            />
            <input
              placeholder="Scor (1-10, max 2 zecimale)"
              value={evaluation.score}
              onChange={(e) => setEvaluation((x) => ({ ...x, score: clampScore(e.target.value) }))}
            />
            <input
              placeholder="Comentariu (opțional)"
              value={evaluation.comment}
              onChange={(e) => setEvaluation((x) => ({ ...x, comment: e.target.value }))}
            />
            <button type="submit" disabled={!canSubmit || loading}>
              Salvează nota
            </button>
          </form>
        </section>
      )}

      {tab === "teacher" && <TeacherView projects={projects} />}
    </div>
  );
}

function TeacherView() {
  const [juryId, setJuryId] = useState("8"); // pune default 8 ca sa iti mearga demo imediat
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setData(null);

    const id = Number(juryId);
    if (Number.isNaN(id) || id <= 0) {
      setErr("Introdu un juryId valid (numar).");
      return;
    }

    setLoading(true);
    try {
      const res = await request(`/api/teacher/juries/${id}`);
      setData(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Profesor – scoruri juriu</h2>

      <div className="row">
        <input
          value={juryId}
          onChange={(e) => setJuryId(e.target.value)}
          placeholder="JuryId (ex: 8)"
        />
        <button onClick={load} disabled={loading}>
          Vezi scor
        </button>
      </div>

      {loading && <p>Se încarcă…</p>}
      {err && <p className="error">{err}</p>}

      {data && (
        <div className="box">
          <p>
            <strong>Jury:</strong> #{data.id}
          </p>
          <p>
            <strong>Proiect:</strong> {data.project?.title} (ID {data.project?.id})
          </p>
          <p>
            <strong>Livrabil:</strong> {data.deliverable?.title} (ID {data.deliverable?.id})
          </p>
          <p>
            <strong>Nr. evaluări:</strong> {data.countEvaluations}
          </p>
          <p>
            <strong>Final score:</strong> {data.finalScore ?? "—"}
          </p>

          {Array.isArray(data.scores) && data.scores.length > 0 ? (
            <div>
              <p className="muted">Scoruri (fără identitatea juraților):</p>
              <ul>
                {data.scores.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">Fără note încă.</p>
          )}
        </div>
      )}

      <p className="muted">
        Tip: juryId îl obții după asignare (POST /api/juries/assign). Profesorul vede scoruri agregate fără
        identitatea membrilor juriului.
      </p>
    </section>
  );
}

