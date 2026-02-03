import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ===== FIX __dirname (ESM) =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_PATH = path.join(__dirname, "data", "users.json");

const BANS_PATH = path.join(__dirname, "data", "bans.json");

function saveUser(user) {
  let users = [];
  if (fs.existsSync(USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
  }

  const idx = users.findIndex(u => (u.discord_id && user.discord_id && u.discord_id === user.discord_id) || (u.id && user.id && u.id === user.id) || (u.discordId && user.discordId && u.discordId === user.discordId));
  if (idx === -1) {
    users.push(user);
  } else {
    users[idx] = Object.assign({}, users[idx], user);
  }
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

/* 🔗 REDIRECTION DISCORD */
router.get("/discord", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email"
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

/* 🔙 CALLBACK */
router.get("/discord/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.redirect("/");

    // TOKEN
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      })
    });

    const token = await tokenRes.json();
    
    if (!token.access_token) {
      console.error("❌ Erreur Token Discord:", token);
      return res.redirect("/");
    }

    // USER
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });

    const discordUser = await userRes.json();
    
    if (!discordUser.id) {
      console.error("❌ Erreur User Discord:", discordUser);
      return res.redirect("/");
    }

    const user = {
      // keep legacy field used elsewhere
      discord_id: discordUser.id,
      // normalized fields for client code
      id: discordUser.id,
      discordId: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      created_at: new Date().toISOString()
    };

    // update last seen
    user.last_seen = new Date().toISOString();

    // check bans
    if (fs.existsSync(BANS_PATH)) {
      try {
        const bans = JSON.parse(fs.readFileSync(BANS_PATH, 'utf-8') || '[]');
        const isBanned = bans.some(b => b.id === discordUser.id);
        if (isBanned) {
          console.log(`🚫 Tentative de connexion d'un utilisateur banni: ${discordUser.id}`);
          return res.redirect("/?banned=1");
        }
      } catch (e) {
        console.error('Erreur lecture bans:', e);
      }
    }

    // mark role owner if matches env ADMIN_DISCORD_ID
    user.role = (process.env.ADMIN_DISCORD_ID && discordUser.id === process.env.ADMIN_DISCORD_ID) ? 'owner' : 'member';
    req.session.user = user;
    saveUser(user);

    console.log("✅ Connexion réussie:", user.username, { id: user.id, role: user.role });
    console.log("🔐 Session set:", !!req.session.user);
    console.log("📍 Redirection vers /page-principal...");

    res.redirect("/page-principal");
  } catch (error) {
    console.error("❌ Erreur OAuth:", error);
    res.redirect("/");
  }
});

export default router;