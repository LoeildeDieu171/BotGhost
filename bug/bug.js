document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bugForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      title: form.querySelector("input").value.trim(),
      description: form.querySelector("textarea").value.trim(),
      priority: form.querySelector("select").value,
      page: document.referrer || "unknown",
      date: new Date().toISOString()
    };

    if (data.title.length < 5 || data.description.length < 20) {
      alert("Merci de remplir correctement le formulaire.");
      return;
    }

    try {
      const res = await fetch("/api/bug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Erreur serveur");

      alert("✅ Bug envoyé avec succès !");
      form.reset();

    } catch (err) {
      alert("❌ Impossible d’envoyer le bug");
      console.error(err);
    }
  });
});
