const PAINTING_MODEL_GROUPS = {
    "Gland Plate": [
        "[75170148] Gland Plate LC600",
        "[BRU53717] Gland Plate NLC600"
    ],
    "Box & U-Box": [
        "[BRU30887] Box NMS 4/6 W. 240 mm.",
        "[BRU30888] Box NMS 8/10W. 320 mm.",
        "[BRU30889] Box NMS 14 W. 400 mm.",
        "[BRU53714] U Box 450 mm.",
        "[75170145] U Box LC600 mm.",
        "[BRU53715] U Box NLC600 mm.",
        "[BRU53716] U Box NLC750 mm.",
        "[BRU53771] U Box NLC900 mm."
    ],
    "Door (บานประตู)": [
        "[75170162] Flat Door LC 600",
        "[BRU53714] Door NLC 450 mm.",
        "[BRU53715] Door NLC 600 mm.",
        "[BRU53716] Door NLC 750 mm.",
        "[BRU53717] Door NLC 900 mm."
    ],
    "Cover NMS": [
        "[BRU30890] Cover NMS 4 w. 245 mm.",
        "[BRU30891] Cover NMS 6 w. 245 mm.",
        "[BRU30892] Cover NMS 8 w. 325 mm.",
        "[BRU30893] Cover NMS 10 w. 325 mm.",
        "[BRU30894] Cover NMS 14 w. 400 mm."
    ],
    "Cover NLC (EZ / LUG)": [
        "[BRU53718] Cover NLC EZ100 450 mm. 12 w.",
        "[BRU53738] Cover NLC LUG250 450 mm. 12 w.",
        "[BRU53724] Cover NLC EZ100 450 mm. 12 w.",
        "[BRU53725] Cover NLC EZ100 450 mm. 18 w.",
        "[BRU53719] Cover NLC EZ100 600 mm. 18 w.",
        "[BRU53739] Cover NLC LUG250 600 mm. 18 w.",
        "[BRU53727] Cover NLC LUG100 600 mm. 30 w.",
        "[BRU53740] Cover NLC LUG250 600 mm. 24 w.",
        "[BRU53741] Cover NLC LUG250 600 mm. 30 w.",
        "[BRU53726] Cover NLC LUG100 600 mm. 24 w.",
        "[BRU53728] Cover NLC LUG100 600 mm. 36 w.",
        "[BRU53720] Cover NLC EZ100 600 mm. 24 w.",
        "[BRU53721] Cover NLC EZ100 600 mm. 30 w.",
        "[BRU53730] Cover NLC EZ250 600 mm. 12 w.",
        "[BRU53731] Cover NLC EZ250 600 mm. 18 w.",
        "[BRU53722] Cover NLC EZ100 750 mm. 36 w.",
        "[BRU53723] Cover NLC EZ100 750 mm. 42 w.",
        "[BRU53729] Cover NLC LUG100 750 mm. 42 w.",
        "[BRU53742] Cover NLC LUG250 750 mm. 36 w.",
        "[BRU53732] Cover NLC EZ250 750 mm. 24 w.",
        "[BRU53734] Cover NLC EZ250 750 mm. 30 w.",
        "[BRU53735] Cover NLC EZ250 900 mm. 36 w.",
        "[BRU53736] Cover NLC EZ250 900 mm. 42 w.",
        "[BRU53737] Cover NLC EZ250 900 mm. 48 w.",
        "[BRU53746] Cover NLC LUG250 900 mm. 48 w."
    ]
};

// Flattened list for backwards compatibility
const PAINTING_MODELS = Object.values(PAINTING_MODEL_GROUPS).flat();

function renderModelDropdownOptions(groupFilter = "") {
    const modelSelects = document.querySelectorAll('.model-select');
    let html = '<option value="">-- เลือกรุ่นงาน --</option>';

    if (groupFilter && PAINTING_MODEL_GROUPS[groupFilter]) {
        PAINTING_MODEL_GROUPS[groupFilter].forEach(m => {
            html += `<option value="${m}">${m}</option>`;
        });
    } else {
        for (const [groupName, models] of Object.entries(PAINTING_MODEL_GROUPS)) {
            html += `<optgroup label="📦 ${groupName}">`;
            models.forEach(m => {
                html += `<option value="${m}">${m}</option>`;
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

let dailyReportRecords = [];

function initDailyReportForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;

    // Populate Part Category Dropdown
    const groupSelect = document.getElementById('drPartGroup');
    if (groupSelect) {
        let groupHtml = '<option value="">-- ทุกกลุ่มงาน (All Parts) --</option>';
        Object.keys(PAINTING_MODEL_GROUPS).forEach(g => {
            groupHtml += `<option value="${g}">${g}</option>`;
        });
        groupSelect.innerHTML = groupHtml;
    }

    // Populate Model Dropdown with optgroups
    renderModelDropdownOptions();

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

function addDailyReportRecord() {
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
        return;
    }

    if (prodQty === 0 && (dent+colorDrop+thinPaint+thickPaint+waterStain+otherDefect) === 0) {
        showToast("กรุณากรอกยอดผลิตหรือยอดของเสียอย่างน้อย 1 ชิ้น", "error");
        return;
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
    
    showToast("เพิ่มรายการสำเร็จ", "success");
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
    if (dailyReportRecords.length === 0) {
        showToast("กรุณาเพิ่มรายการผลิตอย่างน้อย 1 รายการก่อนบันทึก", "error");
        return;
    }

    const date = document.getElementById('reportDate').value;
    const shiftEl = document.querySelector('input[name="shift"]:checked');
    const shift = shiftEl ? shiftEl.value : "Day";
    const recorder = document.getElementById('recorderName').value;
    const checker = document.getElementById('checkerName').value;

    if (!date || !recorder) {
        showToast("กรุณากรอกวันที่และชื่อผู้บันทึกให้ครบถ้วน", "error");
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
    submitBtn.innerHTML = `กำลังส่งข้อมูล...`;

    try {
        await sendDailyReportToAPI(payload);
        showToast("บันทึกข้อมูลแบบฟอร์มประจำวันเรียบร้อยแล้ว!", "success");
        
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
        document.getElementById('recorderName').value = "";
        
        switchTab('dashboard-tab');
    } catch(err) {
        showToast("เกิดข้อผิดพลาดในการบันทึก: " + err.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `💾 บันทึกแบบฟอร์มประจำวัน`;
    }
}
