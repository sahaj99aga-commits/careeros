/* ============================================================================
   Store — the application's data layer.
   Models a local business's brand voice, channels, weekly content cadence,
   the generated posts and their review lifecycle, plus an ideas queue.
   ============================================================================ */
(function () {
  const STORAGE_KEY = 'cornerpost.state.v1';
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const now = () => new Date().toISOString();

  // Monday of the week containing `d` (local), as an ISO date string.
  function weekStart(d = new Date()) {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x.toISOString().slice(0, 10);
  }
  function addDays(iso, n) {
    const x = new Date(iso + 'T00:00:00');
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  }

  function seed() {
    const business = {
      name: 'Ace Drain & Plumbing',
      type: 'plumber',
      city: 'Riverside',
      tagline: 'Fast, honest plumbing your neighbors trust.',
      tone: 'friendly',
      services: ['drain cleaning', 'leak repair', 'water heater installs', 'emergency callouts'],
      offer: '$25 off any drain cleaning this week',
      phone: '(555) 018-4420',
      website: 'acedrain.com',
      targetCustomer: 'Homeowners in Riverside who want a plumber they can trust',
    };
    const channels = [
      { id: uid(), platform: 'instagram', handle: '@acedrain', enabled: true },
      { id: uid(), platform: 'facebook', handle: 'Ace Drain & Plumbing', enabled: true },
      { id: uid(), platform: 'google', handle: 'Ace Drain & Plumbing', enabled: true },
    ];
    const cadence = { postsPerWeek: 5, sendDay: 'Monday', autopilot: true };
    const thisWeek = weekStart();
    const lastWeek = addDays(thisWeek, -7);

    // A couple of pre-generated posts so the app has life on first load.
    const g = window.Generator;
    const activePlatforms = channels.filter((c) => c.enabled).map((c) => c.platform);
    let posts = [];
    if (g) {
      const batch = g.generateWeek(business, { platforms: activePlatforms, count: 5 });
      posts = batch.map((p, i) => ({
        id: uid(),
        weekOf: thisWeek,
        scheduledFor: addDays(thisWeek, i),
        status: i === 0 ? 'approved' : (i === 1 ? 'scheduled' : 'draft'),
        createdAt: now(),
        edited: false,
        ...p,
      }));
      // one published post from last week for library/streak feel
      const past = g.generateOne(business, { type: 'testimonial', platform: 'instagram' });
      posts.push({ id: uid(), weekOf: lastWeek, scheduledFor: addDays(lastWeek, 3), status: 'published', createdAt: now(), edited: false, ...past });
    }

    return {
      business,
      channels,
      cadence,
      posts,
      ideas: [
        { id: uid(), text: 'Highlight the new tankless water heater line', used: false },
        { id: uid(), text: 'Ask customers about their worst DIY plumbing fail', used: false },
        { id: uid(), text: 'Before/after of the Maple St. repipe job', used: false },
      ],
      streakWeeks: 4,
      lastGenerated: null,
      onboarded: true,
      activity: [
        { id: uid(), text: 'Generated this week\'s content batch', at: now() },
        { id: uid(), text: 'Approved a Google Business post', at: now() },
      ],
    };
  }

  let state;
  try { const raw = localStorage.getItem(STORAGE_KEY); state = raw ? JSON.parse(raw) : seed(); } catch (e) { state = seed(); }

  const subscribers = new Set();
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
  function emit() { persist(); subscribers.forEach((fn) => fn(state)); }
  function logActivity(text) { state.activity.unshift({ id: uid(), text, at: now() }); state.activity = state.activity.slice(0, 14); }

  const STATUS_ORDER = ['draft', 'approved', 'scheduled', 'published'];

  const selectors = {
    thisWeek: () => weekStart(),
    weekStart, addDays,
    activePlatforms() { return state.channels.filter((c) => c.enabled).map((c) => c.platform); },
    postsForWeek(week) { return state.posts.filter((p) => p.weekOf === week); },
    currentWeekPosts() { return selectors.postsForWeek(weekStart()).sort((a, b) => (a.scheduledFor || '').localeCompare(b.scheduledFor || '')); },
    weeks() {
      const set = [...new Set(state.posts.map((p) => p.weekOf))];
      return set.sort((a, b) => b.localeCompare(a));
    },
    countByStatus(status, week) {
      return state.posts.filter((p) => p.status === status && (!week || p.weekOf === week)).length;
    },
    readyThisWeek() {
      const wk = weekStart();
      return state.posts.filter((p) => p.weekOf === wk && (p.status === 'approved' || p.status === 'scheduled')).length;
    },
    pendingThisWeek() {
      const wk = weekStart();
      return state.posts.filter((p) => p.weekOf === wk && p.status === 'draft').length;
    },
    totalPublished() { return state.posts.filter((p) => p.status === 'published').length; },
    weekProgress() {
      const wk = weekStart();
      const posts = state.posts.filter((p) => p.weekOf === wk);
      if (!posts.length) return 0;
      const done = posts.filter((p) => p.status !== 'draft').length;
      return Math.round((done / posts.length) * 100);
    },
    upcoming() {
      const today = new Date().toISOString().slice(0, 10);
      return state.posts
        .filter((p) => p.scheduledFor && p.scheduledFor >= today && p.status !== 'published')
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
        .slice(0, 5);
    },
    statusOrder: STATUS_ORDER,
  };

  function newPostFrom(draft, week, dayIndex) {
    return {
      id: uid(),
      weekOf: week || weekStart(),
      scheduledFor: selectors.addDays(week || weekStart(), dayIndex || 0),
      status: 'draft',
      createdAt: now(),
      edited: false,
      ...draft,
    };
  }

  const Store = {
    get: () => state, sel: selectors,
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    reset() { state = seed(); emit(); },

    updateBusiness(patch) {
      Object.assign(state.business, patch);
      if (patch.services && !Array.isArray(patch.services)) {
        state.business.services = String(patch.services).split(',').map((s) => s.trim()).filter(Boolean);
      }
      logActivity('Updated brand voice');
      emit();
    },

    toggleChannel(id) {
      const c = state.channels.find((x) => x.id === id);
      if (c) { c.enabled = !c.enabled; emit(); }
    },
    updateChannel(id, patch) {
      const c = state.channels.find((x) => x.id === id);
      if (c) { Object.assign(c, patch); emit(); }
    },

    updateCadence(patch) { Object.assign(state.cadence, patch); emit(); },

    // Generate (or regenerate) the full batch for the current week.
    // Async: uses AI when a key is configured, templates otherwise.
    async generateWeek({ replace = false } = {}) {
      const g = window.Generator;
      if (!g) return;
      const wk = weekStart();
      const platforms = selectors.activePlatforms();
      const count = state.cadence.postsPerWeek || 5;
      const batch = await g.composeWeek(state.business, { platforms, count });
      if (replace) state.posts = state.posts.filter((p) => p.weekOf !== wk);
      const created = batch.map((d, i) => newPostFrom(d, wk, i));
      state.posts.unshift(...created);
      state.lastGenerated = now();
      logActivity(`Generated ${created.length} posts for this week`);
      emit();
      return created;
    },

    async addPost({ type, platform } = {}) {
      const g = window.Generator;
      if (!g) return;
      const draft = await g.composeOne(state.business, { type, platform });
      const wk = weekStart();
      const existing = selectors.postsForWeek(wk).length;
      const post = newPostFrom(draft, wk, existing % 7);
      state.posts.unshift(post);
      logActivity('Added a new post');
      emit();
      return post;
    },

    // Regenerate the copy of a single post, keeping its slot/type/platform.
    async regeneratePost(id, opts = {}) {
      const g = window.Generator;
      const p = state.posts.find((x) => x.id === id);
      if (!p || !g) return;
      const draft = await g.composeOne(state.business, { type: opts.type || p.type, platform: opts.platform || p.platform });
      Object.assign(p, draft, { edited: false, status: p.status === 'published' ? 'draft' : p.status });
      logActivity('Regenerated a post');
      emit();
    },

    updatePost(id, patch) {
      const p = state.posts.find((x) => x.id === id);
      if (p) { Object.assign(p, patch, { edited: true }); emit(); }
    },

    setStatus(id, status) {
      const p = state.posts.find((x) => x.id === id);
      if (p && p.status !== status) {
        p.status = status;
        const labels = { approved: 'Approved', scheduled: 'Scheduled', published: 'Marked published', draft: 'Moved to draft' };
        logActivity(`${labels[status] || 'Updated'} a ${p.platformLabel} post`);
        emit();
      }
    },

    approveAll() {
      const wk = weekStart();
      let n = 0;
      state.posts.forEach((p) => { if (p.weekOf === wk && p.status === 'draft') { p.status = 'approved'; n++; } });
      if (n) { logActivity(`Approved ${n} posts in one click`); emit(); }
      return n;
    },

    deletePost(id) { state.posts = state.posts.filter((p) => p.id !== id); emit(); },

    addIdea(text) { state.ideas.unshift({ id: uid(), text, used: false }); emit(); },
    toggleIdea(id) { const i = state.ideas.find((x) => x.id === id); if (i) { i.used = !i.used; emit(); } },
    deleteIdea(id) { state.ideas = state.ideas.filter((i) => i.id !== id); emit(); },
  };

  window.Store = Store;
})();
