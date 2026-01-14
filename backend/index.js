

// index.js - backend pentru aplicatia de note anonime (Prisma v7 + SQLite)

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const app = express();
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// =====================
// PRISMA SETUP
// =====================
const fallbackUrl = "file:./note.db";
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  process.env.DATABASE_URL = fallbackUrl;
}

// Prisma v7 + adapter-better-sqlite3 (config cu { url })
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// helper debug: vezi modelele disponibile
console.log(
  "PRISMA MODELS:",
  Object.keys(prisma).filter((k) => !k.startsWith("$") && !k.startsWith("_"))
);

// =====================
// HELPERS
// =====================

// helper: ia sau creeaza user dupa nume + rol (evita amestec "Mihai" profesor/student)
async function getOrCreateUser(name, role) {
  let user = await prisma.user.findFirst({ where: { name, role } });
  if (!user) {
    user = await prisma.user.create({ data: { name, role } });
  }
  return user;
}

// helper: validare nota 1-10, max 2 zecimale
function validateGrade(valoareNum) {
  if (valoareNum < 1 || valoareNum > 10) return "Valoarea trebuie sa fie intre 1 si 10";
  if (Math.round(valoareNum * 100) !== valoareNum * 100) return "Valoarea poate avea maximum 2 zecimale";
  return null;
}

function computeFinalScore(scores) {
  if (!scores || scores.length < 3) return null;

  const sorted = [...scores].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1); // fara min si max

  const sum = trimmed.reduce((acc, x) => acc + x, 0);
  const avg = sum / trimmed.length;

  return Math.round(avg * 100) / 100;
}

function computeRawAverage(scores) {
  if (!scores || scores.length === 0) return null;
  const sum = scores.reduce((acc, x) => acc + x, 0);
  const avg = sum / scores.length;
  return Math.round(avg * 100) / 100;
}

// helper: calculeaza scor final omitand cea mai mare si cea mai mica nota
function computeFinalScore(scores) {
  if (!scores || scores.length === 0) return { count: 0, scores: [], finalScore: null };

  const sorted = [...scores].sort((a, b) => a - b);
  const count = sorted.length;

  // ca sa poti omite min si max ai nevoie de minim 3 note
  if (count < 3) {
    return { count, scores: sorted, finalScore: null };
  }

  // elimina min si max
  const trimmed = sorted.slice(1, -1);
  const sum = trimmed.reduce((acc, x) => acc + x, 0);
  const avg = sum / trimmed.length;

  // rotunjire la 2 zecimale
  const finalScore = Math.round(avg * 100) / 100;

  return { count, scores: sorted, finalScore };
}



