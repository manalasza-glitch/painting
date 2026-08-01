// js/auth.js - Painting Quality Inspection Authentication Logic

const PaintingAuth = {
    currentUser: null,

    async hashPassword(password) {
        if (!password) return "";
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + "PAINTING_SALT_2026");
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error("Hash error:", e);
            return password;
        }
    },

    async init() {
        const storedUser = localStorage.getItem("PAINTING_CURRENT_USER");
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.updateUserHeaderUI();
                this.hideAuthModal();
                return;
            } catch (e) {
                localStorage.removeItem("PAINTING_CURRENT_USER");
            }
        }

        // Show Auth Shell Modal if not logged in
        this.showAuthModal();
        this.checkFirstTimeBootstrap();
    },

    showAuthModal() {
        const shell = document.getElementById("authShell");
        if (shell) {
            shell.removeAttribute("hidden");
            shell.style.display = "flex";
        }
        document.body.classList.add("auth-loading");
    },

    hideAuthModal() {
        const shell = document.getElementById("authShell");
        if (shell) {
            shell.setAttribute("hidden", "true");
            shell.style.display = "none";
        }
        document.body.classList.remove("auth-loading");
    },

    switchTab(tab) {
        const loginTab = document.getElementById("authTabLogin");
        const registerTab = document.getElementById("authTabRegister");
        const loginForm = document.getElementById("authLoginForm");
        const registerForm = document.getElementById("authRegisterForm");
        const msgEl = document.getElementById("authMessage");

        if (msgEl) {
            msgEl.setAttribute("hidden", "true");
            msgEl.innerText = "";
        }

        if (tab === "register") {
            if (loginTab) loginTab.classList.remove("active");
            if (registerTab) registerTab.classList.add("active");
            if (loginForm) loginForm.style.display = "none";
            if (registerForm) registerForm.style.display = "flex";
        } else {
            if (registerTab) registerTab.classList.remove("active");
            if (loginTab) loginTab.classList.add("active");
            if (registerForm) registerForm.style.display = "none";
            if (loginForm) loginForm.style.display = "flex";
        }
    },

    async checkFirstTimeBootstrap() {
        const noticeEl = document.getElementById("authSetupNotice");
        if (noticeEl) {
            noticeEl.style.display = "none";
            noticeEl.setAttribute("hidden", "true");
        }
        this.switchTab("login");
    },

    async handleLogin(event) {
        if (event) event.preventDefault();
        const empIdInput = document.getElementById("loginEmployeeId");
        const passInput = document.getElementById("loginPassword");
        const submitBtn = document.getElementById("loginSubmitBtn");
        const msgEl = document.getElementById("authMessage");

        const employeeId = empIdInput ? empIdInput.value.trim() : "";
        const password = passInput ? passInput.value.trim() : "";

        if (!employeeId || !password) {
            this.showMessage("กรุณากรอกรหัสพนักงานและรหัสผ่าน", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "กำลังเข้าสู่ระบบ...";
        }

        try {
            const passHash = await this.hashPassword(password);
            let res = null;

            if (typeof loginUserAPI === "function") {
                res = await loginUserAPI(employeeId, passHash);
            }

            if (res && res.status === "success" && res.user) {
                this.currentUser = res.user;
                localStorage.setItem("PAINTING_CURRENT_USER", JSON.stringify(res.user));
                this.updateUserHeaderUI();
                this.hideAuthModal();
                if (typeof showToast === "function") {
                    showToast(`ยินดีต้อนรับคุณ ${res.user.displayName || res.user.employeeId}`, "success");
                }
            } else {
                const errText = (res && res.message) ? res.message : "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง";
                this.showMessage(errText, "error");
            }
        } catch (err) {
            console.error("Login exception:", err);
            this.showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "เข้าสู่ระบบ";
            }
        }
    },

    async handleRegister(event) {
        if (event) event.preventDefault();
        const empId = document.getElementById("regEmployeeId")?.value.trim();
        const name = document.getElementById("regDisplayName")?.value.trim();
        const dept = document.getElementById("regDepartment")?.value.trim();
        const pass = document.getElementById("regPassword")?.value.trim();
        const passConfirm = document.getElementById("regPasswordConfirm")?.value.trim();
        const submitBtn = document.getElementById("regSubmitBtn");

        if (!empId || !name || !pass) {
            this.showMessage("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง", "error");
            return;
        }

        if (pass.length < 6) {
            this.showMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
            return;
        }

        if (pass !== passConfirm) {
            this.showMessage("รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "กำลังลงทะเบียน...";
        }

        try {
            const passHash = await this.hashPassword(pass);
            let res = null;

            if (typeof registerUserAPI === "function") {
                res = await registerUserAPI({
                    employeeId: empId,
                    displayName: name,
                    department: dept || "แผนกพ่นสี",
                    passwordHash: passHash
                });
            }

            if (res && res.status === "success") {
                if (res.isSuperAdmin) {
                    this.showMessage("สมัครสมาชิกสำเร็จ! คุณคือ Super Admin คนแรกของระบบ", "success");
                } else {
                    this.showMessage("ลงทะเบียนเรียบร้อย! กรุณารอการอนุมัติสิทธิ์จากผู้ดูแลระบบ", "info");
                }
                setTimeout(() => {
                    this.switchTab("login");
                    const empInput = document.getElementById("loginEmployeeId");
                    if (empInput) empInput.value = empId;
                }, 2000);
            } else {
                const errText = (res && res.message) ? res.message : "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง";
                this.showMessage(errText, "error");
            }
        } catch (err) {
            console.error("Register exception:", err);
            this.showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "ส่งข้อมูลสมัครสมาชิก";
            }
        }
    },

    showMessage(text, type = "error") {
        const msgEl = document.getElementById("authMessage");
        if (!msgEl) return;

        msgEl.className = `auth-message ${type}`;
        msgEl.innerText = text;
        msgEl.removeAttribute("hidden");
    },

    updateUserHeaderUI() {
        const chipName = document.getElementById("userHeaderName");
        const chipRole = document.getElementById("userHeaderRole");
        const chipAvatar = document.getElementById("userHeaderAvatar");
        const settingsTabBtn = document.querySelector('.nav-link[data-permission="users.manage"], .nav-link[onclick*="settings"]');

        if (this.currentUser) {
            if (chipName) chipName.innerText = this.currentUser.displayName || this.currentUser.employeeId;
            if (chipRole) chipRole.innerText = this.currentUser.role === "Super Admin" ? "Super Admin" : (this.currentUser.department || "พนักงาน");
            if (chipAvatar) {
                const firstChar = String(this.currentUser.displayName || this.currentUser.employeeId).charAt(0).toUpperCase();
                chipAvatar.innerText = firstChar || "U";
            }

            // Show Settings (User Management) tab for Super Admin only
            if (settingsTabBtn) {
                if (this.currentUser.role === "Super Admin") {
                    settingsTabBtn.style.display = "flex";
                } else {
                    settingsTabBtn.style.display = "none";
                }
            }
        }
    },

    logout() {
        if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
            localStorage.removeItem("PAINTING_CURRENT_USER");
            this.currentUser = null;
            window.location.reload();
        }
    },

    async loadUsers() {
        const container = document.getElementById("usersContainer");
        const pendingCountEl = document.getElementById("pendingUserCount");
        const activeCountEl = document.getElementById("activeUserCount");
        const disabledCountEl = document.getElementById("disabledUserCount");

        if (!container) return;
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #64748b;">กำลังดึงรายชื่อผู้ใช้งานจากระบบ...</div>`;

        if (typeof getUsersAPI === "function") {
            const users = await getUsersAPI();
            if (Array.isArray(users)) {
                let pending = 0, active = 0, disabled = 0;

                users.forEach(u => {
                    if (u.status === "Pending") pending++;
                    else if (u.status === "Disabled") disabled++;
                    else active++;
                });

                if (pendingCountEl) pendingCountEl.innerText = pending;
                if (activeCountEl) activeCountEl.innerText = active;
                if (disabledCountEl) disabledCountEl.innerText = disabled;

                if (users.length === 0) {
                    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #64748b;">ยังไม่มีรายชื่อผู้ใช้งานในระบบ</div>`;
                    return;
                }

                container.innerHTML = users.map(u => {
                    const isPending = u.status === "Pending";
                    const isDisabled = u.status === "Disabled";
                    const isSuper = u.role === "Super Admin";

                    const roleBadgeClass = isSuper ? "badge-role-super" : "badge-role-inspector";
                    const statusBadgeClass = isPending ? "badge-status-pending" : (isDisabled ? "badge-status-disabled" : "badge-status-active");
                    const statusText = isPending ? "รออนุมัติ" : (isDisabled ? "ระงับใช้งาน" : "ใช้งานได้");

                    return `
                        <div class="user-card">
                            <div class="user-card-info">
                                <div class="user-avatar">${(u.displayName || u.employeeId || 'U').charAt(0).toUpperCase()}</div>
                                <div class="user-details">
                                    <h4>${u.displayName || u.employeeId} <small style="color:#64748b;">(${u.employeeId})</small></h4>
                                    <p>ตำแหน่ง: ${u.department || '-'} | ล่าสุด: ${u.lastLogin || '-'}</p>
                                    <div style="display: flex; gap: 0.4rem; margin-top: 0.3rem;">
                                        <span class="${roleBadgeClass}">${u.role || 'Inspector'}</span>
                                        <span class="${statusBadgeClass}">${statusText}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="user-card-actions">
                                ${isPending ? `
                                    <button class="btn-primary-custom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #10b981; border: none;" onclick="PaintingAuth.approveUser('${u.employeeId}')">✅ อนุมัติ</button>
                                    <button class="btn-secondary-custom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #ef4444; color: #fff; border: none;" onclick="PaintingAuth.toggleUserStatus('${u.employeeId}', 'Disabled')">❌ ปฏิเสธ</button>
                                ` : (!isSuper ? `
                                    ${isDisabled ? `
                                        <button class="btn-primary-custom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #10b981; border: none;" onclick="PaintingAuth.toggleUserStatus('${u.employeeId}', 'Active')">🟢 เปิดใช้งาน</button>
                                    ` : `
                                        <button class="btn-secondary-custom" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #f59e0b; color: #fff; border: none;" onclick="PaintingAuth.toggleUserStatus('${u.employeeId}', 'Disabled')">🔴 ปิดใช้งาน</button>
                                    `}
                                ` : `<span style="font-size: 0.8rem; color: #8b5cf6; font-weight: 700;">👑 เจ้าของระบบ</span>`)}
                            </div>
                        </div>
                    `;
                }).join("");
            }
        }
    },

    async approveUser(employeeId) {
        if (!confirm(`คุณต้องการอนุมัติการใช้งานให้รหัสพนักงาน ${employeeId} ใช่หรือไม่?`)) return;
        if (typeof updateUserStatusAPI === "function") {
            await updateUserStatusAPI(employeeId, "Active");
            if (typeof showToast === "function") showToast(`อนุมัติรหัสพนักงาน ${employeeId} สำเร็จ`, "success");
            this.loadUsers();
        }
    },

    async toggleUserStatus(employeeId, newStatus) {
        const actionName = newStatus === "Active" ? "เปิดใช้งาน" : "ระงับการใช้งาน";
        if (!confirm(`คุณต้องการ${actionName}รหัสพนักงาน ${employeeId} ใช่หรือไม่?`)) return;
        if (typeof updateUserStatusAPI === "function") {
            await updateUserStatusAPI(employeeId, newStatus);
            if (typeof showToast === "function") showToast(`เปลี่ยนสถานะรหัสพนักงาน ${employeeId} เป็น ${newStatus} สำเร็จ`, "info");
            this.loadUsers();
        }
    },

    openAddUserModal() {
        const modal = document.getElementById("addUserModal");
        if (modal) modal.classList.add("active");
    },

    closeAddUserModal() {
        const modal = document.getElementById("addUserModal");
        if (modal) modal.classList.remove("active");
    },

    async handleAdminAddUser(event) {
        if (event) event.preventDefault();
        const empId = document.getElementById("adminAddEmpId")?.value.trim();
        const name = document.getElementById("adminAddName")?.value.trim();
        const dept = document.getElementById("adminAddDept")?.value.trim();
        const status = document.getElementById("adminAddStatus")?.value || "Active";

        if (!empId || !name) {
            alert("กรุณากรอกรหัสพนักงานและชื่อ-นามสกุลให้ครบถ้วน");
            return;
        }

        const userData = {
            employeeId: empId,
            displayName: name,
            department: dept,
            role: "Inspector",
            status: status,
            passwordHash: await this.hashPassword("123456")
        };

        if (typeof saveUserLocallyFallback === "function") {
            saveUserLocallyFallback(userData);
        }

        if (typeof updateUserStatusAPI === "function") {
            await updateUserStatusAPI(empId, status, userData.role);
        }

        if (typeof showToast === "function") {
            showToast(`เพิ่ม/อนุมัติรหัสพนักงาน ${empId} (${name}) เรียบร้อยแล้ว`, "success");
        }

        this.closeAddUserModal();
        this.loadUsers();
    }
};

window.addEventListener("storage", (e) => {
    if (e.key === "PAINTING_LOCAL_USERS") {
        PaintingAuth.loadUsers();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    PaintingAuth.init();
});
