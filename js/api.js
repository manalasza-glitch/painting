let API_URL = localStorage.getItem("PAINTING_API_URL") || "https://script.google.com/macros/s/AKfycbxP00LCfuR6M3Q949UIX5HVRttyEcPJOtcfYgPvhpRKV8v8uS2kE1wyuLQHsIZi-EFG/exec";

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
    if (!API_URL) return generateSampleData();

    try {
        const response = await fetch(API_URL, {
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

// Send inspection form data to Google Sheet API
async function sendDataToAPI(data) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // Save locally to cache so UI updates instantly
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
        { date: "2026-07-24", rust: 5, dent: 2, weld: 8, chemical: 1, oil: 3, note: "การตรวจช่วงเช้า พบคราบสนิมและรอยเชื่อมบางจุด" },
        { date: "2026-07-23", rust: 2, dent: 4, weld: 3, chemical: 0, oil: 1, note: "ผ่านเกณฑ์มาตรฐาน" },
        { date: "2026-07-22", rust: 7, dent: 1, weld: 6, chemical: 4, oil: 2, note: "พบสะเก็ดรอยเชื่อมเยอะเกินปกติ" },
        { date: "2026-07-21", rust: 3, dent: 5, weld: 2, chemical: 2, oil: 0, note: "เรียบร้อย" },
        { date: "2026-07-20", rust: 1, dent: 0, weld: 4, chemical: 1, oil: 5, note: "มีคราบน้ำมันเกาะชิ้นงานเล็กน้อย" },
        { date: "2026-07-19", rust: 4, dent: 3, weld: 5, chemical: 3, oil: 2, note: "งานกะดึก" },
        { date: "2026-07-18", rust: 6, dent: 2, weld: 7, chemical: 0, oil: 1, note: "แจ้งทีมเชื่อมปรับปรุงแก้ไข" }
    ];
    localStorage.setItem("PAINTING_INSPECTION_CACHE", JSON.stringify(sample));
    return sample;
}
