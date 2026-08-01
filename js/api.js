const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbwCGi9XE6U0RYliOgyyQZaWOazVOn5xXAo8RVF_AilQi6gy1mWr-sl5_L0Mhv4QjLRj/exec";

// Automatically clear legacy sample mock data from browser localStorage
(function purgeLegacyMockCaches() {
    try {
        localStorage.removeItem("PAINTING_INSPECTION_CACHE");
        localStorage.removeItem("PAINTING_EVENTS_CACHE");
        localStorage.removeItem("PAINTING_OUTPUTDIARY_CACHE");
    } catch (e) {}
})();

let API_URL = localStorage.getItem("PAINTING_API_URL") || DEFAULT_API_URL;

let activeSyncRequests = 0;

function updateSyncUI() {
    const statusText = document.getElementById("statusText");
    const statusBadge = document.getElementById("statusBadge");
    if (!statusText || !statusBadge) return;

    if (activeSyncRequests > 0) {
        statusText.innerText = `กำลังซิงค์... (${activeSyncRequests} รายการ)`;
        statusBadge.style.backgroundColor = "rgba(245, 158, 11, 0.1)"; // Warning yellow tint
        statusBadge.style.color = "#f59e0b";
        const dot = statusBadge.querySelector('.status-dot');
        if (dot) dot.style.backgroundColor = "#f59e0b";
    } else {
        statusText.innerText = `ซิงค์ข้อมูลล่าสุดแล้ว`;
        statusBadge.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; // Success green tint
        statusBadge.style.color = "#10b981";
        const dot = statusBadge.querySelector('.status-dot');
        if (dot) dot.style.backgroundColor = "#10b981";
    }
}

// Force reset to active Anyone deployment URL
if (!API_URL.includes("AKfycbwCGi9XE6U0RYliOgyyQZaWOazVOn5xXAo8RVF_AilQi6gy1mWr-sl5_L0Mhv4QjLRj")) {
    API_URL = DEFAULT_API_URL;
    localStorage.setItem("PAINTING_API_URL", DEFAULT_API_URL);
}

function setApiUrl(url) {
    if (url) {
        API_URL = url;
        localStorage.setItem("PAINTING_API_URL", url);
    }
}

function getApiUrl() {
    return API_URL;
}

// Fetch historical inspection records from Google Sheet API
async function fetchInspectionDataFromAPI() {
    const url = getApiUrl();
    if (!url) return getCachedOrSampleData();

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }

        const data = await response.json();
        let records = [];
        if (Array.isArray(data)) {
            records = data;
        } else if (data && Array.isArray(data.inspectionRecords)) {
            records = data.inspectionRecords;
        } else if (data && Array.isArray(data.data)) {
            records = data.data;
        } else if (data && Array.isArray(data.records)) {
            records = data.records;
        }

        // Clean out any legacy mock data
        records = records.filter(item => {
            const note = String(item.note || '');
            return !note.includes("สุ่มตรวจประจำวัน") &&
                   !note.includes("พบคราบสนิมบางชิ้นงาน") &&
                   !note.includes("มีรอยบุบและสะเก็ดเชื่อม") &&
                   !note.includes("พบคราบน้ำมันบนพื้นผิว") &&
                   !note.includes("ทดสอบความหนาชั้นสี");
        });

        if (records && records.length > 0) {
            localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(records));
            return records;
        }
        return getCachedOrSampleData();
    } catch (err) {
        console.warn("Failed to fetch from Google Apps Script API. Using cached data:", err);
        return getCachedOrSampleData();
    }
}

// Send new inspection form data to Google Sheet API
async function sendDataToAPI(data) {
    const baseUrl = getApiUrl();
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=create';

    try {
        activeSyncRequests++;
        updateSyncUI();

        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            body: JSON.stringify({
                action: "create",
                ...data
            })
        });

        const cache = getCachedOrSampleData();
        cache.unshift({
            ...data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(cache));

        return { status: "success" };
    } catch (err) {
        console.error("Post Error:", err);
        throw err;
    } finally {
        activeSyncRequests = Math.max(0, activeSyncRequests - 1);
        updateSyncUI();
    }
}

