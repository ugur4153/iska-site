/* ISKA PROPERTY INVEST — etkileşimler */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header ---------- */
  const header = document.getElementById("header");
  const toggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Arsa mı, altın mı? ---------- */
  const cmpRange = document.getElementById("cmpRange");
  if (cmpRange) {
    const tl = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
    const rows = [...document.querySelectorAll("#cmpList li")];
    const maxMult = Math.max(...rows.map((r) => +r.dataset.mult));
    const amountEl = document.getElementById("cmpAmount");
    const drawCmp = () => {
      const v = +cmpRange.value;
      amountEl.textContent = tl.format(v);
      cmpRange.style.setProperty("--p", ((v - cmpRange.min) / (cmpRange.max - cmpRange.min)) * 100 + "%");
      rows.forEach((r) => {
        const m = +r.dataset.mult;
        r.querySelector(".cmp__val").textContent = tl.format(v * m) + " TL";
        r.querySelector(".cmp__bar i").style.width = Math.max(1.5, (m / maxMult) * 100) + "%";
      });
    };
    cmpRange.addEventListener("input", drawCmp);
    drawCmp();
  }

  /* ---------- Proje kartı → form ---------- */
  document.querySelectorAll("[data-project]").forEach((a) => a.addEventListener("click", () => {
    const sel = document.getElementById("f-project");
    if (sel) sel.value = a.dataset.project;
  }));

  try {
    const pq = new URLSearchParams(location.search).get("proje");
    const sel = document.getElementById("f-project");
    if (pq && sel) sel.value = pq;
  } catch (e) {}

  /* ---------- Form doğrulama ---------- */
  const form = document.getElementById("contactForm");
  if (form) {
  const rules = {
    name: (v) => v.trim().length >= 3,
    phone: (v) => v.replace(/\D/g, "").length >= 10,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  };
  const formStart = Date.now();

  Object.keys(rules).forEach((n) => {
    form.elements[n].addEventListener("blur", (e) => {
      if (e.target.value) e.target.closest(".field").classList.toggle("is-invalid", !rules[n](e.target.value));
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    Object.keys(rules).forEach((n) => {
      const valid = rules[n](form.elements[n].value);
      form.elements[n].closest(".field").classList.toggle("is-invalid", !valid);
      if (!valid && ok) { form.elements[n].focus(); ok = false; }
    });
    const kvkk = document.getElementById("f-kvkk");
    if (!kvkk.checked) { kvkk.focus(); kvkk.closest(".form__consent").style.color = "#B3261E"; ok = false; }
    else kvkk.closest(".form__consent").style.color = "";
    if (!ok) return;

    // Spam koruması: honeypot dolu veya form 3 sn'den kısa sürede gönderildiyse yok say
    if (form.elements.website.value || Date.now() - formStart < 3000) return;

    // Talep e-posta ile info@iskaproperty.com adresine gider (FormSubmit, ücretsiz)
    const v = (n) => (form.elements[n] && form.elements[n].value || "").trim();
    const lines = [
      "Merhaba, ISKA web sitesinden yazıyorum.",
      "Ad Soyad: " + v("name"),
      "Telefon: " + v("phone"),
    ];
    if (v("project")) lines.push("İlgilendiğim proje: " + v("project"));
    if (v("message")) lines.push("Mesaj: " + v("message"));
    const waUrl = "https://wa.me/905452154246?text=" + encodeURIComponent(lines.join("\n"));
    document.querySelectorAll(".js-form-wa").forEach((a) => { a.href = waUrl; });

    const btn = form.querySelector('button[type="submit"]');
    form.classList.remove("is-error");
    if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = "Gönderiliyor…"; }
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: "dba763f2-ce5d-417f-bb15-74c2dfd9a9f5",
        subject: "ISKA sitesinden yeni bilgi talebi: " + v("name"),
        from_name: "ISKA Web Sitesi",
        replyto: v("email"),
        "Ad Soyad": v("name"),
        "Telefon": v("phone"),
        "E-posta": v("email"),
        "İlgilenilen Proje": v("project") || "-",
        "Bütçe": v("budget") || "-",
        "Mesaj": v("message") || "-",
        "Sayfa": location.href
      })
    })
      .then((r) => r.json().then((j) => { if (!r.ok || String(j.success) === "false") throw new Error(j.message || r.status); }))
      .then(() => {
        form.classList.add("is-sent");
        if (window.gtag) window.gtag("event", "generate_lead");
        if (window.fbq) window.fbq("track", "Lead");
      })
      .catch(() => form.classList.add("is-error"))
      .finally(() => { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; } });
  });

  }

  const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();
})();

