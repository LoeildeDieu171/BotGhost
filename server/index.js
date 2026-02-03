import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRouter from "./oauth.js";
import dotenv from "dotenv";
import session from "express-session";

// ===== CHARGER VARIABLES D'ENVIRONNEMENT =====
// (loaded after __dirname is initialized below)

const app = express();
const PORT = 3000;

// ===== FIX __dirname (ESM) =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== RACINE DU PROJET =====
const ROOT = path.join(__dirname, "..");

// load .env from process cwd (project root) and fallback to server/ folder
dotenv.config();
try {
  const serverEnv = path.join(__dirname, '.env');
  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv });
    console.log('⚙️ Loaded env from', serverEnv);
  }
} catch (e) {
  console.warn('⚠️ Could not load server .env', e);
}

// ===== CONFIGURATION SESSION (7 JOURS) =====
app.use(session({
  secret: process.env.SESSION_SECRET || "botghost-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // à true si HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes
  }
}));

// ===== SERVIR TOUS LES FICHIERS (CSS / JS / IMG) =====
app.use(express.static(ROOT));
app.use(express.json());

// helper read/write JSON
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    console.error("readJsonSafe error", filePath, e);
    return [];
  }
}

function writeJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("writeJsonSafe error", filePath, e);
  }
}

// ===== ROUTES AUTHENTIFICATION =====
app.use("/auth", authRouter);

// ===== MIDDLEWARE DE VÉRIFICATION AUTHENTIFICATION =====
function isAuthenticated(req, res, next) {
  console.log("🔍 Vérification session:", req.session.user ? "✅ Connecté" : "❌ Pas connecté");
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
}

// ===== PAGE ACCUEIL (AU DÉBUT) =====
app.get("/", (req, res) => {
  res.sendFile(
    path.join(ROOT, "Page-accueil", "index.html")
  );
});

// ===== LOGIN (PLUS TARD) =====
app.get("/login", (req, res) => {
  res.sendFile(
    path.join(ROOT, "Page-accueil", "login", "login.html")
  );
});

// ===== PAGE PRINCIPALE =====
app.get("/page-principal", (req, res) => {
  console.log("📄 Accès à /page-principal");
  console.log("🔐 Session user:", req.session.user ? req.session.user.username : "AUCUN");
  res.sendFile(
    path.join(ROOT, "page-principal", "html", "accueil.html")
  );
});

// ===== API UTILISATEUR =====
app.get("/api/user", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

// ===== DÉCONNEXION =====
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Erreur déconnexion:", err);
    res.redirect("/");
  });
});

// ===== DÉCONNEXION POST =====
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur déconnexion:", err);
      res.json({ success: false });
    } else {
      res.json({ success: true });
    }
  });
});

// ===== SIGNALER UN BUG =====
app.post("/api/report-bug", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ success: false, message: "Non authentifié" });
  }

  const { title, description, page, priority } = req.body;
  const BUGS_PATH = path.join(__dirname, "data", "bugs.json");
  const bugs = readJsonSafe(BUGS_PATH);
  const bug = {
    id: Date.now().toString(),
    title: title || "(sans titre)",
    description: description || "",
    page: page || "",
    priority: priority || "Moyen",
    username: req.session.user.username,
    userId: req.session.user.discordId || req.session.user.discord_id || req.session.user.id,
    date: new Date().toISOString()
  };
  bugs.push(bug);
  writeJsonSafe(BUGS_PATH, bugs);
  console.log("🐞 Nouveau bug signalé:", bug);
  res.json({ success: true, message: "Bug signalé avec succès" });
});

// ===== POSTULER À UN POSTE =====
app.post("/api/apply", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ success: false, message: "Non authentifié" });
  }
  const { jobTitle, jobId, age, experience, availability, extra } = req.body;
  const CAND_PATH = path.join(__dirname, "data", "candidatures.json");
  const cand = readJsonSafe(CAND_PATH);
  const newCand = {
    id: Date.now().toString(),
    jobTitle: jobTitle || "(inconnu)",
    jobId: jobId || null,
    username: req.session.user.username,
    userId: req.session.user.discordId || req.session.user.discord_id || req.session.user.id,
    status: "pending",
    // application details
    age: age || null,
    experience: experience || null,
    availability: availability || null,
    extra: extra || null,
    date: new Date().toISOString()
  };
  cand.push(newCand);
  writeJsonSafe(CAND_PATH, cand);
  console.log("📝 Nouvelle candidature:", newCand);
  res.json({ success: true, message: "Candidature envoyée" });
});

// ===== CANDIDATURES DE L'UTILISATEUR =====
app.get("/api/candidatures", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ candidatures: [] });
  }
  const CAND_PATH = path.join(__dirname, "data", "candidatures.json");
  const all = readJsonSafe(CAND_PATH);
  const userId = req.session.user.discordId || req.session.user.discord_id || req.session.user.id;
  const candidatures = all.filter(c => c.userId === userId).map(c => ({
    id: c.id,
    jobTitle: c.jobTitle,
    status: c.status,
    statusLabel: c.status === 'accepted' ? 'Acceptée' : (c.status === 'refused' ? 'Refusée' : 'En attente'),
    date: c.date
  }));
  res.json({ candidatures });
});

