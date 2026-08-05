const PARAMETER_CHECKLIST_SOURCE_ITEMS = [
    { itemNo: 1, process: "แขวนชิ้นงาน", checkItem: "ความเร็วโซ่ลำเลียง", standard: "2-4 m/min" },
    { itemNo: 2, process: "แขวนชิ้นงาน", checkItem: "ตรวจสอบอุปกรณ์แขวน", standard: "อุปกรณ์ถูกต้อง" },
    { itemNo: 3, process: "แขวนชิ้นงาน", checkItem: "จุดแขวนไม่มีสี และตะขอไม่เสียรูป", standard: "ไม่มีสี / ไม่เสียรูป" },
    { itemNo: 4, process: "แขวนชิ้นงาน", checkItem: "โซ่ลำเลียงไม่ผุกร่อนและไม่มีน้ำมันหยด", standard: "ปกติ" },
    { itemNo: 5, process: "ล้างไขมันเบื้องต้น", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 6, process: "ล้างไขมันเบื้องต้น", checkItem: "ค่าความเป็นด่างอิสระ", standard: "15-25" },
    { itemNo: 7, process: "ล้างไขมัน", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 8, process: "ล้างไขมัน", checkItem: "ค่าความเป็นด่างอิสระ", standard: "15-25" },
    { itemNo: 9, process: "ล้างน้ำ 1", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 10, process: "ล้างน้ำ 1", checkItem: "ค่า pH", standard: "7-9" },
    { itemNo: 11, process: "ล้างน้ำ 2", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 12, process: "ล้างน้ำ 2", checkItem: "ค่า pH", standard: "6.5-7.5" },
    { itemNo: 13, process: "เคลือบเซรามิก", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 14, process: "เคลือบเซรามิก", checkItem: "ค่าความเป็นด่างอิสระ", standard: "0.6-1.2" },
    { itemNo: 15, process: "เคลือบเซรามิก", checkItem: "ความเข้มข้นของน้ำยา", standard: "4.8-5.2" },
    { itemNo: 16, process: "ล้างน้ำ 3", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 17, process: "ล้างน้ำ 3", checkItem: "ค่า pH", standard: "7-9" },
    { itemNo: 19, process: "ล้างน้ำ 4", checkItem: "แรงดันทางออกปั๊มหมุนเวียน", standard: "0.05-0.1" },
    { itemNo: 20, process: "ล้างน้ำ 4", checkItem: "ค่า pH", standard: "6-7.5" },
    { itemNo: 21, process: "ล้างน้ำ 4", checkItem: "ค่าการนำไฟฟ้า", standard: "< 150 us/cm" },
    { itemNo: 22, process: "อบแห้ง", checkItem: "อุณหภูมิ", standard: "120-140 °C" },
    { itemNo: 24, process: "อบแห้ง", checkItem: "ตรวจสอบการรั่วของแก๊ส", standard: "ไม่มีการรั่ว" },
    { itemNo: 25, process: "พ่นสีอัตโนมัติ", checkItem: "แรงดันไฟฟ้า", standard: "40-80 KV" },
    { itemNo: 26, process: "พ่นสีอัตโนมัติ", checkItem: "กระแสไฟฟ้า", standard: "40-60 mA" },
    { itemNo: 28, process: "พ่นสีอัตโนมัติ", checkItem: "แรงดันลม", standard: "2-4 M3/H" },
    { itemNo: 29, process: "พ่นสีอัตโนมัติ", checkItem: "ปริมาณการจ่ายผงสี", standard: "50-70" },
    { itemNo: 30, process: "พ่นสีอัตโนมัติ", checkItem: "ระยะห่างปืนพ่นกับชิ้นงาน", standard: "100-300 mm" },
    { itemNo: 31, process: "พ่นสีอัตโนมัติ", checkItem: "มุมระหว่างปืนพ่นกับชิ้นงาน", standard: "90°" },
    { itemNo: 32, process: "อบคิวริ่ง", checkItem: "อุณหภูมิ", standard: "185-195 °C" },
    { itemNo: 34, process: "อบคิวริ่ง", checkItem: "ตรวจสอบการรั่วของแก๊ส", standard: "ไม่มีการรั่ว" },
    { itemNo: 35, process: "อบคิวริ่ง", checkItem: "ตรวจวัดความหนาฟิล์มโดยหน่วยงานภายนอก", standard: "ทุก 2 สัปดาห์" }
];

