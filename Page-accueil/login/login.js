document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const user = document.getElementById("username");
  const pass = document.getElementById("password");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Connexion...";

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.value,
          password: pass.value,
        })
      });

      if (r.ok) {
        window.location.href = "/";
      } else {
        msg.textContent = "❌ Mauvais identifiants";
      }
    } catch {
      msg.textContent = "❌ Erreur serveur";
    }
    window.location.href = "/dashboard";
  });
});
