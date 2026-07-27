const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbztfold1gDkQaiQEiiWuZ2dYVyGCk7Kh8QuSuPCyd5wBInY3nM89UxDf4l8rhowf-Jm/exec";

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

// Force reset to active deployment URL
if (!API_URL.includes("AKfycbztfold1gDkQaiQEiiWuZ2dYVyGCk7Kh8QuSuPCyd5wBInY3nM89UxDf4l8rhowf-Jm")) {
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

        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });
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
    const sample = [
        { rowIndex: 2, date: "2026-07-24 14:00", rust: 5, dent: 2, weld: 8, chemical: 1, oil: 3, note: "การตรวจช่วงเช้า พบคราบสนิมและรอยเชื่อมบางจุด" },
        { rowIndex: 3, date: "2026-07-23 11:30", rust: 2, dent: 4, weld: 3, chemical: 0, oil: 1, note: "ผ่านเกณฑ์มาตรฐาน" }
    ];
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
            let list = null;
            if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
                list = json.data;
            } else if (Array.isArray(json) && json.length > 0) {
                list = json;
            }

            // Verify that fetched list actually contains outputdiary production data (model or prodQty)
            if (list && list.length > 0 && (list[0].model !== undefined || list[0].prodQty !== undefined)) {
                localStorage.setItem("PAINTING_OUTPUTDIARY_CACHE", JSON.stringify(list));
                return list;
            }
        } catch (e) {
            console.warn("Failed to fetch outputdiary from cloud, checking cache:", e);
        }
    }

    const cached = localStorage.getItem("PAINTING_OUTPUTDIARY_CACHE");
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].model !== undefined || parsed[0].prodQty !== undefined)) {
                return parsed;
            }
        } catch (e) {}
    }

    return generateSampleOutputDiaryData();
}

function generateSampleOutputDiaryData() {
    const sample = [];
    const models = ["GLAND PLATE (SMALL)", "BOX 200x300x150", "U-BOX STANDARD", "DOOR PANEL NLC-01", "COVER NMS-100", "COVER NLC-200"];
    const dates = ["2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26", "2026-07-27"];
    const recorders = ["สมชาย ใจดี", "วิชัย มีสุข", "สมศักดิ์ ขยันงาน", "อนันต์ ราบรื่น", "ประเสริฐ ดีเยี่ยม"];

    for (let i = 0; i < 15; i++) {
        const date = dates[i % dates.length];
        const recorder = recorders[i % recorders.length];
        const model = models[i % models.length];
        const prodQty = 25 + (i * 3);
        const totalDefect = (i % 3 === 0) ? 2 : (i % 2 === 0 ? 1 : 0);

        sample.push({
            timestamp: `${date} 09:00`,
            date: date,
            shift: i % 2 === 0 ? "Day" : "Night",
            recorder: recorder,
            checker: "",
            model: model,
            timeSlot: "08:00 - 09:00",
            prodQty: prodQty,
            dent: totalDefect > 0 ? 1 : 0,
            colorDrop: 0,
            thinPaint: totalDefect > 1 ? 1 : 0,
            thickPaint: 0,
            waterStain: 0,
            otherDefect: 0,
            totalDefect: totalDefect
        });
    }
    localStorage.setItem("PAINTING_OUTPUTDIARY_CACHE", JSON.stringify(sample));
    return sample;
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
                    localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(res.data));
                    localStorage.setItem("PAINTING_EVENTS_INIT", "true");
                    return res.data;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch 5M1E events from cloud API, using cache:", e);
        }
    }

    const isInit = localStorage.getItem("PAINTING_EVENTS_INIT");
    const cached = localStorage.getItem("PAINTING_EVENTS_CACHE");
    if (cached !== null) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }

    if (isInit === "true") {
        return [];
    }

    return generateSampleEventsData();
}

function generateSampleEventsData() {
    const sample = [
        {
            id: "evt_101",
            date: "2026-07-27",
            time: "08:30",
            shift: "กะเช้า",
            category: "Machine",
            process: "เตาอบสี (Baking Oven)",
            title: "ปรับเพิ่มอุณหภูมิตู้อบสี",
            detail: "เพิ่มอุณหภูมิอบสีจาก 180°C เป็น 190°C เพื่อรองรับความหนาชิ้นงานรุ่นใหม่",
            action: "สุ่มตรวจความหนาและพ่นติดของสีผ่านเกณฑ์ 100%",
            recorder: "สมชาย ใจดี",
            timestamp: "2026-07-27 08:30"
        },
        {
            id: "evt_102",
            date: "2026-07-26",
            time: "10:15",
            shift: "กะเช้า",
            category: "Material",
            process: "ห้องผสมสี (Color Mix Room)",
            title: "เปลี่ยนล็อตสีพ่นผงชั่วคราว",
            detail: "เปิดใช้สีผงล็อตใหม่ Batch #20260726-A เนื่องจากสีล็อตเดิมหมดสต็อก",
            action: "ทำการเทียบเฉดสี Gloss & Color Shade อยู่ในเกณฑ์มาตรฐาน",
            recorder: "วิชัย มีสุข",
            timestamp: "2026-07-26 10:15"
        },
        {
            id: "evt_103",
            date: "2026-07-25",
            time: "13:40",
            shift: "กะเช้า",
            category: "Man",
            process: "ไลน์พ่นสีชิ้นงาน",
            title: "เปลี่ยนตัวพนักงานพ่นสีหลัก",
            detail: "พนักงานประจำลาป่วย ให้พนักงานสำรองดำเนินการพ่นสีแทน",
            action: "หัวหน้างานเข้ากำกับเทคนิคการพ่นสีใกล้ชิดตลอดกะ",
            recorder: "สมศักดิ์ ขยันงาน",
            timestamp: "2026-07-25 13:40"
        },
        {
            id: "evt_104",
            date: "2026-07-24",
            time: "15:00",
            shift: "กะเช้า",
            category: "Environment",
            process: "ห้องพ่นสี (Spray Booth)",
            title: "เปลี่ยนแผ่นกรองฝุ่นห้องพ่นสี",
            detail: "ทำความสะอาดและเปลี่ยน Filter กรองอากาศใหม่เนื่องจากฝุ่นสะสม",
            action: "วัดค่าแรงดันลมในห้องพ่นสีกลับสู่สภาวะปกติ",
            recorder: "สมชาย ใจดี",
            timestamp: "2026-07-24 15:00"
        },
        {
            id: "evt_105",
            date: "2026-07-23",
            time: "09:20",
            shift: "กะเช้า",
            category: "Measurement",
            process: "ห้อง QC ตรวจสอบ",
            title: "สอบเทียบเครื่องวัดความหนาสี (Elcometer)",
            detail: "ปรับแต่ง Calibration Zero & Foil Shim สำหรับเครื่องวัดความหนาสี",
            action: "เครื่องมือผ่านการ Calibration พร้อมติดสติ๊กเกอร์รับรอง",
            recorder: "วิชัย มีสุข",
            timestamp: "2026-07-23 09:20"
        }
    ];
    localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(sample));
    localStorage.setItem("PAINTING_EVENTS_INIT", "true");
    return sample;
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