// แยกรายการข้อ 5-21 ไปอยู่ในเมนู "วัดค่าน้ำ" และเริ่มเลขใหม่ที่ 1
// เพิ่มรายการข้อ 9 โดยใช้รายละเอียดเดียวกับรายการเดิมข้อ 16 แต่ให้กระบวนการเป็น "ล้างน้ำ 2"
// ส่วนเมนูเช็กพารามิเตอร์จะเหลือรายการก่อนข้อ 5 และหลังข้อ 21 แล้วเรียงเลขใหม่เช่นกัน
const WATER_PARAMETER_SOURCE_ITEMS = PARAMETER_CHECKLIST_SOURCE_ITEMS
    .filter(item => item.itemNo >= 5 && item.itemNo <= 21);
const WATER_PARAMETER_INSERT_ITEM = PARAMETER_CHECKLIST_SOURCE_ITEMS.find(item => item.itemNo === 21);
const WATER_PARAMETER_CHECKLIST_ITEMS = [
    ...WATER_PARAMETER_SOURCE_ITEMS.slice(0, 8),
    ...(WATER_PARAMETER_INSERT_ITEM ? [{ ...WATER_PARAMETER_INSERT_ITEM, process: "ล้างน้ำ 2" }] : []),
    ...WATER_PARAMETER_SOURCE_ITEMS.slice(8)
].map((item, index) => ({ ...item, itemNo: index + 1 }));
const PARAMETER_CHECKLIST_ITEMS = PARAMETER_CHECKLIST_SOURCE_ITEMS
    .filter(item => item.itemNo < 5 || item.itemNo > 21)
    .map((item, index) => ({ ...item, itemNo: index + 1 }));
let parameterChecklistMode = "full";

function getActiveParameterChecklistItems() {
    return parameterChecklistMode === "water" ? WATER_PARAMETER_CHECKLIST_ITEMS : PARAMETER_CHECKLIST_ITEMS;
}

function setParameterChecklistMode(mode) {
    parameterChecklistMode = mode === "water" ? "water" : "full";
    const page = document.getElementById("parameter-checklist-tab");
    if (page) page.classList.toggle("water-mode", parameterChecklistMode === "water");
    const timeGroup = document.getElementById("parameterChecklistTimeGroup");
    const timeInput = document.getElementById("parameterChecklistTime");
    const isWater = parameterChecklistMode === "water";
    if (timeGroup) timeGroup.style.display = isWater ? "" : "none";
    if (timeInput) timeInput.required = isWater;
}

function parameterChecklistTitle() {
    return parameterChecklistMode === "water" ? "วัดค่าน้ำ" : "รายการตรวจเช็กพารามิเตอร์";
}

let parameterChecklistHistory = [];
let waterParameterChecklistHistory = [];
let parameterChecklistRefreshInFlight = null;
let qcChecklistRefreshInFlight = null;

function parameterChecklistEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
}

function formatParameterChecklistTime(timeValue, timestampValue) {
    const raw = String(timeValue || timestampValue || "").trim();
    if (!raw) return "-";

    const match = raw.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (match) return `${String(match[1]).padStart(2, "0")}:${match[2]}`;

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
        return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
    }
    return "-";
}

