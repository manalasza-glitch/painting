let PAINTING_MODEL_GROUPS = {
    "Gland Plate": [
        "[75170148] Gland Plate LC600",
        "[BRU53717] Gland Plate NLC600"
    ],
    "Box & U-Box": [
        "Box NMS 4/6 W. 240 mm.",
        "BOX 300x400x200",
        "BOX 400x500x200",
        "U-BOX STANDARD",
        "[BRU53714] U Box 450 mm.",
        "[75170145] U Box LC600 mm.",
        "[BRU53715] U Box NLC600 mm."
    ],
    "Door (บานประตู)": [
        "Door NLC 450 mm.",
        "DOOR PANEL NLC-01",
        "DOOR PANEL NMS-01",
        "Flat Door LC 600",
        "[BRU53715] Door NLC 600 mm."
    ],
    "Cover NMS": [
        "Cover NMS 6 w. 245 mm.",
        "[BRU30890] Cover NMS 4 w. 245 mm.",
        "[BRU30892] Cover NMS 8 w. 325 mm."
    ],
    "Cover NLC (EZ / LUG)": [
        "Cover NLC EZ100 600 mm.",
        "[BRU53718] Cover NLC EZ100 450 mm. 12 w.",
        "[BRU53738] Cover NLC LUG250 450 mm. 12 w."
    ]
};

async function loadPartModelsList() {
    // 1. Load from local cache
    const cached = localStorage.getItem("PAINTING_PART_MODELS_CACHE");
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                PAINTING_MODEL_GROUPS = parsed;
            }
        } catch (e) {}
    }

    renderPartGroupDropdownUI();
    renderModelDropdownOptions();

    // 2. Fetch fresh mapping from Cloud Google Sheet (PartModel sheet tab)
    if (typeof fetchPartModelsFromAPI === 'function') {
        const cloudGroups = await fetchPartModelsFromAPI();
        if (cloudGroups && typeof cloudGroups === 'object' && Object.keys(cloudGroups).length > 0) {
            PAINTING_MODEL_GROUPS = cloudGroups;
            renderPartGroupDropdownUI();
            renderModelDropdownOptions();
        }
    }
}

function renderPartGroupDropdownUI() {
    const groupSelect = document.getElementById('drPartGroup');
    if (!groupSelect) return;

    const currentVal = groupSelect.value;
    let html = '<option value="">-- ทุกกลุ่มงาน (All Parts) --</option>';

    Object.keys(PAINTING_MODEL_GROUPS).forEach(gName => {
        html += `<option value="${gName}">${gName}</option>`;
    });

    groupSelect.innerHTML = html;
    if (currentVal && PAINTING_MODEL_GROUPS[currentVal]) {
        groupSelect.value = currentVal;
    }
}

function renderModelDropdownOptions(groupFilter = "") {
    const modelSelects = document.querySelectorAll('.model-select');
    let html = '<option value="">-- เลือกรุ่นงาน --</option>';

    if (groupFilter && PAINTING_MODEL_GROUPS[groupFilter]) {
        PAINTING_MODEL_GROUPS[groupFilter].forEach(m => {
            html += `<option value="${m}">${m} (${groupFilter})</option>`;
        });
    } else {
        for (const [groupName, models] of Object.entries(PAINTING_MODEL_GROUPS)) {
            html += `<optgroup label="📦 ${groupName}">`;
            models.forEach(m => {
                html += `<option value="${m}">${m} (${groupName})</option>`;
            });
            html += `</optgroup>`;
        }
    }

    modelSelects.forEach(sel => {
        sel.innerHTML = html;
    });
}

function filterModelDropdown() {
    const groupSelect = document.getElementById('drPartGroup');
    const selectedGroup = groupSelect ? groupSelect.value : "";
    renderModelDropdownOptions(selectedGroup);
}

const PAINTING_TIMESLOTS = [
    "08.00 - 09.00",
    "09.00 - 10.00",
    "10.10 - 11.00",
    "11.00 - 12.00",
    "13.00 - 14.00",
    "14.00 - 15.00",
    "15.10 - 16.00",
    "16.00 - 17.00",
    "17.30 - 18.00",
    "18.00 - 19.00",
    "19.00 - 20.00",
    "20.00 - 21.00"
];

