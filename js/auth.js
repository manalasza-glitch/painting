(function () {
    const PERMISSION_LABELS = {
        'dashboard.read': 'ดู Dashboard',
        'inspection.read': 'ดูข้อมูลการตรวจ',
        'inspection.create': 'บันทึกการตรวจ',
        'inspection.update': 'แก้ไขการตรวจ',
        'inspection.delete': 'ลบการตรวจ',
        'daily_report.read': 'ดูรายงานผลิต',
        'daily_report.create': 'บันทึกรายงานผลิต',
        'events.read': 'ดู Event 5M1E',
        'events.create': 'บันทึก Event 5M1E',
        'events.delete': 'ลบ Event 5M1E',
        'history.read': 'ดูประวัติย้อนหลัง',
        'recorders.manage': 'จัดการรายชื่อผู้บันทึก',
        'users.manage': 'อนุมัติและกำหนดสิทธิ์',
        'audit.read': 'ดูประวัติความปลอดภัย'
    };

    const state = { user: null, setupRequired: false, users: [] };
    let resolveReady;
    const readyPromise = new Promise((resolve) => { resolveReady = resolve; });

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    async function api(path, options) {
        const response = await fetch(path, {
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', ...((options && options.headers) || {}) },
            ...options
        });
        let data = {};
        try { data = await response.json(); } catch (_) {}
        if (!response.ok) throw Object.assign(new Error(data.error || 'ไม่สามารถเชื่อมต่อระบบได้'), { data, status: response.status });
        return data;
    }

    function showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.textContent = message || '';
        element.className = `auth-message ${type || ''}`.trim();
        element.hidden = !message;
    }

    function setMode(mode) {
        const isRegister = mode === 'register';
        document.getElementById('loginForm').hidden = isRegister;
        document.getElementById('registerForm').hidden = !isRegister;
        document.querySelectorAll('[data-auth-mode]').forEach((button) => {
            button.classList.toggle('active', button.dataset.authMode === mode);
        });
        showMessage('authMessage', '', '');
    }

    function clearDataCaches() {
        Object.keys(localStorage).forEach((key) => {
            if (/^PAINTING_.*(?:CACHE|INIT)/.test(key)) localStorage.removeItem(key);
        });
    }

    function can(permission) {
        return Boolean(state.user && (state.user.role === 'super_admin' || state.user.permissions.includes(permission)));
    }

    function applyAccess() {
        document.querySelectorAll('[data-permission]').forEach((element) => {
            element.hidden = !can(element.dataset.permission);
        });
        const activePage = document.querySelector('.tab-page.active:not([hidden])');
        if (!activePage) {
            document.querySelectorAll('.tab-page').forEach((page) => page.classList.remove('active'));
            const firstPage = document.querySelector('.tab-page:not([hidden])');
            if (firstPage) firstPage.classList.add('active');
        }
        const name = document.getElementById('currentUserName');
        const id = document.getElementById('currentUserId');
        const avatar = document.getElementById('currentUserAvatar');
        if (name) name.textContent = state.user.displayName;
        if (id) id.textContent = state.user.employeeId;
        if (avatar) avatar.textContent = (state.user.displayName || state.user.employeeId || 'U').charAt(0).toUpperCase();
    }

    async function initialize() {
        document.querySelectorAll('[data-auth-mode]').forEach((button) => {
            button.addEventListener('click', () => setMode(button.dataset.authMode));
        });
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);

        try {
            const status = await api('/api/auth/status', { method: 'GET', headers: {} });
            state.setupRequired = Boolean(status.setupRequired);
            document.getElementById('bootstrapNotice').hidden = !state.setupRequired;
            document.getElementById('bootstrapTokenWrap').hidden = !state.setupRequired;
            if (state.setupRequired) {
                document.getElementById('bootstrapToken').required = true;
                document.querySelector('#registerForm .auth-submit').textContent = 'สร้าง Super Admin';
                setMode('register');
            }
        } catch (error) {
            showMessage('authMessage', 'ระบบหลังบ้านยังไม่พร้อมใช้งาน', 'error');
        }

        try {
            const result = await api('/api/auth/me', { method: 'GET', headers: {} });
            state.user = result.user;
            const previousUser = localStorage.getItem('PAINTING_LAST_USER');
            if (previousUser && previousUser !== state.user.id) clearDataCaches();
            localStorage.setItem('PAINTING_LAST_USER', state.user.id);
            document.body.className = 'authenticated';
            applyAccess();
            if (can('users.manage')) loadUsers();
        } catch (_) {
            state.user = null;
            document.body.className = 'auth-guest';
        } finally {
            resolveReady(state.user);
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const body = {
                employeeId: document.getElementById('loginEmployeeId').value,
                password: document.getElementById('loginPassword').value
            };
            await api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
            clearDataCaches();
            location.reload();
        } catch (error) {
            showMessage('authMessage', error.message, 'error');
        } finally {
            button.disabled = false;
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        const password = document.getElementById('registerPassword').value;
        if (password !== document.getElementById('registerPasswordConfirm').value) {
            showMessage('authMessage', 'รหัสผ่านทั้งสองช่องไม่ตรงกัน', 'error');
            return;
        }
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const body = {
                employeeId: document.getElementById('registerEmployeeId').value,
                displayName: document.getElementById('registerDisplayName').value,
                department: document.getElementById('registerDepartment').value,
                password,
                bootstrapToken: state.setupRequired ? document.getElementById('bootstrapToken').value : undefined
            };
            const result = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
            event.currentTarget.reset();
            showMessage('authMessage', result.message, 'success');
            if (result.status === 'active') {
                state.setupRequired = false;
                setMode('login');
            }
        } catch (error) {
            showMessage('authMessage', error.message, 'error');
        } finally {
            button.disabled = false;
        }
    }

    function statusLabel(status) {
        return { pending: 'รออนุมัติ', active: 'ใช้งานได้', rejected: 'ปฏิเสธ', disabled: 'ระงับ' }[status] || status;
    }

    function renderUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        document.getElementById('pendingUserCount').textContent = state.users.filter((u) => u.status === 'pending').length;
        document.getElementById('activeUserCount').textContent = state.users.filter((u) => u.status === 'active').length;
        document.getElementById('disabledUserCount').textContent = state.users.filter((u) => ['rejected', 'disabled'].includes(u.status)).length;
        if (!state.users.length) {
            container.innerHTML = '<div class="user-empty">ยังไม่มีผู้สมัคร</div>';
            return;
        }
        container.innerHTML = state.users.map((user) => {
            const isAdmin = user.role === 'super_admin';
            const permissionHtml = Object.entries(PERMISSION_LABELS).map(([permission, label]) => {
                const checked = isAdmin || user.permissions.includes(permission) ? 'checked' : '';
                return `<label><input type="checkbox" value="${permission}" ${checked} ${isAdmin ? 'disabled' : ''}>${escapeHtml(label)}</label>`;
            }).join('');
            let actions = '<button class="user-action-primary" data-user-action="save">บันทึกสิทธิ์</button>';
            if (user.status === 'pending') {
                actions = '<button class="user-action-primary" data-user-action="approve">อนุมัติ</button><button class="user-action-danger" data-user-action="reject">ปฏิเสธ</button>';
            } else if (user.status === 'active' && !isAdmin) {
                actions += '<button class="user-action-danger" data-user-action="disable">ระงับบัญชี</button>';
            } else if (!isAdmin) {
                actions = '<button class="user-action-primary" data-user-action="approve">เปิดใช้งาน</button>';
            } else {
                actions = '<span class="user-status active">สิทธิ์สูงสุด</span>';
            }
            if (!isAdmin && state.user && user.id !== state.user.id) {
                actions += '<button class="user-action-delete" data-user-action="delete">ลบบัญชี</button>';
            }
            return `<article class="user-row" data-user-id="${escapeHtml(user.id)}">
                <div class="user-row-head"><div><h3>${escapeHtml(user.displayName)} · ${escapeHtml(user.employeeId)}</h3><p>${escapeHtml(user.department || 'ไม่ระบุแผนก')} · สมัคร ${escapeHtml(new Date(user.createdAt).toLocaleString('th-TH'))}</p></div><span class="user-status ${escapeHtml(user.status)}">${statusLabel(user.status)}</span></div>
                <div class="permission-grid">${permissionHtml}</div><div class="user-actions">${actions}</div>
            </article>`;
        }).join('');
        container.querySelectorAll('[data-user-action]').forEach((button) => {
            button.addEventListener('click', () => updateUser(button.closest('.user-row'), button.dataset.userAction));
        });
    }

    async function loadUsers() {
        if (!can('users.manage')) return;
        try {
            const result = await api('/api/users', { method: 'GET', headers: {} });
            state.users = result.users || [];
            renderUsers();
            showMessage('userManagementMessage', '', '');
        } catch (error) {
            showMessage('userManagementMessage', error.message, 'error');
        }
    }

    async function updateUser(row, action) {
        const userId = row.dataset.userId;
        const user = state.users.find((item) => item.id === userId);
        if (!user) return;
        if (action === 'delete') {
            await deleteUser(row, user);
            return;
        }
        const statusMap = { approve: 'active', reject: 'rejected', disable: 'disabled', save: user.status };
        const permissions = [...row.querySelectorAll('.permission-grid input:checked')].map((input) => input.value);
        row.querySelectorAll('button').forEach((button) => { button.disabled = true; });
        try {
            await api(`/api/users/${encodeURIComponent(userId)}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: statusMap[action], permissions })
            });
            showMessage('userManagementMessage', 'บันทึกการเปลี่ยนแปลงแล้ว', 'success');
            await loadUsers();
        } catch (error) {
            showMessage('userManagementMessage', error.message, 'error');
            row.querySelectorAll('button').forEach((button) => { button.disabled = false; });
        }
    }

    async function deleteUser(row, user) {
        const confirmed = window.confirm(`ยืนยันลบบัญชี ${user.displayName} (${user.employeeId}) หรือไม่?\n\nบัญชีนี้จะเข้าสู่ระบบไม่ได้ทันทีและไม่สามารถกู้คืนได้`);
        if (!confirmed) return;

        row.querySelectorAll('button').forEach((button) => { button.disabled = true; });
        try {
            const result = await api(`/api/users/${encodeURIComponent(user.id)}`, {
                method: 'DELETE',
                body: '{}'
            });
            showMessage('userManagementMessage', result.message || 'ลบบัญชีเรียบร้อยแล้ว', 'success');
            await loadUsers();
        } catch (error) {
            showMessage('userManagementMessage', error.message, 'error');
            row.querySelectorAll('button').forEach((button) => { button.disabled = false; });
        }
    }

    async function logout() {
        try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch (_) {}
        clearDataCaches();
        localStorage.removeItem('PAINTING_LAST_USER');
        location.reload();
    }

    window.PaintingAuth = {
        ready: () => readyPromise,
        can,
        loadUsers,
        logout,
        get user() { return state.user; }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