function initParameterChecklist() {
    const page = document.getElementById("parameter-checklist-tab");
    if (page) page.classList.toggle("water-mode", parameterChecklistMode === "water");
    const dateInput = document.getElementById("parameterChecklistDate");
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split("T")[0];
    const timeGroup = document.getElementById("parameterChecklistTimeGroup");
    const timeInput = document.getElementById("parameterChecklistTime");
    const isWater = parameterChecklistMode === "water";
    if (timeGroup) timeGroup.style.display = isWater ? "" : "none";
    if (timeInput) {
        timeInput.required = isWater;
        if (!timeInput.value) {
            const now = new Date();
            timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        }
    }
    const title = parameterChecklistTitle();
    const pageTitle = document.querySelector("#parameter-checklist-tab .page-title");
    const listTitle = document.querySelector("#parameterChecklistItemsBody")?.closest(".dr-card")?.querySelector("h3");
    const saveButton = document.getElementById("submitParameterChecklistBtn");
    if (pageTitle) pageTitle.textContent = title;
    if (listTitle) listTitle.textContent = parameterChecklistMode === "water" ? "รายการวัดค่าน้ำ" : "รายการตรวจเช็กพารามิเตอร์";
    if (saveButton) saveButton.textContent = `บันทึก${title}`;
    renderParameterChecklistItems();
}

function renderParameterChecklistItems() {
    const body = document.getElementById("parameterChecklistItemsBody");
    if (!body) return;
    body.innerHTML = getActiveParameterChecklistItems().map((item, index) => {
        const displayItemNo = index + 1;
        return `
        <tr>
            <td style="text-align:center; font-weight:800; color:#38bdf8;">${displayItemNo}</td>
            <td>${parameterChecklistEscape(item.process)}</td>
            <td>${parameterChecklistEscape(item.checkItem)}</td>
            <td style="color:#a5f3fc; white-space:nowrap;">${parameterChecklistEscape(item.standard)}</td>
            <td><input class="form-control parameter-actual-input" id="parameterActual_${displayItemNo}" placeholder="ค่าที่ตรวจได้"></td>
            <td><select class="form-control parameter-status-input" id="parameterStatus_${displayItemNo}">
                <option value="OK" selected>ปกติ (OK)</option>
                <option value="NG">ผิดปกติ (NG)</option>
                <option value="N/A">ไม่เกี่ยวข้อง (N/A)</option>
            </select></td>
            <td><input class="form-control parameter-note-input" id="parameterNote_${displayItemNo}" placeholder="หมายเหตุ"></td>
        </tr>
    `;
    }).join("");
}