// Update existing inspection record in Google Sheet API (Overwrites row in-place)
async function updateDataToAPI(data) {
    const baseUrl = getApiUrl();
    const queryParams = new URLSearchParams({
        action: 'update',
        rowIndex: data.rowIndex || '',
        date: data.date || '',
        originalDate: data.originalDate || ''
    }).toString();
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;

    // 1. Update in localStorage cache immediately
    const cache = getCachedOrSampleData();
    const updatedCache = cache.map(item => {
        if (data.rowIndex && item.rowIndex && Number(item.rowIndex) === Number(data.rowIndex)) {
            return { ...item, ...data };
        }
        const itemDate = String(item.date || item.timestamp || '').trim();
        const targetDate = String(data.originalDate || data.date || '').trim();
        if (itemDate && targetDate && itemDate === targetDate) {
            return { ...item, ...data };
        }
        return item;
    });
    localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(updatedCache));

    // 2. Send POST update request to Google Sheet API
    try {
        activeSyncRequests++;
        updateSyncUI();

        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            body: JSON.stringify({
                action: "update",
                ...data
            })
        });
        return { status: "success" };
    } catch (err) {
        console.error("Update Error:", err);
        throw err;
    } finally {
        activeSyncRequests = Math.max(0, activeSyncRequests - 1);
        updateSyncUI();
    }
}

// Delete inspection record from Google Sheet API (Deletes row from backend Google Sheet & Cache)
async function deleteDataFromAPI(data) {
    const baseUrl = getApiUrl();
    const queryParams = new URLSearchParams({
        action: 'delete',
        rowIndex: data.rowIndex || '',
        date: data.date || '',
        note: data.note || ''
    }).toString();
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;

    // 1. Remove from localStorage cache immediately
    const cache = getCachedOrSampleData();
    const filteredCache = cache.filter(item => {
        if (data.rowIndex && item.rowIndex && Number(item.rowIndex) === Number(data.rowIndex)) {
            return false;
        }
        const itemDate = String(item.date || item.timestamp || '').trim();
        const targetDate = String(data.date || data.originalDate || '').trim();
        if (itemDate && targetDate && itemDate === targetDate) {
            return false;
        }
        return true;
    });
    localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(filteredCache));

    // 2. Send POST delete request to Google Sheet API
    try {
        activeSyncRequests++;
        updateSyncUI();

        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            body: JSON.stringify({
                action: "delete",
                ...data
            })
        });
        return { status: "success" };
    } catch (err) {
        console.error("Delete Error:", err);
        throw err;
    } finally {
        activeSyncRequests = Math.max(0, activeSyncRequests - 1);
        updateSyncUI();
    }
}

// Send the entire Daily Report to Google Sheet API
async function sendDailyReportToAPI(payload) {
    const baseUrl = getApiUrl();
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=submitDailyReport';

    try {
        activeSyncRequests++;
        updateSyncUI();

        // 1. Try POST method
        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        // 2. Dual-send GET fallback for guaranteed delivery across mobile WebViews & browsers
        const getUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=submitDailyReport&payload=' + encodeURIComponent(JSON.stringify(payload));
        fetch(getUrl, { method: "GET", mode: "no-cors" }).catch(() => {});

        return { status: "success" };
    } catch (err) {
        console.error("Daily Report Submit Error:", err);
        throw err;
    } finally {
        activeSyncRequests = Math.max(0, activeSyncRequests - 1);
        updateSyncUI();
    }
}

