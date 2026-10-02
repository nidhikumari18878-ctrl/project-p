document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Smooth reveal for page sections.
  $$("[data-reveal]").forEach((el, index) => {
    el.style.animationDelay = `${Math.min(index * 55, 330)}ms`;
    el.classList.add("reveal");
  });

  // Animated numbers without replacing server-rendered values.
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count || 0);
    if (!Number.isFinite(target)) return;
    const duration = 750;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // Generic modal used by the application page.
  const modal = $("#applicationModal");
  const openBtn = $("#openModalBtn");
  const closeButtons = $$("[data-close-modal]");
  const closeModal = () => {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };
  const openModal = () => {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    const firstInput = $("input", modal);
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  };
  if (openBtn) openBtn.addEventListener("click", openModal);
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  if (modal) modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

  // Application search + status filter work only on the already-rendered DB rows.
  const tableBody = $("#applicationTableBody");
  const searchInput = $("#searchInput");
  const statusFilter = $("#statusFilter");
  const emptyState = $("#applicationEmptyState");
  const filterRows = () => {
    if (!tableBody) return;
    const search = (searchInput?.value || "").trim().toLowerCase();
    const status = statusFilter?.value || "All Status";
    let visible = 0;

    $$('tr[data-application-row]', tableBody).forEach((row) => {
      const matchesSearch = row.innerText.toLowerCase().includes(search);
      const matchesStatus = status === "All Status" || row.dataset.status === status;
      const show = matchesSearch && matchesStatus;
      row.classList.toggle("hidden", !show);
      if (show) visible += 1;
    });

    if (emptyState) emptyState.classList.toggle("hidden", visible !== 0);
  };
  if (searchInput) searchInput.addEventListener("input", filterRows);
  if (statusFilter) statusFilter.addEventListener("change", filterRows);
  filterRows();

  // Resume score animation.
  const progress = $("[data-score-progress]");
  if (progress) {
    const score = Math.max(0, Math.min(100, Number(progress.dataset.scoreProgress) || 0));
    requestAnimationFrame(() => { progress.style.width = `${score}%`; });
  }

  // File feedback for resume uploads.
  const resumeInput = $("#resumeFile");
  const fileName = $("#resumeFileName");
  if (resumeInput && fileName) {
    resumeInput.addEventListener("change", () => {
      const file = resumeInput.files?.[0];
      fileName.textContent = file ? `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB` : "No file selected";
    });
  }

  // AI job matching: fetch a compact JSON score without leaving the current page.
  $$(".match-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const card = button.closest("article") || document;
      const result = $(".match-result", card);
      const url = button.dataset.matchUrl || `/opportunities/${button.dataset.matchId}/match`;
      if (!result) return;
      button.disabled = true;
      button.textContent = "Analyzing…";
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Match failed");
        result.innerHTML = `<div class="flex items-center justify-between"><strong>AI Match</strong><span class="text-violet-300 font-bold text-lg">${data.score}%</span></div><p class="text-gray-500 mt-2">${data.matched?.length ? `Matched: ${data.matched.join(", ")}` : "No matching skills found yet."}</p>${data.missing?.length ? `<p class="text-gray-500 mt-1">Build next: ${data.missing.join(", ")}</p>` : "<p class=\"text-emerald-300 mt-1\">Great coverage for the listed skills.</p>"}`;
        result.classList.remove("hidden");
      } catch (error) {
        result.textContent = error.message;
        result.classList.remove("hidden");
      } finally {
        button.disabled = false;
        button.textContent = "🤖 AI Match";
      }
    });
  });

  // Auto-dismiss status toasts.
  const toast = $("[data-toast]");
  if (toast) setTimeout(() => toast.remove(), 4200);
});
