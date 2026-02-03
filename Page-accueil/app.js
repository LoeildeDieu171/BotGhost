document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("loginModal");
  const openBtn = document.getElementById("commencer");
  const closeBtn = document.getElementById("closeModal");
  const discordBtn = document.getElementById("discordLogin");

  // sécurité
  if (!modal || !openBtn) {
    console.error("Elements manquants");
    return;
  }

  // ouvrir modal
  openBtn.addEventListener("click", () => {
    modal.classList.add("show");
  });

  // fermer modal
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }

  // fermer en cliquant hors modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });

  // 🔥 OAUTH DISCORD (LA LIGNE IMPORTANTE)
  if (discordBtn) {
    discordBtn.addEventListener("click", () => {
      // ❌ PLUS DE FETCH /api/login
      // ✅ REDIRECTION OAUTH
      window.location.href = "/auth/discord";
    });
  }
});
