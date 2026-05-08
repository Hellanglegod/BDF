const DB = {

  isFirebase() {
    _init();
    return !!_db;
  },

  get auth() {
    _init();
    return _auth;
  },

  async saveUser(user) {
    _init();

    if (_db) {

      await _db
        .collection('users')
        .doc(user.uid)
        .set(user);

    } else {

      const users = LS.get('wpsa_users') || [];

      users.push(user);

      LS.set('wpsa_users', users);
    }
  },

  async addLog(log) {
    _init();

    const logData = {
      ...log,
      timestamp: Date.now()
    };

    if (_db) {

      await _db
        .collection('logs')
        .add(logData);

    } else {

      const logs = LS.get('wpsa_logs') || [];

      logs.unshift(logData);

      LS.set('wpsa_logs', logs);
    }
  },

  async getRegs() {
    _init();

    if (_db) {

      const snap = await _db
        .collection('registrations')
        .orderBy('timestamp', 'desc')
        .get();

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    }

    return LS.get('wpsa_regs') || [];
  },

  async saveReg(reg) {
    _init();

    if (_db) {

      const ref = await _db
        .collection('registrations')
        .add({
          ...reg,
          timestamp: Date.now()
        });

      return ref.id;

    }

    const regs = LS.get('wpsa_regs') || [];

    reg.id = Date.now().toString();

    regs.unshift(reg);

    LS.set('wpsa_regs', regs);

    return reg.id;
  },

  async deleteReg(id) {
    _init();

    if (_db) {

      await _db
        .collection('registrations')
        .doc(id)
        .delete();

      return;
    }

    let regs = LS.get('wpsa_regs') || [];

    regs = regs.filter(r => r.id !== id);

    LS.set('wpsa_regs', regs);
  }
};