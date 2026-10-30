(() => {
  "use strict";

  const ALMACENES = { "Los Ángeles": "Estados Unidos", Zaragoza: "España" };
  const PAISES = ["Estados Unidos", "España"];
  const URGENCIAS = ["Estándar", "Express", "Same Day"];
  const PESO_MIN = 0.1;
  const PESO_MAX = 70;
  const DIR_MIN = 10;
  const DIR_MAX = 150;
  const CP = { "Estados Unidos": /\b\d{5}(-\d{4})?\b/, España: /\b\d{5}\b/ };
  const CP_EJEMPLO = { "Estados Unidos": "90001", España: "50001" };

  const LABELS = {
    origen: "Origen (almacén)",
    paisDestino: "País de destino",
    direccionDestino: "Dirección de destino",
    pesoKg: "Peso del paquete",
    urgencia: "Urgencia",
  };

  // Campos cuya validez depende de otro campo.
  const DEPENDENTS = {
    origen: ["urgencia"],
    paisDestino: ["direccionDestino", "urgencia"],
  };

  const rules = {
    origen(el) {
      const v = el.value;
      if (!v) return `El campo ${LABELS.origen} es obligatorio. Elige Los Ángeles o Zaragoza.`;
      if (!(v in ALMACENES))
        return "El origen debe ser uno de nuestros almacenes: Los Ángeles o Zaragoza.";
      return "";
    },

    paisDestino(el) {
      const v = el.value;
      if (!v) return `El campo ${LABELS.paisDestino} es obligatorio. Elige Estados Unidos o España.`;
      if (!PAISES.includes(v))
        return "TrackFlow solo opera en Estados Unidos y España.";
      return "";
    },

    direccionDestino(el, values) {
      const v = el.value.trim();
      if (!v) return `El campo ${LABELS.direccionDestino} es obligatorio.`;
      if (v.length < DIR_MIN)
        return `La dirección es demasiado corta: mínimo ${DIR_MIN} caracteres (tiene ${v.length}).`;
      if (v.length > DIR_MAX)
        return `La dirección es demasiado larga: máximo ${DIR_MAX} caracteres (tiene ${v.length}).`;
      const pais = values.paisDestino;
      if (CP[pais] && !CP[pais].test(v))
        return `Falta el código postal de ${pais} (5 dígitos, por ejemplo ${CP_EJEMPLO[pais]}).`;
      return "";
    },

    pesoKg(el) {
      if (el.validity.badInput)
        return "El peso debe ser un número, sin letras ni símbolos (por ejemplo 2.5).";
      const raw = el.value.trim();
      if (!raw) return `El campo ${LABELS.pesoKg} es obligatorio.`;
      const n = Number(raw);
      if (!Number.isFinite(n))
        return "El peso debe ser un número, sin letras ni símbolos (por ejemplo 2.5).";
      if (n < 0) return "El peso no puede ser negativo.";
      if (n < PESO_MIN) return `El peso mínimo es ${PESO_MIN} kg.`;
      if (n > PESO_MAX)
        return `El peso máximo permitido es ${PESO_MAX} kg (ingresaste ${n} kg).`;
      if (!/^\d+(\.\d{1,2})?$/.test(raw))
        return "Usa como máximo 2 decimales y punto como separador (por ejemplo 2.5).";
      return "";
    },

    urgencia(el, values) {
      const v = el.value;
      if (!v) return `El campo ${LABELS.urgencia} es obligatorio. Elige Estándar, Express o Same Day.`;
      if (!URGENCIAS.includes(v))
        return "La urgencia debe ser Estándar, Express o Same Day.";
      const paisOrigen = ALMACENES[values.origen];
      if (
        v === "Same Day" &&
        paisOrigen &&
        PAISES.includes(values.paisDestino) &&
        paisOrigen !== values.paisDestino
      )
        return `Same Day solo aplica dentro del mismo país: desde ${values.origen} no se entrega el mismo día en ${values.paisDestino}. Elige Estándar o Express.`;
      return "";
    },
  };

  const form = document.getElementById("shipment-form");
  const status = document.getElementById("form-status");
  const names = Object.keys(rules);
  const touched = new Set();

  const STATUS_OK = ["border-green-600", "bg-green-50", "text-green-800"];
  const STATUS_ERR = ["border-red-500", "bg-red-50", "text-red-800"];

  const getValues = () =>
    Object.fromEntries(names.map((n) => [n, form.elements[n].value]));

  function setStatus(message, ok) {
    status.classList.remove(...STATUS_OK, ...STATUS_ERR);
    status.classList.add(...(ok ? STATUS_OK : STATUS_ERR));
    status.textContent = message;
  }

  function clearField(name) {
    const el = form.elements[name];
    document.getElementById(`${name}-error`).textContent = "";
    el.removeAttribute("aria-invalid");
    el.removeAttribute("data-valid");
  }

  function validateField(name) {
    const el = form.elements[name];
    const message = rules[name](el, getValues());
    const errorEl = document.getElementById(`${name}-error`);
    errorEl.textContent = message;
    if (message) {
      el.setAttribute("aria-invalid", "true");
      el.removeAttribute("data-valid");
    } else {
      el.removeAttribute("aria-invalid");
      el.setAttribute("data-valid", "true");
    }
    return message;
  }

  function revalidate(name) {
    validateField(name);
    (DEPENDENTS[name] || []).forEach((dep) => {
      if (touched.has(dep)) validateField(dep);
    });
  }

  names.forEach((name) => {
    const el = form.elements[name];
    el.addEventListener("blur", () => {
      touched.add(name);
      revalidate(name);
    });
    const onChange = () => {
      if (touched.has(name)) revalidate(name);
    };
    el.addEventListener("input", onChange);
    el.addEventListener("change", onChange);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    names.forEach((n) => touched.add(n));
    const invalid = names.filter((n) => validateField(n));

    if (invalid.length) {
      const plural = invalid.length === 1;
      setStatus(
        `Hay ${invalid.length} ${plural ? "error" : "errores"}, revisa los campos marcados.`,
        false
      );
      form.elements[invalid[0]].focus();
      return;
    }

    const v = getValues();
    setStatus(
      `Solicitud validada correctamente (simulación, no se envió nada): ${v.pesoKg} kg desde ${v.origen} hacia ${v.paisDestino}, urgencia ${v.urgencia}.`,
      true
    );
  });

  form.addEventListener("reset", () => {
    // Espera al reset nativo para no ser sobrescrito por él.
    setTimeout(() => {
      touched.clear();
      names.forEach(clearField);
      status.textContent = "";
    }, 0);
  });
})();
