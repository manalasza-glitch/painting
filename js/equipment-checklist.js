const EQUIPMENT_CHECKLIST_ITEMS = [
    { itemNo: 1, image: "assets/equipment-checklist/image8.webp", checkItem: "มีสิ่งสกปรกลอยอยู่บนผิวของเหลวเป็นบริเวณกว้างหรือไม่", method: "ตรวจด้วยสายตา", standard: "ผิวของเหลวสะอาด ไม่มีสิ่งสกปรก" },
    { itemNo: 2, image: "assets/equipment-checklist/image1.webp", checkItem: "การเปิดเครื่องเป็นปกติหรือไม่", method: "ตรวจด้วยสายตา", standard: "มีน้ำไหลออกจากช่องระบายน้ำ" },
    { itemNo: 3, image: "assets/equipment-checklist/image2.webp", checkItem: "มาตรวัดแรงดันทำงานปกติหรือไม่", method: "ตรวจด้วยสายตา", standard: "ค่าแรงดันอยู่ในช่วงสีน้ำเงิน" },
    { itemNo: 4, image: "assets/equipment-checklist/image3.webp", checkItem: "วาล์วน้ำเข้าหมายเลข 5, 6, 9 และ 10 เปิดอยู่หรือไม่", method: "ตรวจด้วยสายตา", standard: "วาล์วน้ำเข้าอยู่ในสถานะเปิดครึ่งหนึ่ง" },
    { itemNo: 5, image: "assets/equipment-checklist/image4.webp", checkItem: "ช่องน้ำล้นของถังหมายเลข 5, 6, 9 และ 10 มีน้ำล้นออกมาหรือไม่", method: "ตรวจด้วยสายตา", standard: "มีน้ำและฟองล้นออกมา" },
    { itemNo: 6, image: "assets/equipment-checklist/image5.webp", checkItem: "ตรวจสอบว่าระดับน้ำท่วมถึงหัวปั๊มหรือไม่", method: "ตรวจด้วยสายตา", standard: "ระดับน้ำท่วมหัวปั๊ม" },
    { itemNo: 7, image: "assets/equipment-checklist/image6.webp", checkItem: "มอเตอร์มีเสียงผิดปกติหรือไม่", method: "ตรวจด้วยสายตาและการฟัง", standard: "มอเตอร์ทำงานปกติ ไม่มีเสียงผิดปกติ" },
    { itemNo: 8, image: "assets/equipment-checklist/image7.webp", checkItem: "พื้นผิวอุปกรณ์สะอาดและเป็นระเบียบหรือไม่", method: "ตรวจด้วยสายตา", standard: "อุปกรณ์ปราศจากฝุ่นและคราบน้ำมัน" },
    { itemNo: 9, image: "assets/equipment-checklist/image9.webp", checkItem: "อุปกรณ์บำบัดน้ำ RO ทำงานเป็นปกติหรือไม่", method: "ตรวจด้วยสายตา", standard: "สวิตช์การทำงานทั้งหมดบนหน้าจอแสดงผลเป็นสีเขียว" }
];

let equipmentChecklistHistory = [];
let equipmentChecklistRefreshInFlight = null;

function equipmentChecklistEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
}

function initEquipmentChecklist() {
    const dateInput = document.getElementById("equipmentChecklistDate");
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split("T")[0];
    renderEquipmentChecklistItems();
    refreshEquipmentChecklist();
}

function renderEquipmentChecklistItems() {
    const body = document.getElementById("equipmentChecklistItemsBody");
    if (!body) return;
    body.innerHTML = EQUIPMENT_CHECKLIST_ITEMS.map(item => `
        <article class="equipment-check-card">
            <div class="equipment-check-image-wrap">
                <img src="${item.image}" alt="รูปประกอบรายการที่ ${item.itemNo}" loading="lazy" onerror="this.closest('.equipment-check-image-wrap').classList.add('image-missing');">
                <span class="equipment-check-number">${item.itemNo}</span>
            </div>
            <div class="equipment-check-content">
                <div class="equipment-check-label">รายการที่ ${item.itemNo}</div>
                <h3>${equipmentChecklistEscape(item.checkItem)}</h3>
                <div class="equipment-check-meta"><span>วิธีตรวจ</span>${equipmentChecklistEscape(item.method)}</div>
                <div class="equipment-check-meta"><span>มาตรฐาน</span>${equipmentChecklistEscape(item.standard)}</div>
                <div class="equipment-check-inputs">
                    <label>ผลตรวจ
                        <select class="form-control" id="equipmentStatus_${item.itemNo}">
                            <option value="OK" selected>ปกติ (OK)</option>
                            <option value="NG">ผิดปกติ (NG)</option>
                            <option value="N/A">ไม่เกี่ยวข้อง (N/A)</option>
                        </select>
                    </label>
                    <label>หมายเหตุ
                        <input class="form-control" id="equipmentNote_${item.itemNo}" placeholder="หมายเหตุเพิ่มเติม">
                    </label>
                </div>
            </div>
        </article>
    `).join("");
}

