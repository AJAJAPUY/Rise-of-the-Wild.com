// ═══════════════════════════════════════════════════
//  accounts.js — localStorage account management
// ═══════════════════════════════════════════════════

window.Accounts = (() => {
  const KEY = 'rotw_accounts_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(accounts) {
    localStorage.setItem(KEY, JSON.stringify(accounts));
  }

  let accounts = load();

  // Ensure default admin exists
  if (!accounts.find(a => a.username === 'admin')) {
    accounts.push({ name: 'Admin Player', age: 25, gender: 'other', username: 'admin', password: 'admin123' });
    save(accounts);
  }

  return {
    getAll()      { return accounts; },
    find(username){ return accounts.find(a => a.username.toLowerCase() === username.toLowerCase()); },
    create(data)  {
      if (this.find(data.username)) return { ok: false, msg: 'Username already taken.' };
      if (!data.name || !data.username || !data.password) return { ok: false, msg: 'All fields required.' };
      if (data.password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
      if (data.password !== data.confirm) return { ok: false, msg: 'Passwords do not match.' };
      accounts.push({ name: data.name, age: data.age, gender: data.gender, username: data.username, password: data.password });
      save(accounts);
      return { ok: true, msg: 'Account created!' };
    },
    login(username, password) {
      const acc = this.find(username);
      if (!acc) return { ok: false, msg: 'Account not found.' };
      if (acc.password !== password) return { ok: false, msg: 'Wrong password.' };
      return { ok: true, user: acc };
    },
  };
})();