function collectParameterChecklistPayload() {
    const date = document.getElementById("parameterChecklistDate")?.value || "";
    const time = parameterChecklistMode === "water" ? (document.getElementById("parameterChecklistTime")?.value || "") : "";
    const operator = document.getElementById("parameterChecklistOperator")?.value.trim() || "";
    const teamLeader = document.getElementById("parameterChecklistLeader")?.value.trim() || "";
    return {
        action: "submitParameterChecklist",
        submissionId: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `parameter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date,
        time,
        operator,
        teamLeader,
        checklistType: parameterChecklistMode,
        records: getActiveParameterChecklistItems().map((item, index) => ({
            itemNo: index + 1,
            process: item.process,
            checkItem: item.checkItem,
            standard: item.standard,
            actualValue: document.getElementById(`parameterActual_${index + 1}`)?.value.trim() || "",
            status: document.getElementById(`parameterStatus_${index + 1}`)?.value || "OK",
            note: document.getElementById(`parameterNote_${index + 1}`)?.value.trim() || ""
        }))
    };
}

async function submitParameterChecklist() {
    const button = document.getElementById("submitParameterChecklistBtn");
    const payload = collectParameterChecklistPayload();
    const title = parameterChecklistTitle();
    if (!payload.date || !payload.operator) {
        showToast("กรุณาระบุวันที่และชื่อผู้ตรวจให้ครบถ้วน", "error");
        return;
    }
    if (button) {
        button.disabled = true;
        button.textContent = `กำลังบันทึก${title}...`;
    }
    try {
        await sendParameterChecklistToAPI(payload);
        showToast(`บันทึก${title}ลง Google Sheets เรียบร้อยแล้ว`, "success");
    } catch (error) {
        showToast(`บันทึก${title}ไม่สำเร็จ: ${error.message}`, "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = `บันทึก${title}`;
        }
    }
}

function groupParameterChecklistRows(rows) {
    const groups = new Map();
    rows.forEach(row => {
        const key = row.submissionId || `${row.date}|${row.operator}|${row.timestamp}`;
        if (!groups.has(key)) groups.set(key, { ...row, rows: [] });
        groups.get(key).rows.push(row);
    });
    return Array.from(groups.values()).sort((a, b) => String(b.timestamp || b.date).localeCompare(String(a.timestamp || a.date)));
}

function renderParameterChecklistHistory(bodyId = "parameterChecklistHistoryBody", rows = parameterChecklistHistory, emptyText = "ยังไม่มีประวัติการตรวจพารามิเตอร์") {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const groups = groupParameterChecklistRows(rows).slice(0, 10);
    if (!groups.length) {
        body.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:1.5rem;">${parameterChecklistEscape(emptyText)}</td></tr>`;
        return;
    }
    body.innerHTML = groups.map(group => {
        const ng = group.rows.filter(row => String(row.status).toUpperCase() === "NG").length;
        const ok = group.rows.filter(row => String(row.status).toUpperCase() === "OK").length;
        return `<tr>
            <td class="parameter-history-date">${parameterChecklistEscape(formatDailyReportDate(group.date, group.timestamp))}</td>
            <td class="parameter-history-time">${parameterChecklistEscape(formatParameterChecklistTime(group.time, group.timestamp))}</td>
            <td>${parameterChecklistEscape(group.operator || "-")}</td>
            <td>${parameterChecklistEscape(group.teamLeader || "-")}</td>
            <td style="text-align:center;">${group.rows.length}</td>
            <td style="color:#34d399; text-align:center;">${ok}</td>
            <td style="color:${ng ? "#fb7185" : "#94a3b8"}; text-align:center; font-weight:800;">${ng}</td>
        </tr>`;
    }).join("");
}

function renderQCChecklistHistories() {
    renderParameterChecklistHistory("qcParameterChecklistHistoryBody", parameterChecklistHistory, "ยังไม่มีประวัติการตรวจพารามิเตอร์");
    renderParameterChecklistHistory("qcWaterChecklistHistoryBody", waterParameterChecklistHistory, "ยังไม่มีประวัติการตรวจน้ำ");
}

function renderQCChecklistHistoryMessage(bodyId, message, isError = false) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    body.innerHTML = `<tr><td colspan="7" style="text-align:center; color:${isError ? "#fb7185" : "#94a3b8"}; padding:1.5rem;">${parameterChecklistEscape(message)}</td></tr>`;
}

function setQCChecklistRefreshButtonLoading(isLoading) {
    const button = document.getElementById("qcHistoryRefreshBtn");
    if (!button) return;
    button.disabled = isLoading;
    button.style.opacity = isLoading ? "0.7" : "1";
    button.textContent = isLoading ? "กำลังโหลดข้อมูล..." : "รีเฟรชข้อมูล";
}

async function refreshParameterChecklist() {
    if (parameterChecklistRefreshInFlight) return parameterChecklistRefreshInFlight;
    parameterChecklistRefreshInFlight = (async () => {
        try {
            if (typeof fetchParameterChecklistDataFromAPI === "function") {
                const records = await fetchParameterChecklistDataFromAPI("", parameterChecklistMode === "water" ? "water" : "");
                parameterChecklistHistory = Array.isArray(records)
                    ? records.filter(record => parameterChecklistMode === "water"
                        ? String(record.checklistType || "") === "water"
                        : !record.checklistType || String(record.checklistType) === "full")
                    : [];
                renderParameterChecklistHistory();
            }
        } finally {
            parameterChecklistRefreshInFlight = null;
        }
    })();
    return parameterChecklistRefreshInFlight;
}

