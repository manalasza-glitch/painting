const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbwCGi9XE6U0RYliOgyyQZaWOazVOn5xXAo8RVF_AilQi6gy1mWr-sl5_L0Mhv4QjLRj/exec";

// Automatically clear legacy sample mock data from browser localStorage
(function purgeLegacyMockCaches() {
    try {
        const events = localStorage.getItem("PAINTING_EVENTS_CACHE");
        if (events && (events.includes("evt_101") || events.includes("ปรับเพิ่มอุณหภูมิตู้อบสี") || events.includes("Sample"))) {
            localStorage.removeItem("PAINTING_EVENTS_CACHE");
        }
        const output = localStorage.getItem("PAINTING_OUTPUTDIARY_CACHE");
        if (output && (output.includes("Box NMS 4/6 W.") || output.includes("Cover NMS 6 w."))) {
            localStorage.removeItem("PAINTING_OUTPUTDIARY_CACHE");
        }
        const inspection = localStorage.getItem("PAINTING_INSPECTION_CACHE");
        if (inspection && (inspection.includes("สุ่มตรวจประจำวัน") || inspection.includes("พบคราบสนิมบางชิ้นงาน"))) {
            localStorage.removeItem("PAINTING_INSPECTION_CACHE");
        }
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
        if (Array.isArray(data)) {
            localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(data));
            return data;
        } else if (data.status === "error") {
            console.warn("API Error:", data.message);
            return getCachedOrSampleData();
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

function getCachedOrSampleData() {
    const cached = localStorage.getItem("PAINTING_INSPECTION_CACHE");
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
            console.error("Cache parse error", e);
        }
    }
    return generateSampleData();
}

function generateSampleData() {
    const sample = [];
    const notes = [
        "สุ่มตรวจประจำวัน ผลการตรวจสอบอยู่ในเกณฑ์มาตรฐาน",
        "พบคราบสนิมบางชิ้นงาน ดำเนินการล้างน้ำยาทำความสะอาดเพิ่มเติม",
        "มีรอยบุบและสะเก็ดเชื่อม ดำเนินการแจ้งแผนกเชื่อมเจียรแต่งขอบ",
        "พบคราบน้ำมันบนพื้นผิว ส่งคืนแผนกเตรียมชิ้นงานรีล้างใหม่",
        "ทดสอบความหนาชั้นสีผ่านเกณฑ์ปกติ 60-80 ไมครอน",
        "การตรวจเช็ครอบกะดึก ผลปกติ",
        "ปรับพารามิเตอร์เครื่องพ่นสีเนื่องจากพบรอยละอองสีบางจุด"
    ];

    // Generate 1 full month of sample inspection data (July 1 - July 31, 2026)
    for (let day = 1; day <= 31; day++) {
        const dd = ('0' + day).slice(-2);
        const dateStr = `2026-07-${dd}`;
        
        // 1 - 2 inspection records per day
        const recordsPerDay = 1 + (day % 2);
        for (let r = 0; r < recordsPerDay; r++) {
            const hour = r === 0 ? "09:30" : "14:15";
            const fullDate = `${dateStr} ${hour}`;
            
            const rust = (day % 3 === 0) ? (2 + (day % 4)) : (day % 5 === 0 ? 1 : 0);
            const dent = (day % 4 === 0) ? (1 + (day % 3)) : 0;
            const weld = (day % 2 === 0) ? (2 + (day % 5)) : 1;
            const chemical = (day % 7 === 0) ? 2 : 0;
            const oil = (day % 6 === 0) ? 1 : 0;
            
            const noteText = notes[(day + r) % notes.length];

            sample.push({
                rowIndex: sample.length + 2,
                date: fullDate,
                timestamp: fullDate,
                rust: rust,
                dent: dent,
                weld: weld,
                chemical: chemical,
                oil: oil,
                note: noteText
            });
        }
    }

    localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(sample));
    return sample;
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
    const sample = [];
    const models = [
        "Box NMS 4/6 W. 240 mm.",
        "Door NLC 450 mm.",
        "BOX 300x400x200",
        "GLAND PLATE (MEDIUM)",
        "DOOR PANEL NLC-01",
        "U-BOX STANDARD",
        "DOOR PANEL NMS-01",
        "BOX 400x500x200",
        "Cover NMS 6 w. 245 mm.",
        "Cover NLC EZ100 600 mm.",
        "Flat Door LC 600"
    ];
    const recorders = ["สมชาย ใจดี", "วิชัย มีสุข", "สมศักดิ์ ขยันงาน", "อนันต์ ราบรื่น", "ประเสริฐ ดีเยี่ยม"];

    // Seed full month of July 2026 (2026-07-01 to 2026-07-31) matching sheet tab gid=236266615
    for (let day = 1; day <= 31; day++) {
        const dd = ('0' + day).slice(-2);
        const dateStr = `2026-07-${dd}`;
        
        // 2 - 4 production runs per day
        const runsCount = 2 + (day % 3);
        for (let r = 0; r < runsCount; r++) {
            const mIdx = (day + r * 3) % models.length;
            const model = models[mIdx];
            const recorder = recorders[(day + r) % recorders.length];
            
            // Peak day volume spikes (e.g. July 27)
            let baseQty = 45 + ((day * 7 + r * 15) % 110);
            if (day === 27) baseQty = 450 + (r * 120);

            const totalDefect = (day % 4 === 0) ? (1 + (day % 3)) : (day % 2 === 0 ? 1 : 0);

            sample.push({
                timestamp: `${dateStr} 08:30`,
                date: dateStr,
                shift: r % 2 === 0 ? "กะเช้า" : "กะดึก",
                recorder: recorder,
                checker: "",
                model: model,
                timeSlot: `${8 + r * 2}:00 - ${10 + r * 2}:00`,
                prodQty: baseQty,
                dent: totalDefect > 0 ? 1 : 0,
                colorDrop: 0,
                thinPaint: totalDefect > 1 ? 1 : 0,
                thickPaint: 0,
                waterStain: 0,
                otherDefect: 0,
                totalDefect: totalDefect
            });
        }
    }

    localStorage.setItem("PAINTING_OUTPUTDIARY_CACHE", JSON.stringify(sample));
    return sample;
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
    const baseUrl = getApiUrl();
    if (!baseUrl) return { isBootstrap: true };
    try {
        const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=checkBootstrap';
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data.isBootstrap === 'boolean') return data;
        }
    } catch (e) {}

    // Check local fallback users count
    try {
        const cached = localStorage.getItem("PAINTING_LOCAL_USERS");
        const users = cached ? JSON.parse(cached) : [];
        return { isBootstrap: users.length === 0 };
    } catch (e) {
        return { isBootstrap: true };
    }
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

    // 1. Try Cloud Google Apps Script GET Request
    if (baseUrl) {
        try {
            const query = new URLSearchParams({
                action: 'register',
                employeeId: userData.employeeId || '',
                displayName: userData.displayName || '',
                department: userData.department || '',
                passwordHash: userData.passwordHash || ''
            }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + query;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.status === "success") {
                    saveUserLocallyFallback(userData); // Keep synced locally
                    return json;
                } else if (json && json.status === "error") {
                    if (json.message === "Unauthorized" || !json.message) {
                        return saveUserLocallyFallback(userData);
                    }
                    return json;
                }
            }
        } catch (e) {
            console.warn("Cloud GET register failed, trying POST...", e);
        }

        // 2. Try Cloud POST Request
        try {
            const postUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=register';
            const res = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "register", ...userData })
            });
            if (res.ok) {
                const json = await res.json();
                if (json && json.status === "success") {
                    saveUserLocallyFallback(userData);
                    return json;
                } else if (json && json.status === "error") {
                    if (json.message === "Unauthorized" || !json.message) {
                        return saveUserLocallyFallback(userData);
                    }
                    return json;
                }
            }
        } catch (e) {
            console.warn("Cloud POST register failed:", e);
        }
    }

    // 3. Guaranteed Local Registration Fallback
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
            existingUser.displayName = userData.displayName;
            existingUser.department = userData.department;
            existingUser.passwordHash = userData.passwordHash;
            localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(users));
            return {
                status: "success",
                isSuperAdmin: existingUser.role === "Super Admin",
                role: existingUser.role,
                userStatus: existingUser.status
            };
        }

        const isFirst = users.length === 0;
        const newUser = {
            employeeId: userData.employeeId,
            displayName: userData.displayName,
            department: userData.department,
            passwordHash: userData.passwordHash,
            role: isFirst ? "Super Admin" : "Inspector",
            status: isFirst ? "Active" : "Pending",
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(users));

        return {
            status: "success",
            isSuperAdmin: isFirst,
            role: newUser.role,
            userStatus: newUser.status
        };
    } catch (e) {
        return { status: "error", message: "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้" };
    }
}

async function getUsersAPI() {
    const baseUrl = getApiUrl();
    if (baseUrl) {
        try {
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'action=getUsers';
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.status === "success" && Array.isArray(json.users)) {
                    localStorage.setItem("PAINTING_LOCAL_USERS", JSON.stringify(json.users));
                    return json.users;
                }
            }
        } catch (e) {
            console.warn("getUsersAPI cloud fetch failed, checking local:", e);
        }
    }

    try {
        const cached = localStorage.getItem("PAINTING_LOCAL_USERS");
        return cached ? JSON.parse(cached) : [];
    } catch (e) {
        return [];
    }
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

    // 2. Update cloud API
    const baseUrl = getApiUrl();
    if (baseUrl) {
        try {
            const queryParams = new URLSearchParams({
                action: 'updateUserStatus',
                employeeId: employeeId,
                userStatus: newStatus || '',
                userRole: newRole || ''
            }).toString();
            const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryParams;
            fetch(url, { method: "GET" }).catch(() => {});
        } catch (e) {}
    }
    return { status: "success" };
}