// helper: parse date sigur
function parseDateOrNull(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// =====================
// HEALTH
// =====================
app.get("/api/health", async (req, res) => {
  try {
    await prisma.user.findFirst();
    res.json({
      status: "ok",
      message: "Backend pornit",
      DATABASE_URL: process.env.DATABASE_URL,
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// =====================
// NOTE
// =====================

// Inserare nota demo
app.get("/api/note/demo", async (req, res) => {
  try {
    const prof = await getOrCreateUser("prof_demo", "profesor");
    const stud = await getOrCreateUser("student_demo", "student");

    const nota = await prisma.note.create({
      data: {
        value: 8.75,
        comment: "Nota demo inserata automat",
        profesorId: prof.id,
        studentId: stud.id,
      },
    });

    res.json({ message: "Nota demo a fost inserata", nota });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la inserarea notei demo", details: err.message });
  }
});

// Adaugare nota reala
// Body: { profesor_id, student_id, valoare, comentariu }
app.post("/api/note", async (req, res) => {
  try {
    const { profesor_id, student_id, valoare, comentariu } = req.body;

    const valoareNum = Number(valoare);
    if (!profesor_id || !student_id || Number.isNaN(valoareNum)) {
      return res.status(400).json({ error: "Date invalide pentru nota" });
    }

    const errGrade = validateGrade(valoareNum);
    if (errGrade) return res.status(400).json({ error: errGrade });

    const prof = await getOrCreateUser(profesor_id, "profesor");
    const stud = await getOrCreateUser(student_id, "student");

    const nota = await prisma.note.create({
      data: {
        value: valoareNum,
        comment: comentariu || null,
        profesorId: prof.id,
        studentId: stud.id,
      },
    });

    res.json({ message: "Nota a fost salvata cu succes", nota });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la inserarea notei", details: err.message });
  }
});

// Lista note
app.get("/api/note", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      include: { profesor: true, student: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = notes.map((n) => ({
      id: n.id,
      valoare: n.value,
      comentariu: n.comment || null,
      profesor_id: n.profesor?.name || null,
      student_id: n.student?.name || null,
      data: n.createdAt,
    }));

    res.json({ total: mapped.length, note: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la citirea notelor", details: err.message });
  }
});

// =========================
// PROIECTE + LIVRABILE (MVP)
// =========================

// Creeaza proiect + il adauga automat pe creator ca MP
// Body: { creator_name, title, description }
app.post("/api/projects", async (req, res) => {
  try {
    const { creator_name, title, description } = req.body;

    if (!creator_name || !title) {
      return res.status(400).json({ error: "creator_name si title sunt obligatorii" });
    }

    const creator = await getOrCreateUser(creator_name, "student");

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        members: {
          create: {
            userId: creator.id,
            role: "MP",
          },
        },
      },
      include: { members: { include: { user: true } } },
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("Eroare la creare proiect:", err);
    res.status(500).json({ error: "Eroare la creare proiect", details: err.message });
  }
});

// Listeaza proiectele
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: { include: { user: true } },
        deliverables: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ total: projects.length, projects });
  } catch (err) {
    console.error("Eroare la listare proiecte:", err);
    res.status(500).json({ error: "Eroare la listare proiecte", details: err.message });
  }
});

// Detalii proiect
app.get("/api/projects/:projectId", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: "projectId invalid" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        deliverables: { orderBy: { dueDate: "asc" } },
      },
    });

    if (!project) return res.status(404).json({ error: "Proiect inexistent" });

    res.json(project);
  } catch (err) {
    console.error("Eroare la detalii proiect:", err);
    res.status(500).json({ error: "Eroare la detalii proiect", details: err.message });
  }
});

// Adauga livrabil la proiect (doar MP)
// Body: { creator_name, title, dueDate, videoUrl, liveUrl }
app.post("/api/projects/:projectId/deliverables", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: "projectId invalid" });

    const { creator_name, title, dueDate, videoUrl, liveUrl } = req.body;

    if (!creator_name || !title || !dueDate) {
      return res.status(400).json({ error: "creator_name, title si dueDate sunt obligatorii" });
    }

    const due = parseDateOrNull(dueDate);
    if (!due) return res.status(400).json({ error: "dueDate invalid (trimite ISO date)" });

    const user = await getOrCreateUser(creator_name, "student");

    const isMp = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id, role: "MP" },
    });

    if (!isMp) {
      return res.status(403).json({ error: "Doar un MP poate adauga livrabile" });
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId,
        title,
        dueDate: due,
        videoUrl: videoUrl || null,
        liveUrl: liveUrl || null,
      },
    });

    res.status(201).json(deliverable);
  } catch (err) {
    console.error("Eroare la creare livrabil:", err);
    res.status(500).json({ error: "Eroare la creare livrabil", details: err.message });
  }
});

// =========================
// JURIU - asignare aleatorie
// =========================
// Body: { projectId, deliverableId, jurySize }
// Selecteaza studenti (role=student) care NU sunt MP in proiect
app.post("/api/juries/assign", async (req, res) => {
  try {
    const { projectId, deliverableId, jurySize } = req.body;

    const pId = Number(projectId);
    const dId = Number(deliverableId);
    const size = Number(jurySize) || 3;

    if (Number.isNaN(pId) || Number.isNaN(dId)) {
      return res.status(400).json({ error: "projectId si deliverableId trebuie sa fie numere" });
    }

    // verificare livrabil
    const deliverable = await prisma.deliverable.findUnique({ where: { id: dId } });
    if (!deliverable) return res.status(404).json({ error: "Deliverable inexistent" });
    if (deliverable.projectId !== pId) {
      return res.status(400).json({ error: "Deliverable nu apartine proiectului" });
    }

    // MP-ii proiectului (de exclus)
    const projectMPs = await prisma.projectMember.findMany({
      where: { projectId: pId, role: "MP" },
      select: { userId: true },
    });
    const mpIds = projectMPs.map((x) => x.userId);

    // candidati studenti care NU sunt MP
    const candidates = await prisma.user.findMany({
      where: { role: "student", id: { notIn: mpIds } },
      select: { id: true, name: true },
    });

    if (candidates.length === 0) {
      return res.status(400).json({ error: "Nu exista studenti candidati" });
    }

    // selectie aleatorie
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(size, shuffled.length));

    // juriu unic pe (project, deliverable)
    const jury = await prisma.jury.upsert({
      where: {
        projectId_deliverableId: { projectId: pId, deliverableId: dId },
      },
      update: {},
      create: { projectId: pId, deliverableId: dId },
    });

    // adauga membri juriu (fara duplicate) - compatibil Prisma
    for (const u of selected) {
      await prisma.juryMember.upsert({
        where: {
          juryId_userId: { juryId: jury.id, userId: u.id },
        },
        update: {},
        create: { juryId: jury.id, userId: u.id },
      });
    }

    const result = await prisma.jury.findUnique({
      where: { id: jury.id },
      include: {
        project: true,
        deliverable: true,
        members: { include: { user: true } },
      },
    });

    return res.status(201).json({ message: "Juriu asignat cu succes", jury: result });
  } catch (err) {
    console.error("Eroare /api/juries/assign:", err);
    return res.status(500).json({ error: "Eroare la asignare juriu", details: err.message });
  }
});

