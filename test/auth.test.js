import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');

const { hashPassword, verifyPassword } = await import('../functions/_lib/crypto.js');
const { sanitizePermissions, hasPermission, ACTION_PERMISSIONS } = await import('../functions/_lib/permissions.js');

test('password hashes are salted and can be verified', async () => {
  const first = await hashPassword('correct horse battery staple', 'test-pepper', null, 1000);
  const second = await hashPassword('correct horse battery staple', 'test-pepper', null, 1000);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(await verifyPassword('correct horse battery staple', 'test-pepper', first.hash, first.salt, first.iterations), true);
  assert.equal(await verifyPassword('wrong password', 'test-pepper', first.hash, first.salt, first.iterations), false);
});

test('unknown permissions are removed', () => {
  assert.deepEqual(sanitizePermissions(['dashboard.read', 'admin.everything', 'dashboard.read']), ['dashboard.read']);
});

test('super admin and employees are authorized correctly', () => {
  assert.equal(hasPermission({ role: 'super_admin', status: 'active', permissions: '[]' }, 'users.manage'), true);
  assert.equal(hasPermission({ role: 'employee', status: 'active', permissions: '["events.read"]' }, 'events.read'), true);
  assert.equal(hasPermission({ role: 'employee', status: 'pending', permissions: '["events.read"]' }, 'events.read'), false);
});

test('every supported sheet action has an explicit permission', () => {
  for (const action of ['', 'create', 'update', 'delete', 'submitDailyReport', 'getEvents', 'createEvent', 'deleteEvent']) {
    assert.equal(typeof ACTION_PERMISSIONS[action], 'string');
  }
});
