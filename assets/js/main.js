/* Портфолио: поведение без сборки. Всё деградирует аккуратно,
   если JS недоступен (класс no-js показывает скрытые элементы). */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  document.documentElement.classList.remove("no-js");

  /* ---- навбар: плотная подложка после ухода от hero + подсветка активной секции ---- */
  var nav = document.getElementById("mainNav");
  var hero = document.querySelector(".hero");

  function onScroll() {
    var threshold = hero ? hero.offsetHeight - 72 : 72;
    nav.classList.toggle("solid", window.scrollY > threshold);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- страховка от «залипшего» вьюпорта ----
     Chrome на Windows после максимизации окна или смены масштаба экрана
     иногда продолжает рисовать страницу по старому размеру окна, а
     viewport-единицы (svh) при этом «замирают». Пересчитываем высоту
     hero из JS на каждом resize — CSS min-height остаётся фолбэком без JS. */
  function heroFit() {
    if (!hero) return;
    hero.style.minHeight = Math.max(560, Math.round(window.innerHeight * 0.92)) + "px";
  }
  var heroFitRaf = 0;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(heroFitRaf);
    heroFitRaf = requestAnimationFrame(heroFit);
  }, { passive: true });
  heroFit();

  /* ---- собственный скролл-спай: подсветка активного пункта меню ----
     Проще и стабильнее при плавном скролле, чем scroll-spy Bootstrap. */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('.nav-link[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function spy() {
    var pos = window.scrollY + 120;
    var current = null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) current = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* мобильное меню закрывается после выбора пункта + подложка навбара на время раскрытия */
  var collapseEl = nav.querySelector(".collapse");
  nav.addEventListener("show.bs.collapse", function () { nav.classList.add("show-open"); });
  nav.addEventListener("hidden.bs.collapse", function () { nav.classList.remove("show-open"); });
  navLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      var c = nav.querySelector(".collapse");
      if (c && window.bootstrap && c.classList.contains("show")) {
        new window.bootstrap.Collapse(c, { toggle: true });
      }
    });
  });

  /* ---- появление блоков при скролле ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- полосы навыков: рисуем проценты, когда секция в кадре ---- */
  var skillsSection = document.getElementById("skills");
  if (skillsSection) {
    skillsSection.querySelectorAll(".skill").forEach(function (s) {
      var pct = s.getAttribute("data-pct");
      if (pct) s.querySelector(".skill-head").setAttribute("data-pct-visible", pct + "%");
    });
    var fill = function () { skillsSection.classList.add("skills-in"); };
    if ("IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { fill(); io2.disconnect(); }
      }, { threshold: 0.25 });
      io2.observe(skillsSection);
    } else {
      fill();
    }
  }

  /* ---- форма контактов: валидация + сборка письма через mailto ----
     GitHub Pages — статичный хостинг, сервера нет. Открываем почтовый
     клиент пользователя с уже заполненными темой и телом. ---- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  var MAILTO = "mailto:[email]"; /* ЗАМЕНИТЕ на свою почту (здесь и в разделе контактов) */

  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) {
        status.textContent = "Проверьте подсвеченные поля.";
        return;
      }
      var d = new FormData(form);
      var body =
        d.get("message") +
        "\n\n" + d.get("name") +
        "\n" + d.get("email");
      var uri =
        MAILTO +
        "?subject=" + encodeURIComponent("[Портфолио] " + d.get("subject")) +
        "&body=" + encodeURIComponent(body);

      if (uri.length > 1800) {
        status.textContent = "Сообщение слишком длинное для письма: сократите его или напишите напрямую.";
        return;
      }
      window.location.href = uri;
      status.textContent = "Открываю почтовую программу: проверьте черновик и отправьте письмо.";
    });
  }

  /* ---- год в футере ---- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