// =========================
// JURIU (student) - ANONIM
// =========================
// GET /api/juries/:juryId?user=Vlad
// - NU arata lista membrilor
// - Daca user e membru => arata doar evaluarea lui (myEvaluation)
app.get("/api/juries/:juryId", async (req, res) => {
  try {
    const juryId = Number(req.params.juryId);
    if (Number.isNaN(juryId)) return res.status(400).json({ error: "juryId invalid" });

    const userName = (req.query.user || "").toString().trim();

    const jury = await prisma.jury.findUnique({
      where: { id: juryId },
      include: {
        project: true,
        deliverable: true,
        members: { include: { user: true } },
        evaluations: { include: { user: true } },
      },
    });

    if (!jury) return res.status(404).json({ error: "Juriu inexistent" });

    let isMember = false;
    let myEvaluation = null;

    if (userName) {
      const user = await prisma.user.findFirst({ where: { name: userName } });
      if (user) {
        isMember = jury.members.some((m) => m.userId === user.id);

        if (isMember) {
          const mine = jury.evaluations.find((e) => e.userId === user.id);
          if (mine) {
            myEvaluation = {
              score: mine.score,
              comment: mine.comment,
              updatedAt: mine.updatedAt,
            };
          }
        }
      }
    }

    // scor final anonimizat (omit max+min)
    const scores = jury.evaluations.map((e) => e.score);
    let finalScore = null;

    if (scores.length >= 3) {
      const sorted = [...scores].sort((a, b) => a - b);
      const trimmed = sorted.slice(1, -1);
      const avg = trimmed.reduce((s, x) => s + x, 0) / trimmed.length;
      finalScore = Math.round(avg * 100) / 100;
    }

    return res.json({
      id: jury.id,
      project: { id: jury.project.id, title: jury.project.title },
      deliverable: {
        id: jury.deliverable.id,
        title: jury.deliverable.title,
        dueDate: jury.deliverable.dueDate,
      },
      countEvaluations: scores.length,
      finalScore,
      isMember,
      myEvaluation,
    });
  } catch (err) {
    console.error("Eroare /api/juries/:juryId:", err);
    return res.status(500).json({ error: "Eroare la citire juriu", details: err.message });
  }
});

// =========================
// JURIU (teacher) - fara identitatea juriului
// =========================
app.get("/api/teacher/juries/:juryId", async (req, res) => {
  try {
    const juryId = Number(req.params.juryId);
    if (Number.isNaN(juryId)) return res.status(400).json({ error: "juryId invalid" });

    const jury = await prisma.jury.findUnique({
      where: { id: juryId },
      include: {
        project: true,
        deliverable: true,
        evaluations: true,
      },
    });

    if (!jury) return res.status(404).json({ error: "Juriu inexistent" });

    const scores = jury.evaluations.map((e) => e.score).sort((a, b) => a - b);

    let finalScore = null;
    if (scores.length >= 3) {
      const trimmed = scores.slice(1, -1);
      const avg = trimmed.reduce((s, x) => s + x, 0) / trimmed.length;
      finalScore = Math.round(avg * 100) / 100;
    }

    return res.json({
      id: jury.id,
      project: { id: jury.project.id, title: jury.project.title },
      deliverable: {
        id: jury.deliverable.id,
        title: jury.deliverable.title,
        dueDate: jury.deliverable.dueDate,
      },
      countEvaluations: scores.length,
      scores,
      finalScore,
    });
  } catch (err) {
    console.error("Eroare /api/teacher/juries/:juryId:", err);
    return res.status(500).json({ error: "Eroare la citire juriu (teacher)", details: err.message });
  }
});




