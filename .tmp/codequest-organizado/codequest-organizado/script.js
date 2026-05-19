// CodeQuest - navegação e painéis

// ── RIGHT PANEL HTML (shared) ──
function rpHTML(extraRewards) {
  return `
    <div class="rp-card">
      <div class="rp-title">Seu progresso</div>
      <div class="trail-name-rp">Trilha Frontend</div>
      <div class="bar"><div class="bar-fill" style="background:linear-gradient(90deg,var(--accent),var(--accent2));width:68%"></div></div>
      <div class="pct-lbl">68%</div>
      <div style="border-top:1px solid var(--border);padding-top:13px">
        <div class="rp-title">Nível</div>
        <div class="lvl-row">
          <div class="hex">24</div>
          <div><div class="lvl-name">DevMaster</div><div class="lvl-xp">3.240 / 4.000 XP</div></div>
        </div>
        <div class="bar" style="margin-bottom:14px"><div class="bar-fill" style="background:linear-gradient(90deg,var(--gold),#f7c55f);width:81%"></div></div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:13px">
        <div class="rp-title">${extraRewards || 'Recompensas recentes'}</div>
        <div class="rewards-row"><div class="rw-type"><span>🔮</span> XP</div><span style="font-weight:700;color:var(--accent2)">+300 XP</span></div>
        <div class="rewards-row"><div class="rw-type"><span>💎</span> Gemas</div><span style="font-weight:700;color:var(--gem)">+15</span></div>
        <div class="rewards-row"><div class="rw-type"><span>🏅</span> Badge</div><span style="font-weight:700;color:var(--gold);font-size:11px">Explorador HTML</span></div>
      </div>
    </div>
    <div class="rp-card">
      <div class="rp-title">Próximo Boss</div>
      <div class="boss-inner">
        <div class="boss-top">
          <div class="boss-av">👑</div>
          <div><div class="boss-name">HTML BOSS</div><div class="boss-desc">Crie uma página completa do zero</div></div>
        </div>
        <div class="boss-xp-row"><span style="color:var(--accent2);font-weight:700">🔮 1.000 XP</span><span>🔒</span></div>
      </div>
    </div>
    <div class="rp-card" style="padding:14px 16px">
      <div class="tip-row">
        <span style="font-size:18px">💡</span>
        <div><div class="tip-lbl">Dica</div><div class="tip-txt">Pratique sempre! Quanto mais você pratica, mais rápido evolui.</div></div>
      </div>
    </div>
  `;
}

// inject right panels
const panelIds = ['dashboard','trilhas','desafios','missoes','ranking','skilltree','devtags','conquistas','perfil','config'];
const rpLabels = {trilhas:'Recompensas da seção'};
panelIds.forEach(id => {
  const el = document.getElementById('rp-'+id);
  if (el) el.innerHTML = rpHTML(rpLabels[id] || '');
});

// ── NAVIGATION ──
function showPage(pageId, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-'+pageId);
  if (page) page.classList.add('active');
  if (navEl) navEl.classList.add('active');
}

// filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    this.closest('.filter-row').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// mission tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    this.closest('.missoes-tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});
