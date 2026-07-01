/* ============================================================================
   App — CornerPost. Shell, routing and views.
   A weekly content engine for local businesses: generate a week of social +
   Google Business posts in the owner's voice, review, and ship. Low-effort,
   recurring. Framework-free; renders from the Store on every change.
   ============================================================================ */
(function () {
  const { toast, ring, modal, confirmDialog, field, esc } = window.UI;
  const app = document.getElementById('app');

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'week', label: 'This Week', icon: 'calendar' },
    { id: 'library', label: 'Content Library', icon: 'layers' },
    { id: 'voice', label: 'Brand Voice', icon: 'megaphone' },
    { id: 'schedule', label: 'Schedule', icon: 'grid' },
  ];

  const PLATFORM_META = {
    instagram: { icon: 'instagram', label: 'Instagram', cls: 'ig' },
    facebook: { icon: 'facebook', label: 'Facebook', cls: 'fb' },
    google: { icon: 'google', label: 'Google Business', cls: 'gg' },
  };
  const STATUS_META = {
    draft: { label: 'Draft', chip: 'muted' },
    approved: { label: 'Approved', chip: 'indigo' },
    scheduled: { label: 'Scheduled', chip: 'amber' },
    published: { label: 'Published', chip: 'green' },
  };

  // --- UI (view-local, non-persisted) state ---
  const ui = {
    route: (location.hash.replace('#/', '') || 'dashboard'),
    sidebarOpen: false,
    weekFilter: 'all',      // platform filter on This Week
    libFilter: 'all',       // status filter on Library
    libPlatform: 'all',
    voicePreview: null,
    generating: false,      // week batch in flight
    busy: new Set(),        // ids of posts being rewritten
  };

  /* ----------  Small helpers  ---------- */
  const fmtDay = (iso) => { if (!iso) return ''; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
  const fmtWeek = (iso) => { const d = new Date(iso + 'T00:00:00'); const end = new Date(d); end.setDate(end.getDate() + 6); const opts = { month: 'short', day: 'numeric' }; return `${d.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`; };
  const timeAgo = (iso) => { const s = Math.floor((Date.now() - new Date(iso)) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; };
  const initials = (name) => (name || 'CP').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const fullText = (p) => (p.body + (p.hashtags && p.hashtags.length ? '\n\n' + p.hashtags.join(' ') : '')).trim();

  function aiBadge() {
    const m = window.Generator && window.Generator.mode ? window.Generator.mode() : { enabled: false };
    return m.enabled
      ? `<span class="chip chip--green ai-badge" title="Posts are written by Claude${m.model ? ' (' + esc(m.model) + ')' : ''}">${icon('sparkle')}AI on</span>`
      : `<span class="chip chip--muted ai-badge" title="Running the built-in demo engine. Add an API key to enable real AI.">${icon('wand')}Demo</span>`;
  }

  function nextStatus(status) { return { draft: 'approved', approved: 'scheduled', scheduled: 'published' }[status]; }
  function nextStatusLabel(status) { return { draft: 'Approve', approved: 'Schedule', scheduled: 'Mark posted' }[status]; }

  /* ==========================================================================
     Post card — the core UI unit
     ========================================================================== */
  function postCard(p, { compact = false } = {}) {
    const pm = PLATFORM_META[p.platform] || PLATFORM_META.instagram;
    const sm = STATUS_META[p.status] || STATUS_META.draft;
    const tags = (p.hashtags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
    const next = nextStatus(p.status);
    return `
    <article class="post-card platform-${pm.cls}" data-id="${p.id}">
      <div class="post-card__top">
        <span class="platform-badge platform-badge--${pm.cls}">${icon(pm.icon)}${pm.label}</span>
        <span class="chip chip--muted">${esc(p.typeLabel)}</span>
        <span class="chip chip--${sm.chip} post-status">${sm.label}</span>
        ${p.edited ? '<span class="chip chip--muted" title="Edited by you">edited</span>' : ''}
        <span class="post-card__when">${p.scheduledFor ? icon('calendar') + fmtDay(p.scheduledFor) : ''}</span>
      </div>
      <div class="post__body">${esc(p.body)}</div>
      ${tags ? `<div class="post__tags">${tags}</div>` : ''}
      ${p.cta ? `<div class="post__cta"><span class="muted">Button</span><span class="post__cta-btn">${esc(p.cta)} ${icon('arrowRight')}</span></div>` : ''}
      <div class="post__hint">${icon('image')}<span>${esc(p.imageIdea || '')}</span></div>
      <div class="post-card__actions">
        ${next ? `<button class="btn btn--primary btn--sm" data-act="advance" data-id="${p.id}">${icon(p.status === 'scheduled' ? 'check' : 'thumbsUp')}${nextStatusLabel(p.status)}</button>` : `<button class="btn btn--ghost btn--sm" data-act="advance-reset" data-id="${p.id}">${icon('refresh')}Reuse</button>`}
        <button class="btn btn--ghost btn--sm" data-act="copy" data-id="${p.id}">${icon('copy')}Copy</button>
        <button class="btn btn--ghost btn--sm" data-act="edit" data-id="${p.id}">${icon('pen')}Edit</button>
        <button class="btn btn--ghost btn--sm ${ui.busy.has(p.id) ? 'is-busy' : ''}" data-act="regen" data-id="${p.id}" title="Rewrite in your voice">${icon(ui.busy.has(p.id) ? 'refresh' : 'wand')}${ui.busy.has(p.id) ? 'Writing…' : 'Rewrite'}</button>
        <button class="icon-btn icon-btn--sm" data-act="delete" data-id="${p.id}" aria-label="Delete post">${icon('trash')}</button>
      </div>
    </article>`;
  }

  function emptyState({ icon: ic = 'sparkle', title, text, cta }) {
    return `<div class="empty-state">
      <div class="empty-state__icon">${icon(ic)}</div>
      <h3>${esc(title)}</h3>
      <p class="muted">${esc(text)}</p>
      ${cta ? `<button class="btn btn--primary" data-act="${cta.act}">${icon(cta.icon || 'wand')}${esc(cta.label)}</button>` : ''}
    </div>`;
  }

  function segmented(name, current, options) {
    return `<div class="segmented" role="tablist">${options.map((o) => `<button role="tab" class="segmented__btn ${o.value === current ? 'is-active' : ''}" data-act="filter" data-filter="${name}" data-value="${o.value}">${o.icon ? icon(o.icon) : ''}${esc(o.label)}</button>`).join('')}</div>`;
  }

  /* ==========================================================================
     Views
     ========================================================================== */
  function viewDashboard() {
    const s = Store.get(), sel = Store.sel;
    const biz = s.business;
    const bt = (window.Generator.TYPES[biz.type] || {});
    const wkPosts = sel.currentWeekPosts();
    const progress = sel.weekProgress();
    const pending = sel.pendingThisWeek();
    const ready = sel.readyThisWeek();
    const hasWeek = wkPosts.length > 0;

    const stat = (icon_, cls, value, label) => `<div class="stat-card"><div class="stat-card__icon stat-card__icon--${cls}">${icon(icon_)}</div><div><span class="stat-card__value">${value}</span><span class="stat-card__label">${label}</span></div></div>`;

    return `
    <section class="content view-enter">
      <div class="hero-card reveal">
        <div class="hero-card__glow"></div>
        <div class="hero-card__content">
          <span class="chip chip--accent">${icon('store')} ${esc(bt.label || 'Local business')} · ${esc(biz.city || '')}</span>
          <h2>${hasWeek ? `Your week of content is ${progress === 100 ? 'ready to ship 🚀' : 'ready for review'}` : 'Let\'s write this week\'s posts'}</h2>
          <p>${hasWeek ? `We drafted <strong>${wkPosts.length} posts</strong> for <strong>${esc(biz.name)}</strong> in your voice — ${pending} still need a quick look.` : `One click and CornerPost drafts a full week of posts for <strong>${esc(biz.name)}</strong> across your channels, in your voice.`}</p>
          <div class="hero-card__cta">
            <button class="btn btn--primary" data-act="generate">${icon('wand')}${hasWeek ? 'Regenerate this week' : 'Generate this week\'s posts'}</button>
            ${hasWeek && pending ? `<button class="btn btn--ghost" data-act="approve-all">${icon('thumbsUp')}Approve all (${pending})</button>` : `<button class="btn btn--ghost" data-act="go" data-route="week">${icon('calendar')}Open this week</button>`}
          </div>
        </div>
        <div class="hero-card__ring">${ring(progress, { label: progress + '%', sub: 'week ready' })}</div>
      </div>

      <div class="stat-grid">
        ${stat('thumbsUp', 'green', ready, 'Ready to post')}
        ${stat('pen', 'amber', pending, 'Awaiting review')}
        ${stat('flame', 'rose', s.streakWeeks, 'Week streak')}
        ${stat('send', 'indigo', sel.totalPublished(), 'Posts published')}
      </div>

      <div class="grid-2">
        <div class="panel reveal" style="--d:60ms">
          <div class="panel__head"><h3>${icon('calendar')} This week's batch</h3><a class="link" data-act="go" data-route="week">Open all ${icon('arrowRight')}</a></div>
          ${hasWeek ? `<div class="post-grid post-grid--tight">${wkPosts.slice(0, 2).map((p) => postCard(p)).join('')}</div>` : emptyState({ icon: 'wand', title: 'No posts yet this week', text: 'Generate a full week of content in your voice in one click.', cta: { act: 'generate', label: 'Generate this week', icon: 'wand' } })}
        </div>
        <div>
          <div class="panel reveal" style="--d:120ms">
            <div class="panel__head"><h3>${icon('clock')} Coming up</h3></div>
            ${renderUpcoming(sel.upcoming())}
          </div>
          <div class="panel reveal" style="--d:180ms">
            <div class="panel__head"><h3>${icon('zap')} Recent activity</h3></div>
            <ul class="activity-list">
              ${s.activity.slice(0, 6).map((a) => `<li class="activity-item"><span class="dot"></span><span>${esc(a.text)}</span><small>${timeAgo(a.at)}</small></li>`).join('') || '<li class="empty-inline">Nothing yet.</li>'}
            </ul>
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderUpcoming(list) {
    if (!list.length) return '<p class="empty-inline">Nothing scheduled — generate this week to fill your calendar.</p>';
    return `<ul class="deadline-list">${list.map((p) => {
      const pm = PLATFORM_META[p.platform] || PLATFORM_META.instagram;
      const d = new Date(p.scheduledFor + 'T00:00:00');
      return `<li class="deadline-item"><div class="deadline-item__date"><strong>${d.getDate()}</strong><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small></div><div><strong>${esc(p.typeLabel)}</strong><small>${pm.label}</small></div><span class="chip chip--${(STATUS_META[p.status] || {}).chip || 'muted'}">${(STATUS_META[p.status] || {}).label}</span></li>`;
    }).join('')}</ul>`;
  }

  function viewWeek() {
    const s = Store.get(), sel = Store.sel;
    let posts = sel.currentWeekPosts();
    if (ui.weekFilter !== 'all') posts = posts.filter((p) => p.platform === ui.weekFilter);
    const pending = sel.pendingThisWeek();
    const platformOpts = [{ value: 'all', label: 'All', icon: 'layers' }].concat(Store.sel.activePlatforms().map((pk) => ({ value: pk, label: PLATFORM_META[pk].label, icon: PLATFORM_META[pk].icon })));

    return `
    <section class="content view-enter">
      <div class="page-head">
        <div>
          <h1>This week</h1>
          <p class="muted">${fmtWeek(sel.thisWeek())} · ${sel.currentWeekPosts().length} posts in your voice</p>
        </div>
        <div class="page-head__actions">
          ${pending ? `<button class="btn btn--ghost" data-act="approve-all">${icon('thumbsUp')}Approve all (${pending})</button>` : ''}
          <button class="btn btn--ghost" data-act="add-post">${icon('plus')}Add post</button>
          <button class="btn btn--primary" data-act="generate">${icon('wand')}${sel.currentWeekPosts().length ? 'Regenerate week' : 'Generate week'}</button>
        </div>
      </div>
      <div class="toolbar">${segmented('weekFilter', ui.weekFilter, platformOpts)}</div>
      ${posts.length ? `<div class="post-grid">${posts.map((p) => postCard(p)).join('')}</div>`
        : emptyState({ icon: 'wand', title: sel.currentWeekPosts().length ? 'No posts for this filter' : 'Your week is empty', text: sel.currentWeekPosts().length ? 'Try a different channel filter.' : 'Generate a full week of on-brand posts in one click, then review and ship.', cta: sel.currentWeekPosts().length ? null : { act: 'generate', label: 'Generate this week', icon: 'wand' } })}

      <div class="panel reveal" style="margin-top:24px">
        <div class="panel__head"><h3>${icon('lightbulb')} Idea parking lot</h3><span class="muted">Seeds for future posts</span></div>
        <form class="inline-add" data-act="add-idea-form">
          <input name="idea" placeholder="e.g. Spotlight the new same-day service…" aria-label="New idea" />
          <button class="btn btn--ghost btn--sm" type="submit">${icon('plus')}Add</button>
        </form>
        <ul class="idea-list">
          ${s.ideas.map((i) => `<li class="idea-item ${i.used ? 'is-used' : ''}"><button class="milestone__toggle" data-act="toggle-idea" data-id="${i.id}" aria-label="Toggle used">${icon(i.used ? 'checkCircle' : 'circle')}</button><span>${esc(i.text)}</span><button class="icon-btn icon-btn--sm" data-act="del-idea" data-id="${i.id}" aria-label="Delete idea">${icon('trash')}</button></li>`).join('') || '<li class="empty-inline">No ideas yet — jot one down above.</li>'}
        </ul>
      </div>
    </section>`;
  }

  function viewLibrary() {
    const s = Store.get(), sel = Store.sel;
    let posts = s.posts.slice();
    if (ui.libPlatform !== 'all') posts = posts.filter((p) => p.platform === ui.libPlatform);
    if (ui.libFilter !== 'all') posts = posts.filter((p) => p.status === ui.libFilter);
    posts.sort((a, b) => (b.weekOf.localeCompare(a.weekOf)) || (b.scheduledFor || '').localeCompare(a.scheduledFor || ''));

    // group by week
    const groups = {};
    posts.forEach((p) => { (groups[p.weekOf] = groups[p.weekOf] || []).push(p); });
    const weeks = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    const statusOpts = [{ value: 'all', label: 'All' }].concat(sel.statusOrder.map((st) => ({ value: st, label: STATUS_META[st].label })));
    const platOpts = [{ value: 'all', label: 'All channels', icon: 'layers' }].concat(Object.keys(PLATFORM_META).map((pk) => ({ value: pk, label: PLATFORM_META[pk].label, icon: PLATFORM_META[pk].icon })));

    return `
    <section class="content view-enter">
      <div class="page-head">
        <div><h1>Content library</h1><p class="muted">${s.posts.length} posts across ${sel.weeks().length} weeks</p></div>
      </div>
      <div class="toolbar toolbar--wrap">
        ${segmented('libPlatform', ui.libPlatform, platOpts)}
        ${segmented('libFilter', ui.libFilter, statusOpts)}
      </div>
      ${weeks.length ? weeks.map((wk) => `
        <h2 class="section-title">${wk === sel.thisWeek() ? 'This week' : 'Week of ' + fmtWeek(wk)} <span class="chip chip--muted">${groups[wk].length}</span></h2>
        <div class="post-grid">${groups[wk].map((p) => postCard(p)).join('')}</div>
      `).join('') : emptyState({ icon: 'layers', title: 'Nothing here yet', text: 'Generated posts will collect here so you can reuse the ones that landed.' })}
    </section>`;
  }

  function viewVoice() {
    const s = Store.get();
    const biz = s.business;
    const G = window.Generator;
    if (!ui.voicePreview) ui.voicePreview = G.generateOne(biz, { type: 'tip', platform: 'instagram' });

    const typeOpts = G.typeOptions();
    const toneOpts = G.toneOptions();

    return `
    <section class="content view-enter">
      <div class="page-head"><div><h1>Brand voice</h1><p class="muted">This is what every post is written from. Get it right once — the engine handles the rest.</p></div></div>
      <div class="voice-grid">
        <div class="panel">
          <div class="panel__head"><h3>${icon('store')} Your business</h3></div>
          <form data-act="voice-form">
            <div class="form-grid">
              ${field({ id: 'name', label: 'Business name', value: biz.name, required: true })}
              ${field({ id: 'type', label: 'Business type', type: 'select', value: biz.type, options: typeOpts })}
              ${field({ id: 'city', label: 'City / area', value: biz.city, placeholder: 'e.g. Riverside' })}
              ${field({ id: 'tone', label: 'Voice & tone', type: 'select', value: biz.tone, options: toneOpts })}
            </div>
            ${field({ id: 'tagline', label: 'Tagline', value: biz.tagline, placeholder: 'One line that sums you up' })}
            ${field({ id: 'services', label: 'Services (comma-separated)', value: (biz.services || []).join(', '), hint: 'Drives what the engine talks about' })}
            ${field({ id: 'offer', label: 'Current offer / promo', value: biz.offer, placeholder: 'e.g. $25 off first service', hint: 'Used in promo posts. Leave blank if none.' })}
            <div class="form-grid">
              ${field({ id: 'phone', label: 'Phone', value: biz.phone, placeholder: '(555) 000-0000' })}
              ${field({ id: 'website', label: 'Website', value: biz.website, placeholder: 'yoursite.com' })}
            </div>
            ${field({ id: 'targetCustomer', label: 'Who you serve', type: 'textarea', value: biz.targetCustomer, rows: 2, placeholder: 'The customer you write for' })}
            <div class="form-actions">
              <button class="btn btn--primary" type="submit">${icon('check')}Save voice</button>
              <button class="btn btn--ghost" type="button" data-act="preview-refresh">${icon('refresh')}New sample</button>
            </div>
          </form>
        </div>
        <div>
          <div class="panel voice-preview">
            <div class="panel__head"><h3>${icon('sparkle')} Live sample</h3><span class="muted">In your voice</span></div>
            ${postCard(Object.assign({ id: 'preview', status: 'draft', edited: false, scheduledFor: '' }, ui.voicePreview), { compact: true })}
            <p class="muted preview-note">${icon('wand')} Every weekly post is generated from the settings on the left. Change the tone or services and hit “New sample” to hear the difference.</p>
          </div>
        </div>
      </div>
    </section>`;
  }

  function viewSchedule() {
    const s = Store.get(), sel = Store.sel;
    const wk = sel.thisWeek();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const wkPosts = sel.currentWeekPosts();
    const byDay = {};
    wkPosts.forEach((p) => { (byDay[p.scheduledFor] = byDay[p.scheduledFor] || []).push(p); });

    const cadence = s.cadence;
    const dayOpts = days.map((d) => ({ value: d, label: d }));

    return `
    <section class="content view-enter">
      <div class="page-head"><div><h1>Schedule &amp; channels</h1><p class="muted">Set the cadence once. CornerPost keeps the weeks coming.</p></div></div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel__head"><h3>${icon('refresh')} Weekly cadence</h3></div>
          <form data-act="cadence-form">
            ${field({ id: 'postsPerWeek', label: 'Posts per week', type: 'select', value: String(cadence.postsPerWeek), options: [3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: n + ' posts' })) })}
            ${field({ id: 'sendDay', label: 'Draft-ready day', type: 'select', value: cadence.sendDay, options: dayOpts, hint: 'When your fresh batch lands each week' })}
            <label class="switch-row">
              <span><strong>Autopilot</strong><small class="muted">Auto-generate next week's batch every ${esc(cadence.sendDay)}</small></span>
              <button type="button" class="toggle ${cadence.autopilot ? 'is-on' : ''}" data-act="toggle-autopilot" role="switch" aria-checked="${cadence.autopilot}"><span class="toggle__dot"></span></button>
            </label>
            <div class="form-actions"><button class="btn btn--primary" type="submit">${icon('check')}Save cadence</button></div>
          </form>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>${icon('send')} Connected channels</h3></div>
          <ul class="channel-list">
            ${s.channels.map((c) => { const pm = PLATFORM_META[c.platform]; return `<li class="channel-row"><span class="platform-badge platform-badge--${pm.cls}">${icon(pm.icon)}${pm.label}</span><span class="channel-row__handle muted">${esc(c.handle)}</span><button type="button" class="toggle ${c.enabled ? 'is-on' : ''}" data-act="toggle-channel" data-id="${c.id}" role="switch" aria-checked="${c.enabled}"><span class="toggle__dot"></span></button></li>`; }).join('')}
          </ul>
          <p class="muted preview-note">${icon('zap')} Posts are generated for every channel that's switched on.</p>
        </div>
      </div>

      <h2 class="section-title">${icon('calendar')} This week at a glance</h2>
      <div class="calendar">
        ${days.map((d, i) => {
          const iso = sel.addDays(wk, i);
          const list = byDay[iso] || [];
          const isToday = iso === new Date().toISOString().slice(0, 10);
          return `<div class="cal-day ${isToday ? 'is-today' : ''}">
            <div class="cal-day__head"><strong>${d}</strong><small>${new Date(iso + 'T00:00:00').getDate()}</small></div>
            <div class="cal-day__body">${list.map((p) => { const pm = PLATFORM_META[p.platform]; return `<button class="cal-chip cal-chip--${pm.cls}" data-act="edit" data-id="${p.id}" title="${esc(p.typeLabel)} · ${pm.label}">${icon(pm.icon)}<span>${esc(p.typeLabel)}</span></button>`; }).join('') || '<span class="cal-day__empty">—</span>'}</div>
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }

  const VIEWS = { dashboard: viewDashboard, week: viewWeek, library: viewLibrary, voice: viewVoice, schedule: viewSchedule };

  /* ==========================================================================
     Shell + render
     ========================================================================== */
  function render() {
    const s = Store.get();
    const view = VIEWS[ui.route] || viewDashboard;
    const theme = document.documentElement.getAttribute('data-theme');
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar" data-open="${ui.sidebarOpen}">
          <div class="brand">
            <span class="brand__mark">${icon('megaphone')}</span>
            <span class="brand__name">Corner<span>Post</span></span>
          </div>
          <nav class="nav">
            ${NAV.map((n) => `<a class="nav__item ${ui.route === n.id ? 'is-active' : ''}" data-act="go" data-route="${n.id}" href="#/${n.id}"><span class="nav__indicator"></span>${icon(n.icon)}<span>${n.label}</span></a>`).join('')}
          </nav>
          <div class="sidebar__foot">
            <div class="streak-card">
              <span class="icon flame">${Icons.flame}</span>
              <div><strong>${s.streakWeeks}-week streak</strong><small>${s.cadence.postsPerWeek} posts / week on autopilot</small></div>
            </div>
          </div>
        </aside>
        <div class="main-wrap">
          <header class="topbar">
            <button class="icon-btn topbar__menu" data-act="toggle-sidebar" aria-label="Toggle menu">${icon('menu')}</button>
            <div class="topbar__biz">
              <span class="platform-badge platform-badge--gg">${icon('store')}${esc(s.business.name)}</span>
            </div>
            <div class="topbar__actions">
              ${aiBadge()}
              <button class="btn btn--primary btn--sm topbar__generate ${ui.generating ? 'is-busy' : ''}" data-act="generate">${icon(ui.generating ? 'refresh' : 'wand')}${ui.generating ? 'Writing…' : 'Generate week'}</button>
              <button class="icon-btn" data-act="toggle-theme" aria-label="Toggle theme">${icon(theme === 'dark' ? 'sun' : 'moon')}</button>
              <button class="avatar" data-act="go" data-route="voice" aria-label="Brand voice">${initials(s.business.name)}</button>
            </div>
          </header>
          <main>${view()}</main>
        </div>
      </div>
      <div class="scrim ${ui.sidebarOpen ? 'is-visible' : ''}" data-act="close-sidebar"></div>`;
  }

  /* ==========================================================================
     Actions (event delegation)
     ========================================================================== */
  function editModal(id) {
    const p = Store.get().posts.find((x) => x.id === id);
    if (!p) return;
    const pm = PLATFORM_META[p.platform];
    modal({
      title: `Edit ${pm.label} post`,
      body: `
        ${field({ id: 'body', label: 'Post copy', type: 'textarea', value: p.body, rows: 7 })}
        ${field({ id: 'hashtags', label: 'Hashtags', value: (p.hashtags || []).join(' '), hint: 'Space-separated. Ignored for Google Business.' })}
        ${field({ id: 'imageIdea', label: 'Photo idea', value: p.imageIdea })}
      `,
      actions: [
        { label: 'Cancel' },
        { label: 'Rewrite for me', variant: 'ghost', keepOpen: true, onClick: ({ close }) => { Store.regeneratePost(id); close(); toast('Rewritten in your voice', 'info'); } },
        { label: 'Save', variant: 'primary', onClick: ({ dialog }) => {
          const body = dialog.querySelector('#body').value.trim();
          const hashtags = dialog.querySelector('#hashtags').value.split(/\s+/).map((t) => t.trim()).filter(Boolean).map((t) => t.startsWith('#') ? t : '#' + t);
          const imageIdea = dialog.querySelector('#imageIdea').value.trim();
          Store.updatePost(id, { body, hashtags, imageIdea });
          toast('Post updated');
        } },
      ],
    });
  }

  function addPostModal() {
    const G = window.Generator;
    modal({
      title: 'Add a post',
      body: `
        <p class="muted" style="margin:-4px 0 14px">Pick a channel and angle — we'll draft it in your voice.</p>
        ${field({ id: 'platform', label: 'Channel', type: 'select', value: 'instagram', options: G.platformOptions() })}
        ${field({ id: 'type', label: 'Content type', type: 'select', value: 'tip', options: G.contentTypeOptions() })}
      `,
      actions: [
        { label: 'Cancel' },
        { label: 'Generate post', variant: 'primary', onClick: async ({ dialog }) => {
          const platform = dialog.querySelector('#platform').value;
          const type = dialog.querySelector('#type').value;
          if (window.Generator.mode().enabled) toast('Writing your post…', 'info');
          await Store.addPost({ platform, type });
          toast('New post added to this week');
        } },
      ],
    });
  }

  async function copyPost(id) {
    const p = Store.get().posts.find((x) => x.id === id);
    if (!p) return;
    const text = fullText(p);
    try { await navigator.clipboard.writeText(text); toast('Copied — ready to paste', 'success'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied — ready to paste'); } catch (_) { toast('Copy failed', 'info'); }
      ta.remove();
    }
  }

  function navigate(route) {
    ui.route = route; ui.sidebarOpen = false;
    if (location.hash !== '#/' + route) location.hash = '#/' + route;
    render();
    document.querySelector('main')?.scrollIntoView({ block: 'start' });
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const id = el.dataset.id;

    switch (act) {
      case 'go': e.preventDefault(); navigate(el.dataset.route); break;
      case 'toggle-sidebar': ui.sidebarOpen = !ui.sidebarOpen; render(); break;
      case 'close-sidebar': ui.sidebarOpen = false; render(); break;
      case 'toggle-theme': {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('cornerpost.theme', next); } catch (_) {}
        render();
        break;
      }
      case 'generate': {
        if (ui.generating) break;
        (async () => {
          const had = Store.sel.currentWeekPosts().length > 0;
          const aiOn = window.Generator.mode().enabled;
          ui.generating = true;
          if (ui.route !== 'week') navigate('week'); else render();
          if (aiOn) toast('Writing your week with AI…', 'info');
          try { await Store.generateWeek({ replace: true }); }
          catch (e) { toast('Something went wrong generating', 'info'); }
          finally { ui.generating = false; render(); }
          toast(had ? 'Fresh batch generated ✨' : 'Your week of posts is ready ✨');
        })();
        break;
      }
      case 'approve-all': { const n = Store.approveAll(); toast(n ? `Approved ${n} posts` : 'Nothing to approve'); break; }
      case 'add-post': addPostModal(); break;
      case 'advance': { const p = Store.get().posts.find((x) => x.id === id); if (p) { const ns = nextStatus(p.status); Store.setStatus(id, ns); toast(ns === 'published' ? 'Marked as posted 🎉' : ns === 'scheduled' ? 'Scheduled' : 'Approved'); } break; }
      case 'advance-reset': Store.setStatus(id, 'draft'); toast('Back in drafts — tweak and reuse', 'info'); break;
      case 'copy': copyPost(id); break;
      case 'edit': editModal(id); break;
      case 'regen': {
        if (ui.busy.has(id)) break;
        (async () => {
          ui.busy.add(id); render();
          try { await Store.regeneratePost(id); }
          finally { ui.busy.delete(id); render(); }
          toast('Rewritten in your voice ✨', 'info');
        })();
        break;
      }
      case 'delete': { const p = Store.get().posts.find((x) => x.id === id); confirmDialog({ title: 'Delete post?', message: `This ${p ? PLATFORM_META[p.platform].label : ''} post will be removed.`, onConfirm: () => { Store.deletePost(id); toast('Post deleted'); } }); break; }
      case 'filter': { ui[el.dataset.filter] = el.dataset.value; render(); break; }
      case 'toggle-idea': Store.toggleIdea(id); break;
      case 'del-idea': Store.deleteIdea(id); break;
      case 'toggle-channel': Store.toggleChannel(id); break;
      case 'toggle-autopilot': Store.updateCadence({ autopilot: !Store.get().cadence.autopilot }); break;
      case 'preview-refresh': { ui.voicePreview = window.Generator.generateOne(Store.get().business, {}); render(); break; }
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-act]');
    if (!form) return;
    e.preventDefault();
    const act = form.dataset.act;
    if (act === 'voice-form') {
      const get = (n) => (form.querySelector('#' + n) || {}).value || '';
      Store.updateBusiness({
        name: get('name').trim() || 'My Business', type: get('type'), city: get('city').trim(), tone: get('tone'),
        tagline: get('tagline').trim(), services: get('services'), offer: get('offer').trim(),
        phone: get('phone').trim(), website: get('website').trim(), targetCustomer: get('targetCustomer').trim(),
      });
      ui.voicePreview = window.Generator.generateOne(Store.get().business, {});
      render();
      toast('Brand voice saved — future posts will match');
    } else if (act === 'cadence-form') {
      const g = (n) => (form.querySelector('#' + n) || {}).value;
      Store.updateCadence({ postsPerWeek: Number(g('postsPerWeek')), sendDay: g('sendDay') });
      toast('Cadence updated');
    } else if (act === 'add-idea-form') {
      const input = form.querySelector('input[name="idea"]');
      const val = input.value.trim();
      if (val) { Store.addIdea(val); input.value = ''; toast('Idea saved'); }
    }
  });

  window.addEventListener('hashchange', () => {
    const r = location.hash.replace('#/', '') || 'dashboard';
    if (VIEWS[r] && r !== ui.route) { ui.route = r; render(); }
  });

  // restore theme
  try { const t = localStorage.getItem('cornerpost.theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (_) {}

  Store.subscribe(render);
  render();

  // Detect whether the backend has an API key configured, then re-render so
  // the "AI on / Demo" badge reflects reality. Safe when opened via file://.
  if (window.Generator && window.Generator.refreshMode) {
    window.Generator.refreshMode().then(render).catch(() => {});
  }
})();
