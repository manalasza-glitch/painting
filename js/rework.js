// REWORK production form. It intentionally mirrors the daily production
// form while writing to and reading from the dedicated REWORK sheet.

let reworkDraftRecords = [];
let reworkHistoryRecords = [];
let reworkFormInitialized = false;
let reworkCatalogListenersBound = false;

const REWORK_DRAFT_KEY = "PAINTING_REWORK_DRAFT";

function reworkToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function reworkEsc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function reworkNum(id) {
    const value = Number(document.getElementById(id)?.value);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function reworkCatalog() {
    const groups = (typeof PAINTING_MODEL_GROUPS !== "undefined" && PAINTING_MODEL_GROUPS) || window.PAINTING_MODEL_GROUPS || {};
    const sharedOrder = (typeof PAINTING_PRODUCT_GROUP_ORDER !== "undefined" && PAINTING_PRODUCT_GROUP_ORDER) || window.PAINTING_PRODUCT_GROUP_ORDER;
    const order = Array.isArray(sharedOrder)
        ? sharedOrder
        : Object.keys(groups);
    return { groups, order };
}

function reworkOptions(selectId, options, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${reworkEsc(placeholder)}</option>` + options.map(option => {
        const value = typeof option === "string" ? option : (option.value ?? option.code ?? "");
        const label = typeof option === "string" ? option : (option.label ?? option.value ?? option.code ?? "");
        return `<option value="${reworkEsc(value)}">${reworkEsc(label)}</option>`;
    }).join("");
    if (options.some(option => String(typeof option === "string" ? option : (option.value ?? option.code ?? "")) === String(current))) {
        select.value = current;
    }
}

function renderReworkProductGroups() {
    const { groups, order } = reworkCatalog();
    reworkOptions("rwProductGroup", order.filter(key => groups[key]), "-- เลือกกลุ่มผลิตภัณฑ์ --");
    renderReworkPartGroups();
    renderReworkColors();
}

function renderReworkPartGroups() {
    const { groups } = reworkCatalog();
    const group = document.getElementById("rwProductGroup")?.value || "";
    const categories = groups[group]?.categories || {};
    reworkOptions("rwPartGroup", Object.keys(categories), "-- เลือกประเภทชิ้นงาน --");
    renderReworkModels();
}

function renderReworkModels() {
    const { groups } = reworkCatalog();
    const group = document.getElementById("rwProductGroup")?.value || "";
    const part = document.getElementById("rwPartGroup")?.value || "";
    const models = groups[group]?.categories?.[part] || [];
    reworkOptions("rwModel", models, "-- เลือกรุ่นงาน / รหัส --");
}

function renderReworkColors() {
    const { groups } = reworkCatalog();
    const group = document.getElementById("rwProductGroup")?.value || "";
    const colors = groups[group]?.colors || [];
    reworkOptions("rwColor", colors, "-- เลือกสี --");
}

function reworkFormMarkup() {
    const sharedSlots = (typeof PAINTING_TIMESLOTS !== "undefined" && PAINTING_TIMESLOTS) || window.PAINTING_TIMESLOTS;
    const slots = Array.isArray(sharedSlots) && sharedSlots.length
        ? sharedSlots
        : ["08.00 - 09.00", "09.00 - 10.00", "10.00 - 11.00", "11.00 - 12.00", "12.00 - 13.00", "13.00 - 14.00", "14.00 - 15.00", "15.00 - 16.00", "16.00 - 17.00", "17.00 - 18.00", "18.00 - 19.00", "20.00 - 21.00"];
    return `
        <div class="section-title-bar">
            <div>
                <h1 class="page-title">REWORK</h1>
                <p class="page-subtitle">แบบฟอร์มบันทึกงานแก้ไข/ทำซ้ำ แยกจากแบบฟอร์มผลิตรายวัน</p>
            </div>
        </div>

        <div class="dr-card rework-form-card">
            <h2 class="dr-section-title">ส่วนที่ 1: ข้อมูลการบันทึก REWORK</h2>
            <div class="dr-grid-3">
                <div class="form-group"><label for="rwDate">วันที่</label><input id="rwDate" type="date" class="form-control"></div>
                <div class="form-group"><label>กะ</label><div class="dr-radio-group"><label><input type="radio" name="reworkShift" value="Day" checked> กะเช้า</label><label><input type="radio" name="reworkShift" value="Night"> กะดึก</label></div></div>
                <div class="form-group"><label for="rwRecorder">ผู้บันทึก</label><input id="rwRecorder" class="form-control" type="text" placeholder="ระบุชื่อผู้บันทึก"></div>
            </div>
        </div>

        <div class="dr-card rework-form-card">
            <h2 class="dr-section-title">ส่วนที่ 2: รายการผลิตและของเสีย</h2>
            <div class="dr-grid-4">
                <div class="form-group"><label for="rwProductGroup">กลุ่มผลิตภัณฑ์</label><select id="rwProductGroup" class="form-control"><option value="">-- เลือกกลุ่มผลิตภัณฑ์ --</option></select></div>
                <div class="form-group"><label for="rwPartGroup">ประเภทชิ้นงาน</label><select id="rwPartGroup" class="form-control"><option value="">-- เลือกประเภทชิ้นงาน --</option></select></div>
                <div class="form-group"><label for="rwModel">รุ่นงาน / รหัส</label><select id="rwModel" class="form-control"><option value="">-- เลือกรุ่นงาน / รหัส --</option></select></div>
                <div class="form-group"><label for="rwColor">สี</label><select id="rwColor" class="form-control"><option value="">-- เลือกสี --</option></select></div>
            </div>
            <div class="dr-grid-2">
                <div class="form-group"><label for="rwTime">ช่วงเวลา</label><select id="rwTime" class="form-control">${slots.map(slot => `<option value="${reworkEsc(slot)}">${reworkEsc(slot)}</option>`).join("")}</select></div>
                <div class="form-group"><label for="rwProdQty">ยอดผลิต (ชิ้น)</label><input id="rwProdQty" class="form-control" type="number" min="0" value="0"></div>
            </div>
            <h3 class="dr-subtitle">ของเสีย (Defects)</h3>
            <div class="dr-grid-9 rework-defects-grid">
                ${[["rwRust", "สนิม"], ["rwDent", "รอยบุบ"], ["rwColorDrop", "สะเก็ดรอยเชื่อม"], ["rwThinPaint", "สีหนา/สีปูด"], ["rwThickPaint", "คราบน้ำ/จาระบี"], ["rwWaterStain", "คราบน้ำยา"], ["rwOil", "คราบน้ำมัน"], ["rwDust", "เศษฝุ่น"], ["rwOtherDefect", "อื่นๆ"]].map(([id, label]) => `<div class="form-group"><label for="${id}">${label}</label><input id="${id}" class="form-control" type="number" min="0" value="0"></div>`).join("")}
            </div>
            <div class="rework-form-actions"><button id="reworkSubmitButton" type="button" class="btn-primary" onclick="submitReworkReport()">💾 บันทึกข้อมูล REWORK</button></div>
        </div>

        <div class="dr-card rework-form-card">
            <h2 class="dr-section-title">ส่วนที่ 3: เวลาสูญเสีย (Downtime)</h2>
            <div class="dr-grid-4">
                <div class="form-group"><label for="rwDtBurner">เบอร์เนอร์</label><input id="rwDtBurner" class="form-control" type="number" min="0" value="0"></div>
                <div class="form-group"><label for="rwDtWash">ไลน์ล้าง</label><input id="rwDtWash" class="form-control" type="number" min="0" value="0"></div>
                <div class="form-group"><label for="rwDtOven">เตาอบ</label><input id="rwDtOven" class="form-control" type="number" min="0" value="0"></div>
                <div class="form-group"><label for="rwDtGun">ระบบปืน</label><input id="rwDtGun" class="form-control" type="number" min="0" value="0"></div>
            </div>
            <div class="dr-grid-4">
                <div class="form-group"><label for="rwDtPower">ไฟฟ้าดับ</label><input id="rwDtPower" class="form-control" type="number" min="0" value="0"></div>
                <div class="form-group"><label for="rwDtMotor">มอเตอร์</label><input id="rwDtMotor" class="form-control" type="number" min="0" value="0"></div>
                <div class="form-group"><label for="rwDtOther">อื่นๆ</label><input id="rwDtOther" class="form-control" type="number" min="0" value="0"></div>
                <div class="form-group"><label for="rwDtNote">หมายเหตุ</label><input id="rwDtNote" class="form-control" type="text" placeholder="ระบุสาเหตุเพิ่มเติม"></div>
            </div>
        </div>

        <div class="dr-card rework-form-card">
            <div class="rework-list-heading">
                <h2 class="dr-section-title">รายการ REWORK ที่เพิ่ม</h2>
                <div class="rework-list-toolbar">
                    <strong id="reworkTotalSummary">0 รายการ</strong>
                    <button type="button" class="rework-refresh-btn" onclick="refreshReworkHistory()">
                        <span class="rework-refresh-icon" aria-hidden="true">↻</span>
                        <span>รีเฟรชประวัติ</span>
                    </button>
                </div>
            </div>
            <div class="table-responsive"><table class="data-table"><thead><tr><th>วันที่</th><th>รุ่นงาน</th><th>ช่วงเวลา</th><th>สี</th><th>ยอดผลิต</th><th>ยอดเสีย</th><th>จัดการ</th></tr></thead><tbody id="reworkListBody"><tr><td colspan="7" class="empty-state">ยังไม่มีรายการ</td></tr></tbody></table></div>
        </div>`;
}

function initReworkForm() {
    const root = document.getElementById("reworkFormRoot");
    if (!root) return;
    if (!reworkFormInitialized) {
        root.innerHTML = reworkFormMarkup();
        const date = document.getElementById("rwDate");
        if (date) date.value = reworkToday();
        reworkFormInitialized = true;
        try {
            const saved = JSON.parse(localStorage.getItem(REWORK_DRAFT_KEY) || "[]");
            if (Array.isArray(saved)) reworkDraftRecords = saved;
        } catch (_) { reworkDraftRecords = []; }
        ["rwProductGroup", "rwPartGroup"].forEach(id => document.getElementById(id)?.addEventListener("change", () => {
            if (id === "rwProductGroup") { renderReworkPartGroups(); renderReworkColors(); } else renderReworkModels();
        }));
        renderReworkProductGroups();
    } else if (typeof window.renderReworkList === "function") {
        renderReworkList();
    }
}

function selectedReworkColor() {
    const select = document.getElementById("rwColor");
    const group = document.getElementById("rwProductGroup")?.value || "";
    const colors = reworkCatalog().groups[group]?.colors || [];
    return colors.find(color => String(color.value ?? color.code) === String(select?.value || "")) || {};
}

function addReworkRecord() {
    const model = document.getElementById("rwModel")?.value || "";
    if (!model) return showToast?.("กรุณาเลือกรุ่นงาน / รหัสก่อนเพิ่มรายการ", "error");
    const color = selectedReworkColor();
    const record = {
        productGroup: document.getElementById("rwProductGroup")?.value || "",
        partCategory: document.getElementById("rwPartGroup")?.value || "",
        model, color: color.value || document.getElementById("rwColor")?.value || "", colorCode: color.code || "",
        timeSlot: document.getElementById("rwTime")?.value || "", prodQty: reworkNum("rwProdQty"),
        rust: reworkNum("rwRust"), dent: reworkNum("rwDent"), colorDrop: reworkNum("rwColorDrop"),
        thinPaint: reworkNum("rwThinPaint"), thickPaint: reworkNum("rwThickPaint"), waterStain: reworkNum("rwWaterStain"),
        oil: reworkNum("rwOil"), dust: reworkNum("rwDust"), otherDefect: reworkNum("rwOtherDefect")
    };
    record.totalDefect = record.rust + record.dent + record.colorDrop + record.thinPaint + record.thickPaint + record.waterStain + record.oil + record.dust + record.otherDefect;
    if (record.prodQty <= 0 && record.totalDefect <= 0) return showToast?.("กรุณาระบุยอดผลิตหรือยอดเสียอย่างน้อยหนึ่งรายการ", "error");
    record.date = document.getElementById("rwDate")?.value || reworkToday();
    reworkDraftRecords.push(record);
    localStorage.setItem(REWORK_DRAFT_KEY, JSON.stringify(reworkDraftRecords));
    renderReworkList();
    ["rwProdQty", "rwRust", "rwDent", "rwColorDrop", "rwThinPaint", "rwThickPaint", "rwWaterStain", "rwOil", "rwDust", "rwOtherDefect"].forEach(id => { const el = document.getElementById(id); if (el) el.value = "0"; });
    showToast?.("เพิ่มรายการ REWORK แล้ว", "success");
}

function removeReworkRecord(index) {
    reworkDraftRecords.splice(index, 1);
    localStorage.setItem(REWORK_DRAFT_KEY, JSON.stringify(reworkDraftRecords));
    renderReworkList();
}

function renderReworkList() {
    const body = document.getElementById("reworkListBody");
    if (!body) return;
    const rows = reworkDraftRecords.length ? reworkDraftRecords : reworkHistoryRecords.slice(0, 20);
    const summary = document.getElementById("reworkTotalSummary");
    if (summary) summary.textContent = `${rows.length} รายการ`;
    if (!rows.length) { body.innerHTML = `<tr><td colspan="7" class="empty-state">ยังไม่มีรายการ</td></tr>`; return; }
    body.innerHTML = rows.map((row, index) => `<tr><td>${reworkEsc(row.date || "-")}</td><td>${reworkEsc(row.model || "-")}</td><td>${reworkEsc(row.timeSlot || "-")}</td><td>${reworkEsc(row.color || "ไม่ระบุ")}</td><td>${Number(row.prodQty) || 0}</td><td>${Number(row.totalDefect) || 0}</td><td>${reworkDraftRecords.length ? `<button type="button" class="btn-danger" onclick="removeReworkRecord(${index})">ลบ</button>` : "บันทึกแล้ว"}</td></tr>`).join("");
}

async function refreshReworkHistory() {
    const body = document.getElementById("reworkListBody");
    if (body && !reworkDraftRecords.length) body.innerHTML = `<tr><td colspan="7" class="empty-state">กำลังโหลดประวัติ REWORK...</td></tr>`;
    try {
        reworkHistoryRecords = await fetchReworkReportDataFromAPI();
        renderReworkList();
    } catch (error) {
        console.error("REWORK history load failed", error);
        if (body && !reworkDraftRecords.length) body.innerHTML = `<tr><td colspan="7" class="empty-state error-text">โหลดประวัติ REWORK ไม่สำเร็จ กรุณากดรีเฟรชอีกครั้ง</td></tr>`;
    }
}

async function submitReworkReport() {
    if (!reworkDraftRecords.length) addReworkRecord();
    if (!reworkDraftRecords.length) return;
    const records = reworkDraftRecords.map(record => ({ ...record }));
    const payload = {
        action: "submitReworkReport", submissionId: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: document.getElementById("rwDate")?.value || reworkToday(),
        shift: document.querySelector('input[name="reworkShift"]:checked')?.value || "Day",
        recorder: document.getElementById("rwRecorder")?.value?.trim() || "",
        checker: "", records,
        downtime: { burner: reworkNum("rwDtBurner"), wash: reworkNum("rwDtWash"), oven: reworkNum("rwDtOven"), gun: reworkNum("rwDtGun"), power: reworkNum("rwDtPower"), motor: reworkNum("rwDtMotor"), other: reworkNum("rwDtOther"), note: document.getElementById("rwDtNote")?.value || "" }
    };
    if (!payload.recorder) return showToast?.("กรุณาระบุชื่อผู้บันทึก", "error");
    const button = document.getElementById("reworkSubmitButton");
    if (button) { button.disabled = true; button.textContent = "กำลังบันทึก..."; }
    try {
        await sendReworkReportToAPI(payload);
        reworkDraftRecords = [];
        localStorage.removeItem(REWORK_DRAFT_KEY);
        await refreshReworkHistory();
        showToast?.("บันทึกข้อมูล REWORK สำเร็จ", "success");
    } catch (error) {
        console.error("REWORK submit failed", error);
        showToast?.("บันทึกข้อมูล REWORK ไม่สำเร็จ", "error");
    } finally {
        if (button) { button.disabled = false; button.textContent = "💾 บันทึกข้อมูล REWORK"; }
    }
}

window.initReworkForm = initReworkForm;
window.addReworkRecord = addReworkRecord;
window.removeReworkRecord = removeReworkRecord;
window.renderReworkList = renderReworkList;
window.refreshReworkHistory = refreshReworkHistory;
window.submitReworkReport = submitReworkReport;