// ===== MES RAPPORTS DE BUG =====
app.get("/api/my-bugs", (req, res) => {
  if (!req.session || !req.session.user) return res.json({ bugs: [] });
  const BUGS_PATH = path.join(__dirname, "data", "bugs.json");
  const all = readJsonSafe(BUGS_PATH);
  const userId = req.session.user.discordId || req.session.user.discord_id || req.session.user.id;
  const userBugs = all.filter(b => b.userId === userId);
  res.json({ bugs: userBugs });
});

// ===== STATS ADMIN =====
app.get("/api/admin/stats", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.json({ error: "Non autorisé" });
  }

  const USERS_PATH = path.join(__dirname, "data", "users.json");
  const CAND_PATH = path.join(__dirname, "data", "candidatures.json");
  const BUGS_PATH = path.join(__dirname, "data", "bugs.json");
  const users = readJsonSafe(USERS_PATH);
  const cand = readJsonSafe(CAND_PATH);
  const bugs = readJsonSafe(BUGS_PATH);
  res.json({
    users: users.length,
    candidatures: cand.length,
    bugs: bugs.length
  });
});

// ===== BUGS ADMIN =====
app.get("/api/admin/bugs", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.json({ bugs: [] });
  }

  const BUGS_PATH = path.join(__dirname, "data", "bugs.json");
  const bugs = readJsonSafe(BUGS_PATH);
  res.json({ bugs });
});

// ===== DELETE BUG (ADMIN) =====
app.delete("/api/admin/bugs/:id", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  const BUGS_PATH = path.join(__dirname, "data", "bugs.json");
  let bugs = readJsonSafe(BUGS_PATH);
  const before = bugs.length;
  bugs = bugs.filter(b => b.id !== req.params.id);
  writeJsonSafe(BUGS_PATH, bugs);
  console.log(`🐞 Bug supprimé: ${req.params.id}`);
  res.json({ success: true, deleted: before - bugs.length });
});

// ===== CANDIDATURES ADMIN =====
app.get("/api/admin/candidatures", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ candidatures: [] });
  }
  const CAND_PATH = path.join(__dirname, "data", "candidatures.json");
  const candidatures = readJsonSafe(CAND_PATH);
  res.json({ candidatures });
});

// action: accept | refuse | delete
app.post("/api/admin/candidatures/:id", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  const action = req.body.action;
  const CAND_PATH = path.join(__dirname, "data", "candidatures.json");
  let candidatures = readJsonSafe(CAND_PATH);
  const idx = candidatures.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Introuvable' });

  const cand = candidatures[idx];
  if (action === 'delete') {
    candidatures.splice(idx, 1);
    writeJsonSafe(CAND_PATH, candidatures);
    console.log(`🗑️ Candidature supprimée: ${cand.id}`);
    return res.json({ success: true });
  }

  if (action === 'refuse') {
    candidatures[idx].status = 'refused';
    writeJsonSafe(CAND_PATH, candidatures);
    console.log(`❌ Candidature refusée: ${cand.id}`);
    return res.json({ success: true });
  }

  if (action === 'accept') {
    // decrement places on matching post (by jobTitle)
    const POSTS_PATH = path.join(__dirname, "data", "posts.json");
    const posts = readJsonSafe(POSTS_PATH);
    const pidx = posts.findIndex(p => p.name === cand.jobTitle || p.id === String(cand.jobId));
    if (pidx !== -1) {
      if (!posts[pidx].places || posts[pidx].places <= 0) {
        return res.status(400).json({ success: false, message: 'Plus de places disponibles' });
      }
      posts[pidx].places = Math.max(0, (posts[pidx].places || 0) - 1);
      if (posts[pidx].places === 0) posts[pidx].open = false;
      writeJsonSafe(POSTS_PATH, posts);
    }
    candidatures[idx].status = 'accepted';
    writeJsonSafe(CAND_PATH, candidatures);
    console.log(`✅ Candidature acceptée: ${cand.id}`);
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: 'Action inconnue' });
});

// ===== ADMIN USERS =====
app.get("/api/admin/users", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ users: [] });
  }
  const USERS_PATH = path.join(__dirname, "data", "users.json");
  const users = readJsonSafe(USERS_PATH);
  // mark online if last_seen within 5 minutes
  const now = Date.now();
  const usersWithOnline = users.map(u => ({
    ...u,
    online: u.last_seen ? (now - new Date(u.last_seen).getTime()) < 5 * 60 * 1000 : false
  }));
  res.json({ users: usersWithOnline });
});

// ===== EXPEL / BAN USER =====
app.post("/api/admin/expel", (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  const { userId, reason } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId requis' });
  const USERS_PATH = path.join(__dirname, "data", "users.json");
  const BANS_PATH = path.join(__dirname, "data", "bans.json");
  let users = readJsonSafe(USERS_PATH);
  let bans = readJsonSafe(BANS_PATH);
  users = users.filter(u => (u.discordId || u.discord_id || u.id) !== userId);
  bans.push({ id: userId, reason: reason || '', date: new Date().toISOString() });
  writeJsonSafe(USERS_PATH, users);
  writeJsonSafe(BANS_PATH, bans);
  console.log(`🚫 Utilisateur expulsé: ${userId} (${reason || 'aucune raison'})`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("BotGhost ON → http://localhost:3000");
});
