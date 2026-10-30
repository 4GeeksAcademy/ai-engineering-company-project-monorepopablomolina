(() => {
  const MAX_COMMENTS = 500;
  const LOW_VOLUME_WARNING =
    "Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?";
  const WARN_PRODUCTS = ["moda", "electronica", "cosmetica"];

  const form = document.getElementById("lead-form");
  const success = document.getElementById("form-success");
  const counter = document.getElementById("comentarios-restantes");
  const submitBtn = form.querySelector('button[type="submit"]');

  const getEls = (name) => Array.from(form.querySelectorAll(`[name="${name}"]`));
  const value = (name) => getEls(name)[0].value;

  const rules = {
    empresa: () =>
      value("empresa").trim().length >= 2
        ? ""
        : "El nombre de la empresa debe tener al menos 2 caracteres",
    contacto: () =>
      value("contacto").trim().split(/\s+/).filter(Boolean).length >= 2
        ? ""
        : "Ingresa nombre y apellido del contacto",
    email: () =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email").trim())
        ? ""
        : "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com)",
    telefono: () =>
      /^\+\d{1,3}[\s-]?\d[\d\s-]{4,}$/.test(value("telefono").trim())
        ? ""
        : "El teléfono debe incluir código de país (ejemplo: +1 213 555 0147)",
    "sitio-web": () => {
      const url = value("sitio-web").trim();
      if (!url) return "";
      try {
        const { protocol } = new URL(url);
        if (protocol === "http:" || protocol === "https:") return "";
      } catch {
        // URL inválida: cae al mensaje de error
      }
      return "Si incluyes sitio web, debe ser una URL válida";
    },
    pais: () => (value("pais") ? "" : "Selecciona el país de operación principal"),
    producto: () =>
      value("producto") ? "" : "Selecciona el tipo de producto que manejas",
    volumen: () =>
      value("volumen") ? "" : "Selecciona el volumen mensual estimado",
    servicios: () =>
      getEls("servicios").some((el) => el.checked)
        ? ""
        : "Selecciona al menos un servicio de interés",
    tpl: () =>
      getEls("tpl").some((el) => el.checked)
        ? ""
        : "Indica si actualmente trabajas con otro proveedor logístico",
    comentarios: () => {
      const left = MAX_COMMENTS - value("comentarios").length;
      return left >= 0
        ? ""
        : `Los comentarios no pueden exceder ${MAX_COMMENTS} caracteres (quedan ${left})`;
    },
    privacidad: () =>
      getEls("privacidad")[0].checked
        ? ""
        : "Debes aceptar la política de privacidad para continuar",
  };

  const names = Object.keys(rules);
  const groups = ["servicios", "tpl"];
  const OPTIONAL = ["sitio-web", "comentarios"];

  const setState = (name, state) => {
    const els = getEls(name);
    els.forEach((el) => {
      if (state === "error") el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    });
    if (groups.includes(name) || name === "privacidad") return;
    const el = els[0];
    el.classList.toggle("border-green-700", state === "ok");
    el.classList.toggle("border-slate-500", state !== "ok");
    el.classList.toggle("bg-green-50", state === "ok");
    el.classList.toggle("bg-white", state !== "ok");
    el.classList.toggle("focus:ring-green-700", state === "ok");
  };

  const ERROR_ICON =
    '<svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="mt-0.5 h-4 w-4 shrink-0"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 6h2v5H9V6zm0 6h2v2H9v-2z" clip-rule="evenodd"/></svg>';

  const renderError = (name, message) => {
    const box = document.getElementById(`${name}-error`);
    box.replaceChildren();
    if (!message) return;
    box.insertAdjacentHTML("beforeend", ERROR_ICON);
    const text = document.createElement("span");
    text.textContent = message;
    box.append(text);
  };

  const validateField = (name) => {
    const message = rules[name]();
    renderError(name, message);
    const empty = OPTIONAL.includes(name) && !value(name).trim();
    setState(name, message ? "error" : empty ? "neutral" : "ok");
    return !message;
  };

  const updateCounter = () => {
    counter.textContent = String(MAX_COMMENTS - value("comentarios").length);
  };

  const warning = document.createElement("div");
  warning.id = "volumen-warning";
  warning.setAttribute("aria-live", "polite");
  warning.className = "text-sm font-medium text-amber-800";
  document.getElementById("volumen-error").after(warning);
  getEls("volumen")[0].setAttribute(
    "aria-describedby",
    "volumen-error volumen-warning",
  );

  const isLowVolume = () =>
    value("volumen") === "0-100" && WARN_PRODUCTS.includes(value("producto"));

  const updateWarning = () => {
    warning.textContent = isLowVolume() ? LOW_VOLUME_WARNING : "";
  };

  names.forEach((name) => {
    if (groups.includes(name) || name === "privacidad") {
      getEls(name).forEach((el) =>
        el.addEventListener("change", () => validateField(name)),
      );
      return;
    }
    const el = getEls(name)[0];
    el.addEventListener("blur", () => validateField(name));
    el.addEventListener("input", () => validateField(name));
    el.addEventListener("change", () => validateField(name));
  });

  groups.forEach((name) => {
    const fieldset = getEls(name)[0].closest("fieldset");
    fieldset.addEventListener("focusout", (event) => {
      if (!fieldset.contains(event.relatedTarget)) validateField(name);
    });
  });

  getEls("comentarios")[0].addEventListener("input", updateCounter);
  ["volumen", "producto"].forEach((name) =>
    getEls(name)[0].addEventListener("change", updateWarning),
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalid = names.filter((name) => !validateField(name));
    if (invalid.length > 0) {
      getEls(invalid[0])[0].focus();
      return;
    }

    if (isLowVolume() && !window.confirm(LOW_VOLUME_WARNING)) {
      getEls("volumen")[0].focus();
      return;
    }

    submitBtn.disabled = true;
    // Envío simulado: no hay backend.
    setTimeout(() => {
      submitBtn.disabled = false;
      form.classList.add("hidden");
      success.classList.remove("hidden");
      success.focus();
    }, 500);
  });

  form.addEventListener("reset", () => {
    // El reset nativo ocurre después de este evento; esperamos para limpiar el resto.
    setTimeout(() => {
      names.forEach((name) => {
        renderError(name, "");
        setState(name, "neutral");
      });
      warning.textContent = "";
      updateCounter();
      success.classList.add("hidden");
      form.classList.remove("hidden");
    }, 0);
  });
})();
