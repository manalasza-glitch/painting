import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');

const registerEndpoint = await import('../functions/api/auth/register.js');
const loginEndpoint = await import('../functions/api/auth/login.js');
const meEndpoint = await import('../functions/api/auth/me.js');
const usersEndpoint = await import('../functions/api/users/index.js');
const updateUserEndpoint = await import('../functions/api/users/[id].js');

class D1StatementMock {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    return this.database.prepare(this.sql).get(...this.values) || null;
  }

  async run() {
    return this.database.prepare(this.sql).run(...this.values);
  }

  async all() {
    return { results: this.database.prepare(this.sql).all(...this.values) };
  }
}

class D1Mock {
  constructor() {
    this.database = new DatabaseSync(':memory:');
    this.database.exec(readFileSync(new URL('../migrations/0001_auth.sql', import.meta.url), 'utf8'));
  }

  prepare(sql) {
    return new D1StatementMock(this.database, sql);
  }

  async batch(statements) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }
}

function post(path, body, cookie = '') {
  return new Request(`https://painting.example${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://painting.example', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}

function get(path, cookie = '') {
  return new Request(`https://painting.example${path}`, { headers: cookie ? { Cookie: cookie } : {} });
}

test('bootstrap, pending registration, approval, and login flow', async () => {
  const env = {
    DB: new D1Mock(),
    PASSWORD_PEPPER: 'unit-test-pepper-with-at-least-32-bytes',
    ADMIN_BOOTSTRAP_TOKEN: 'one-time-setup-token',
  };

  const bootstrap = await registerEndpoint.onRequestPost({
    env,
    request: post('/api/auth/register', {
      employeeId: 'EMP001', displayName: 'Admin User', department: 'Quality',
      password: 'admin-password-123', bootstrapToken: 'one-time-setup-token',
    }),
  });
  assert.equal(bootstrap.status, 201);
  assert.equal((await bootstrap.json()).status, 'active');

  const login = await loginEndpoint.onRequestPost({
    env,
    request: post('/api/auth/login', { employeeId: 'emp001', password: 'admin-password-123' }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(cookie, /^painting_session=/);

  const me = await meEndpoint.onRequestGet({ env, request: get('/api/auth/me', cookie) });
  const meBody = await me.json();
  assert.equal(meBody.user.employeeId, 'EMP001');
  assert.equal(meBody.user.role, 'super_admin');

  const register = await registerEndpoint.onRequestPost({
    env,
    request: post('/api/auth/register', {
      employeeId: 'EMP102', displayName: 'Employee User', department: 'Painting', password: 'employee-password-123',
    }),
  });
  assert.equal(register.status, 201);
  assert.equal((await register.json()).status, 'pending');

  const pendingLogin = await loginEndpoint.onRequestPost({
    env,
    request: post('/api/auth/login', { employeeId: 'EMP102', password: 'employee-password-123' }),
  });
  assert.equal(pendingLogin.status, 403);
  assert.equal((await pendingLogin.json()).status, 'pending');

  const users = await usersEndpoint.onRequestGet({ env, request: get('/api/users', cookie) });
  const usersBody = await users.json();
  const employee = usersBody.users.find((item) => item.employeeId === 'EMP102');
  assert.ok(employee);

  const approve = await updateUserEndpoint.onRequestPatch({
    env,
    request: new Request(`https://painting.example/api/users/${employee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: 'https://painting.example', Cookie: cookie },
      body: JSON.stringify({ status: 'active', permissions: ['dashboard.read', 'events.read'] }),
    }),
    params: { id: employee.id },
  });
  assert.equal(approve.status, 200);

  const employeeLogin = await loginEndpoint.onRequestPost({
    env,
    request: post('/api/auth/login', { employeeId: 'EMP102', password: 'employee-password-123' }),
  });
  assert.equal(employeeLogin.status, 200);
  const employeeBody = await employeeLogin.json();
  assert.deepEqual(employeeBody.user.permissions, ['dashboard.read', 'events.read']);
});