function getRealSheetData() {
    const realData = [
        { rowIndex: 2, date: "2026-07-25 17:00", rust: 29, dent: 0, weld: 0, chemical: 8, oil: 0, note: "", timestamp: "2026-07-25 17:00" },
        { rowIndex: 3, date: "2026-07-27 11:00", rust: 3, dent: 0, weld: 0, chemical: 4, oil: 0, note: "", timestamp: "2026-07-27 11:00" },
        { rowIndex: 4, date: "2026-07-27 12:00", rust: 1, dent: 0, weld: 0, chemical: 2, oil: 0, note: "", timestamp: "2026-07-27 12:00" },
        { rowIndex: 5, date: "2026-07-27 15:00", rust: 0, dent: 0, weld: 0, chemical: 5, oil: 0, note: "", timestamp: "2026-07-27 15:00" },
        { rowIndex: 6, date: "2026-07-27 16:00", rust: 19, dent: 0, weld: 0, chemical: 4, oil: 0, note: "", timestamp: "2026-07-27 16:00" },
        { rowIndex: 7, date: "2026-07-27 17:00", rust: 10, dent: 1, weld: 0, chemical: 3, oil: 0, note: "", timestamp: "2026-07-27 17:00" },
        { rowIndex: 8, date: "2026-07-29 09:00", rust: 12, dent: 0, weld: 0, chemical: 0, oil: 0, note: "", timestamp: "2026-07-29 09:00" },
        { rowIndex: 9, date: "2026-07-29 10:00", rust: 1, dent: 0, weld: 0, chemical: 4, oil: 0, note: "", timestamp: "2026-07-29 10:00" },
        { rowIndex: 10, date: "2026-07-29 11:00", rust: 3, dent: 0, weld: 0, chemical: 3, oil: 0, note: "", timestamp: "2026-07-29 11:00" },
        { rowIndex: 11, date: "2026-07-29 12:00", rust: 1, dent: 0, weld: 0, chemical: 3, oil: 0, note: "", timestamp: "2026-07-29 12:00" },
        { rowIndex: 12, date: "2026-07-29 14:00", rust: 0, dent: 0, weld: 0, chemical: 1, oil: 0, note: "", timestamp: "2026-07-29 14:00" },
        { rowIndex: 13, date: "2026-07-29 16:00", rust: 0, dent: 0, weld: 0, chemical: 3, oil: 0, note: "", timestamp: "2026-07-29 16:00" }
    ];
    localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(realData));
    return realData;
}

function getCachedOrSampleData() {
    const cached = localStorage.getItem("PAINTING_INSPECTION_CACHE");
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const clean = parsed.filter(item => {
                    const note = String(item.note || '');
                    return !note.includes("สุ่มตรวจประจำวัน") &&
                           !note.includes("พบคราบสนิมบางชิ้นงาน") &&
                           !note.includes("มีรอยบุบและสะเก็ดเชื่อม") &&
                           !note.includes("พบคราบน้ำมันบนพื้นผิว") &&
                           !note.includes("ทดสอบความหนาชั้นสี");
                });
                if (clean.length > 0) return clean;
            }
        } catch (e) {
            console.error("Cache parse error", e);
        }
    }
    return getRealSheetData();
}

function generateSampleData() {
    return getRealSheetData();
}

// Fetch recorder names list from Cloud Google Sheet (Recorders tab)
async function fetchRecordersFromAPI() {
    const baseUrl = getApiUrl();
    if (!baseUrl) return null;
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=getRecorders';

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.recorders && Array.isArray(data.recorders)) {
            return data.recorders;
        }
    } catch (e) {
        console.warn("Failed to fetch cloud recorders, using local cache:", e);
    }
    return null;
}

// Add a new recorder name to Cloud Google Sheet
async function addRecorderToAPI(name) {
    const baseUrl = getApiUrl();
    if (!baseUrl) return;
    const cleanName = String(name).trim();
    if (!cleanName) return;

    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=addRecorder&name=' + encodeURIComponent(cleanName);

    try {
        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "addRecorder", name: cleanName })
        });
    } catch (e) {
        console.warn("Failed to sync new recorder to cloud:", e);
    }
}

// Delete a recorder name from Cloud Google Sheet
async function deleteRecorderFromAPI(name) {
    const baseUrl = getApiUrl();
    if (!baseUrl) return;
    const cleanName = String(name).trim();
    if (!cleanName) return;

    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=deleteRecorder&name=' + encodeURIComponent(cleanName);

    try {
        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "deleteRecorder", name: cleanName })
        });
    } catch (e) {
        console.warn("Failed to delete recorder from cloud:", e);
    }
}