/* ===== ISKA Asistan: hazır soru-cevap sohbet penceresi (AI'sız, ücretsiz) ===== */
(function () {
  "use strict";
  const me = document.currentScript;
  const BASE = me ? new URL(".", me.src).href : "";
  const WA = "https://wa.me/905452154246?text=" + encodeURIComponent("Merhaba, ISKA arsaları hakkında bilgi almak istiyorum.");
  const link = (href, text) => '<a href="' + BASE + href + '">' + text + "</a>";
  const QA = [
    { q: "Hangi projeleriniz var?", a: () =>
      "Şu an dört projemiz var:<ul><li>" + link("gobel.html", "Göbel") + " – Balıkesir / Kepsut, 223 parsel</li><li>" +
      link("bagtepe.html", "Bağtepe") + " – Balıkesir / Kepsut, 112 parsel</li><li>" +
      link("haydar.html", "Haydar") + " – Balıkesir / Manyas</li><li>" +
      link("karakoclu.html", "Karakoçlu") + " – Zonguldak / Devrek, 42 parsel</li></ul>Projeye tıklayarak detaylarını inceleyebilirsiniz." },
    { q: "Parsel büyüklükleri ne kadar?", a: () =>
      "<ul><li>Göbel: 300–495 m²</li><li>Bağtepe: 300–577 m²</li><li>Haydar: 258–322 m²</li></ul>Karakoçlu'daki parsel büyüklüklerini WhatsApp'tan hemen paylaşabiliriz." },
    { q: "Fiyatlar ne kadar?", a: () =>
      "Fiyatlar parselin büyüklüğüne ve konumuna göre değişiyor. Güncel fiyat listesini ve boştaki parselleri WhatsApp'tan hemen gönderelim." },
    { q: "Tapu durumu nasıl?", a: () =>
      "Göbel, Bağtepe ve Karakoçlu'da her parsel <strong>müstakil tapuludur</strong>, yani parselin tamamı sizin adınıza kayıtlı olur. Haydar'ın tapu detaylarını WhatsApp'tan paylaşalım." },
    { q: "İmar durumu nedir?", a: () =>
      "Dört projemizde de imar <strong>%25 / %50, 2 kat</strong>. Örneğin 400 m² bir parselde taban alanı 100 m², toplam inşaat alanı 200 m² olur. Detaylı bilgi için " + link("blog/taks-kaks-nedir.html", "TAKS ve KAKS yazımıza") + " göz atabilirsiniz." },
    { q: "Altyapı var mı?", a: () =>
      "<ul><li>Göbel: elektrik, su ve yol altyapısı mevcut.</li><li>Bağtepe: parseller asfalt yola cepheli.</li><li>Haydar: 7 m iç yollar ve 10 m ana yol.</li><li>Karakoçlu: mevcut yol ağı üzerinden ulaşım.</li></ul>" },
    { q: "Ödeme seçenekleri neler?", a: () =>
      "Ödeme planını seçtiğiniz parsele göre birlikte konuşuyoruz. Seçenekleri öğrenmek için WhatsApp'tan yazmanız yeterli." },
    { q: "Tapu devri nasıl yapılıyor?", a: () =>
      "Parselinizi seçtikten sonra tapu müdürlüğünden randevu alınır, harçlar ödenir ve tapu sizin adınıza devredilir. Bu süreçte yanınızdayız. Karakoçlu'da tapu devrini Türkiye'deki tüm tapu müdürlüklerinde yapabilirsiniz. " + link("blog/arsa-tapu-devri-nasil-yapilir.html", "Adım adım tapu devri") }
  ];

  const css = document.createElement("style");
  css.textContent = `
  .ai-fab{position:fixed;z-index:41;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(88px + env(safe-area-inset-bottom,0px));width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:var(--forest);color:#fff;display:grid;place-items:center;box-shadow:0 10px 24px -8px rgba(0,0,0,.35);transition:transform .25s}
  .ai-fab:hover{transform:scale(1.06)}
  .ai-fab svg{width:26px;height:26px}
  .ai-fab__dot{position:absolute;top:6px;right:6px;width:12px;height:12px;border-radius:50%;background:var(--leaf-light);border:2px solid var(--forest)}
  .ai-panel{position:fixed;z-index:60;right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(156px + env(safe-area-inset-bottom,0px));width:min(380px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 190px));display:flex;flex-direction:column;background:var(--cream);border:1px solid var(--line);border-radius:20px;box-shadow:0 24px 60px -18px rgba(25,57,28,.35);overflow:hidden;opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .25s,transform .25s}
  .ai-panel.is-open{opacity:1;transform:none;pointer-events:auto}
  .ai-head{display:flex;align-items:center;gap:12px;padding:16px 18px;background:var(--forest);color:#fff}
  .ai-head img{width:30px;height:30px;object-fit:contain;background:var(--cream);border-radius:8px;padding:3px}
  .ai-head strong{display:block;font-size:.98rem}
  .ai-head small{font-size:.76rem;opacity:.8}
  .ai-close{margin-left:auto;width:36px;height:36px;border:0;border-radius:10px;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:20px;line-height:1}
  .ai-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
  .ai-msg{max-width:88%;padding:11px 14px;border-radius:14px;font-size:.92rem;line-height:1.55}
  .ai-msg--bot{background:var(--white);border:1px solid var(--line);color:var(--ink);border-top-left-radius:4px}
  .ai-msg--me{align-self:flex-end;background:var(--leaf);color:#fff;border-top-right-radius:4px}
  .ai-msg ul{margin:6px 0;padding-left:18px}
  .ai-msg a{color:var(--leaf);font-weight:600;text-decoration:underline;text-underline-offset:2px}
  .ai-chips{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid var(--line);background:var(--white);max-height:150px;overflow-y:auto}
  .ai-chip{border:1px solid var(--line);background:var(--cream);color:var(--forest);border-radius:999px;padding:8px 12px;font:inherit;font-size:.82rem;font-weight:600;cursor:pointer}
  .ai-chip:hover,.ai-chip:focus-visible{border-color:var(--leaf);background:var(--leaf-soft)}
  .ai-wa{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 16px 16px;padding:12px;border-radius:12px;background:#25A85A;color:#fff;font-weight:700;font-size:.92rem}
  .ai-wa svg{width:18px;height:18px}
  @media (prefers-reduced-motion: reduce){.ai-panel,.ai-fab{transition:none}}`;
  document.head.appendChild(css);

  const fab = document.createElement("button");
  fab.className = "ai-fab"; fab.type = "button";
  fab.setAttribute("aria-label", "ISKA Asistan ile sohbet edin"); fab.setAttribute("aria-expanded", "false");
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg><span class="ai-fab__dot"></span>';

  const panel = document.createElement("section");
  panel.className = "ai-panel"; panel.setAttribute("aria-label", "ISKA Asistan"); panel.setAttribute("role", "dialog");
  panel.innerHTML = '<div class="ai-head"><img src="' + BASE + 'assets/iska-k.png" alt=""><div><strong>ISKA Asistan</strong><small>Sık sorulan sorular</small></div><button class="ai-close" type="button" aria-label="Kapat">×</button></div>' +
    '<div class="ai-body" aria-live="polite"></div><div class="ai-chips"></div>' +
    '<a class="ai-wa" href="' + WA + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><use href="#i-wa"/></svg>WhatsApp\'tan yazın</a>';
  document.body.append(fab, panel);

  const body = panel.querySelector(".ai-body");
  const chips = panel.querySelector(".ai-chips");
  const add = (html, who) => {
    const m = document.createElement("div");
    m.className = "ai-msg ai-msg--" + who; m.innerHTML = html;
    body.appendChild(m); body.scrollTop = body.scrollHeight;
  };
  const asked = new Set();
  const renderChips = () => {
    chips.innerHTML = "";
    QA.forEach((item, i) => {
      if (asked.has(i)) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "ai-chip"; b.textContent = item.q;
      b.addEventListener("click", () => {
        asked.add(i); add(item.q, "me"); renderChips();
        setTimeout(() => add(item.a(), "bot"), 350);
      });
      chips.appendChild(b);
    });
    if (!chips.children.length) {
      const r = document.createElement("button");
      r.type = "button"; r.className = "ai-chip"; r.textContent = "Soruları tekrar göster";
      r.addEventListener("click", () => { asked.clear(); renderChips(); });
      chips.appendChild(r);
    }
  };
  let started = false;
  const setOpen = (open) => {
    panel.classList.toggle("is-open", open);
    fab.setAttribute("aria-expanded", String(open));
    if (open && !started) {
      started = true;
      add("Merhaba! Ben ISKA Asistan. Arsalarımızla ilgili merak ettiklerinizi aşağıdaki sorulardan seçebilirsiniz.", "bot");
      renderChips();
    }
  };
  fab.addEventListener("click", () => setOpen(!panel.classList.contains("is-open")));
  panel.querySelector(".ai-close").addEventListener("click", () => { setOpen(false); fab.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("is-open")) setOpen(false); });
})();

/* Ana sayfa: parsellerde beliren yeşil tikler */
(function () {
  const layer = document.querySelector(".hero__ticks");
  if (!layer) return;
  const svg = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  let last = [];
  function spot() {
    const m = innerWidth < 760;
    for (let i = 0; i < 8; i++) {
      const x = m ? 8 + Math.random() * 62 : 60 + Math.random() * 34;
      const y = m ? 84 + Math.random() * 10 : 16 + Math.random() * 72;
      if (last.every((p) => Math.hypot(p[0] - x, p[1] - y) > 14)) return [x, y];
    }
    return null;
  }
  function add() {
    if (document.hidden || layer.childElementCount >= 3) return;
    const p = spot(); if (!p) return;
    last = [p].concat(last).slice(0, 4);
    const t = document.createElement("span");
    t.className = "hero__tick"; t.innerHTML = svg;
    t.style.left = p[0] + "%"; t.style.top = p[1] + "%";
    layer.appendChild(t);
    t.addEventListener("animationend", (e) => { if (e.animationName === "tickPop") t.remove(); });
  }
  setTimeout(function loop() { add(); setTimeout(loop, 1800 + Math.random() * 1600); }, 1500);
})();