async function refreshQCChecklistHistory(showFeedback = false) {
    if (qcChecklistRefreshInFlight) {
        if (showFeedback && typeof showToast === "function") showToast("กำลังโหลดข้อมูลอยู่ กรุณารอสักครู่", "info");
        return qcChecklistRefreshInFlight;
    }
    qcChecklistRefreshInFlight = (async () => {
        const failures = [];
        const retryOptions = { attempts: 2, timeoutMs: 9000 };
        setQCChecklistRefreshButtonLoading(true);
        renderQCChecklistHistoryMessage("qcParameterChecklistHistoryBody", "กำลังโหลดประวัติการตรวจพารามิเตอร์...");
        renderQCChecklistHistoryMessage("qcWaterChecklistHistoryBody", "กำลังโหลดประวัติการตรวจน้ำ...");
        renderQCChecklistHistoryMessage("qcEquipmentChecklistHistoryBody", "กำลังโหลดประวัติเช็กลิสอุปกรณ์...");
        try {
            if (typeof fetchParameterChecklistDataFromAPI === "function") {
                // Load the two populated history sheets first. The parameter
                // sheet may be empty, and must never block the other tables.
                try {
                    const waterRecords = await fetchParameterChecklistDataFromAPI("", "water", { throwOnError: true, retryOptions });
                    waterParameterChecklistHistory = Array.isArray(waterRecords)
                        ? waterRecords.filter(record => String(record.checklistType || "water") === "water")
                        : [];
                    renderParameterChecklistHistory("qcWaterChecklistHistoryBody", waterParameterChecklistHistory, "ยังไม่มีประวัติการตรวจน้ำ");
                } catch (error) {
                    failures.push("ตรวจน้ำ");
                    renderQCChecklistHistoryMessage("qcWaterChecklistHistoryBody", "โหลดประวัติการตรวจน้ำไม่สำเร็จ กรุณากดรีเฟรชอีกครั้ง", true);
                }

                if (typeof fetchEquipmentChecklistDataFromAPI === "function") {
                    try {
                        equipmentChecklistHistory = await fetchEquipmentChecklistDataFromAPI("", { throwOnError: true, retryOptions });
                        renderEquipmentChecklistHistory();
                    } catch (error) {
                        failures.push("เช็กอุปกรณ์");
                        renderQCChecklistHistoryMessage("qcEquipmentChecklistHistoryBody", "โหลดประวัติเช็กลิสอุปกรณ์ไม่สำเร็จ กรุณากดรีเฟรชอีกครั้ง", true);
                    }
                }

                try {
                    const parameterRecords = await fetchParameterChecklistDataFromAPI("", "full", { throwOnError: true, retryOptions });
                    parameterChecklistHistory = Array.isArray(parameterRecords)
                        ? parameterRecords.filter(record => !record.checklistType || String(record.checklistType) === "full")
                        : [];
                    renderParameterChecklistHistory("qcParameterChecklistHistoryBody", parameterChecklistHistory, "ยังไม่มีประวัติการตรวจพารามิเตอร์");
                } catch (error) {
                    failures.push("พารามิเตอร์");
                    renderQCChecklistHistoryMessage("qcParameterChecklistHistoryBody", "โหลดประวัติการตรวจพารามิเตอร์ไม่สำเร็จ กรุณากดรีเฟรชอีกครั้ง", true);
                }

            }

            if (showFeedback && typeof showToast === "function") {
                if (failures.length) {
                    showToast(`โหลดข้อมูลไม่สำเร็จบางส่วน: ${failures.join(", ")}`, "error");
                } else {
                    showToast("รีเฟรชข้อมูล QC เรียบร้อยแล้ว", "success");
                }
            }
        } finally {
            setQCChecklistRefreshButtonLoading(false);
            qcChecklistRefreshInFlight = null;
        }
    })();
    return qcChecklistRefreshInFlight;
}
