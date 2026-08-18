/**
 * CLÍNICA DENTAL AURORA — LANDING PAGE
 * JavaScript modular en vanilla JS (sin dependencias).
 * Cada función "init..." es independiente y se ejecuta de forma aislada
 * mediante safeRun(), de modo que si un módulo falla (por ejemplo, porque
 * falta un elemento en el DOM) el resto de la página sigue funcionando.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    safeRun(setFooterYear);
    safeRun(initHeaderScroll);
    safeRun(initMobileNav);
    safeRun(initScrollReveal);
    safeRun(initCounters);
    safeRun(initGalleryFilters);
    safeRun(initTestimonialCarousel);
    safeRun(initAccordion);
    safeRun(initContactForm);
    safeRun(initBackToTop);
  }

  /** Ejecuta una función capturando cualquier error para no romper el resto de módulos. */
  function safeRun(fn) {
    try {
      fn();
    } catch (error) {
      console.error("[AuroraDental] Error en " + fn.name + ":", error);
    }
  }

  /* ---------------------------------------------------------------------
   * Año dinámico en el footer
   * ------------------------------------------------------------------- */
  function setFooterYear() {
    var year = new Date().getFullYear();
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ---------------------------------------------------------------------
   * Cabecera: sombra al hacer scroll
   * ------------------------------------------------------------------- */
  function initHeaderScroll() {
    var header = document.getElementById("header");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------
   * Menú móvil (hamburguesa + backdrop + cierre con Escape)
   * ------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("nav");
    var backdrop = document.getElementById("navBackdrop");
    if (!toggle || !nav || !backdrop) return;

    var iconUse = toggle.querySelector("use");

    function openNav() {
      nav.classList.add("is-open");
      backdrop.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (iconUse) iconUse.setAttribute("href", "#icon-close");
    }

    function closeNav() {
      nav.classList.remove("is-open");
      backdrop.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (iconUse) iconUse.setAttribute("href", "#icon-menu");
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });

    backdrop.addEventListener("click", closeNav);

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });
  }

  /* ---------------------------------------------------------------------
   * Animaciones de aparición al hacer scroll (IntersectionObserver)
   * ------------------------------------------------------------------- */
  function initScrollReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    items.forEach(function (item) {
      var delay = item.getAttribute("data-reveal-delay");
      if (delay) item.style.setProperty("--reveal-delay", delay + "ms");
    });

    // Fallback si el navegador no soporta IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  /* ---------------------------------------------------------------------
   * Contadores animados (años de experiencia, pacientes, etc.)
   * ------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    function animateCounter(el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      var duration = 1500;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute("data-target");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
   * Filtros de la galería de casos
   * ------------------------------------------------------------------- */
  function initGalleryFilters() {
    var buttons = document.querySelectorAll("[data-filter]");
    var cards = document.querySelectorAll("[data-gallery] .project-card");
    var emptyMessage = document.querySelector("[data-gallery-empty]");
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.getAttribute("data-filter");

        buttons.forEach(function (btn) {
          var isActive = btn === button;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-selected", String(isActive));
        });

        var visibleCount = 0;
        cards.forEach(function (card) {
          var matches = filter === "todos" || card.getAttribute("data-category") === filter;
          card.classList.toggle("is-hidden", !matches);
          if (matches) visibleCount++;
        });

        if (emptyMessage) emptyMessage.hidden = visibleCount !== 0;
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Carrusel de testimonios (autoplay + control manual + accesibilidad)
   * ------------------------------------------------------------------- */
  function initTestimonialCarousel() {
    var track = document.querySelector("[data-testimonial-track]");
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-testimonial-slide]"));
    var dotsWrap = document.querySelector("[data-testimonial-dots]");
    var prevBtn = document.querySelector("[data-testimonial-prev]");
    var nextBtn = document.querySelector("[data-testimonial-next]");
    if (!track || !slides.length || !dotsWrap) return;

    var AUTOPLAY_MS = 6000;
    var current = 0;
    var autoplayId = null;

    slides.forEach(function (_, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Ir al testimonio " + (index + 1));
      dot.addEventListener("click", function () {
        goTo(index);
      });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function render() {
      slides.forEach(function (slide, index) {
        slide.classList.toggle("is-active", index === current);
      });
      dots.forEach(function (dot, index) {
        dot.classList.toggle("is-active", index === current);
      });
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
      restartAutoplay();
    }

    function next() {
      goTo(current + 1);
    }

    function prev() {
      goTo(current - 1);
    }

    function startAutoplay() {
      autoplayId = window.setInterval(next, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (autoplayId) window.clearInterval(autoplayId);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);

    // Pausa el autoplay si el usuario interactúa o pasa el ratón por encima
    track.addEventListener("mouseenter", stopAutoplay);
    track.addEventListener("mouseleave", startAutoplay);
    track.addEventListener("focusin", stopAutoplay);
    track.addEventListener("focusout", startAutoplay);

    render();
    startAutoplay();
  }

  /* ---------------------------------------------------------------------
   * Acordeón de preguntas frecuentes (accesible con aria-expanded)
   * ------------------------------------------------------------------- */
  function initAccordion() {
    var items = document.querySelectorAll("[data-accordion] .accordion__item");
    if (!items.length) return;

    items.forEach(function (item) {
      var trigger = item.querySelector(".accordion__trigger");
      var panel = item.querySelector(".accordion__panel");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", function () {
        var isOpen = trigger.getAttribute("aria-expanded") === "true";

        // Cierra el resto de preguntas (acordeón de una sola apertura)
        items.forEach(function (other) {
          var otherTrigger = other.querySelector(".accordion__trigger");
          var otherPanel = other.querySelector(".accordion__panel");
          if (otherTrigger && otherPanel) {
            otherTrigger.setAttribute("aria-expanded", "false");
            otherPanel.hidden = true;
          }
        });

        if (!isOpen) {
          trigger.setAttribute("aria-expanded", "true");
          panel.hidden = false;
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Formulario de contacto: validación en tiempo real + envío simulado
   * con estados de carga, éxito y error.
   * ------------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var submitBtn = document.getElementById("submitBtn");
    var spinner = form.querySelector("[data-submit-spinner]");
    var btnLabel = submitBtn ? submitBtn.querySelector(".btn__label") : null;
    var statusBox = form.querySelector("[data-form-status]");

    var validators = {
      name: function (value) {
        return value.trim().length >= 2 ? "" : "Introduce tu nombre completo.";
      },
      phone: function (value) {
        return /^[+]?[\d\s]{9,15}$/.test(value.trim()) ? "" : "Introduce un teléfono válido.";
      },
      email: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Introduce un correo electrónico válido.";
      },
      service: function (value) {
        return value ? "" : "Selecciona el motivo de tu consulta.";
      },
      message: function (value) {
        return value.trim().length >= 10 ? "" : "Cuéntanos un poco más (mínimo 10 caracteres).";
      },
      privacy: function (_value, input) {
        return input.checked ? "" : "Debes aceptar la política de privacidad.";
      },
    };

    function getFieldWrapper(input) {
      return input.closest(".field");
    }

    function getErrorEl(name) {
      return form.querySelector('[data-error-for="' + name + '"]');
    }

    function validateField(input) {
      var validator = validators[input.name];
      if (!validator) return true;

      var value = input.type === "checkbox" ? input.checked : input.value;
      var message = validator(value, input);
      var wrapper = getFieldWrapper(input);
      var errorEl = getErrorEl(input.name);

      if (message) {
        if (wrapper) wrapper.classList.add("has-error");
        if (errorEl) errorEl.textContent = message;
        return false;
      }

      if (wrapper) wrapper.classList.remove("has-error");
      if (errorEl) errorEl.textContent = "";
      return true;
    }

    var trackedFields = Array.prototype.filter.call(form.elements, function (el) {
      return el.name && validators[el.name];
    });

    trackedFields.forEach(function (input) {
      var eventName = input.tagName === "SELECT" || input.type === "checkbox" ? "change" : "blur";
      input.addEventListener(eventName, function () {
        validateField(input);
      });
      // Revalida mientras escribe solo si el campo ya tenía un error visible
      input.addEventListener("input", function () {
        var wrapper = getFieldWrapper(input);
        if (wrapper && wrapper.classList.contains("has-error")) validateField(input);
      });
    });

    function showStatus(state, message) {
      if (!statusBox) return;
      statusBox.hidden = false;
      statusBox.setAttribute("data-state", state);
      statusBox.textContent = message;
    }

    function hideStatus() {
      if (!statusBox) return;
      statusBox.hidden = true;
      statusBox.removeAttribute("data-state");
    }

    function setLoading(isLoading) {
      if (submitBtn) submitBtn.disabled = isLoading;
      if (spinner) spinner.hidden = !isLoading;
      if (btnLabel) btnLabel.textContent = isLoading ? "Enviando..." : "Pedir cita";
    }

    /**
     * Simula el envío del formulario a un servidor.
     * Sustituye esta función por una llamada real, por ejemplo:
     *   fetch('/api/citas', { method: 'POST', body: JSON.stringify(payload) })
     * En la demo, hay un 12% de probabilidad de fallo para poder ver el estado de error.
     */
    function submitLead(payload) {
      return new Promise(function (resolve, reject) {
        window.setTimeout(function () {
          if (Math.random() < 0.88) {
            resolve({ ok: true, payload: payload });
          } else {
            reject(new Error("No se ha podido enviar la solicitud. Inténtalo de nuevo en unos segundos."));
          }
        }, 1100);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      hideStatus();

      var results = trackedFields.map(validateField);
      var isValid = results.every(Boolean);

      if (!isValid) {
        showStatus("error", "Revisa los campos marcados antes de enviar el formulario.");
        var firstInvalid = form.querySelector(".has-error input, .has-error textarea, .has-error select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var payload = {};
      new FormData(form).forEach(function (value, key) {
        payload[key] = value;
      });

      setLoading(true);

      submitLead(payload)
        .then(function () {
          showStatus("success", "¡Gracias! Hemos recibido tu solicitud y te confirmaremos la cita en menos de 24h laborables.");
          form.reset();
          trackedFields.forEach(function (input) {
            var wrapper = getFieldWrapper(input);
            if (wrapper) wrapper.classList.remove("has-error");
          });
        })
        .catch(function (error) {
          showStatus("error", error && error.message ? error.message : "Ha ocurrido un error inesperado. Vuelve a intentarlo.");
        })
        .finally(function () {
          setLoading(false);
        });
    });
  }

  /* ---------------------------------------------------------------------
   * Botón "volver arriba"
   * ------------------------------------------------------------------- */
  function initBackToTop() {
    var button = document.getElementById("backToTop");
    if (!button) return;

    var onScroll = function () {
      button.hidden = window.scrollY < 500;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
