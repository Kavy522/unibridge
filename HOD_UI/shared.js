// ── NAV DATA ──
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`, href: 'dashboard.html' },
  { id: 'students', label: 'Students', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, href: 'students.html' },
  { id: 'faculty', label: 'Faculty', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, href: 'faculty.html' },
  { id: 'results', label: 'Results', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`, href: 'results.html' },
  { id: 'attendance', label: 'Attendance', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, href: 'attendance.html' },
  { id: 'subjects', label: 'Subjects', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`, href: 'subjects.html' },
  { id: 'mentorship', label: 'Mentorship', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`, href: 'mentorship.html' },
  { id: 'analytics', label: 'Analytics', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, href: 'analytics.html' },
  { id: 'promotion', label: 'Promotion', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`, href: 'promotion.html' },
  { id: 'calendar', label: 'Calendar', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>`, href: 'calendar.html' },
  { id: 'settings', label: 'Settings', icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`, href: 'settings.html' },
];

// ── RENDER SIDEBAR ──
function renderSidebar(activeId) {
  return `
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="logo">LJ</div>
      <div class="brand-text">
        <div class="brand-name">LJ University</div>
        <div class="brand-sub">HOD Portal</div>
      </div>
    </div>
    <div class="sidebar-ctx">
      <div class="ctx-label">Academic Year</div>
      <select onchange="window.location.href=window.location.href">
        <option>2026 – 2027</option>
        <option>2025 – 2026</option>
      </select>
      <div class="ctx-label" style="margin-top:6px">Semester</div>
      <div class="ctx-val">Semester 3 • Active</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      ${NAV.slice(0,6).map(n => `
        <a href="${n.href}" class="nav-item ${n.id === activeId ? 'active' : ''}">
          <span class="nav-icon">${n.icon}</span>
          ${n.label}
        </a>
      `).join('')}
      <div class="nav-section-label">Management</div>
      ${NAV.slice(6).map(n => `
        <a href="${n.href}" class="nav-item ${n.id === activeId ? 'active' : ''}">
          <span class="nav-icon">${n.icon}</span>
          ${n.label}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar">RP</div>
        <div class="user-info">
          <div class="user-name">Dr. Rajesh Patel</div>
          <div class="user-role">HOD · IT Dept</div>
        </div>
      </div>
    </div>
  </aside>`;
}

// ── RENDER TOPBAR ──
function renderTopbar(title) {
  return `
  <header class="topbar">
    <div class="search-wrap">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" placeholder="Search students, faculty, batches, subjects…">
    </div>
    <div class="topbar-right">
      <div class="icon-btn">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="badge">5</span>
      </div>
      <div class="topbar-user">
        <div class="avatar">RP</div>
        <div>
          <div class="user-name">Dr. Rajesh Patel</div>
          <div class="user-role">HOD · IT Department</div>
        </div>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:var(--text-muted);margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  </header>`;
}

// ── TOAST SYSTEM ──
function showToast(msg, type = '') {
  const icons = { success: '✓', error: '✕', warning: '⚠' };
  const container = document.querySelector('.toast-container') || (() => {
    const el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── MODAL HELPERS ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// ── TABS ──
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('[data-tabs]');
      const target = tab.dataset.tab;
      group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll(`[data-tab-content]`).forEach(c => {
        c.classList.toggle('active', c.dataset.tabContent === target);
      });
    });
  });
}

// ── FILE DROP ──
function initFileDrop(dropEl, onFile) {
  if (!dropEl) return;
  dropEl.addEventListener('dragover', e => { e.preventDefault(); dropEl.classList.add('drag'); });
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('drag'));
  dropEl.addEventListener('drop', e => {
    e.preventDefault(); dropEl.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  });
  dropEl.addEventListener('click', () => dropEl.querySelector('input')?.click());
  const inp = dropEl.querySelector('input[type=file]');
  if (inp) inp.addEventListener('change', e => { if (e.target.files[0]) onFile(e.target.files[0]); });
}

// ── FAKE CSV PARSE ──
function simulateCSVUpload(file, callback) {
  setTimeout(() => {
    callback({ inserted: 47, updated: 3, errors: [] });
  }, 1200);
}

// ── PERCENTAGE COLOR ──
function pctColor(pct) {
  if (pct >= 85) return 'var(--success)';
  if (pct >= 75) return 'var(--warning)';
  return 'var(--danger)';
}
function pctClass(pct) {
  if (pct >= 85) return 'success';
  if (pct >= 75) return 'warning';
  return 'danger';
}
function pctBadgeClass(pct) {
  if (pct >= 85) return 'badge-success';
  if (pct >= 75) return 'badge-warning';
  return 'badge-danger';
}