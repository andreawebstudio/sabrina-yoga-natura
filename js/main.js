/* Sabrina Yoga Natura — script principale (nessuna dipendenza esterna) */

/* --------------------------------------------------------------------------
   EVENTI
   Aggiungere qui gli eventi reali. Se l'array è vuoto, la finestra mostra
   un messaggio di cortesia. Esempio di voce:
   {
     data: "Sabato 14 marzo 2027 · ore 10:00",
     titolo: "Yoga all'aperto",
     luogo: "Luogo da confermare",
     descrizione: "Pratica dolce adatta a tutti i livelli.",
     prenota: "#contatti"          // oppure un link esterno di prenotazione
   }
   -------------------------------------------------------------------------- */
const EVENTS = [];

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Anno dinamico */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Header: bordo allo scroll */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- Menu mobile ---------------- */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("main-nav");
  const toggleLabel = toggle.querySelector(".sr-only");
  const mq = window.matchMedia("(max-width: 900px)");

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    toggleLabel.textContent = open ? "Chiudi il menu" : "Apri il menu";
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  mq.addEventListener("change", () => setMenu(false));

  /* ---------------- Voce di menu attiva ---------------- */
  const links = [...document.querySelectorAll('.main-nav ul a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }
  window.addEventListener("scroll", () => {
    if (window.scrollY < 200) links.forEach((a) => a.classList.remove("is-active"));
  }, { passive: true });

  /* ---------------- Comparsa progressiva ---------------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------------- FAQ: tutte chiuse all'avvio ---------------- */
  document.querySelectorAll(".faq-q").forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const item = btn.closest(".faq-item");
    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
      item.classList.toggle("is-open", open);
    };
    set(false);
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  });

  /* ---------------- Come funziona: percorso luminoso ---------------- */
  const journey = document.getElementById("journey");
  if (journey) {
    const steps = [...journey.querySelectorAll(".journey-step")];
    const dots = steps.map((s) => s.querySelector(".journey-dot"));
    const track = document.createElement("span");
    track.className = "journey-track";
    track.setAttribute("aria-hidden", "true");
    track.innerHTML = '<span class="journey-fill"></span>';
    const glow = document.createElement("span");
    glow.className = "journey-glow";
    glow.setAttribute("aria-hidden", "true");
    journey.prepend(track, glow);

    let mode = "none";
    let start = 0, length = 0, cross = 0;

    const layout = () => {
      const base = journey.getBoundingClientRect();
      const c = dots.map((d) => {
        const r = d.getBoundingClientRect();
        return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
      });
      const sameY = c.every((p) => Math.abs(p.y - c[0].y) < 2);
      const sameX = c.every((p) => Math.abs(p.x - c[0].x) < 2);
      journey.classList.toggle("is-vertical", sameX && !sameY);
      if (sameY) {
        mode = "h"; start = c[0].x; length = c[c.length - 1].x - c[0].x; cross = c[0].y;
        Object.assign(track.style, { display: "", left: start + "px", top: cross + "px", width: length + "px", height: "1px" });
      } else if (sameX) {
        mode = "v"; start = c[0].y; length = c[c.length - 1].y - c[0].y; cross = c[0].x;
        Object.assign(track.style, { display: "", top: start + "px", left: cross + "px", height: length + "px", width: "1px" });
      } else {
        mode = "none";
        track.style.display = "none";
      }
      update();
    };

    const update = () => {
      const r = journey.getBoundingClientRect();
      const vh = window.innerHeight;
      let p;
      if (reduceMotion) p = 1;
      else if (mode === "h") p = (vh * 0.82 - r.top) / (vh * 0.45);
      else p = (vh * 0.72 - r.top) / Math.max(r.height, 1);
      p = Math.min(Math.max(p, 0), 1);
      journey.style.setProperty("--p", p.toFixed(4));

      const tip = start + p * length;
      if (mode === "h") { glow.style.left = tip + "px"; glow.style.top = cross + "px"; }
      else if (mode === "v") { glow.style.top = tip + "px"; glow.style.left = cross + "px"; }
      journey.style.setProperty("--glow", mode !== "none" && p > 0.01 && p < 0.99 ? "1" : "0");

      steps.forEach((step, i) => {
        let lit;
        if (mode === "none") lit = r.top < vh * 0.85 - (step.offsetTop || 0) * 0.6;
        else lit = p >= (i / (steps.length - 1)) - 0.02;
        step.classList.toggle("is-lit", lit);
      });
    };

    layout();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    window.addEventListener("load", layout);
  }

  /* ---------------- Eventi: finestra modale ---------------- */
  const dialog = document.getElementById("events-dialog");
  const opener = document.getElementById("open-events");
  if (dialog && opener) {
    const list = document.getElementById("events-list");
    const empty = document.getElementById("events-empty");
    if (EVENTS.length) {
      EVENTS.forEach((ev) => {
        const li = document.createElement("li");
        const add = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls; el.textContent = text; li.append(el); return el; };
        if (ev.data) add("p", "ev-date", ev.data);
        add("p", "ev-title", ev.titolo || "");
        if (ev.luogo) add("p", "ev-meta", ev.luogo);
        if (ev.descrizione) add("p", "ev-meta", ev.descrizione);
        if (ev.prenota) {
          const a = add("a", "ev-book", "Prenota il tuo posto");
          a.href = ev.prenota;
          if (/^https?:/.test(ev.prenota)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
          else a.setAttribute("data-close-dialog", "");
        }
        list.append(li);
      });
    } else {
      list.hidden = true;
      empty.hidden = false;
    }

    const close = () => { if (dialog.open) dialog.close(); };
    opener.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) close();                 // clic sullo sfondo
      if (e.target.closest("[data-close-dialog]")) close();
    });
    dialog.addEventListener("close", () => opener.focus());
  }

  /* ---------------- Modulo contatti ---------------- */
  const form = document.getElementById("contact-form");
  if (form) {
    const status = document.getElementById("form-status");
    const submit = form.querySelector('button[type="submit"]');
    const setStatus = (msg, type) => {
      status.textContent = msg;
      status.className = "form-status" + (type ? " is-" + type : "");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("", "");

      let firstInvalid = null;
      form.querySelectorAll("[required]").forEach((field) => {
        const ok = field.type === "checkbox" ? field.checked : field.checkValidity() && field.value.trim() !== "";
        field.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        setStatus("Controlla i campi evidenziati e conferma la presa visione dell'informativa privacy.", "error");
        firstInvalid.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      data.privacy = form.privacy.checked;
      submit.disabled = true;
      setStatus("Invio in corso…", "");

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) {
          form.reset();
          form.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
          setStatus("Grazie, ho ricevuto il tuo messaggio. Ti risponderò al più presto.", "success");
        } else {
          throw new Error(out.error || "send-failed");
        }
      } catch (err) {
        setStatus("Non è stato possibile inviare il messaggio in questo momento. Riprova più tardi oppure scrivimi su Instagram: @sabrinayoganatura.", "error");
      } finally {
        submit.disabled = false;
      }
    });
  }
});