function getCurrentTimeSlot() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let closestSlot = "";
    let minDiff = Infinity;

    for (let slot of PAINTING_TIMESLOTS) {
        const parts = slot.split("-");
        if (parts.length === 2) {
            const startStr = parts[0].trim();
            const endStr = parts[1].trim();
            
            const startParts = startStr.split(".");
            const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            
            const endParts = endStr.split(".");
            const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            // If strictly inside the slot, return it immediately
            if (currentMins >= startMins && currentMins <= endMins) {
                return slot;
            }

            // Otherwise find distance to the closest edge (start or end)
            const diffStart = Math.abs(currentMins - startMins);
            const diffEnd = Math.abs(currentMins - endMins);
            const minEdgeDiff = Math.min(diffStart, diffEnd);

            if (minEdgeDiff < minDiff) {
                minDiff = minEdgeDiff;
                closestSlot = slot;
            }
        }
    }
    return closestSlot;
}

let currentTargetStaffType = "recorder";

let PAINTING_RECORDERS_LIST = [
    "สมชาย ใจดี",
    "วิชัย มีสุข",
    "สมศักดิ์ ขยันงาน"
];

async function loadStaffList() {
    // 1. Load from local cache for instant UI rendering
    const cachedRecorders = localStorage.getItem("PAINTING_RECORDERS_CACHE");
    if (cachedRecorders) {
        try {
            const list = JSON.parse(cachedRecorders);
            if (Array.isArray(list) && list.length > 0) {
                PAINTING_RECORDERS_LIST = list;
            }
        } catch (e) {}
    }

    // 2. Fetch fresh list from Cloud (Google Sheet Recorders tab)
    if (typeof fetchRecordersFromAPI === 'function') {
        const cloudRecorders = await fetchRecordersFromAPI();
        if (cloudRecorders && cloudRecorders.length > 0) {
            PAINTING_RECORDERS_LIST = cloudRecorders;
            saveStaffList();
            renderStaffDropdownsUI();
        }
    }
}

function saveStaffList() {
    localStorage.setItem("PAINTING_RECORDERS_CACHE", JSON.stringify(PAINTING_RECORDERS_LIST));
}

function renderStaffDropdownsUI() {
    const recorderSelect = document.getElementById('recorderName');
    const currentRecorder = recorderSelect ? recorderSelect.value : "";

    if (recorderSelect) {
        let recorderHtml = '<option value="">-- เลือกผู้บันทึก --</option>';
        PAINTING_RECORDERS_LIST.forEach(name => {
            recorderHtml += `<option value="${name}">${name}</option>`;
        });
        recorderHtml += `<option value="__ADD_NEW__">➕ + เพิ่มรายชื่อผู้บันทึกใหม่...</option>`;
        recorderSelect.innerHTML = recorderHtml;
        if (currentRecorder && PAINTING_RECORDERS_LIST.includes(currentRecorder)) {
            recorderSelect.value = currentRecorder;
        }
    }
}

function renderStaffDropdowns() {
    loadStaffList().then(() => {
        renderStaffDropdownsUI();
    });
    renderStaffDropdownsUI();
}

function handleStaffSelectChange(selectEl, targetType = "recorder") {
    if (selectEl && selectEl.value === "__ADD_NEW__") {
        selectEl.value = "";
        openAddStaffModal(targetType);
    }
}

function openAddStaffModal(targetType = "recorder") {
    currentTargetStaffType = "recorder";
    const modal = document.getElementById('addStaffModal');
    const modalTitle = document.getElementById('addStaffModalTitle');

    if (modalTitle) {
        modalTitle.innerText = "👥 จัดการรายชื่อ \"ผู้บันทึก\"";
    }

    if (modal) {
        modal.style.display = "flex";
        modal.classList.add('active');
        const input = document.getElementById('newStaffInput');
        if (input) {
            input.value = "";
            input.placeholder = "ระบุ ชื่อผู้บันทึก";
            setTimeout(() => input.focus(), 200);
        }
        renderStaffListInModal();
    } else {
        const newName = prompt("กรอกชื่อ - นามสกุล (ผู้บันทึก):");
        if (newName && newName.trim()) {
            if (!PAINTING_RECORDERS_LIST.includes(newName.trim())) {
                PAINTING_RECORDERS_LIST.push(newName.trim());
                saveStaffList();
                renderStaffDropdownsUI();
                if (typeof addRecorderToAPI === 'function') {
                    addRecorderToAPI(newName.trim());
                }
            }
            const sel = document.getElementById('recorderName');
            if (sel) sel.value = newName.trim();
        }
    }
}

