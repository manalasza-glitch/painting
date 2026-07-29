export const PERMISSIONS = Object.freeze([
  'dashboard.read',
  'inspection.read',
  'inspection.create',
  'inspection.update',
  'inspection.delete',
  'daily_report.read',
  'daily_report.create',
  'events.read',
  'events.create',
  'events.delete',
  'history.read',
  'recorders.manage',
  'users.manage',
  'audit.read',
]);

export const DEFAULT_EMPLOYEE_PERMISSIONS = Object.freeze([
  'dashboard.read',
  'inspection.read',
  'inspection.create',
  'daily_report.read',
  'daily_report.create',
  'events.read',
  'events.create',
  'history.read',
]);

export function sanitizePermissions(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => PERMISSIONS.includes(item)))];
}

export function userPermissions(user) {
  if (user.role === 'super_admin') return [...PERMISSIONS];
  try {
    return sanitizePermissions(JSON.parse(user.permissions || '[]'));
  } catch {
    return [];
  }
}

export function hasPermission(user, permission) {
  return user && user.status === 'active' && (
    user.role === 'super_admin' || userPermissions(user).includes(permission)
  );
}

export const ACTION_PERMISSIONS = Object.freeze({
  '': 'inspection.read',
  getDailyReportData: 'daily_report.read',
  getPartModels: 'daily_report.read',
  getRecorders: 'daily_report.read',
  getEvents: 'events.read',
  create: 'inspection.create',
  update: 'inspection.update',
  delete: 'inspection.delete',
  submitDailyReport: 'daily_report.create',
  addRecorder: 'recorders.manage',
  deleteRecorder: 'recorders.manage',
  createEvent: 'events.create',
  deleteEvent: 'events.delete',
});