// =========================
// EVALUARI - doar juriu
// =========================
// Body: { juryId, juror_name, score, comment }
app.post("/api/evaluations", async (req, res) => {
  try {
    const { juryId, juror_name, score, comment } = req.body;

    const jId = Number(juryId);
    const s = Number(score);

    if (!juror_name || Number.isNaN(jId) || Number.isNaN(s)) {
      return res.status(400).json({ error: "juryId, juror_name, score sunt obligatorii" });
    }

    const errScore = validateGrade(s);
    if (errScore) return res.status(400).json({ error: errScore });

    // ia juriul + deliverable (pentru dueDate)
    const jury = await prisma.jury.findUnique({
      where: { id: jId },
      include: { deliverable: true },
    });
    if (!jury) return res.status(404).json({ error: "Juriu inexistent" });

    // fereastra de timp (24h dupa dueDate)
    const now = new Date();
    const due = new Date(jury.deliverable.dueDate);
    const limitHours = 24;
    const deadline = new Date(due.getTime() + limitHours * 60 * 60 * 1000);

    if (now < due) {
      return res.status(403).json({ error: "Inca nu a inceput perioada de notare (nu s-a ajuns la dueDate)" });
    }
    if (now > deadline) {
      return res.status(403).json({ error: "Perioada de notare a expirat" });
    }

    // user (jurat) - rol student
    const user = await getOrCreateUser(juror_name, "student");

    // verifica membru in juriu
    const member = await prisma.juryMember.findFirst({
      where: { juryId: jId, userId: user.id },
    });
    if (!member) return res.status(403).json({ error: "Nu esti membru in acest juriu" });

    // upsert evaluarea lui
    const evaluation = await prisma.evaluation.upsert({
      where: {
        juryId_userId: { juryId: jId, userId: user.id },
      },
      update: { score: s, comment: comment || null },
      create: { juryId: jId, userId: user.id, score: s, comment: comment || null },
    });

    return res.json({ message: "Evaluare salvata", evaluation });
  } catch (err) {
    console.error("Eroare evaluare:", err);
    return res.status(500).json({ error: "Eroare la evaluare", details: err.message });
  }
});

// =========================
// SCOR FINAL LIVRABIL (medie evaluari)
// =========================
app.get("/api/projects/:projectId/deliverables/:deliverableId/score", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const deliverableId = Number(req.params.deliverableId);

    if (Number.isNaN(projectId) || Number.isNaN(deliverableId)) {
      return res.status(400).json({ error: "projectId / deliverableId invalide" });
    }

    const del = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
    });
    if (!del) return res.status(404).json({ error: "Deliverable inexistent" });
    if (del.projectId !== projectId) {
      return res.status(400).json({ error: "Deliverable nu apartine proiectului" });
    }

    const jury = await prisma.jury.findUnique({
      where: { projectId_deliverableId: { projectId, deliverableId } },
      include: { evaluations: true },
    });

    if (!jury) {
      return res.status(404).json({ error: "Nu exista juriu asignat pentru acest deliverable" });
    }

    const evaluations = jury.evaluations || [];
    const count = evaluations.length;
    const avg = count === 0 ? null : evaluations.reduce((sum, e) => sum + e.score, 0) / count;

    return res.json({
      projectId,
      deliverableId,
      juryId: jury.id,
      countEvaluations: count,
      averageScore: avg,
    });
  } catch (err) {
    console.error("Eroare scor livrabil:", err);
    return res.status(500).json({ error: "Eroare la scor livrabil", details: err.message });
  }
});