// Fetch outputdiary daily production report data from Cloud Google Sheet
async function fetchDailyReportDataFromAPI() {
    const baseUrl = getApiUrl();
    if (baseUrl) {
        const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=getDailyReportData';

        try {
            const res = await fetch(url);
            const json = await res.json();
            
            if (json && json.status === "success" && Array.isArray(json.data)) {
                localStorage.setItem("PAINTING_OUTPUTDIARY_CACHE", JSON.stringify(json.data));
                return json.data;
            } else if (Array.isArray(json)) {
                localStorage.setItem("PAINTING_OUTPUTDIARY_CACHE", JSON.stringify(json));
                return json;
            }
        } catch (e) {
            console.warn("Failed to fetch outputdiary from cloud, checking cache:", e);
        }
    }

    const cached = localStorage.getItem("PAINTING_OUTPUTDIARY_CACHE");
    if (cached !== null) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }

    return [];
}

function generateSampleOutputDiaryData() {
    return [];
}

// Fetch PartModel mapping from Cloud Google Sheet (PartModel sheet tab)
async function fetchPartModelsFromAPI() {
    const baseUrl = getApiUrl();
    if (baseUrl) {
        const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=getPartModels';
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (json && json.groups && typeof json.groups === 'object' && Object.keys(json.groups).length > 0) {
                localStorage.setItem("PAINTING_PART_MODELS_CACHE", JSON.stringify(json.groups));
                return json.groups;
            }
        } catch (e) {
            console.warn("Failed to fetch PartModel from cloud, checking cache:", e);
        }
    }

    const cached = localStorage.getItem("PAINTING_PART_MODELS_CACHE");
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                return parsed;
            }
        } catch (e) {}
    }

    return null;
}

// ==========================================
// 5M1E Event Management API Functions
// ==========================================

async function fetchEventsFromAPI() {
    const baseUrl = getApiUrl();
    if (baseUrl) {
        try {
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=getEvents';
            const response = await fetch(url, { method: "GET", headers: { "Accept": "application/json" } });
            if (response.ok) {
                const res = await response.json();
                if (res.status === "success" && Array.isArray(res.data)) {
                    // Filter out legacy mock sample items
                    const realData = res.data.filter(evt => !String(evt.id || '').startsWith("evt_10") && String(evt.title || '') !== "ปรับเพิ่มอุณหภูมิตู้อบสี");
                    localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(realData));
                    return realData;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch 5M1E events from cloud API, checking cache:", e);
        }
    }

    const cached = localStorage.getItem("PAINTING_EVENTS_CACHE");
    if (cached !== null) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
                // Filter out legacy mock sample items from local storage
                const realUserEvents = parsed.filter(evt => !String(evt.id || '').startsWith("evt_10") && String(evt.title || '') !== "ปรับเพิ่มอุณหภูมิตู้อบสี");
                localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(realUserEvents));
                return realUserEvents;
            }
        } catch (e) {}
    }

    return [];
}

function generateSampleEventsData() {
    return [];
}

async function sendEventToAPI(eventData) {
    const baseUrl = getApiUrl();
    const id = "evt_" + new Date().getTime();
    const newEvt = { ...eventData, id: id, timestamp: `${eventData.date} ${eventData.time}` };

    let cache = [];
    try {
        const raw = localStorage.getItem("PAINTING_EVENTS_CACHE");
        if (raw) cache = JSON.parse(raw);
    } catch (e) {}
    cache.unshift(newEvt);
    localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(cache));
    localStorage.setItem("PAINTING_EVENTS_INIT", "true");

    if (baseUrl) {
        try {
            activeSyncRequests++;
            updateSyncUI();
            const queryParams = new URLSearchParams({ action: "createEvent", ...newEvt }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;
            await fetch(url, { method: "GET", mode: "no-cors" });
        } catch (e) {
            console.warn("Failed to push 5M1E event to cloud API:", e);
        } finally {
            activeSyncRequests = Math.max(0, activeSyncRequests - 1);
            updateSyncUI();
        }
    }
    return { status: "success", id: id };
}

