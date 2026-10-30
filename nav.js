(() => {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("menu-principal");
  if (!toggle || !menu) return;

  const label = toggle.querySelector("[data-label]");
  const iconOpen = toggle.querySelector("[data-icon=open]");
  const iconClose = toggle.querySelector("[data-icon=close]");

  const setOpen = (open) => {
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Cerrar menú" : "Abrir menú";
    iconOpen.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
})();
