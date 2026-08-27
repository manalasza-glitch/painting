const RTV_CACHE_KEY = "PAINTING_RTV_CACHE";
let rtvRecordsCache = null;
let rtvLoadPromise = null;

function rtvEscape(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function rtvDateOnly(value) {
    const raw = String(value == null ? "" : value).trim();
    let match = raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (match) return match[1] + "-" + String(match[2]).padStart(2, "0") + "-" + String(match[3]).padStart(2, "0");
    match = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
    if (match) {
        let a = Number(match[1]), b = Number(match[2]), year = Number(match[3]);
        if (year < 100) year += 2000;
        if (year > 2400) year -= 543;
        const day = a > 12 ? a : (b > 12 ? b : a);
        const month = a > 12 ? b : (b > 12 ? a : b);
        return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    }
    return raw.slice(0, 10);
}

function rtvWorkType(value) {
    const raw = String(value == null ? "" : value).trim().toUpperCase();
    if (raw === "SCREEN" || raw === "SC") return "SCREEN";
    if (raw === "REWORK" || raw === "RW") return "REWORK";
    return "NEW";
}

function rtvWorkTypeLabel(value) {
    return { NEW: "งานใหม่", REWORK: "REWORK", SCREEN: "SCREEN" }[rtvWorkType(value)] || "งานใหม่";
}

function rtvNormalizeRecord(row) {
    return {
        rtvId: String(row && (row.rtvId || row.RTVId) || ""),
        paintDate: rtvDateOnly(row && (row.paintDate || row.PaintDate || row.date || row.Date)),
        workType: rtvWorkType(row && (row.workType || row.WorkType)),
        productGroup: String(row && (row.productGroup || row.ProductGroup) || ""),
        partCategory: String(row && (row.partCategory || row.PartCategory) || ""),
        model: String(row && (row.model || row.Model) || ""),
        color: String(row && (row.color || row.Color) || ""),
        returnQty: Number(row && (row.returnQty ?? row.ReturnQty ?? row.qty)) || 0,
        problem: String(row && (row.problem || row.Problem) || ""),
        reference: String(row && (row.reference || row.Reference) || ""),
        recorder: String(row && (row.recorder || row.Recorder) || ""),
        status: String(row && (row.status || row.Status) || "รอติดตาม"),
        createdAt: String(row && (row.createdAt || row.CreatedAt) || ""),
        updatedAt: String(row && (row.updatedAt || row.UpdatedAt) || "")
    };
}

function getRTVRecords() {
    if (Array.isArray(rtvRecordsCache)) return rtvRecordsCache;
    try {
        const rows = JSON.parse(localStorage.getItem(RTV_CACHE_KEY) || "[]");
        return Array.isArray(rows) ? rows : [];
    } catch (_) {
        return [];
    }
}

async function loadRTVRecords(forceRefresh = false) {
    if (!forceRefresh && Array.isArray(rtvRecordsCache)) return rtvRecordsCache;
    if (!forceRefresh && rtvLoadPromise) return rtvLoadPromise;
    const task = (async () => {
        const baseUrl = typeof getApiUrl === "function" ? getApiUrl() : "";
        if (baseUrl && typeof fetchAppsScriptJsonWithRetry === "function") {
            const url = baseUrl + (baseUrl.includes("?") ? "&" : "?") + "action=getRTVRecords&_request=" + Date.now();
            try {
                const result = await fetchAppsScriptJsonWithRetry(url, "โหลดข้อมูล RTV", { attempts: 2, timeoutMs: 15000 });
                if (result && result.status === "success" && Array.isArray(result.data)) {
                    rtvRecordsCache = result.data.map(rtvNormalizeRecord);
                    localStorage.setItem(RTV_CACHE_KEY, JSON.stringify(rtvRecordsCache));
                    renderRTVRecords();
                    return rtvRecordsCache;
                }
            } catch (error) {
                console.warn("โหลดข้อมูล RTV จากระบบกลางไม่สำเร็จ ใช้ข้อมูลสำรอง", error);
            }
        }
        rtvRecordsCache = getRTVRecords().map(rtvNormalizeRecord);
        return rtvRecordsCache;
    })();
    rtvLoadPromise = task;
    try {
        return await task;
    } finally {
        if (rtvLoadPromise === task) rtvLoadPromise = null;
    }
}

async function saveRTVRecordToAPI(record) {
    const baseUrl = typeof getApiUrl === "function" ? getApiUrl() : "";
    if (!baseUrl || typeof fetchAppsScriptJsonWithRetry !== "function") throw new Error("ยังไม่ได้เชื่อมต่อฐานข้อมูล RTV");
    const params = new URLSearchParams({
        action: "saveRTVRecord", rtvId: record.rtvId || "", paintDate: record.paintDate || "",
        workType: rtvWorkType(record.workType), productGroup: record.productGroup || "",
        partCategory: record.partCategory || "", model: record.model || "", color: record.color || "",
        returnQty: String(record.returnQty || 0), problem: record.problem || "",
        reference: record.reference || "", recorder: record.recorder || "", status: record.status || "รอติดตาม"
    }).toString();
    return fetchAppsScriptJsonWithRetry(
        baseUrl + (baseUrl.includes("?") ? "&" : "?") + params + "&_request=" + Date.now(),
        "บันทึกข้อมูล RTV", { attempts: 2, timeoutMs: 15000 }
    );
}

function rtvToday() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

async function submitRTVRecord(event) {
    if (event) event.preventDefault();
    const payload = {
        rtvId: "rtv_" + Date.now(),
        paintDate: document.getElementById("rtvPaintDate")?.value || "",
        workType: rtvWorkType(document.getElementById("rtvWorkType")?.value),
        productGroup: document.getElementById("rtvProductGroup")?.value.trim() || "",
        partCategory: document.getElementById("rtvPartCategory")?.value.trim() || "",
        model: document.getElementById("rtvModel")?.value.trim() || "",
        color: document.getElementById("rtvColor")?.value.trim() || "",
        returnQty: Number(document.getElementById("rtvReturnQty")?.value) || 0,
        problem: document.getElementById("rtvProblem")?.value.trim() || "",
        reference: document.getElementById("rtvReference")?.value.trim() || "",
        recorder: document.getElementById("rtvRecorder")?.value.trim() || "",
        status: "รอติดตาม"
    };
    if (!payload.paintDate || payload.returnQty <= 0 || !payload.problem) {
        if (typeof showToast === "function") showToast("กรุณาระบุวันที่พ่น จำนวนตีกลับ และปัญหาให้ครบ", "error");
        return;
    }
    const button = document.getElementById("rtvSubmitButton");
    if (button) { button.disabled = true; button.textContent = "กำลังบันทึก..."; }
    try {
        const result = await saveRTVRecordToAPI(payload);
        if (!result || result.status !== "success") throw new Error(result?.message || "ระบบไม่ยืนยันการบันทึก");
        await loadRTVRecords(true);
        renderRTVRecords();
        if (event && event.target && typeof event.target.reset === "function") event.target.reset();
        const dateInput = document.getElementById("rtvPaintDate");
        if (dateInput) dateInput.value = rtvToday();
        if (typeof refreshDashboardAfterRTV === "function") refreshDashboardAfterRTV();
        if (typeof showToast === "function") showToast("บันทึก RTV และปรับยอดตามวันที่พ่นแล้ว", "success");
    } catch (error) {
        console.error("RTV submit failed", error);
        if (typeof showToast === "function") showToast(error.message || "บันทึก RTV ไม่สำเร็จ", "error");
    } finally {
        if (button) { button.disabled = false; button.textContent = "💾 บันทึก RTV"; }
    }
}

function openRTVTab(event, link) {
    if (event) event.preventDefault();
    if (typeof switchTab === "function") switchTab("rtv-tab", link);
    renderRTVRecords();
    loadRTVRecords();
}

function renderRTVRecords() {
    const body = document.getElementById("rtvTableBody");
    if (!body) return;
    const rows = getRTVRecords().map(rtvNormalizeRecord)
        .sort((a, b) => String(b.paintDate).localeCompare(String(a.paintDate)));
    const count = document.getElementById("rtvRecordCount");
    if (count) count.textContent = rows.length;
    const totals = { NEW: 0, REWORK: 0, SCREEN: 0 };
    rows.forEach(row => { totals[row.workType] = (totals[row.workType] || 0) + row.returnQty; });
    ["NEW", "REWORK", "SCREEN"].forEach(type => {
        const el = document.getElementById("rtvTotal" + type);
        if (el) el.textContent = (totals[type] || 0).toLocaleString("th-TH");
    });
    if (!rows.length) {
        body.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:2rem;">ยังไม่มีรายการ RTV</td></tr>';
        return;
    }
    body.innerHTML = rows.map(row =>
        '<tr><td>' + rtvEscape(row.paintDate) + '</td>' +
        '<td><span class="rtv-type-badge ' + row.workType.toLowerCase() + '">' + rtvEscape(rtvWorkTypeLabel(row.workType)) + '</span></td>' +
        '<td>' + rtvEscape(row.model || "-") + '</td>' +
        '<td style="text-align:right;font-weight:800;color:#fb7185;">' + row.returnQty.toLocaleString("th-TH") + '</td>' +
        '<td>' + rtvEscape(row.problem) + '</td><td>' + rtvEscape(row.reference || "-") + '</td>' +
        '<td>' + rtvEscape(row.recorder || "-") + '</td><td>' + rtvEscape(row.status) + '</td>' +
        '<td>' + rtvEscape(row.createdAt || "-") + '</td></tr>'
    ).join("");
}

function getRTVReturnTotalsByDate(workType) {
    const totals = {};
    const wanted = rtvWorkType(workType);
    getRTVRecords().map(rtvNormalizeRecord).forEach(row => {
        if (row.workType !== wanted || !row.paintDate) return;
        totals[row.paintDate] = (totals[row.paintDate] || 0) + Math.max(0, row.returnQty);
    });
    return totals;
}

function applyRTVAdjustments(records, workType) {
    const rows = (Array.isArray(records) ? records : []).map(row => ({ ...row }));
    const returns = getRTVReturnTotalsByDate(workType);
    const indicesByDate = {};
    rows.forEach((row, index) => {
        const date = rtvDateOnly(row && (row.date || row.Date || row.timestamp));
        if (date) (indicesByDate[date] ||= []).push(index);
    });
    Object.keys(returns).forEach(date => {
        let remaining = returns[date] || 0;
        (indicesByDate[date] || []).forEach(index => {
            if (remaining <= 0) return;
            const row = rows[index];
            const qty = Math.max(0, Number(row.prodQty || row.ProdQty || row.qty) || 0);
            if (!qty) return;
            const deduction = Math.min(qty, remaining);
            const nextQty = Math.max(0, qty - deduction);
            const ratio = qty > 0 ? nextQty / qty : 0;
            row.prodQty = nextQty;
            ["rust", "dent", "weld", "chemical", "oil", "colorDrop", "thinPaint", "thickPaint", "waterStain", "dust", "otherDefect", "totalDefect"].forEach(key => {
                if (row[key] != null && Number.isFinite(Number(row[key]))) row[key] = Math.round(Number(row[key]) * ratio * 100) / 100;
            });
            remaining -= deduction;
        });
    });
    return rows;
}

function getRTVAdjustedTotal(records, workType) {
    return applyRTVAdjustments(records, workType).reduce((sum, row) => sum + (Number(row.prodQty || row.ProdQty || row.qty) || 0), 0);
}

function refreshDashboardAfterRTV() {
    if (typeof renderDailyReportCharts === "function") renderDailyReportCharts();
    if (typeof loadReworkDashboardChart === "function") loadReworkDashboardChart(true);
    if (typeof loadScreenDashboardChart === "function") loadScreenDashboardChart(true);
}

function initRTV() {
    const input = document.getElementById("rtvPaintDate");
    if (input && !input.value) input.value = rtvToday();
    renderRTVRecords();
    loadRTVRecords();
}

window.getRTVRecords = getRTVRecords;
window.loadRTVRecords = loadRTVRecords;
window.submitRTVRecord = submitRTVRecord;
window.openRTVTab = openRTVTab;
window.renderRTVRecords = renderRTVRecords;
window.applyRTVAdjustments = applyRTVAdjustments;
window.getRTVReturnTotalsByDate = getRTVReturnTotalsByDate;
window.getRTVAdjustedTotal = getRTVAdjustedTotal;
window.refreshDashboardAfterRTV = refreshDashboardAfterRTV;

document.addEventListener("DOMContentLoaded", () => setTimeout(initRTV, 500));
