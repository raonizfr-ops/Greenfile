// ── API CLIENT ─────────────────────────────────────────────────────────────
const API = window.location.origin + '/api';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('gl_token');
  let res;
  try {
    res = await fetch(API + path, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

// ── STATE ──────────────────────────────────────────────────────────────────
const state = {
  view: 'auth',
  authTab: 'login',
  user: null,
  tips: [],
  feedFilter: 'Todos',
  actions: [],
  actionTotals: {},
  badges: [],
  adminStats: null,
  adminUsers: [],
  adminComments: [],
  adminTab: 'overview',
  categories: [],
  modal: null,
};

// ── TOAST ──────────────────────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── ICONS (inline SVG strings) ─────────────────────────────────────────────
const I = {
  leaf: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  zap:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  bar:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  heart:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  msg:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  ban:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  trash:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  out:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  recycle:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 4.875 7.97l3.418-5.626"/><path d="m9.5 4.5 4 .5-1 3.5"/><path d="M15.707 13.596l3.418-5.626"/><path d="m15 10.5 1-3.5 3.5.5"/></svg>`,
  droplet:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
  bolt:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  bag:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  bus:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><rect x="4" y="2" width="16" height="16" rx="2"/><path d="M4 6h16"/><path d="M4 12h16"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>`,
  bike:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`,
  sprout:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>`,
  bulb:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  trophy:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  star:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  globe: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  award: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
};

// ── RENDER ─────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (state.view === 'auth') { app.innerHTML = renderAuth(); bindAuth(); return; }
  const isAdmin = state.user?.role === 'admin';
  app.innerHTML = `
    <div class="app">
      ${renderSidebar(isAdmin)}
      <main class="main" id="main-content">
        <div id="view-content">${renderLoading()}</div>
      </main>
    </div>
    ${state.modal ? renderModal() : ''}
  `;
  bindNav();
  if (state.modal) bindModal();
  loadView();
}

function renderLoading() {
  return `<div class="loading"><div class="spinner"></div> Carregando...</div>`;
}

// ── AUTH ───────────────────────────────────────────────────────────────────
function renderAuth() {
  const isLogin = state.authTab === 'login';
  return `
  <div class="auth-wrap">
    <div class="auth-left">
      <div class="auth-logo">${I.leaf}<span class="auth-logo-text">GreenLife</span></div>
      <p class="auth-tagline">Aprenda práticas sustentáveis, registre ações ecológicas e <strong>transforme o mundo</strong> junto à comunidade.</p>
      <div class="auth-stats">
        <div class="auth-stat"><div class="num">12.4k</div><div class="lbl">Usuários Ativos</div></div>
        <div class="auth-stat"><div class="num">89t</div><div class="lbl">CO₂ Poupado</div></div>
        <div class="auth-stat"><div class="num">340+</div><div class="lbl">Dicas Publicadas</div></div>
      </div>
    </div>
    <div class="auth-right">
      <div class="auth-form-wrap">
        <h2>${isLogin ? 'Bem-vindo de volta' : 'Criar conta'}</h2>
        <p class="sub">${isLogin ? 'Entre na sua conta GreenLife' : 'Junte-se à comunidade sustentável'}</p>
        <div class="auth-tabs">
          <div class="auth-tab ${isLogin?'active':''}" data-tab="login">Login</div>
          <div class="auth-tab ${!isLogin?'active':''}" data-tab="register">Cadastro</div>
        </div>
        <div class="error-msg" id="auth-error"></div>
        ${!isLogin ? `<div class="form-group"><label>Nome Completo</label><input id="reg-name" type="text" placeholder="João Silva"/></div>` : ''}
        <div class="form-group"><label>Email</label><input id="auth-email" type="email" placeholder="email@exemplo.com"/></div>
        <div class="form-group"><label>Senha</label><input id="auth-pass" type="password" placeholder="••••••••"/></div>
        ${isLogin ? `<p style="font-size:12px;color:var(--sage);text-align:right;margin-bottom:1rem;cursor:pointer">Esqueci minha senha</p>` : ''}
        <button class="btn btn-primary" id="auth-submit">${isLogin ? 'Entrar' : 'Criar Conta'}</button>
        ${isLogin ? `<button class="btn btn-ghost" id="auth-demo" style="margin-top:8px">Entrar como Administrador (demo)</button>` : ''}
        <p class="auth-switch">${isLogin ? 'Não tem conta? <a id="switch-tab">Cadastre-se</a>' : 'Já tem conta? <a id="switch-tab">Entrar</a>'}</p>
      </div>
    </div>
  </div>`;
}

function bindAuth() {
  document.querySelectorAll('[data-tab]').forEach(el =>
    el.addEventListener('click', () => { state.authTab = el.dataset.tab; render(); })
  );
  document.getElementById('switch-tab')?.addEventListener('click', () => {
    state.authTab = state.authTab === 'login' ? 'register' : 'login'; render();
  });
  document.getElementById('auth-submit')?.addEventListener('click', doAuth);
  document.getElementById('auth-demo')?.addEventListener('click', demoAdmin);
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return; el.textContent = msg; el.classList.add('show');
}

async function doAuth() {
  const btn = document.getElementById('auth-submit');
  btn.disabled = true; btn.textContent = 'Aguarde...';
  try {
    if (state.authTab === 'login') {
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-pass').value;
      const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
      localStorage.setItem('gl_token', data.token);
      state.user = data.user;
    } else {
      const name = document.getElementById('reg-name')?.value;
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-pass').value;
      const data = await apiFetch('/auth/register', { method: 'POST', body: { name, email, password } });
      localStorage.setItem('gl_token', data.token);
      state.user = data.user;
    }
    state.view = 'feed'; render(); toast('Bem-vindo ao GreenLife!');
  } catch (err) {
    showAuthError(err.message);
    btn.disabled = false; btn.textContent = state.authTab === 'login' ? 'Entrar' : 'Criar Conta';
  }
}

async function demoAdmin() {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST', body: { email: 'admin@greenlife.com', password: 'password' }
    });
    localStorage.setItem('gl_token', data.token);
    state.user = data.user;
    state.view = 'admin'; render(); toast('Painel administrativo aberto');
  } catch { showAuthError('Erro ao conectar. Verifique se o servidor está rodando.'); }
}

// ── SIDEBAR ────────────────────────────────────────────────────────────────
function renderSidebar(isAdmin) {
  const navItem = (v, icon, label) =>
    `<div class="nav-item ${state.view===v?'active':''}" data-view="${v}">${icon}<span>${label}</span></div>`;
  const u = state.user;
  const initials = u?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'U';
  return `
  <aside class="sidebar">
    <div class="sidebar-logo">${I.leaf}<span class="sidebar-logo-text">GreenLife</span></div>
    <nav class="sidebar-nav">
      <div class="nav-section">Menu</div>
      ${navItem('feed', I.grid, 'Feed de Dicas')}
      ${navItem('impact', I.zap, 'Meu Impacto')}
      ${navItem('profile', I.user, 'Meu Perfil')}
      ${isAdmin ? `<div class="nav-section">Admin</div>${navItem('admin', I.bar, 'Dashboard')}` : ''}
    </nav>
    <div class="sidebar-user" data-view="profile">
      <div class="mini-avatar" style="width:34px;height:34px;font-size:13px;background:var(--sage)">${initials}</div>
      <div class="user-info">
        <div style="font-size:13px;font-weight:600;color:#fff">${u?.name||'Usuário'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.45)">${u?.role==='admin'?'Administrador':'Eco Cidadão'}</div>
      </div>
    </div>
  </aside>`;
}

function bindNav() {
  document.querySelectorAll('[data-view]').forEach(el =>
    el.addEventListener('click', () => { state.view = el.dataset.view; render(); })
  );
}

// ── MODAL ──────────────────────────────────────────────────────────────────
function renderModal() {
  const m = state.modal;
  return `<div class="modal-overlay" id="modal-overlay">
    <div class="modal">
      <h3>${m.title}</h3><p>${m.desc}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost btn-sm" id="modal-cancel">Cancelar</button>
        <button class="btn btn-danger btn-sm" id="modal-confirm">Confirmar</button>
      </div>
    </div>
  </div>`;
}
function bindModal() {
  document.getElementById('modal-cancel')?.addEventListener('click', () => { state.modal = null; render(); });
  document.getElementById('modal-confirm')?.addEventListener('click', () => { state.modal?.onConfirm?.(); });
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') { state.modal = null; render(); }
  });
}

// ── LOAD VIEW ──────────────────────────────────────────────────────────────
async function loadView() {
  const el = document.getElementById('view-content');
  try {
    if (state.view === 'feed')    { await loadFeed();    el.innerHTML = renderFeed(); bindFeed(); }
    if (state.view === 'impact')  { await loadImpact();  el.innerHTML = renderImpact(); bindImpact(); }
    if (state.view === 'admin')   { await loadAdmin();   el.innerHTML = renderAdmin(); bindAdmin(); }
    if (state.view === 'profile') { await loadProfile(); el.innerHTML = renderProfile(); bindProfile(); }
  } catch (err) {
    el.innerHTML = `<div class="loading" style="color:var(--danger)">Erro: ${err.message}</div>`;
  }
}

// ── FEED ───────────────────────────────────────────────────────────────────
const catIcon = { 'Reciclagem':'recycle','Água':'droplet','Energia':'bolt','Consumo Consciente':'bag' };
const catColor = { 'Reciclagem':'#E8F5E9','Água':'#EBF5FB','Energia':'#FEF9EE','Consumo Consciente':'#EDE7F6' };

async function loadFeed() {
  const params = state.feedFilter !== 'Todos' ? `?category=${encodeURIComponent(state.feedFilter)}&userId=${state.user?.id||''}` : `?userId=${state.user?.id||''}`;
  const [tips, cats] = await Promise.all([
    apiFetch('/tips' + params),
    state.categories.length ? Promise.resolve(state.categories) : apiFetch('/tips/categories'),
  ]);
  state.tips = tips;
  if (!state.categories.length) state.categories = cats;
}

function renderFeed() {
  const cats = ['Todos', ...state.categories.map(c => c.name)];
  return `
  <div class="page-header">
    <div><h1>Feed de Dicas</h1><p>Explore práticas sustentáveis por categoria</p></div>
    ${state.user?.role === 'admin' ? `<button class="btn btn-primary btn-sm" id="open-add-tip">${I.plus} Nova Dica</button>` : ''}
  </div>
  <div class="feed-filters">
    ${cats.map(c => `<div class="filter-chip ${state.feedFilter===c?'active':''}" data-filter="${c}">${c}</div>`).join('')}
  </div>
  ${state.tips.length === 0 ? '<p style="color:var(--muted);text-align:center;padding:3rem">Nenhuma dica encontrada.</p>' : ''}
  <div class="tips-grid">
    ${state.tips.map(t => `
    <div class="tip-card">
      <div class="tip-thumb" style="background:${catColor[t.category]||'#E8F5E9'}">${I[catIcon[t.category]]||I.leaf}</div>
      <div class="tip-body">
        <span class="badge badge-green">${t.category || 'Geral'}</span>
        <h3>${t.title}</h3>
        <p>${t.description}</p>
      </div>
      <div class="tip-footer">
        <div class="tip-actions">
          <button class="tip-action ${t.liked?'liked':''}" data-like="${t.id}">${I.heart} ${t.likes}</button>
          <button class="tip-action" data-comments="${t.id}">${I.msg} ${t.comments}</button>
          <button class="tip-action ${t.saved?'saved':''}" data-save="${t.id}">${I.save}</button>
        </div>
        <span style="font-size:11px;color:var(--muted)">${t.author||'GreenLife'}</span>
      </div>
    </div>`).join('')}
  </div>`;
}

function bindFeed() {
  document.querySelectorAll('[data-filter]').forEach(el =>
    el.addEventListener('click', async () => {
      state.feedFilter = el.dataset.filter;
      document.getElementById('view-content').innerHTML = renderLoading();
      await loadFeed();
      document.getElementById('view-content').innerHTML = renderFeed();
      bindFeed();
    })
  );
  document.querySelectorAll('[data-like]').forEach(el =>
    el.addEventListener('click', async () => {
      const id = +el.dataset.like;
      try {
        const r = await apiFetch(`/tips/${id}/like`, { method: 'POST' });
        const tip = state.tips.find(t => t.id === id);
        if (tip) { tip.liked = r.liked; tip.likes += r.liked ? 1 : -1; }
        document.getElementById('view-content').innerHTML = renderFeed(); bindFeed();
      } catch { toast('Faça login para curtir'); }
    })
  );
  document.querySelectorAll('[data-save]').forEach(el =>
    el.addEventListener('click', async () => {
      const id = +el.dataset.save;
      try {
        const r = await apiFetch(`/tips/${id}/save`, { method: 'POST' });
        const tip = state.tips.find(t => t.id === id);
        if (tip) tip.saved = r.saved;
        toast(r.saved ? 'Dica salva nos favoritos!' : 'Removida dos favoritos');
        document.getElementById('view-content').innerHTML = renderFeed(); bindFeed();
      } catch { toast('Faça login para salvar'); }
    })
  );
  document.querySelectorAll('[data-comments]').forEach(el =>
    el.addEventListener('click', () => toast('Seção de comentários em breve!'))
  );
  document.getElementById('open-add-tip')?.addEventListener('click', openAddTipModal);
}

function openAddTipModal() {
  const cats = state.categories;
  state.modal = {
    title: 'Nova Dica',
    desc: `
      <div class="form-group" style="margin-top:.5rem"><label>Título</label><input id="m-title" type="text" placeholder="Título da dica..."/></div>
      <div class="form-group"><label>Categoria</label>
        <select id="m-cat">${cats.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Descrição</label><textarea id="m-desc" placeholder="Descreva a prática..."></textarea></div>
    `,
    onConfirm: async () => {
      const title = document.getElementById('m-title')?.value;
      const description = document.getElementById('m-desc')?.value;
      const category_id = document.getElementById('m-cat')?.value;
      if (!title || !description) { toast('Preencha título e descrição'); return; }
      try {
        await apiFetch('/tips', { method: 'POST', body: { title, description, category_id } });
        state.modal = null; toast('Dica publicada!');
        await loadFeed(); render();
      } catch (err) { toast(err.message); }
    }
  };
  render();
}

// ── IMPACT ─────────────────────────────────────────────────────────────────
const actionTypes = [
  { label: 'Usei transporte público',    icon: 'bus' },
  { label: 'Reciclei resíduos',          icon: 'recycle' },
  { label: 'Economizei água',            icon: 'droplet' },
  { label: 'Reduzi consumo elétrico',    icon: 'bulb' },
  { label: 'Comprei produto sustentável',icon: 'bag' },
  { label: 'Andei de bicicleta',         icon: 'bike' },
  { label: 'Plantei algo',               icon: 'sprout' },
];

async function loadImpact() {
  const [actData, badgeData] = await Promise.all([
    apiFetch('/actions'),
    apiFetch('/actions/badges'),
  ]);
  state.actions = actData.actions;
  state.actionTotals = actData.totals;
  state.badges = badgeData;
}

function renderImpact() {
  const t = state.actionTotals;
  const pts = +(t.total_points || 0);
  const level = pts < 500 ? 'Semente' : pts < 1000 ? 'Broto' : pts < 2000 ? 'Cidadão Eco' : 'Guardião Verde';
  const pct = Math.min(100, Math.round((pts % 1000) / 10));
  return `
  <div class="page-header"><div><h1>Meu Impacto</h1><p>Registre e acompanhe suas ações sustentáveis</p></div></div>
  <div class="impact-grid">
    <div>
      <div class="card level-badge">
        <div class="level-icon">${I.leaf}</div>
        <div>
          <div style="font-size:12px;color:var(--muted)">Nível atual</div>
          <div style="font-family:Fraunces,serif;font-size:20px;color:var(--forest);font-weight:700">${level}</div>
          <div style="font-size:12px;color:var(--sage);margin-top:2px">${pts} pontos ecológicos</div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600">Progresso para próximo nível</span>
          <span style="font-size:13px;color:var(--sage)">${pct}%</span>
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <p style="font-size:12px;color:var(--muted);margin-top:6px">Faltam ${1000-(pts%1000)} pontos</p>
      </div>
      <div class="card" style="margin-top:14px">
        <h3 style="font-size:16px;color:var(--forest);margin-bottom:1rem">Registrar nova ação</h3>
        <select id="action-select" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:14px;background:var(--cream);outline:none;margin-bottom:10px">
          <option value="">Selecione a ação...</option>
          ${actionTypes.map(a => `<option value="${a.label}" data-icon="${a.icon}">${a.label}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="log-action-btn">Registrar Ação</button>
      </div>
    </div>
    <div>
      <div class="stats-grid" style="grid-template-columns:1fr 1fr;margin-bottom:14px">
        <div class="stat-card"><div class="stat-label">CO₂ Poupado</div><div class="stat-value">${(+t.total_co2||0).toFixed(1)}<span style="font-size:14px">kg</span></div></div>
        <div class="stat-card"><div class="stat-label">Ações</div><div class="stat-value">${t.total_actions||0}</div></div>
      </div>
      <div class="card">
        <h3 style="font-size:15px;color:var(--forest);margin-bottom:.8rem">Histórico recente</h3>
        <div class="action-log">
          ${state.actions.length === 0 ? '<p style="color:var(--muted);font-size:13px;text-align:center;padding:1rem">Nenhuma ação registrada ainda.</p>' : ''}
          ${state.actions.map(a => `
          <div class="action-item">
            <div class="action-icon">${I[a.icon]||I.leaf}</div>
            <div style="flex:1"><div class="action-name">${a.action_type}</div><div class="action-impact">${a.co2_saved} kg CO₂ poupado · +${a.points_earned} pts</div></div>
            <span class="action-date">${new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:14px">
    <h3 style="font-size:16px;color:var(--forest);margin-bottom:1rem">Minhas Conquistas</h3>
    <div class="badges-grid">
      ${state.badges.map(b => `
      <div class="badge-item ${b.earned?'':'locked'}">
        <div class="badge-icon">${I[b.icon]||I.award}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.description}</div>
        ${b.earned ? '<span class="badge badge-green" style="font-size:10px">Conquistado</span>' : ''}
      </div>`).join('')}
    </div>
  </div>`;
}

function bindImpact() {
  document.getElementById('log-action-btn')?.addEventListener('click', async () => {
    const sel = document.getElementById('action-select');
    if (!sel.value) { toast('Selecione uma ação primeiro'); return; }
    const opt = sel.options[sel.selectedIndex];
    const icon = opt.dataset.icon || 'leaf';
    try {
      const r = await apiFetch('/actions', { method: 'POST', body: { action_type: sel.value, icon } });
      toast(`Ação registrada! ${r.message}`);
      await loadImpact();
      document.getElementById('view-content').innerHTML = renderImpact(); bindImpact();
    } catch (err) { toast(err.message); }
  });
}

// ── ADMIN ──────────────────────────────────────────────────────────────────
async function loadAdmin() {
  const [stats, users, comments] = await Promise.all([
    apiFetch('/admin/stats'),
    apiFetch('/admin/users'),
    apiFetch('/admin/comments'),
  ]);
  state.adminStats = stats;
  state.adminUsers = users;
  state.adminComments = comments;
}

function renderAdmin() {
  const s = state.adminStats || {};
  return `
  <div class="page-header"><div><h1>Painel Administrativo</h1><p>Visão geral e ferramentas de moderação</p></div></div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Usuários</div><div class="stat-value">${s.total_users||0}</div></div>
    <div class="stat-card"><div class="stat-label">Ações Registradas</div><div class="stat-value">${s.total_actions||0}</div></div>
    <div class="stat-card"><div class="stat-label">CO₂ Total</div><div class="stat-value">${(+(s.total_co2||0)).toFixed(1)}<span style="font-size:14px">kg</span></div></div>
    <div class="stat-card"><div class="stat-label">Dicas</div><div class="stat-value">${s.total_tips||0}</div></div>
  </div>
  <div class="tabs">
    <div class="tab ${state.adminTab==='overview'?'active':''}" data-admin-tab="overview">Visão Geral</div>
    <div class="tab ${state.adminTab==='users'?'active':''}" data-admin-tab="users">Usuários</div>
    <div class="tab ${state.adminTab==='content'?'active':''}" data-admin-tab="content">Moderação</div>
  </div>
  <div id="admin-tab-content">${renderAdminTab()}</div>`;
}

function renderAdminTab() {
  if (state.adminTab === 'overview') return renderAdminOverview();
  if (state.adminTab === 'users')    return renderAdminUsers();
  if (state.adminTab === 'content')  return renderAdminContent();
  return '';
}

function renderAdminOverview() {
  const monthly = state.adminStats?.monthly || [];
  const maxVal  = Math.max(...monthly.map(m => m.total), 1);
  const bycat   = state.adminStats?.by_category || [];
  const total   = bycat.reduce((s, c) => s + +c.total, 0) || 1;
  const colors  = ['#40916C','#5BA4CF','#74C69D','#E9A824'];
  return `
  <div class="admin-grid">
    <div class="card">
      <h3 style="font-size:15px;color:var(--forest);margin-bottom:1rem">Ações registradas por mês</h3>
      <div class="chart-bar-wrap">
        ${monthly.length === 0 ? '<p style="color:var(--muted);font-size:13px">Sem dados ainda</p>' : ''}
        ${monthly.map((m,i) => `
        <div class="chart-bar-col">
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px">${m.total}</div>
          <div class="chart-bar" style="height:${Math.round((m.total/maxVal)*140)}px;background:${i===monthly.length-1?'var(--forest)':'var(--sage)'}"></div>
          <div class="chart-bar-label">${m.month}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3 style="font-size:15px;color:var(--forest);margin-bottom:.8rem">Ações por categoria</h3>
      ${bycat.length === 0 ? '<p style="color:var(--muted);font-size:13px">Sem dados ainda</p>' : ''}
      ${bycat.map((c,i) => {
        const pct = Math.round(+c.total/total*100);
        return `
        <div style="margin-bottom:8px">
          <div class="pie-row">
            <div class="pie-dot" style="background:${colors[i%colors.length]}"></div>
            <span style="color:var(--muted);flex:1;font-size:13px">${c.name}</span>
            <span style="font-weight:600;font-size:13px">${pct}%</span>
          </div>
          <div class="progress-bar-bg" style="height:6px;margin-top:4px">
            <div class="progress-bar-fill" style="width:${pct}%;background:${colors[i%colors.length]}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderAdminUsers() {
  return `
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <h3 style="font-size:15px;color:var(--forest)">Gerenciar Usuários</h3>
      <input id="user-search" type="text" placeholder="Buscar por nome ou email..." style="padding:7px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;background:var(--cream);width:220px"/>
    </div>
    <table class="users-table">
      <thead><tr><th>Usuário</th><th>Pontos</th><th>Ações</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${state.adminUsers.map(u => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="mini-avatar" style="background:var(--sage)">${u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
              <div>
                <div style="font-weight:600;font-size:13px">${u.name}</div>
                <div style="font-size:11px;color:var(--muted)">${u.email}</div>
              </div>
            </div>
          </td>
          <td style="font-weight:600;color:var(--forest)">${u.points}</td>
          <td style="color:var(--muted)">${u.total_actions}</td>
          <td><span class="badge ${u.status==='ativo'?'badge-green':u.status==='suspenso'?'badge-gold':'badge-red'}">${u.status}</span></td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="icon-btn" title="Suspender/Reativar" data-toggle-status="${u.id}" data-status="${u.status}">${I.ban}</button>
              <button class="icon-btn danger" title="Remover" data-remove-user="${u.id}">${I.trash}</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderAdminContent() {
  return `
  <div class="two-col">
    <div class="card">
      <h3 style="font-size:15px;color:var(--forest);margin-bottom:1rem">Criar Nova Dica</h3>
      <div class="form-group"><label>Título</label><input id="new-tip-title" type="text" placeholder="Título da dica..."/></div>
      <div class="form-group"><label>Categoria</label>
        <select id="new-tip-cat">
          ${state.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Descrição</label><textarea id="new-tip-desc" placeholder="Descreva a prática sustentável..."></textarea></div>
      <button class="btn btn-primary btn-sm" id="create-tip-btn">Publicar Dica</button>
    </div>
    <div class="card">
      <h3 style="font-size:15px;color:var(--forest);margin-bottom:1rem">Comentários (${state.adminComments.length})</h3>
      <div style="max-height:380px;overflow-y:auto">
        ${state.adminComments.length === 0 ? '<p style="color:var(--muted);font-size:13px">Nenhum comentário.</p>' : ''}
        ${state.adminComments.map(c => `
        <div class="comment-item">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="comment-author">${c.author}</span>
            ${c.flagged ? '<span class="badge badge-red">Denunciado</span>' : ''}
          </div>
          <p class="comment-text">${c.content}</p>
          <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
            <span class="comment-date">${c.tip_title} · ${new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
            <button class="btn btn-danger btn-sm" style="padding:4px 8px;font-size:11px" data-del-comment="${c.id}">Remover</button>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function bindAdmin() {
  document.querySelectorAll('[data-admin-tab]').forEach(el =>
    el.addEventListener('click', () => {
      state.adminTab = el.dataset.adminTab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('admin-tab-content').innerHTML = renderAdminTab();
      bindAdmin();
    })
  );
  document.getElementById('user-search')?.addEventListener('input', async (e) => {
    const search = e.target.value;
    state.adminUsers = await apiFetch('/admin/users?search=' + encodeURIComponent(search));
    document.getElementById('admin-tab-content').innerHTML = renderAdminTab(); bindAdmin();
  });
  document.querySelectorAll('[data-toggle-status]').forEach(el =>
    el.addEventListener('click', async () => {
      const id = el.dataset.toggleStatus;
      const cur = el.dataset.status;
      const newStatus = cur === 'ativo' ? 'suspenso' : 'ativo';
      state.modal = {
        title: cur === 'ativo' ? 'Suspender usuário' : 'Reativar usuário',
        desc: `Deseja ${cur === 'ativo' ? 'suspender' : 'reativar'} este usuário?`,
        onConfirm: async () => {
          await apiFetch(`/admin/users/${id}/status`, { method: 'PUT', body: { status: newStatus } });
          toast('Status atualizado');
          state.modal = null;
          state.adminUsers = await apiFetch('/admin/users');
          render();
        }
      }; render();
    })
  );
  document.querySelectorAll('[data-remove-user]').forEach(el =>
    el.addEventListener('click', () => {
      const id = el.dataset.removeUser;
      state.modal = {
        title: 'Remover usuário',
        desc: 'Esta ação é irreversível. Confirma?',
        onConfirm: async () => {
          await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
          toast('Usuário removido');
          state.modal = null;
          state.adminUsers = await apiFetch('/admin/users');
          render();
        }
      }; render();
    })
  );
  document.querySelectorAll('[data-del-comment]').forEach(el =>
    el.addEventListener('click', async () => {
      const id = el.dataset.delComment;
      await apiFetch(`/admin/comments/${id}`, { method: 'DELETE' });
      toast('Comentário removido');
      state.adminComments = await apiFetch('/admin/comments');
      document.getElementById('admin-tab-content').innerHTML = renderAdminTab(); bindAdmin();
    })
  );
  document.getElementById('create-tip-btn')?.addEventListener('click', async () => {
    const title = document.getElementById('new-tip-title')?.value;
    const description = document.getElementById('new-tip-desc')?.value;
    const category_id = document.getElementById('new-tip-cat')?.value;
    if (!title || !description) { toast('Preencha título e descrição'); return; }
    await apiFetch('/tips', { method: 'POST', body: { title, description, category_id } });
    toast('Dica publicada!');
    document.getElementById('new-tip-title').value = '';
    document.getElementById('new-tip-desc').value = '';
    state.adminStats = await apiFetch('/admin/stats');
    document.getElementById('view-content').innerHTML = renderAdmin(); bindAdmin();
  });
}

// ── PROFILE ────────────────────────────────────────────────────────────────
async function loadProfile() {
  const me = await apiFetch('/auth/me');
  state.user = { ...state.user, ...me };
  const [actData, badgeData] = await Promise.all([apiFetch('/actions'), apiFetch('/actions/badges')]);
  state.actions = actData.actions;
  state.actionTotals = actData.totals;
  state.badges = badgeData;
}

function renderProfile() {
  const u = state.user;
  const pts = +(state.actionTotals.total_points || 0);
  const pct = Math.min(100, Math.round((pts % 1000) / 10));
  const initials = u?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'U';
  const earned = state.badges.filter(b => b.earned);
  return `
  <div class="profile-hero">
    <div class="profile-header">
      <div class="profile-avatar">${initials}</div>
      <div>
        <h2 style="font-size:22px">${u?.name}</h2>
        <div style="font-size:13px;color:var(--mint);margin-top:2px;display:flex;align-items:center;gap:6px">${I.leaf} ${u?.role==='admin'?'Administrador':'Cidadão Ecológico'} · Membro desde ${new Date(u?.created_at||Date.now()).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><div class="num">${pts}</div><div class="lbl">Pontos</div></div>
      <div class="profile-stat"><div class="num">${state.actionTotals.total_actions||0}</div><div class="lbl">Ações</div></div>
      <div class="profile-stat"><div class="num">${(+(state.actionTotals.total_co2||0)).toFixed(1)}kg</div><div class="lbl">CO₂ poupado</div></div>
      <div class="profile-stat"><div class="num">${earned.length}</div><div class="lbl">Conquistas</div></div>
    </div>
  </div>
  <div class="two-col">
    <div class="card">
      <h3 style="font-size:16px;color:var(--forest);margin-bottom:1rem">Editar Perfil</h3>
      <div class="form-group"><label>Nome</label><input id="prof-name" type="text" value="${u?.name||''}"/></div>
      <div class="form-group"><label>Email</label><input id="prof-email" type="email" value="${u?.email||''}"/></div>
      <button class="btn btn-primary btn-sm" id="save-profile-btn" style="margin-top:4px">Salvar Alterações</button>
      <div style="margin-top:1.2rem">
        <div style="font-size:13px;font-weight:600;margin-bottom:6px">Progresso de Nível</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;color:var(--muted)">Para próximo nível</span>
          <span style="font-size:12px;color:var(--sage)">${pct}%</span>
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="card">
      <h3 style="font-size:16px;color:var(--forest);margin-bottom:1rem">Conquistas (${earned.length}/${state.badges.length})</h3>
      <div class="badges-grid" style="grid-template-columns:repeat(2,1fr)">
        ${state.badges.slice(0,6).map(b => `
        <div class="badge-item ${b.earned?'':'locked'}">
          <div class="badge-icon">${I[b.icon]||I.award}</div>
          <div class="badge-name">${b.name}</div>
        </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" id="logout-btn" style="width:100%;margin-top:1.2rem">${I.out} Sair da Conta</button>
    </div>
  </div>`;
}

function bindProfile() {
  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('prof-name').value;
    const email = document.getElementById('prof-email').value;
    try {
      await apiFetch('/auth/me', { method: 'PUT', body: { name, email } });
      state.user = { ...state.user, name, email };
      toast('Perfil atualizado!');
      render();
    } catch (err) { toast(err.message); }
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('gl_token');
    state.user = null; state.view = 'auth'; state.authTab = 'login'; render();
    toast('Até logo!');
  });
}

// ── BOOT ───────────────────────────────────────────────────────────────────
async function boot() {
  const token = localStorage.getItem('gl_token');
  if (token) {
    try {
      const me = await apiFetch('/auth/me');
      state.user = me;
      state.view = 'feed';
    } catch { localStorage.removeItem('gl_token'); }
  }
  render();
}

boot();
