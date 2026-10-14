(() => {
  const invite = window.TF9_CONFIG && window.TF9_CONFIG.discordInvite;
  if (invite) {
    document.querySelectorAll(".invite-link").forEach((link) => {
      link.href = invite;
    });
  }

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const toggle = document.querySelector(".menu-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) {
    return;
  }

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    links.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    links.classList.toggle("is-open", !isOpen);
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  const scope = document.querySelector("[data-scope]");
  const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (scope && canTrackPointer.matches && !prefersReducedMotion.matches) {
    scope.addEventListener("pointermove", (event) => {
      const bounds = scope.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      const maxOffset = Math.min(bounds.width, bounds.height) * 0.12;

      scope.style.setProperty("--aim-x", `${x * maxOffset}px`);
      scope.style.setProperty("--aim-y", `${y * maxOffset}px`);
      scope.style.setProperty("--scope-rotation", `${x * 12}deg`);
    });

    scope.addEventListener("pointerleave", () => {
      scope.style.setProperty("--aim-x", "0px");
      scope.style.setProperty("--aim-y", "0px");
      scope.style.setProperty("--scope-rotation", "0deg");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
})();
