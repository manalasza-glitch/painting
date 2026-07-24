const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbxglNkez35o5iiV0UxNRm0w_R3QesAGfOutj3TxysvHu4JPrtsFWnNxTMeiWAarnm22/exec";

let API_URL = localStorage.getItem("PAINTING_API_URL") || DEFAULT_API_URL;

// Ensure mobile devices reset to working deployment URL if old broken URL is stored
if (!API_URL.includes("AKfycbxglNkez35o5iiV0UxNRm0w_R3QesAGfOutj3TxysvHu4JPrtsFWnNxTMeiWAarnm22")) {
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
    if (!url) return generateSampleData();

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
            // Save to localStorage as cache
            localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(data));
            return data;
        } else if (data.status === "error") {
            console.warn("API Error:", data.message);
            return getCachedOrSampleData();
        }
        return getCachedOrSampleData();
    } catch (err) {
        console.warn("Failed to fetch from Google Apps Script API. Using sample/cached data:", err);
        return getCachedOrSampleData();
    }
}

// Send new inspection form data to Google Sheet API
async function sendDataToAPI(data) {
    const url = getApiUrl();
    try {
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
    }
}

// Update existing inspection record in Google Sheet API
async function updateDataToAPI(data) {
    const url = getApiUrl();
    try {
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
    }
}

// Delete inspection record from Google Sheet API
async function deleteDataFromAPI(data) {
    const url = getApiUrl();
    try {
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
        { rowIndex: 3, date: "2026-07-23 11:30", rust: 2, dent: 4, weld: 3, chemical: 0, oil: 1, note: "ผ่านเกณฑ์มาตรฐาน" },
        { rowIndex: 4, date: "2026-07-22 09:15", rust: 7, dent: 1, weld: 6, chemical: 4, oil: 2, note: "พบสะเก็ดรอยเชื่อมเยอะเกินปกติ" },
        { rowIndex: 5, date: "2026-07-21 16:45", rust: 3, dent: 5, weld: 2, chemical: 2, oil: 0, note: "เรียบร้อย" }
    ];
    localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(sample));
    return sample;
}