function closeAddStaffModal() {
    const modal = document.getElementById('addStaffModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderStaffListInModal() {
    const container = document.getElementById('staffListContainer');
    if (!container) return;

    if (PAINTING_RECORDERS_LIST.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 1rem; font-size: 0.85rem;">ยังไม่มีรายชื่อ</div>`;
        return;
    }

    container.innerHTML = PAINTING_RECORDERS_LIST.map((name, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;">
            <span style="font-weight: 600; color: #334155;">👤 ${name}</span>
            <button type="button" onclick="deleteStaffName(${index})" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; font-weight: 700; cursor: pointer;">🗑️ ลบ</button>
        </div>
    `).join('');
}

function saveNewStaff() {
    const input = document.getElementById('newStaffInput');
    if (!input) return;

    const newName = input.value.trim();
    if (!newName) {
        showToast("กรุณาระบุชื่อผู้บันทึก", "error");
        return;
    }

    if (PAINTING_RECORDERS_LIST.includes(newName)) {
        showToast("รายชื่อนี้มีอยู่ในรายการแล้ว", "warning");
        return;
    }

    PAINTING_RECORDERS_LIST.push(newName);
    saveStaffList();
    renderStaffDropdownsUI();
    renderStaffListInModal();

    // Sync new recorder to Cloud Google Sheet
    if (typeof addRecorderToAPI === 'function') {
        addRecorderToAPI(newName);
    }

    const recorderSelect = document.getElementById('recorderName');
    if (recorderSelect) recorderSelect.value = newName;

    input.value = "";
    showToast(`เพิ่มรายชื่อ "${newName}" เรียบร้อยแล้ว`, "success");
}

function deleteStaffName(index) {
    if (index >= 0 && index < PAINTING_RECORDERS_LIST.length) {
        const removedName = PAINTING_RECORDERS_LIST[index];
        PAINTING_RECORDERS_LIST.splice(index, 1);
        saveStaffList();
        renderStaffDropdownsUI();
        renderStaffListInModal();

        // Sync deletion to Cloud Google Sheet
        if (typeof deleteRecorderFromAPI === 'function') {
            deleteRecorderFromAPI(removedName);
        }

        showToast(`ลบรายชื่อ "${removedName}" แล้ว`, "info");
    }
}

let dailyReportRecords = [];

function initDailyReportForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;

    // Populate Recorder & Checker Staff Dropdowns
    renderStaffDropdowns();

    // Populate Part Category & Model Dropdowns from Cloud (PartModel sheet tab)
    loadPartModelsList();

    // Populate Time Dropdowns
    const timeSelects = document.querySelectorAll('.time-select');
    let timeHtml = '<option value="">-- เลือกช่วงเวลา --</option>';
    PAINTING_TIMESLOTS.forEach(t => {
        timeHtml += `<option value="${t}">${t}</option>`;
    });
    timeSelects.forEach(sel => {
        sel.innerHTML = timeHtml;
        const currentSlot = getCurrentTimeSlot();
        if (currentSlot) {
            sel.value = currentSlot;
        }
    });

    // Load any draft records from localStorage if present
    const draft = localStorage.getItem("PAINTING_DAILY_REPORT_DRAFT");
    if (draft) {
        try {
            dailyReportRecords = JSON.parse(draft) || [];
            renderDailyReportList();
        } catch (e) {
            dailyReportRecords = [];
        }
    }
}

function addDailyReportRecord({ silent = false } = {}) {
    const model = document.getElementById('drModel').value;
    const timeSlot = document.getElementById('drTime').value;
    const prodQty = Number(document.getElementById('drProdQty').value) || 0;
    
    // Defects
    const dent = Number(document.getElementById('drDent').value) || 0;
    const colorDrop = Number(document.getElementById('drColorDrop').value) || 0;
    const thinPaint = Number(document.getElementById('drThinPaint').value) || 0;
    const thickPaint = Number(document.getElementById('drThickPaint').value) || 0;
    const waterStain = Number(document.getElementById('drWaterStain').value) || 0;
    const otherDefect = Number(document.getElementById('drOtherDefect').value) || 0;

    if (!model || !timeSlot) {
        showToast("กรุณาเลือกรุ่นงานและช่วงเวลา", "error");
        return false;
    }

    if (prodQty === 0 && (dent+colorDrop+thinPaint+thickPaint+waterStain+otherDefect) === 0) {
        showToast("กรุณากรอกยอดผลิตหรือยอดของเสียอย่างน้อย 1 ชิ้น", "error");
        return false;
    }

    const totalDefect = dent + colorDrop + thinPaint + thickPaint + waterStain + otherDefect;

    dailyReportRecords.push({
        id: Date.now().toString(),
        model,
        timeSlot,
        prodQty,
        dent,
        colorDrop,
        thinPaint,
        thickPaint,
        waterStain,
        otherDefect,
        totalDefect
    });

    // Save draft to localStorage so refresh doesn't lose items
    localStorage.setItem("PAINTING_DAILY_REPORT_DRAFT", JSON.stringify(dailyReportRecords));

    renderDailyReportList();
    
    // Clear inputs for next entry, but keep current time slot auto-selected
    const currentSlot = getCurrentTimeSlot();
    document.getElementById('drTime').value = currentSlot || "";
    document.getElementById('drProdQty').value = "";
    document.getElementById('drDent').value = "";
    document.getElementById('drColorDrop').value = "";
    document.getElementById('drThinPaint').value = "";
    document.getElementById('drThickPaint').value = "";
    document.getElementById('drWaterStain').value = "";
    document.getElementById('drOtherDefect').value = "";
    
    if (!silent) {
        showToast("เพิ่มรายการสำเร็จ", "success");
    }
    return true;
}

function removeDailyReportRecord(index) {
    dailyReportRecords.splice(index, 1);
    localStorage.setItem("PAINTING_DAILY_REPORT_DRAFT", JSON.stringify(dailyReportRecords));
    renderDailyReportList();
}

function renderDailyReportList() {
    const tbody = document.getElementById('dailyReportListBody');
    if (!tbody) return;

    if (dailyReportRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 1.5rem;">ยังไม่มีรายการที่เพิ่ม</td></tr>`;
        return;
    }

    tbody.innerHTML = dailyReportRecords.map((r, i) => `
        <tr>
            <td style="font-size: 0.85rem; font-weight: 600;">${r.model}</td>
            <td><span class="badge" style="background:#e2e8f0; color:#475569;">${r.timeSlot}</span></td>
            <td style="font-weight: bold; color: #10b981;">${r.prodQty}</td>
            <td><span class="badge-defect ${r.totalDefect > 0 ? 'badge-has-defect' : 'badge-zero'}">${r.totalDefect}</span></td>
            <td style="text-align: center;">
                <button type="button" class="btn-action-delete" onclick="removeDailyReportRecord(${i})" style="padding: 4px 8px; font-size: 0.8rem;">🗑️ ลบ</button>
            </td>
        </tr>
    `).join('');
}

async function submitDailyReport() {
    // If table is empty, check if form fields are filled and auto-add to table first
    if (dailyReportRecords.length === 0) {
        const model = document.getElementById('drModel') ? document.getElementById('drModel').value : "";
        const prodQty = Number(document.getElementById('drProdQty').value) || 0;
        const dent = Number(document.getElementById('drDent').value) || 0;
        const colorDrop = Number(document.getElementById('drColorDrop').value) || 0;
        const thinPaint = Number(document.getElementById('drThinPaint').value) || 0;
        const thickPaint = Number(document.getElementById('drThickPaint').value) || 0;
        const waterStain = Number(document.getElementById('drWaterStain').value) || 0;
        const otherDefect = Number(document.getElementById('drOtherDefect').value) || 0;
        const totalDefect = dent + colorDrop + thinPaint + thickPaint + waterStain + otherDefect;

        if (model && (prodQty > 0 || totalDefect > 0)) {
            addDailyReportRecord({ silent: true });
        }
    }

    if (dailyReportRecords.length === 0) {
        showToast("กรุณาเลือกรุ่นงาน ช่วงเวลา และกรอกยอดผลิตหรือของเสียก่อนบันทึก", "error");
        return;
    }

    const date = document.getElementById('reportDate').value;
    const shiftEl = document.querySelector('input[name="shift"]:checked');
    const shift = shiftEl ? shiftEl.value : "Day";
    const recorder = document.getElementById('recorderName') ? document.getElementById('recorderName').value : "";
    const checker = "";

    if (!date || !recorder) {
        showToast("กรุณากรอกวันที่และเลือกชื่อผู้บันทึกในส่วนที่ 1 ให้ครบถ้วน", "error");
        return;
    }

    const downtime = {
        burner: Number(document.getElementById('dtBurner').value) || 0,
        wash: Number(document.getElementById('dtWash').value) || 0,
        oven: Number(document.getElementById('dtOven').value) || 0,
        gun: Number(document.getElementById('dtGun').value) || 0,
        power: Number(document.getElementById('dtPower').value) || 0,
        motor: Number(document.getElementById('dtMotor').value) || 0,
        other: Number(document.getElementById('dtOther').value) || 0,
        note: document.getElementById('dtNote').value || ""
    };

    const payload = {
        action: "submitDailyReport",
        date: date,
        shift: shift,
        recorder: recorder,
        checker: checker,
        records: dailyReportRecords,
        downtime: downtime
    };

    const submitBtn = document.getElementById('submitDailyBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `กำลังส่งข้อมูลไปยัง Google Sheets...`;

    try {
        // Send to Cloud API
        await sendDailyReportToAPI(payload);
        
        // Update local cache so Dashboard updates immediately
        const cached = localStorage.getItem("PAINTING_OUTPUTDIARY_CACHE");
        let list = [];
        if (cached) {
            try { list = JSON.parse(cached) || []; } catch(e){}
        }
        
        dailyReportRecords.forEach(r => {
            list.push({
                timestamp: `${date} 09:00`,
                date: date,
                shift: shift,
                recorder: recorder,
                checker: checker,
                model: r.model,
                timeSlot: r.timeSlot,
                prodQty: r.prodQty,
                dent: r.dent,
                colorDrop: r.colorDrop,
                thinPaint: r.thinPaint,
                thickPaint: r.thickPaint,
                waterStain: r.waterStain,
                otherDefect: r.otherDefect,
                totalDefect: r.totalDefect
            });
        });
        localStorage.setItem("PAINTING_OUTPUTDIARY_CACHE", JSON.stringify(list));
        localStorage.setItem("PAINTING_OUTPUTDIARY_INIT", "true");

        showToast("บันทึกข้อมูลลง Google Sheets เรียบร้อยแล้ว!", "success");
        
        // Reset Form & Clear Draft
        dailyReportRecords = [];
        localStorage.removeItem("PAINTING_DAILY_REPORT_DRAFT");
        renderDailyReportList();
        document.getElementById('dtBurner').value = "";
        document.getElementById('dtWash').value = "";
        document.getElementById('dtOven').value = "";
        document.getElementById('dtGun').value = "";
        document.getElementById('dtPower').value = "";
        document.getElementById('dtMotor').value = "";
        document.getElementById('dtOther').value = "";
        document.getElementById('dtNote').value = "";
        document.getElementById('drProdQty').value = "";
        
        if (typeof renderDailyReportCharts === 'function') {
            renderDailyReportCharts();
        }
    } catch(err) {
        showToast("เกิดข้อผิดพลาดในการบันทึก: " + err.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `💾 บันทึกข้อมูลทันที`;
    }
}

async function generate1MonthMockData() {
    if (!confirm("คุณต้องการสร้างและจำลองกรอกข้อมูลการผลิตรายวันย้อนหลัง 1 เดือน (1-31 กรกฎาคม 2026) ใช่หรือไม่?")) {
        return;
    }

    const sample = [];
    const allModels = Object.values(PAINTING_MODEL_GROUPS).flat();
    const modelsList = allModels.length > 0 ? allModels : [
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
    const recorders = (typeof PAINTING_RECORDERS_LIST !== 'undefined' && PAINTING_RECORDERS_LIST.length > 0) 
        ? PAINTING_RECORDERS_LIST 
        : ["สมชาย ใจดี", "วิชัย มีสุข", "สมศักดิ์ ขยันงาน"];

    for (let day = 1; day <= 31; day++) {
        const dd = ('0' + day).slice(-2);
        const dateStr = `2026-07-${dd}`;
        const runsCount = 2 + (day % 3);
        
        for (let r = 0; r < runsCount; r++) {
            const mIdx = (day + r * 3) % modelsList.length;
            const model = modelsList[mIdx];
            const recorder = recorders[(day + r) % recorders.length];
            
            let baseQty = 45 + ((day * 7 + r * 15) % 110);
            if (day === 27) baseQty = 450 + (r * 120);

            const totalDefect = (day % 4 === 0) ? (1 + (day % 3)) : (day % 2 === 0 ? 1 : 0);

            sample.push({
                timestamp: `${dateStr} 08:30`,
                date: dateStr,
                shift: r % 2 === 0 ? "Day" : "Night",
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
    localStorage.setItem("PAINTING_OUTPUTDIARY_INIT", "true");

    showToast("สร้างข้อมูลจำลองการผลิตรายวัน 1 เดือนสำเร็จ!", "success");
    
    // Switch to Dashboard and re-render charts immediately!
    switchTab('dashboard-tab');
    if (typeof renderDailyReportCharts === 'function') {
        renderDailyReportCharts();
    }
}