function collectEquipmentChecklistPayload() {
    return {
        action: "submitEquipmentChecklist",
        submissionId: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `equipment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: document.getElementById("equipmentChecklistDate")?.value || "",
        operator: document.getElementById("equipmentChecklistOperator")?.value.trim() || "",
        teamLeader: document.getElementById("equipmentChecklistLeader")?.value.trim() || "",
        records: EQUIPMENT_CHECKLIST_ITEMS.map(item => ({
            itemNo: item.itemNo,
            checkItem: item.checkItem,
            method: item.method,
            standard: item.standard,
            imageUrl: new URL(item.image, window.location.href).href,
            status: document.getElementById(`equipmentStatus_${item.itemNo}`)?.value || "OK",
            note: document.getElementById(`equipmentNote_${item.itemNo}`)?.value.trim() || ""
        }))
    };
}

async function submitEquipmentChecklist() {
    const button = document.getElementById("submitEquipmentChecklistBtn");
    const payload = collectEquipmentChecklistPayload();
    if (!payload.date || !payload.operator) {
        showToast("กรุณาระบุวันที่และชื่อผู้ตรวจให้ครบถ้วน", "error");
        return;
    }
    if (button) {
        button.disabled = true;
        button.textContent = "กำลังบันทึกเช็กลิสอุปกรณ์...";
    }
    try {
        await sendEquipmentChecklistToAPI(payload);
        showToast("บันทึกเช็กลิสอุปกรณ์ลง Google Sheets เรียบร้อยแล้ว", "success");
        await refreshEquipmentChecklist();
    } catch (error) {
        showToast(`บันทึกเช็กลิสอุปกรณ์ไม่สำเร็จ: ${error.message}`, "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "บันทึกเช็กลิสอุปกรณ์";
        }
    }
}

function groupEquipmentChecklistRows(rows) {
    const groups = new Map();
    rows.forEach(row => {
        const key = row.submissionId || `${row.date}|${row.operator}|${row.timestamp}`;
        if (!groups.has(key)) groups.set(key, { ...row, rows: [] });
        groups.get(key).rows.push(row);
    });
    return Array.from(groups.values()).sort((a, b) => String(b.timestamp || b.date).localeCompare(String(a.timestamp || a.date)));
}

function renderEquipmentChecklistHistory() {
    const body = document.getElementById("equipmentChecklistHistoryBody");
    if (!body) return;
    const groups = groupEquipmentChecklistRows(equipmentChecklistHistory).slice(0, 10);
    if (!groups.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:1.5rem;">ยังไม่มีประวัติเช็กลิสอุปกรณ์</td></tr>`;
        return;
    }
    body.innerHTML = groups.map(group => {
        const ng = group.rows.filter(row => String(row.status).toUpperCase() === "NG").length;
        const ok = group.rows.filter(row => String(row.status).toUpperCase() === "OK").length;
        return `<tr>
            <td>${equipmentChecklistEscape(formatDailyReportDate(group.date, group.timestamp))}</td>
            <td>${equipmentChecklistEscape(group.operator || "-")}</td>
            <td>${equipmentChecklistEscape(group.teamLeader || "-")}</td>
            <td style="text-align:center;">${group.rows.length}</td>
            <td style="color:#34d399; text-align:center;">${ok}</td>
            <td style="color:${ng ? "#fb7185" : "#94a3b8"}; text-align:center; font-weight:800;">${ng}</td>
        </tr>`;
    }).join("");
}

async function refreshEquipmentChecklist() {
    if (equipmentChecklistRefreshInFlight) return equipmentChecklistRefreshInFlight;
    equipmentChecklistRefreshInFlight = (async () => {
        try {
            if (typeof fetchEquipmentChecklistDataFromAPI === "function") {
                equipmentChecklistHistory = await fetchEquipmentChecklistDataFromAPI();
                renderEquipmentChecklistHistory();
            }
        } finally {
            equipmentChecklistRefreshInFlight = null;
        }
    })();
    return equipmentChecklistRefreshInFlight;
}