// =========================
// RAPORT PROIECT (membri + livrabile + jurii + evaluari + medie)
// =========================
app.get("/api/projects/:projectId/report", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: "projectId invalid" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        deliverables: {
          orderBy: { dueDate: "asc" },
          include: {
            juries: {
              include: {
                members: { include: { user: true } },
                evaluations: { include: { user: true }, orderBy: { updatedAt: "desc" } },
              },
            },
          },
        },
      },
    });

    if (!project) return res.status(404).json({ error: "Proiect inexistent" });

    const report = {
      id: project.id,
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      members: project.members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      deliverables: project.deliverables.map((d) => {
        const jury = d.juries?.[0] || null;
        const evals = jury?.evaluations || [];
        const avg = evals.length === 0 ? null : evals.reduce((s, e) => s + e.score, 0) / evals.length;

        return {
          id: d.id,
          title: d.title,
          dueDate: d.dueDate,
          videoUrl: d.videoUrl,
          liveUrl: d.liveUrl,
          createdAt: d.createdAt,
          jury: jury
            ? {
                id: jury.id,
                createdAt: jury.createdAt,
                members: jury.members.map((jm) => ({
                  userId: jm.userId,
                  name: jm.user.name,
                  assignedAt: jm.assignedAt,
                })),
                evaluations: evals.map((e) => ({
                  userId: e.userId,
                  name: e.user.name,
                  score: e.score,
                  comment: e.comment,
                  updatedAt: e.updatedAt,
                })),
                countEvaluations: evals.length,
                averageScore: avg,
              }
            : null,
        };
      }),
    };

    return res.json(report);
  } catch (err) {
    console.error("Eroare raport proiect:", err);
    return res.status(500).json({ error: "Eroare la raport proiect", details: err.message });
  }
});

// =========================
// PROFESOR VIEW (anonim) - raport proiect fara identitatea juriului
// =========================
app.get("/api/teacher/projects/:projectId/report", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: "projectId invalid" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        deliverables: {
          orderBy: { dueDate: "asc" },
          include: {
            juries: {
              include: {
                evaluations: true, // fara user
              },
            },
          },
        },
      },
    });

    if (!project) return res.status(404).json({ error: "Proiect inexistent" });

    const mapped = {
      id: project.id,
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      members: project.members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      deliverables: project.deliverables.map((d) => {
        const jury = d.juries?.[0] || null;
        const scores = jury ? jury.evaluations.map((e) => e.score) : [];
        const countEvaluations = scores.length;

        // scor final: omite min + max (doar daca ai minim 3 note)
        let finalScore = null;
        if (scores.length >= 3) {
          const sorted = [...scores].sort((a, b) => a - b);
          const trimmed = sorted.slice(1, -1);
          const avg = trimmed.reduce((s, x) => s + x, 0) / trimmed.length;
          finalScore = Math.round(avg * 100) / 100; // 2 zecimale
        }

        return {
          id: d.id,
          title: d.title,
          dueDate: d.dueDate,
          videoUrl: d.videoUrl,
          liveUrl: d.liveUrl,
          createdAt: d.createdAt,
          jury: jury
            ? {
                id: jury.id,
                createdAt: jury.createdAt,
                countEvaluations,
                scores,     // OPTIONAL: poti sa-l scoti daca vrei si mai anonim
                finalScore, // asta e important
              }
            : null,
        };
      }),
    };

    return res.json(mapped);
  } catch (err) {
    console.error("Eroare teacher report:", err);
    return res.status(500).json({ error: "Eroare raport profesor", details: err.message });
  }
});

// =========================
// SCORE LIVRABIL (finalScore = fara min/max)
// =========================
app.get("/api/projects/:projectId/deliverables/:deliverableId/score", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const deliverableId = Number(req.params.deliverableId);

    if (Number.isNaN(projectId) || Number.isNaN(deliverableId)) {
      return res.status(400).json({ error: "projectId/deliverableId invalid" });
    }

    const jury = await prisma.jury.findUnique({
      where: {
        projectId_deliverableId: { projectId, deliverableId },
      },
      include: {
        evaluations: true,
      },
    });

    if (!jury) {
      return res.status(404).json({ error: "Nu exista juriu pentru acest livrabil" });
    }

    const scores = jury.evaluations.map((e) => e.score);
    const countEvaluations = scores.length;

    const rawAverage = computeRawAverage(scores);
    const finalScore = computeFinalScore(scores);

    return res.json({
      projectId,
      deliverableId,
      juryId: jury.id,
      countEvaluations,
      rawAverage,
      finalScore,
    });
  } catch (err) {
    console.error("Eroare score:", err);
    return res.status(500).json({ error: "Eroare la calcul scor", details: err.message });
  }
});



// =====================
// STOP CLEAN
// =====================
process.on("SIGINT", async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});

app.listen(PORT, () => {
  console.log("Serverul ruleaza pe http://localhost:" + PORT);
});
