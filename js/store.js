/* ============================================================================
Store - the application's data layer.
============================================================================ */
(function () {
const STORAGE_KEY = 'careeros.state.v1';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();

function seed() {
return {
profile: { name: 'Sahaj Agarwal', headline: 'Final-year CS - Aspiring Software Engineer', target: 'Software Engineer - Product Companies', graduationYear: 2026, streakDays: 6, lastActive: now() },
roadmaps: [
{ id: uid(), title: 'Full-Stack Web Developer', description: 'From fundamentals to deploying production-grade apps.', color: 'green', milestones: [ { id: uid(), title: 'HTML, CSS & responsive layout', done: true }, { id: uid(), title: 'JavaScript (ES6+) & the DOM', done: true }, { id: uid(), title: 'React + state management', done: true }, { id: uid(), title: 'Node.js & REST APIs', done: false }, { id: uid(), title: 'Databases (SQL + NoSQL)', done: false }, { id: uid(), title: 'Auth, testing & deployment', done: false } ] },
{ id: uid(), title: 'DSA for Interviews', description: 'Pattern-based problem solving for placement rounds.', color: 'indigo', milestones: [ { id: uid(), title: 'Arrays & hashing', done: true }, { id: uid(), title: 'Two pointers & sliding window', done: true }, { id: uid(), title: 'Stacks, queues & linked lists', done: false }, { id: uid(), title: 'Trees & graphs (BFS/DFS)', done: false }, { id: uid(), title: 'Dynamic programming', done: false } ] },
],
skills: [ { id: uid(), name: 'JavaScript', category: 'Programming', level: 75 }, { id: uid(), name: 'React', category: 'Frontend', level: 68 }, { id: uid(), name: 'Python', category: 'Programming', level: 60 }, { id: uid(), name: 'SQL', category: 'Data', level: 45 }, { id: uid(), name: 'Node.js', category: 'Backend', level: 40 }, { id: uid(), name: 'System Design', category: 'Architecture', level: 25 } ],
projects: [ { id: uid(), title: 'StudySync - Collaborative Notes', description: 'Real-time shared notes app with live cursors and markdown.', status: 'completed', tech: ['React', 'Node.js', 'Socket.io'], link: 'https://github.com' }, { id: uid(), title: 'Expense Insights Dashboard', description: 'Personal finance tracker with category analytics.', status: 'in-progress', tech: ['Next.js', 'PostgreSQL', 'Recharts'], link: '' }, { id: uid(), title: 'AI Resume Reviewer', description: 'Scores resumes against a job description using NLP.', status: 'planning', tech: ['Python', 'FastAPI'], link: '' } ],
applications: [ { id: uid(), company: 'Atlassian', role: 'SDE Intern', stage: 'interview', deadline: '2026-07-02', notes: 'DSA round scheduled.' }, { id: uid(), company: 'Razorpay', role: 'Backend Intern', stage: 'applied', deadline: '2026-06-28', notes: '' }, { id: uid(), company: 'Google', role: 'STEP Intern', stage: 'wishlist', deadline: '2026-08-15', notes: 'Referral from senior.' }, { id: uid(), company: 'Zomato', role: 'Frontend SDE', stage: 'offer', deadline: '', notes: 'Verbal offer - negotiating.' } ],
prep: [ { id: uid(), label: 'Polish resume to 1 page', done: true }, { id: uid(), label: 'Solve 150 DSA problems', done: false }, { id: uid(), label: 'Build 3 portfolio projects', done: false }, { id: uid(), label: 'Mock interview x5', done: false }, { id: uid(), label: 'Optimize LinkedIn profile', done: true } ],
goals: [ { id: uid(), title: 'Crack a top-tier SDE internship', due: '2026-08-30', progress: 55 }, { id: uid(), title: 'Reach 200-day DSA streak', due: '2026-12-31', progress: 30 }, { id: uid(), title: 'Ship a side project with real users', due: '2026-09-15', progress: 40 } ],
activity: [ { id: uid(), text: 'Completed milestone "React + state management"', at: now() }, { id: uid(), text: 'Moved Atlassian to Interview stage', at: now() } ],
};
}

let state;
try { const raw = localStorage.getItem(STORAGE_KEY); state = raw ? JSON.parse(raw) : seed(); } catch (e) { state = seed(); }

const subscribers = new Set();
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
function emit() { persist(); subscribers.forEach((fn) => fn(state)); }
function logActivity(text) { state.activity.unshift({ id: uid(), text, at: now() }); state.activity = state.activity.slice(0, 12); }

const selectors = {
roadmapProgress(r) { if (!r.milestones.length) return 0; return Math.round((r.milestones.filter((m) => m.done).length / r.milestones.length) * 100); },
overallProgress() { const all = state.roadmaps.flatMap((r) => r.milestones); if (!all.length) return 0; return Math.round((all.filter((m) => m.done).length / all.length) * 100); },
avgSkill() { if (!state.skills.length) return 0; return Math.round(state.skills.reduce((s, x) => s + x.level, 0) / state.skills.length); },
prepProgress() { if (!state.prep.length) return 0; return Math.round((state.prep.filter((p) => p.done).length / state.prep.length) * 100); },
projectsCompleted() { return state.projects.filter((p) => p.status === 'completed').length; },
activeApplications() { return state.applications.filter((a) => a.stage !== 'wishlist').length; },
upcomingDeadlines() { return state.applications.filter((a) => a.deadline).map((a) => ({ ...a, ts: new Date(a.deadline).getTime() })).sort((a, b) => a.ts - b.ts).slice(0, 4); },
nextActions() { const actions = []; state.roadmaps.forEach((r) => { const next = r.milestones.find((m) => !m.done); if (next) actions.push({ kind: 'roadmap', label: next.title, meta: r.title, id: next.id, parent: r.id }); }); const prep = state.prep.find((p) => !p.done); if (prep) actions.push({ kind: 'prep', label: prep.label, meta: 'Placement prep', id: prep.id }); return actions.slice(0, 4); },
};

const Store = {
get: () => state, sel: selectors,
subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
reset() { state = seed(); emit(); },
updateProfile(patch) { Object.assign(state.profile, patch); emit(); },
addRoadmap({ title, description, color }) { state.roadmaps.unshift({ id: uid(), title, description, color: color || 'green', milestones: [] }); logActivity('Created roadmap'); emit(); },
deleteRoadmap(id) { state.roadmaps = state.roadmaps.filter((r) => r.id !== id); emit(); },
addMilestone(roadmapId, title) { const r = state.roadmaps.find((x) => x.id === roadmapId); if (r) { r.milestones.push({ id: uid(), title, done: false }); emit(); } },
toggleMilestone(roadmapId, milestoneId) { const r = state.roadmaps.find((x) => x.id === roadmapId); const m = r && r.milestones.find((x) => x.id === milestoneId); if (m) { m.done = !m.done; if (m.done) { logActivity('Completed milestone: ' + m.title); if (selectors.roadmapProgress(r) === 100) logActivity('Finished roadmap!'); } emit(); } },
deleteMilestone(roadmapId, milestoneId) { const r = state.roadmaps.find((x) => x.id === roadmapId); if (r) { r.milestones = r.milestones.filter((m) => m.id !== milestoneId); emit(); } },
addSkill({ name, category, level }) { state.skills.push({ id: uid(), name, category: category || 'General', level: Number(level) || 0 }); logActivity('Added skill: ' + name); emit(); },
updateSkill(id, patch) { const s = state.skills.find((x) => x.id === id); if (s) { Object.assign(s, patch); emit(); } },
deleteSkill(id) { state.skills = state.skills.filter((s) => s.id !== id); emit(); },
addProject(p) { state.projects.unshift({ id: uid(), tech: [], link: '', status: 'planning', ...p }); logActivity('Added project: ' + p.title); emit(); },
updateProject(id, patch) { const p = state.projects.find((x) => x.id === id); if (p) { Object.assign(p, patch); emit(); } },
deleteProject(id) { state.projects = state.projects.filter((p) => p.id !== id); emit(); },
addApplication(a) { state.applications.unshift({ id: uid(), stage: 'wishlist', notes: '', deadline: '', ...a }); logActivity('Tracking: ' + a.role + ' @ ' + a.company); emit(); },
moveApplication(id, stage) { const a = state.applications.find((x) => x.id === id); if (a && a.stage !== stage) { a.stage = stage; logActivity('Moved ' + a.company + ' to ' + stage); emit(); } },
updateApplication(id, patch) { const a = state.applications.find((x) => x.id === id); if (a) { Object.assign(a, patch); emit(); } },
deleteApplication(id) { state.applications = state.applications.filter((a) => a.id !== id); emit(); },
addPrep(label) { state.prep.push({ id: uid(), label, done: false }); emit(); },
togglePrep(id) { const p = state.prep.find((x) => x.id === id); if (p) { p.done = !p.done; emit(); } },
deletePrep(id) { state.prep = state.prep.filter((p) => p.id !== id); emit(); },
addGoal(g) { state.goals.unshift({ id: uid(), progress: 0, ...g }); logActivity('Set goal: ' + g.title); emit(); },
updateGoal(id, patch) { const g = state.goals.find((x) => x.id === id); if (g) { Object.assign(g, patch); emit(); } },
deleteGoal(id) { state.goals = state.goals.filter((g) => g.id !== id); emit(); },
};

window.Store = Store;
})();