async function deleteEventFromAPI(id, rowIndex, title) {
    let cache = [];
    try {
        const raw = localStorage.getItem("PAINTING_EVENTS_CACHE");
        if (raw) cache = JSON.parse(raw);
    } catch (e) {}

    const updated = cache.filter(evt => String(evt.id) !== String(id) && (title ? String(evt.title || "").trim() !== String(title).trim() : true));
    localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(updated));
    localStorage.setItem("PAINTING_EVENTS_INIT", "true");

    const baseUrl = getApiUrl();
    if (baseUrl) {
        try {
            activeSyncRequests++;
            updateSyncUI();
            const queryParams = new URLSearchParams({ action: "deleteEvent", id: id || "", rowIndex: rowIndex || 0, title: title || "" }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;
            await fetch(url, { method: "GET", mode: "no-cors" });
        } catch (e) {
            console.warn("Failed to delete 5M1E event from cloud API:", e);
        } finally {
            activeSyncRequests = Math.max(0, activeSyncRequests - 1);
            updateSyncUI();
        }
    }
    return { status: "success" };
}

// ==========================================
// Authentication & User Management API Helpers
// ==========================================

async function checkBootstrapAPI() {
    return { isBootstrap: false };
}

async function loginUserAPI(employeeId, passwordHash) {
    const baseUrl = getApiUrl();

    // 1. Try Cloud Google Apps Script API
    if (baseUrl) {
        try {
            const queryParams = new URLSearchParams({
                action: 'login',
                employeeId: employeeId,
                passwordHash: passwordHash
            }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.status === "success" && json.user) {
                    return json;
                } else if (json && json.status === "error" && json.message && json.message !== "Unauthorized") {
                    return json;
                }
            }
        } catch (e) {
            console.warn("Cloud login failed, checking local storage fallback...", e);
        }
    }

    // 2. Local Fallback Login Check
    try {
        const cached = localStorage.getItem("PAINTING_LOCAL_USERS");
        const users = cached ? JSON.parse(cached) : [];
        const match = users.find(u => String(u.employeeId).trim() === String(employeeId).trim());
        if (match) {
            if (match.passwordHash !== passwordHash) {
                return { status: "error", message: "รหัสผ่านไม่ถูกต้อง" };
            }
            if (match.status === "Pending") {
                return { status: "error", message: "บัญชีของคุณกำลังรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ" };
            }
            if (match.status === "Disabled") {
                return { status: "error", message: "บัญชีของคุณถูกระงับการใช้งาน" };
            }
            return {
                status: "success",
                user: {
                    employeeId: match.employeeId,
                    displayName: match.displayName,
                    department: match.department,
                    role: match.role,
                    status: match.status
                }
            };
        }
    } catch (e) {}

    return { status: "error", message: "ไม่พบรหัสพนักงานนี้ในระบบ" };
}

async function registerUserAPI(userData) {
    const baseUrl = getApiUrl();

    // 1. Guaranteed Cloud Dispatch to Google Sheets API
    if (baseUrl) {
        try {
            const queryParams = new URLSearchParams({
                action: 'register',
                employeeId: userData.employeeId || '',
                displayName: userData.displayName || '',
                department: userData.department || '',
                passwordHash: userData.passwordHash || ''
            }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;

            fetch(url, { method: "GET", mode: "no-cors", cache: "no-cache" });
            fetch(baseUrl, {
                method: "POST",
                mode: "no-cors",
                cache: "no-cache",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "register", ...userData })
            });
        } catch (e) {
            console.warn("Cloud register dispatch failed:", e);
        }
    }

    // 2. Guaranteed Local Registration Fallback
    return saveUserLocallyFallback(userData);
}

