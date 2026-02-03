function $(id){ return document.getElementById(id); }

function showPage(pageId){
  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("show");
  });

  const target = $("page-" + pageId);
  if (!target) return;
  target.classList.add("show");

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("active", t.dataset.page === pageId);
  });

  const titles = {
    home: "Accueil",
    candidatures: "Candidatures",
    recrutement: "Recrutement",
    profil: "Profil"
  };
  if ($("pageTitle")) $("pageTitle").textContent = titles[pageId] || "BotGhost";
}

function setPill(txt, ok){
  const pill = $("botPill");
  if (!pill) return;
  pill.textContent = txt;
  pill.classList.toggle("bad", !ok);
}

async function updateBotStatus(){
  const start = performance.now();
  try{
    const r = await fetch("/api/health");
    const j = await r.json();
    const online = !!(j?.ok && j?.bot?.ok);

    const ms = Math.round(performance.now() - start);
    if ($("latencyValue")) $("latencyValue").textContent = ms;

    if (online){
      setPill("Bot: online", true);
      if ($("statusValue")) $("statusValue").textContent = "ONLINE";
      if ($("apiHint")) $("apiHint").textContent = "localhost:3000";
    }else{
      setPill("Bot: offline", false);
      if ($("statusValue")) $("statusValue").textContent = "OFFLINE";
      if ($("apiHint")) $("apiHint").textContent = "—";
    }
  }catch{
    setPill("Bot: offline", false);
    if ($("statusValue")) $("statusValue").textContent = "OFFLINE";
    if ($("apiHint")) $("apiHint").textContent = "—";
    if ($("latencyValue")) $("latencyValue").textContent = "—";
  }
}

// ✅ fake DB front (après on met en JSON serveur)
let candidatures = [
  { pseudo: "Shadow#0001", age: 17, why: "Motivé", status: "En attente" },
  { pseudo: "Alpha#7777", age: 18, why: "Je suis actif", status: "En attente" },
  { pseudo: "Ghost#9999", age: 20, why: "Je peux aider", status: "En attente" },
];

function renderCandidatures(){
  const box = $("candList");
  if (!box) return;
  box.innerHTML = "";

  candidatures.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="left">
        <div class="name">${c.pseudo}</div>
        <div class="meta">Âge: ${c.age} • ${c.why}</div>
      </div>
      <div class="right">
        <span class="badge">${c.status}</span>
      </div>
    `;
    div.addEventListener("click", () => {
      alert(`Candidature:\n${c.pseudo}\nAge: ${c.age}\n\n${c.why}`);
    });
    box.appendChild(div);
  });

  if ($("candCount")) $("candCount").textContent = candidatures.length;
}

document.addEventListener("DOMContentLoaded", () => {
  // tabs click
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      showPage(btn.dataset.page);
    });
  });

  // candidatures form
  const form = $("candForm");
  if (form){
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const pseudo = $("pseudo").value.trim();
      const age = parseInt($("age").value.trim(), 10);
      const why = $("why").value.trim();

      if (!pseudo || !age || !why) return;

      candidatures.unshift({ pseudo, age, why, status: "En attente" });
      renderCandidatures();

      $("formMsg").textContent = "✅ Candidature envoyée";
      form.reset();
      setTimeout(()=>{ $("formMsg").textContent = ""; }, 2000);
    });
  }

  // recrutement save
  const save = $("saveRecru");
  if (save){
    save.addEventListener("click", ()=>{
      const on = $("recruToggle").checked;
      const text = $("recruText").value;

      $("recruMsg").textContent = `✅ Sauvegardé (${on ? "ON" : "OFF"})`;
      setTimeout(()=>{ $("recruMsg").textContent = ""; }, 1500);

      console.log("Recruitment:", { on, text });
    });
  }

  showPage("home");
  renderCandidatures();
  updateBotStatus();
  setInterval(updateBotStatus, 4000);
});
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard chargé");

  // Exemple : données mock (à remplacer par API)
  const stats = {
    total: 0,
    pending: 0,
    success: 0,
    available: 3
  };

  const statEls = document.querySelectorAll(".stat strong");

  if (statEls.length >= 4) {
    statEls[0].textContent = stats.total;
    statEls[1].textContent = stats.pending;
    statEls[2].textContent = stats.success;
    statEls[3].textContent = stats.available;
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("bugModal");
  const openBtn = document.getElementById("openBug");
  const closeBtn = document.getElementById("closeBug");

  if (!modal || !openBtn) return;

  openBtn.onclick = () => modal.classList.remove("hidden");
  closeBtn.onclick = () => modal.classList.add("hidden");

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  document.querySelectorAll(".prio-grid button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".prio-grid button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("bugModal");
  const open = document.getElementById("openBug");
  const close = document.getElementById("closeBug");

  if (!modal || !open) return;

  open.onclick = () => modal.classList.remove("hidden");
  close.onclick = () => modal.classList.add("hidden");

  modal.onclick = e => {
    if (e.target === modal) modal.classList.add("hidden");
  };

  document.querySelectorAll(".prio-grid button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".prio-grid button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });
});
