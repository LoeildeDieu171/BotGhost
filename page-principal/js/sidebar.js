document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-item");

  links.forEach(link => {
    // actif si URL correspond
    if (link.href === window.location.href) {
      link.classList.add("active");
    }

    link.addEventListener("click", () => {
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
});
document.querySelectorAll(".item").forEach(link => {
  if (link.href === location.href) {
    link.classList.add("active");
  }
});