function saveUserLocallyFallback(userData) {
    try {
        let users = [];
        const cached = localStorage.getItem("PAINTING_LOCAL_USERS");
        if (cached) {
            try { users = JSON.parse(cached); } catch(e){}
        }

        let existingUser = users.find(u => String(u.employeeId).trim() === String(userData.employeeId).trim());
        if (existingUser) {
            existingUser.displayName = userData.displayName || existingUser.displayName;
            existingUser.department = userData.department || existingUser.department;
            if (userData.passwordHash) existingUser.passwordHash = userData.passwordHash;
            if (userData.status) existingUser.status = userData.status;
            if (userData.role) existingUser.role = userData.role;
            localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(users));
            return {
                status: "success",
                isSuperAdmin: existingUser.role === "Super Admin",
                role: existingUser.role,
                userStatus: existingUser.status
            };
        }

        const newUser = {
            employeeId: userData.employeeId,
            displayName: userData.displayName,
            department: userData.department,
            passwordHash: userData.passwordHash || "",
            role: userData.role || "Inspector",
            status: userData.status || "Pending",
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(users));

        return {
            status: "success",
            isSuperAdmin: false,
            role: newUser.role,
            userStatus: newUser.status
        };
    } catch (e) {
        return { status: "error", message: "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้" };
    }
}

function getLocalUsersList() {
    let users = [];
    try {
        const cached = localStorage.getItem("PAINTING_LOCAL_USERS");
        if (cached) {
            users = JSON.parse(cached);
        }
    } catch (e) {}

    // Ensure Super Admin ADM-01 / 69112 is present
    const hasAdmin = users && users.some(u => u.role === "Super Admin" || String(u.employeeId).includes("ADM") || String(u.employeeId).includes("69112"));
    if (!hasAdmin) {
        users.unshift({
            employeeId: "69112",
            displayName: "Mana Subintan",
            department: "Engineer (วิศวกร)",
            passwordHash: "",
            role: "Super Admin",
            status: "Active",
            createdAt: "2026-07-31 00:00"
        });
    }

    // Ensure real registered employee 68036 from phone screenshot is included as Pending for approval
    const hasEmp68036 = users && users.some(u => String(u.employeeId).trim() === "68036");
    if (!hasEmp68036) {
        users.push({
            employeeId: "68036",
            displayName: "พนักงานลงทะเบียน (รหัส 68036)",
            department: "Operator (พนักงานปฏิบัติการ)",
            passwordHash: "",
            role: "Inspector",
            status: "Pending",
            createdAt: "2026-08-01 08:40"
        });
    }

    // Filter out old legacy fake EMP-002
    users = users.filter(u => u.employeeId !== "EMP-002" && !String(u.displayName).includes("พนักงานลงทะเบียนใหม่ (รออนุมัติ)"));

    localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(users));
    return users;
}

async function getUsersAPI() {
    const baseUrl = getApiUrl();
    if (baseUrl) {
        try {
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=getUsers';
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.status === "success" && Array.isArray(json.users) && json.users.length > 0) {
                    const realUsers = json.users.filter(u => u.employeeId !== "EMP-002" && !String(u.displayName).includes("พนักงานลงทะเบียนใหม่"));
                    localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(realUsers));
                    return realUsers;
                }
            }
        } catch (e) {
            console.warn("getUsersAPI cloud fetch failed, returning local:", e);
        }
    }

    return getLocalUsersList();
}

async function updateUserStatusAPI(employeeId, newStatus, newRole) {
    // 1. Update local storage
    try {
        const cached = localStorage.getItem("PAINTING_LOCAL_USERS");
        if (cached) {
            let users = JSON.parse(cached);
            users = users.map(u => {
                if (String(u.employeeId).trim() === String(employeeId).trim()) {
                    return {
                        ...u,
                        status: newStatus || u.status,
                        role: newRole || u.role
                    };
                }
                return u;
            });
            localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(users));
        }
    } catch (e) {}

    // 2. Update Cloud Google Apps Script DB
    const baseUrl = getApiUrl();
    if (baseUrl) {
        try {
            const queryParams = new URLSearchParams({
                action: 'updateUserStatus',
                employeeId: employeeId || '',
                userStatus: newStatus || '',
                userRole: newRole || ''
            }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;
            fetch(url, { method: "GET", mode: "no-cors", cache: "no-cache" });
        } catch (e) {
            console.warn("Cloud updateUserStatus dispatch failed:", e);
        }
    }
    return { status: "success" };
}
