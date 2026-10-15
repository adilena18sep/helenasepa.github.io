/* ============================================================
   HELENA SEPA SAPUTRI — PORTFOLIO
   Interaksi: tema, navigasi, reveal, tilt, parallax, form.
   Semua efek gerak otomatis mati bila pengguna memilih
   "reduce motion" atau memakai perangkat sentuh.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  const rafThrottle = (fn) => {
    let queued = false;
    return function (...args) {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn.apply(this, args);
      });
    };
  };

  /* ============================================================
     1. TEMA (TERANG / GELAP)
     ============================================================ */
  const THEME_KEY = "helena-theme";
  const root = document.documentElement;
  const themeToggle = $("#themeToggle");

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"
      );
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#14100F" : "#B01E23");
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* diabaikan */ }
    }
  }

  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { /* diabaikan */ }
    applyTheme(stored || (prefersDark.matches ? "dark" : "light"), false);
  }
  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  // Ikuti preferensi sistem hanya bila pengguna belum memilih manual.
  const onSystemTheme = (e) => {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (err) { /* diabaikan */ }
    if (!stored) applyTheme(e.matches ? "dark" : "light", false);
  };
  if (prefersDark.addEventListener) prefersDark.addEventListener("change", onSystemTheme);
  else if (prefersDark.addListener) prefersDark.addListener(onSystemTheme);

  /* ============================================================
     2. TAHUN DI FOOTER
     ============================================================ */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     3. NAVBAR: sticky, menu mobile, tautan aktif
     ============================================================ */
  const nav = $("#nav");
  const burger = $("#burger");
  const navMenu = $("#navMenu");
  const navLinks = $$(".nav__link");

  function closeMenu() {
    if (!navMenu || !burger) return;
    navMenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Buka menu");
    document.body.classList.remove("is-locked");
  }

  if (burger && navMenu) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        navMenu.classList.add("is-open");
        burger.setAttribute("aria-expanded", "true");
        burger.setAttribute("aria-label", "Tutup menu");
        document.body.classList.add("is-locked");
      }
    });

    // Tutup menu saat tautan diklik
    navLinks.forEach((link) => link.addEventListener("click", closeMenu));

    // Tutup dengan tombol Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
        closeMenu();
        burger.focus();
      }
    });

    // Tutup saat layar diperbesar ke desktop
    const mqDesktop = window.matchMedia("(min-width: 861px)");
    const onDesktop = (e) => { if (e.matches) closeMenu(); };
    if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", onDesktop);
    else if (mqDesktop.addListener) mqDesktop.addListener(onDesktop);
  }

  /* --- Progress bar + status sticky + tombol ke atas --- */
  const progressBar = $("#progressBar");
  const toTop = $("#toTop");
  const sections = $$("main section[id]");

  const onScroll = rafThrottle(() => {
    const y = window.scrollY || window.pageYOffset;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.min(100, Math.max(0, (y / docH) * 100)) : 0;

    if (progressBar) progressBar.style.width = pct + "%";
    if (nav) nav.classList.toggle("is-stuck", y > 20);
    if (toTop) toTop.classList.toggle("is-on", y > 520);

    // Tandai tautan navigasi yang sedang aktif
    if (sections.length) {
      const probe = y + window.innerHeight * 0.32;
      let current = null;
      for (const sec of sections) {
        if (sec.offsetTop <= probe) current = sec.id;
      }
      navLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";
        link.classList.toggle("is-active", href === "#" + current);
      });
    }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  }

  /* ============================================================
     4. REVEAL SAAT DI-SCROLL
     ============================================================ */
  const revealEls = $$(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ============================================================
     5. TIMELINE: garis yang tumbuh mengikuti scroll
     ============================================================ */
  const timelineFill = $("#timelineFill");
  const timeline = $(".timeline");

  if (timelineFill && timeline && !reduceMotion) {
    const updateTimeline = rafThrottle(() => {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 saat bagian atas timeline menyentuh 80% tinggi layar,
      // 1 saat bagian bawahnya menyentuh 30% tinggi layar.
      const start = vh * 0.8;
      const end = vh * 0.3;
      const total = rect.height + (start - end);
      const passed = start - rect.top;
      const ratio = Math.min(1, Math.max(0, passed / total));
      timelineFill.style.transform = "scaleY(" + ratio + ")";
    });

    window.addEventListener("scroll", updateTimeline, { passive: true });
    window.addEventListener("resize", updateTimeline);
    updateTimeline();
  } else if (timelineFill) {
    timelineFill.style.transform = "scaleY(1)";
  }

  /* ============================================================
     6. PARALLAX FOTO HERO
     ============================================================ */
  const parallaxPhoto = $("#parallaxPhoto");

  if (parallaxPhoto && !reduceMotion && !isTouch) {
    const updateParallax = rafThrottle(() => {
      const y = window.scrollY || window.pageYOffset;
      if (y > window.innerHeight * 1.15) return;
      parallaxPhoto.style.transform = "translate3d(0," + (y * 0.085) + "px,0)";
    });
    window.addEventListener("scroll", updateParallax, { passive: true });
    updateParallax();
  }

  /* ============================================================
     7. TILT 3D PADA KARTU KOMPETENSI (desktop saja)
     ============================================================ */
  const tiltCards = $$(".tilt");

  if (tiltCards.length && !reduceMotion && !isTouch) {
    const MAX_TILT = 7;

    tiltCards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * MAX_TILT * 2;
        const rotateX = (0.5 - py) * MAX_TILT * 2;
        card.style.transition = "transform .12s linear, box-shadow .45s ease, border-color .45s ease";
        card.style.transform =
          "perspective(900px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" +
          rotateY.toFixed(2) + "deg) translateY(-4px)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .5s cubic-bezier(.22,1,.36,1), box-shadow .45s ease, border-color .45s ease";
        card.style.transform = "";
      });
    });
  }

  /* ============================================================
     8. MAGNETIC BUTTON
     ============================================================ */
  const magneticBtns = $$(".btn--primary");

  if (magneticBtns.length && !reduceMotion && !isTouch) {
    magneticBtns.forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width / 2;
        const my = e.clientY - rect.top - rect.height / 2;
        btn.style.transform =
          "translate(" + (mx * 0.16).toFixed(2) + "px," +
          (my * 0.24 - 3).toFixed(2) + "px)";
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ============================================================
     9. CURSOR GLOW
     ============================================================ */
  const cursorGlow = $("#cursorGlow");

  if (cursorGlow && !reduceMotion && !isTouch) {
    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let curX = glowX;
    let curY = glowY;
    let glowActive = false;

    document.addEventListener("mousemove", (e) => {
      glowX = e.clientX;
      glowY = e.clientY;
      if (!glowActive) {
        glowActive = true;
        cursorGlow.classList.add("is-on");
      }
    });

    document.addEventListener("mouseleave", () => {
      glowActive = false;
      cursorGlow.classList.remove("is-on");
    });

    (function loopGlow() {
      curX += (glowX - curX) * 0.14;
      curY += (glowY - curY) * 0.14;
      cursorGlow.style.transform =
        "translate3d(" + curX.toFixed(1) + "px," + curY.toFixed(1) + "px,0)";
      requestAnimationFrame(loopGlow);
    })();
  }

  /* ============================================================
     10. TYPEWRITER
     ============================================================ */
  const typeEl = $("#typewriter");
  const ROLES = [
    "Agen Perbankan BRILink",
    "Kasir & Rekonsiliasi Kas",
    "Staf Administrasi",
    "Instruktur Komputer"
  ];

  if (typeEl) {
    if (reduceMotion) {
      typeEl.textContent = ROLES[0];
    } else {
      let roleIdx = 0;
      let charIdx = 0;
      let deleting = false;

      const TYPE_MS = 62;
      const DELETE_MS = 32;
      const HOLD_MS = 1500;
      const GAP_MS = 380;

      function tick() {
        const word = ROLES[roleIdx];

        if (!deleting) {
          charIdx++;
          typeEl.textContent = word.slice(0, charIdx);
          if (charIdx === word.length) {
            deleting = true;
            setTimeout(tick, HOLD_MS);
            return;
          }
          setTimeout(tick, TYPE_MS);
        } else {
          charIdx--;
          typeEl.textContent = word.slice(0, charIdx);
          if (charIdx === 0) {
            deleting = false;
            roleIdx = (roleIdx + 1) % ROLES.length;
            setTimeout(tick, GAP_MS);
            return;
          }
          setTimeout(tick, DELETE_MS);
        }
      }
      setTimeout(tick, 700);
    }
  }

  /* ============================================================
     11. ACCORDION PENGALAMAN KERJA
     ============================================================ */
  const triggers = $$(".accordion__trigger");

  triggers.forEach((trigger) => {
    const job = trigger.closest(".job");

    // Tandai kartu yang terbuka agar titik timeline ikut menyala.
    if (job && trigger.getAttribute("aria-expanded") === "true") {
      job.classList.add("is-open");
    }

    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isOpen));
      if (job) job.classList.toggle("is-open", !isOpen);
    });
  });

  /* ============================================================
     12. SALIN KE PAPAN KLIP (email & telepon)
     ============================================================ */
  const toast = $("#toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback untuk konteks non-HTTPS / file://
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  // Tombol salin kecil di dalam kartu kontak
  $$(".contact-card[data-copy]").forEach((card) => {
    const text = (card.getAttribute("data-copy") || "").trim();
    if (!text) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "contact-card__copy";
    btn.setAttribute("aria-label", "Salin " + text);
    btn.title = "Salin " + text;
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/>' +
      '<path d="M15.5 5.5H6.5a2 2 0 0 0-2 2v9"/></svg>';

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await copyText(text);
      showToast(ok ? "Tersalin: " + text : "Gagal menyalin. Salin manual ya.");
    });

    card.appendChild(btn);
  });

  /* ============================================================
     13. FORM KONTAK (mailto)
     ============================================================ */
  const form = $("#contactForm");
  const formStatus = $("#formStatus");
  const MAIL_TO = "hlenahelen26@gmail.com";

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#cf-name").value.trim();
      const email = $("#cf-email").value.trim();
      const message = $("#cf-message").value.trim();

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      if (!name || !emailOk || !message) {
        if (formStatus) {
          formStatus.className = "contact-form__status is-error";
          formStatus.textContent = !name
            ? "Mohon isi nama Anda."
            : !emailOk
              ? "Mohon isi alamat email yang valid."
              : "Mohon tuliskan pesan Anda.";
        }
        return;
      }

      const subject = "Pesan dari " + name + " — melalui web portofolio";
      const body =
        "Nama: " + name + "\n" +
        "Email: " + email + "\n\n" +
        "Pesan:\n" + message + "\n";

      const href =
        "mailto:" + MAIL_TO +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = href;

      if (formStatus) {
        formStatus.className = "contact-form__status is-ok";
        formStatus.textContent = "Membuka aplikasi email Anda…";
      }
      showToast("Membuka aplikasi email…");
    });
  }

  /* ============================================================
     14. SCROLL HALUS UNTUK TAUTAN ANCHOR
     ============================================================ */
  if (!reduceMotion) {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Perbarui URL tanpa lompatan
        if (history.replaceState) history.replaceState(null, "", id);
      });
    });
  }

})();
