let inspectionRecords = [];
let dailyChartInstance = null;
let donutChartInstance = null;
let outputDailyChartInstance = null;
let topModelsChartInstance = null;
let qualityYieldChartInstance = null;
let currentQualityViewMode = 'ng';
let globalQualityChartCache = { datesList: [], pctOkList: [], pctNgList: [] };

function formatDateForDisplay(dateVal, timestampVal) {
    let source = timestampVal || dateVal;
    if (!source) return '-';

    let str = String(source).trim();
    if (!str) return '-';

    // If it's already "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss"
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
        return str.substring(0, 16);
    }

    try {
        let d = new Date(str);
        if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        }
    } catch (e) {}

    // Fallback: If string contains T (ISO format)
    if (str.includes('T')) {
        const parts = str.split('T');
        const dPart = parts[0];
        const tPart = parts[1] ? parts[1].substring(0, 5) : '00:00';
        return `${dPart} ${tPart}`;
    }

    return str;
}

function setCurrentDateTimeDefaults() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = `${hh}:${min}`;

    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = dateStr;
        dateInput.setAttribute("value", dateStr);
    }
    const timeInput = document.getElementById("time");
    if (timeInput) {
        timeInput.value = timeStr;
        timeInput.setAttribute("value", timeStr);
        try {
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {}
    }
}

window.onload = async () => {
    setCurrentDateTimeDefaults();

    // Auto-clear stale test cache from old v1.0.4 version
    const cacheVer = localStorage.getItem("PAINTING_INSPECTION_CACHE_VER");
    if (cacheVer !== "1.5.0") {
        localStorage.removeItem("PAINTING_INSPECTION_CACHE");
        localStorage.setItem("PAINTING_INSPECTION_CACHE_VER", "1.5.0");
    }

    if (typeof initDailyReportForm === 'function') {
        initDailyReportForm();
    }

    const settingInput = document.getElementById("settingApiUrl");
    if (settingInput) {
        settingInput.value = getApiUrl();
    }

    await loadDataFromAPI();
    if (typeof loadEventsData === 'function') {
        loadEventsData();
    }

    // Poll data every 15 seconds only if there are no pending sync requests
    setInterval(() => {
        if (typeof activeSyncRequests !== 'undefined' && activeSyncRequests === 0) {
            loadDataFromAPI(true); // silent reload
            if (typeof renderStaffDropdowns === 'function') {
                renderStaffDropdowns();
            }
            if (typeof loadEventsData === 'function') {
                loadEventsData();
            }
        }
    }, 15000);
};

async function loadDataFromAPI(silent = false) {
    if (!silent) showToast("กำลังโหลดข้อมูล...", "info");
    
    // Only fetch if not currently syncing to avoid race conditions overriding local cache
    if (typeof activeSyncRequests !== 'undefined' && activeSyncRequests > 0) {
        return;
    }

    inspectionRecords = await fetchInspectionDataFromAPI();
    
    // Sort records by date descending
    inspectionRecords.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    renderDashboard();
    renderTables();

    // Pre-fetch Daily Report history from Google Sheets backend
    if (typeof refreshDailyReportHistory === 'function') {
        refreshDailyReportHistory();
    }
    
    if (!silent) showToast("โหลดข้อมูลสำเร็จ (" + inspectionRecords.length + " รายการ)", "success");
}

function switchTab(tabId, element) {
    // Hide all tab pages & remove active class
    document.querySelectorAll(".tab-page").forEach(page => {
        page.classList.remove("active");
    });
    
    // Remove active class from all nav items (sidebar links & mobile bottom nav items)
    document.querySelectorAll(".nav-link, .mobile-nav-item").forEach(link => link.classList.remove("active"));

    // Show target tab page
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add("active");
    }

    // Highlight all matching navigation items (both desktop & mobile)
    document.querySelectorAll(`[onclick*="${tabId}"]`).forEach(el => el.classList.add("active"));

    // Scroll window to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === "dashboard-tab") {
        renderDashboard();
    } else if (tabId === "daily-report-tab") {
        if (typeof renderStaffDropdowns === 'function') {
            renderStaffDropdowns();
        }
        if (typeof renderDailyReportList === 'function') {
            renderDailyReportList();
        }
        if (typeof refreshDailyReportHistory === 'function') {
            refreshDailyReportHistory();
        }
    } else if (tabId === "event-tab") {
        if (typeof renderEventsTab === 'function') {
            renderEventsTab();
        }
    } else if (tabId === "history-tab") {
        if (typeof renderTables === 'function') {
            renderTables();
        }
    }
}

function openInspectionModal() {
    const modal = document.getElementById("inspectionModal");
    if (modal) {
        // Clear Edit Mode Flags
        document.getElementById("editRowIndex").value = "";
        document.getElementById("editOriginalDate").value = "";
        document.getElementById("editIndexInArray").value = "";
        const titleEl = document.getElementById("modalTitleText");
        if (titleEl) titleEl.innerText = "📝 บันทึกข้อมูลการตรวจเช็ค (Painting Inspection)";

        document.getElementById("inspectionForm").reset();
        setCurrentDateTimeDefaults();

        modal.classList.add("active");
        calculateTotalDefects();

        setTimeout(setCurrentDateTimeDefaults, 50);
        setTimeout(setCurrentDateTimeDefaults, 250);
    }
}

function closeInspectionModal() {
    const modal = document.getElementById("inspectionModal");
    if (modal) {
        modal.classList.remove("active");
        document.getElementById("editRowIndex").value = "";
        document.getElementById("editOriginalDate").value = "";
        document.getElementById("editIndexInArray").value = "";
    }
}

// Global modal dismiss listeners (Click backdrop or Press ESC)
document.addEventListener("click", (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("modal-overlay")) {
        e.target.classList.remove("active");
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
});

// Edit Inspection Record: Pre-fills PREVIOUSLY SAVED Date & Time so user can modify or preserve it
function editInspectionRecord(index) {
    const record = inspectionRecords[index];
    if (!record) return;

    const modal = document.getElementById("inspectionModal");
    if (!modal) return;

    // Set Edit Mode Title
    const titleEl = document.getElementById("modalTitleText");
    if (titleEl) titleEl.innerText = "✏️ แก้ไขข้อมูลการตรวจเช็ค (Painting Inspection)";

    // Set Hidden Inputs for exact in-place overwrite
    document.getElementById("editRowIndex").value = record.rowIndex || (index + 2);
    document.getElementById("editOriginalDate").value = record.date || record.timestamp || "";
    document.getElementById("editIndexInArray").value = index;

    // Extract PREVIOUSLY SAVED Date & Time
    const rawDateStr = String(record.date || record.timestamp || "").trim();
    let datePart = "";
    let timePart = "12:00";

    if (rawDateStr.includes(" ")) {
        const parts = rawDateStr.split(" ");
        datePart = parts[0];
        timePart = parts[1] ? parts[1].substring(0, 5) : "12:00";
    } else if (rawDateStr.includes("T")) {
        const parts = rawDateStr.split("T");
        datePart = parts[0];
        timePart = parts[1] ? parts[1].substring(0, 5) : "12:00";
    } else {
        datePart = rawDateStr.substring(0, 10);
    }

    // Set Date & Time to PREVIOUSLY SAVED values
    const dateInput = document.getElementById("date");
    if (dateInput && datePart) dateInput.value = datePart;

    const timeInput = document.getElementById("time");
    if (timeInput && timePart) {
        timeInput.value = timePart;
        timeInput.setAttribute("value", timePart);
        try {
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
        } catch(e){}
    }

    document.getElementById("rust").value = Number(record.rust) || 0;
    document.getElementById("dent").value = Number(record.dent) || 0;
    document.getElementById("weld").value = Number(record.weld) || 0;
    document.getElementById("chemical").value = Number(record.chemical) || 0;
    document.getElementById("oil").value = Number(record.oil) || 0;
    document.getElementById("note").value = record.note || "";

    modal.classList.add("active");
    calculateTotalDefects();
}

async function deleteInspectionRecord(index) {
    const record = inspectionRecords[index];
    if (!record) return;

    const confirmMsg = `คุณต้องการลบรายการตรวจเช็คของวันที่ "${formatDateForDisplay(record.date, record.timestamp)}" ใช่หรือไม่?`;
    if (!confirm(confirmMsg)) return;

    // Remove locally from memory and re-render immediately
    inspectionRecords.splice(index, 1);
    renderDashboard();
    renderTables();
    showToast("กำลังลบข้อมูลออกจากระบบ...", "info");

    try {
        await deleteDataFromAPI(record);
        showToast("ลบข้อมูลเรียบร้อยแล้ว!", "success");
    } catch (err) {
        showToast("เกิดข้อผิดพลาดในการลบ: " + err.message, "error");
    }
}

function calculateTotalDefects() {
    const rust = Number(document.getElementById("rust").value) || 0;
    const dent = Number(document.getElementById("dent").value) || 0;
    const weld = Number(document.getElementById("weld").value) || 0;
    const chemical = Number(document.getElementById("chemical").value) || 0;
    const oil = Number(document.getElementById("oil").value) || 0;

    const total = rust + dent + weld + chemical + oil;
    const previewEl = document.getElementById("modalTotalPreview");
    if (previewEl) {
        previewEl.innerText = `${total} ชิ้น`;
    }
    return total;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const editRowIndex = document.getElementById("editRowIndex").value;
    const editOriginalDate = document.getElementById("editOriginalDate").value;
    const editIndexInArray = document.getElementById("editIndexInArray").value;
    const isEditMode = Boolean(editRowIndex || editOriginalDate || editIndexInArray !== "");

    submitBtn.disabled = true;
    submitBtn.innerHTML = isEditMode ? `กำลังบันทึกทับข้อมูลเดิม...` : `กำลังบันทึก...`;

    const now = new Date();
    const inputDate = document.getElementById("date").value;
    const inputTime = document.getElementById("time").value;

    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const selectedTime = inputTime || defaultTime;
    const formattedDateTime = inputDate ? `${inputDate} ${selectedTime}` : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${selectedTime}`;

    const data = {
        rowIndex: editRowIndex,
        originalDate: editOriginalDate,
        date: formattedDateTime,
        rust: Number(document.getElementById("rust").value) || 0,
        dent: Number(document.getElementById("dent").value) || 0,
        weld: Number(document.getElementById("weld").value) || 0,
        chemical: Number(document.getElementById("chemical").value) || 0,
        oil: Number(document.getElementById("oil").value) || 0,
        note: document.getElementById("note").value.trim(),
        timestamp: formattedDateTime
    };

    try {
        if (isEditMode) {
            // Overwrite in-place in local array to prevent duplicate rows
            const arrIndex = Number(editIndexInArray);
            if (!isNaN(arrIndex) && arrIndex >= 0 && arrIndex < inspectionRecords.length) {
                inspectionRecords[arrIndex] = {
                    ...data,
                    rowIndex: editRowIndex || inspectionRecords[arrIndex].rowIndex
                };
            }
            renderDashboard();
            renderTables();

            await updateDataToAPI(data);
            showToast("แก้ไขบันทึกทับข้อมูลเดิมเรียบร้อยแล้ว!", "success");
        } else {
            await sendDataToAPI(data);
            showToast("บันทึกข้อมูลเรียบร้อยแล้ว!", "success");
        }
        
        closeInspectionModal();
        document.getElementById("inspectionForm").reset();
        setCurrentDateTimeDefaults();
    } catch (err) {
        showToast("เกิดข้อผิดพลาดในการบันทึก: " + err.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `💾 บันทึกข้อมูล`;
    }
}

function renderDashboard() {
    renderDailyReportCharts();

    if (!inspectionRecords || inspectionRecords.length === 0) return;

    // Apply Date Filter
    const filterInput = document.getElementById("dashboardDateFilter");
    const filterDate = filterInput ? filterInput.value : "";

    let filteredRecords = inspectionRecords;
    if (filterDate) {
        filteredRecords = inspectionRecords.filter(r => {
            const recordDateStr = String(r.date || r.timestamp || '').split('T')[0].substring(0, 10);
            return recordDateStr === filterDate;
        });
    }

    // 1. Calculate KPI Metrics using Filtered Data
    let totalInspections = filteredRecords.length;
    let totalRust = 0, totalDent = 0, totalWeld = 0, totalChemical = 0, totalOil = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    let todayDefects = 0;

    filteredRecords.forEach(r => {
        const rust = Number(r.rust) || 0;
        const dent = Number(r.dent) || 0;
        const weld = Number(r.weld) || 0;
        const chemical = Number(r.chemical) || 0;
        const oil = Number(r.oil) || 0;
        const rowTotal = rust + dent + weld + chemical + oil;

        totalRust += rust;
        totalDent += dent;
        totalWeld += weld;
        totalChemical += chemical;
        totalOil += oil;

        const recordDateStr = String(r.date || r.timestamp || '').split('T')[0].substring(0, 10);
        if (recordDateStr === todayStr) {
            todayDefects += rowTotal;
        }
    });

    const grandTotalDefects = totalRust + totalDent + totalWeld + totalChemical + totalOil;
    const avgDefects = totalInspections > 0 ? (grandTotalDefects / totalInspections).toFixed(1) : 0;

    // Determine Top Defect Category
    const defectsCategory = [
        { name: "งานเป็นสนิม", val: totalRust, color: "#f59e0b" },
        { name: "รอยบุบ", val: totalDent, color: "#3b82f6" },
        { name: "สะเก็ดรอยเชื่อม", val: totalWeld, color: "#ef4444" },
        { name: "คราบน้ำยา", val: totalChemical, color: "#06b6d4" },
        { name: "คราบน้ำมัน", val: totalOil, color: "#8b5cf6" }
    ];
    defectsCategory.sort((a, b) => b.val - a.val);

    document.getElementById("kpiTotalInspections").innerText = totalInspections;
    document.getElementById("kpiTotalDefects").innerText = grandTotalDefects;
    document.getElementById("kpiAvgDefectPerJob").innerText = `เฉลี่ย ${avgDefects} ชิ้น/ครั้ง`;

    // Update KPI 1 subtext
    const kpi1Subtext = document.querySelector('.kpi-card.blue .kpi-subtext');
    if (kpi1Subtext) {
        kpi1Subtext.innerText = filterDate ? `↑ รายการวันที่เลือก` : `↑ รายการทั้งหมด`;
    }

    const topCategory = defectsCategory[0];
    document.getElementById("kpiTopDefect").innerText = topCategory.val > 0 ? topCategory.name : "-";
    document.getElementById("kpiTopDefectCount").innerText = topCategory.val > 0 ? `${topCategory.val} ชิ้น` : "0 ชิ้น";

    // Update KPI 4
    document.getElementById("kpiTodayDefects").innerText = filterDate ? grandTotalDefects : todayDefects;
    const kpi4Title = document.querySelector('.kpi-card.yellow .kpi-label');
    const kpi4Subtext = document.querySelector('.kpi-card.yellow .kpi-subtext');
    if (kpi4Title) kpi4Title.innerText = filterDate ? 'อัตราของเสียที่เลือก' : 'อัตราของเสียวันนี้';
    if (kpi4Subtext) kpi4Subtext.innerText = filterDate ? 'วันที่เลือก' : 'วันนี้';

    // 2. Render Daily Statistics Chart
    renderDailyChart(filterDate ? filteredRecords : inspectionRecords, filterDate);

    // 3. Render Defect Donut Chart
    renderDonutChart(defectsCategory, grandTotalDefects);

    // 4. Render Defect Progress Bars
    renderSeverityBars(defectsCategory, grandTotalDefects);

    // 5. Update Recent Table to reflect filtered date
    renderRecentTable(filterDate ? filteredRecords : inspectionRecords);

    // 6. Render Output Diary Charts (from Google Sheets outputdiary)
    renderDailyReportCharts();
}

function renderDailyChart(recordsData = inspectionRecords, filterDate = "") {
    const ctx = document.getElementById("dailyChart");
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded");
        return;
    }

    // Aggregate last 7 days of records, or just the filtered date if filterDate is set
    let recentRecords = [];
    if (filterDate) {
        recentRecords = [...recordsData].reverse();
    } else {
        recentRecords = [...recordsData].reverse().slice(-7);
    }
    
    const labels = recentRecords.map(r => String(r.date || r.timestamp || '').split('T')[0].substring(0, 10));
    const rustData = recentRecords.map(r => Number(r.rust) || 0);
    const dentData = recentRecords.map(r => Number(r.dent) || 0);
    const weldData = recentRecords.map(r => Number(r.weld) || 0);
    const totalsData = recentRecords.map(r => (Number(r.rust)||0)+(Number(r.dent)||0)+(Number(r.weld)||0)+(Number(r.chemical)||0)+(Number(r.oil)||0));

    if (dailyChartInstance) {
        dailyChartInstance.destroy();
    }

    dailyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'รวมของเสียทั้งหมด',
                    data: totalsData,
                    borderColor: '#00b4d8',
                    backgroundColor: 'rgba(0, 180, 216, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    type: 'bar',
                    label: 'สนิม (Rust)',
                    data: rustData,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    type: 'bar',
                    label: 'รอยบุบ (Dent)',
                    data: dentData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                },
                {
                    type: 'bar',
                    label: 'สะเก็ดเชื่อม (Weld)',
                    data: weldData,
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', font: { family: 'Sarabun', size: 12 } }
                },
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' }
                }
            }
        }
    });
}

function renderDonutChart(defectsCategory, grandTotal) {
    const ctx = document.getElementById("donutChart");
    if (!ctx) return;

    if (typeof Chart === 'undefined') return;

    if (donutChartInstance) {
        donutChartInstance.destroy();
    }

    donutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: defectsCategory.map(c => c.name),
            datasets: [{
                data: defectsCategory.map(c => c.val),
                backgroundColor: defectsCategory.map(c => c.color),
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { family: 'Sarabun', size: 11 }, boxWidth: 12 }
                }
            },
            cutout: '70%'
        }
    });
}

function renderSeverityBars(defectsCategory, grandTotal) {
    const container = document.getElementById("defectProgressList");
    if (!container) return;

    container.innerHTML = defectsCategory.map(item => {
        const pct = grandTotal > 0 ? Math.round((item.val / grandTotal) * 100) : 0;
        return `
            <div class="severity-item">
                <div class="severity-info">
                    <span>${item.name}</span>
                    <span>${item.val} ชิ้น (${pct}%)</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${pct}%; background-color: ${item.color};"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTables() {
    renderRecentTable(inspectionRecords);
    renderFullHistoryTable(inspectionRecords);
}

function renderRecentTable(recordsData = inspectionRecords) {
    const tbody = document.getElementById("recentTableBody");
    if (!tbody) return;

    const recent = recordsData.slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2rem;">ไม่พบข้อมูลการตรวจเช็ค</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map((r, i) => {
        const rust = Number(r.rust) || 0;
        const dent = Number(r.dent) || 0;
        const weld = Number(r.weld) || 0;
        const chemical = Number(r.chemical) || 0;
        const oil = Number(r.oil) || 0;
        const total = rust + dent + weld + chemical + oil;
        const dateFormatted = formatDateForDisplay(r.date, r.timestamp);

        return `
            <tr>
                <td style="font-weight: 700; white-space: nowrap;">${dateFormatted}</td>
                <td><span class="badge-defect ${rust > 0 ? 'badge-has-defect' : 'badge-zero'}">${rust}</span></td>
                <td><span class="badge-defect ${dent > 0 ? 'badge-has-defect' : 'badge-zero'}">${dent}</span></td>
                <td><span class="badge-defect ${weld > 0 ? 'badge-has-defect' : 'badge-zero'}">${weld}</span></td>
                <td><span class="badge-defect ${chemical > 0 ? 'badge-has-defect' : 'badge-zero'}">${chemical}</span></td>
                <td><span class="badge-defect ${oil > 0 ? 'badge-has-defect' : 'badge-zero'}">${oil}</span></td>
                <td><span class="badge-defect badge-total">${total}</span></td>
                <td style="color: #64748b; font-size: 0.85rem;">${r.note || '-'}</td>
                <td style="text-align: center;">
                    <div class="action-btn-group">
                        <button class="btn-action-edit" onclick="editInspectionRecord(${i})" title="แก้ไข">✏️ แก้ไข</button>
                        <button class="btn-action-delete" onclick="deleteInspectionRecord(${i})" title="ลบ">🗑️ ลบ</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderFullHistoryTable(records) {
    const tbody = document.getElementById("fullHistoryTableBody");
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2rem;">ไม่พบข้อมูลการตรวจเช็ค</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map((r, i) => {
        const rust = Number(r.rust) || 0;
        const dent = Number(r.dent) || 0;
        const weld = Number(r.weld) || 0;
        const chemical = Number(r.chemical) || 0;
        const oil = Number(r.oil) || 0;
        const total = rust + dent + weld + chemical + oil;
        const dateFormatted = formatDateForDisplay(r.date, r.timestamp);

        return `
            <tr>
                <td style="font-weight: 800; color: #2563eb; white-space: nowrap;">${dateFormatted}</td>
                <td><span class="badge-defect ${rust > 0 ? 'badge-has-defect' : 'badge-zero'}">${rust}</span></td>
                <td><span class="badge-defect ${dent > 0 ? 'badge-has-defect' : 'badge-zero'}">${dent}</span></td>
                <td><span class="badge-defect ${weld > 0 ? 'badge-has-defect' : 'badge-zero'}">${weld}</span></td>
                <td><span class="badge-defect ${chemical > 0 ? 'badge-has-defect' : 'badge-zero'}">${chemical}</span></td>
                <td><span class="badge-defect ${oil > 0 ? 'badge-has-defect' : 'badge-zero'}">${oil}</span></td>
                <td><span class="badge-defect badge-total">${total} ชิ้น</span></td>
                <td>${r.note || '-'}</td>
                <td style="text-align: center;">
                    <div class="action-btn-group">
                        <button class="btn-action-edit" onclick="editInspectionRecord(${i})" title="แก้ไข">✏️ แก้ไข</button>
                        <button class="btn-action-delete" onclick="deleteInspectionRecord(${i})" title="ลบ">🗑️ ลบ</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterHistoryTable() {
    const query = document.getElementById("globalSearch").value.toLowerCase();
    const filtered = inspectionRecords.filter(r => {
        const dStr = formatDateForDisplay(r.date, r.timestamp).toLowerCase();
        return dStr.includes(query) || (r.note && r.note.toLowerCase().includes(query));
    });
    renderFullHistoryTable(filtered);
}

function saveSettings() {
    const url = document.getElementById("settingApiUrl").value.trim();
    if (url) {
        setApiUrl(url);
        showToast("บันทึก URL API เรียบร้อยแล้ว", "success");
        loadDataFromAPI();
    }
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-msg ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
        <span>${type === 'error' ? '❌' : '✅'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function getModelWithGroupLabel(rawModel) {
    if (!rawModel) return 'รุ่นอื่นๆ (Other)';
    let raw = String(rawModel).trim();
    if (!raw) return 'รุ่นอื่นๆ (Other)';

    // Avoid duplicating if already wrapped in parentheses
    if (raw.includes('(') && raw.includes(')')) {
        return raw;
    }

    const groups = (typeof PAINTING_MODEL_GROUPS !== 'undefined') ? PAINTING_MODEL_GROUPS : {};
    let foundGroup = "";

    for (const grpName in groups) {
        const arr = groups[grpName];
        if (Array.isArray(arr)) {
            const hasMatch = arr.some(item => {
                const cleanItem = String(item).trim();
                return cleanItem.toLowerCase() === raw.toLowerCase() ||
                       raw.toLowerCase().includes(cleanItem.toLowerCase()) ||
                       cleanItem.toLowerCase().includes(raw.toLowerCase());
            });
            if (hasMatch) {
                foundGroup = grpName;
                break;
            }
        }
    }

    if (foundGroup) {
        return `${raw} (${foundGroup})`;
    }
    return raw;
}

async function renderDailyReportCharts() {
    if (typeof fetchDailyReportDataFromAPI !== 'function') return;

    const data = await fetchDailyReportDataFromAPI();
    
    if (!data || data.length === 0) {
        // Reset KPI Elements to 0
        const kpiProdTotalQty = document.getElementById('kpiProdTotalQty');
        const kpiProdTotalDefects = document.getElementById('kpiProdTotalDefects');
        const kpiProdDefectRate = document.getElementById('kpiProdDefectRate');
        const kpiProdTopModel = document.getElementById('kpiProdTopModel');
        const kpiProdTopModelQty = document.getElementById('kpiProdTopModelQty');
        const kpiProdReportCount = document.getElementById('kpiProdReportCount');

        if (kpiProdTotalQty) kpiProdTotalQty.innerText = "0";
        if (kpiProdTotalDefects) kpiProdTotalDefects.innerText = "0";
        if (kpiProdDefectRate) kpiProdDefectRate.innerText = "อัตราของเสีย 0%";
        if (kpiProdTopModel) kpiProdTopModel.innerText = "-";
        if (kpiProdTopModelQty) kpiProdTopModelQty.innerText = "0 ชิ้น";
        if (kpiProdReportCount) kpiProdReportCount.innerText = "0";

        // Destroy Chart.js instances if empty
        if (outputDailyChartInstance) { outputDailyChartInstance.destroy(); outputDailyChartInstance = null; }
        if (topModelsChartInstance) { topModelsChartInstance.destroy(); topModelsChartInstance = null; }
        if (qualityYieldChartInstance) { qualityYieldChartInstance.destroy(); qualityYieldChartInstance = null; }
        globalQualityChartCache = { datesList: [], pctOkList: [], pctNgList: [] };
        return;
    }

    const filterInput = document.getElementById("dashboardDateFilter");
    const filterDate = filterInput ? filterInput.value : "";

    let filteredData = data;
    if (filterDate) {
        filteredData = data.filter(r => String(r.date).substring(0, 10) === filterDate);
    }

    // 1. Calculate KPIs
    let totalProdQty = 0;
    let totalDefects = 0;
    const modelMap = {};

    filteredData.forEach(r => {
        const pQty = Number(r.prodQty || r.ProdQty || r.prod_qty || r.qty) || 0;
        const dQty = Number(r.totalDefect || r.TotalDefect || r.total_defect) || 0;
        let mName = String(r.model || r.Model || '').trim();

        totalProdQty += pQty;
        totalDefects += dQty;

        if (mName) {
            modelMap[mName] = (modelMap[mName] || 0) + pQty;
        }
    });

    const reportCount = filteredData.length;
    const defectRate = totalProdQty > 0 ? ((totalDefects / totalProdQty) * 100).toFixed(1) : 0;

    // Top Model
    let topModelName = "-";
    let topModelQty = 0;
    Object.keys(modelMap).forEach(m => {
        if (modelMap[m] > topModelQty) {
            topModelQty = modelMap[m];
            topModelName = m;
        }
    });

    // Update KPI Elements
    const kpiProdTotalQty = document.getElementById('kpiProdTotalQty');
    const kpiProdTotalDefects = document.getElementById('kpiProdTotalDefects');
    const kpiProdDefectRate = document.getElementById('kpiProdDefectRate');
    const kpiProdTopModel = document.getElementById('kpiProdTopModel');
    const kpiProdTopModelQty = document.getElementById('kpiProdTopModelQty');
    const kpiProdReportCount = document.getElementById('kpiProdReportCount');

    if (kpiProdTotalQty) kpiProdTotalQty.innerText = totalProdQty.toLocaleString();
    if (kpiProdTotalDefects) kpiProdTotalDefects.innerText = totalDefects.toLocaleString();
    if (kpiProdDefectRate) kpiProdDefectRate.innerText = `อัตราของเสีย ${defectRate}%`;
    if (kpiProdTopModel) kpiProdTopModel.innerText = getModelWithGroupLabel(topModelName);
    if (kpiProdTopModelQty) kpiProdTopModelQty.innerText = `${topModelQty.toLocaleString()} ชิ้น`;
    if (kpiProdReportCount) kpiProdReportCount.innerText = reportCount.toLocaleString();

    // 2. Render Output Daily Stacked Bar Chart (Grouped by Model Names - ชื่อรุ่นของงาน + กลุ่มงาน)
    const modelTotalsMap = {};
    filteredData.forEach(r => {
        let mName = String(r.model || r.Model || '').trim();
        if (mName) {
            mName = getModelWithGroupLabel(mName);
        } else {
            mName = 'รุ่นอื่นๆ (Other)';
        }
        const pQty = Number(r.prodQty || r.ProdQty || r.prod_qty || r.qty) || 0;
        if (pQty > 0) {
            modelTotalsMap[mName] = (modelTotalsMap[mName] || 0) + pQty;
        }
    });

    // Sort models by volume descending and select top models for clean legend display
    const sortedModelNames = Object.keys(modelTotalsMap).sort((a, b) => modelTotalsMap[b] - modelTotalsMap[a]);
    const topModelNames = sortedModelNames.slice(0, 8);
    const hasMoreModels = sortedModelNames.length > 8;

    const activeModels = [...topModelNames];
    if (hasMoreModels && !activeModels.includes('รุ่นอื่นๆ (Other)')) {
        activeModels.push('รุ่นอื่นๆ (Other)');
    }

    const paletteColors = [
        "#00b4d8", // Cyan Blue
        "#10b981", // Emerald Green
        "#f59e0b", // Amber Gold
        "#8b5cf6", // Purple
        "#ec4899", // Pink
        "#3b82f6", // Royal Blue
        "#14b8a6", // Teal
        "#f97316", // Bright Orange
        "#a855f7", // Deep Violet
        "#64748b"  // Slate Gray
    ];

    const modelColorMap = {};
    activeModels.forEach((m, idx) => {
        modelColorMap[m] = paletteColors[idx % paletteColors.length];
    });

    const dateGroupMap = {};
    const dateDefectsMap = {};
    const dateTotalProdMap = {};

    filteredData.forEach(r => {
        const dStr = String(r.date || r.Date || r.timestamp || '').substring(0, 10);
        if (!dStr) return;

        let mName = String(r.model || r.Model || '').trim();
        if (mName) {
            mName = getModelWithGroupLabel(mName);
        }
        if (!mName || !topModelNames.includes(mName)) {
            mName = 'รุ่นอื่นๆ (Other)';
        }

        if (!dateGroupMap[dStr]) {
            dateGroupMap[dStr] = {};
            activeModels.forEach(m => dateGroupMap[dStr][m] = 0);
            dateDefectsMap[dStr] = 0;
            dateTotalProdMap[dStr] = 0;
        }

        const pQty = Number(r.prodQty || r.ProdQty || r.prod_qty || r.qty) || 0;
        const dQty = Number(r.totalDefect || r.TotalDefect || r.total_defect) || 0;

        dateGroupMap[dStr][mName] = (dateGroupMap[dStr][mName] || 0) + pQty;
        dateDefectsMap[dStr] += dQty;
        dateTotalProdMap[dStr] += pQty;
    });

    const datesList = Object.keys(dateGroupMap).sort();
    const defectsList = datesList.map(d => dateDefectsMap[d]);

    // Build Stacked Datasets: Red Line for Defects + Stacked Colored Bars for Specific Model Names
    const stackedDatasets = [
        {
            type: 'line',
            label: 'ของเสียรวม (ชิ้น)',
            data: defectsList,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            borderWidth: 3,
            pointRadius: 4,
            fill: false,
            tension: 0.3,
            order: 0
        }
    ];

    activeModels.forEach(mName => {
        const qtyData = datesList.map(d => dateGroupMap[d][mName] || 0);
        const sum = qtyData.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            stackedDatasets.push({
                type: 'bar',
                label: mName,
                data: qtyData,
                backgroundColor: modelColorMap[mName],
                stack: 'prodStack',
                borderRadius: 2,
                order: 1
            });
        }
    });

    const ctxDaily = document.getElementById("outputDailyChart");
    if (ctxDaily && typeof Chart !== 'undefined') {
        if (outputDailyChartInstance) {
            outputDailyChartInstance.destroy();
        }

        outputDailyChartInstance = new Chart(ctxDaily, {
            type: 'bar',
            data: {
                labels: datesList,
                datasets: stackedDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0', font: { family: 'Sarabun', size: 11 } }
                    },
                    zoom: {
                        pan: { enabled: true, mode: 'x' },
                        zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' }
                    },
                    tooltip: {
                        callbacks: {
                            footer: function(tooltipItems) {
                                if (!tooltipItems || tooltipItems.length === 0) return '';
                                const dateLabel = tooltipItems[0].label;
                                const totalPcs = dateTotalProdMap[dateLabel] || 0;
                                return `ยอดผลิตรวมทั้งวัน: ${totalPcs.toLocaleString()} ชิ้น`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        stacked: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' }
                    }
                }
            }
        });
    }

    // 3. Render Top 5 Models Chart (Horizontal Bar Layout for Perfect Space Fitting)
    const sortedModels = Object.keys(modelMap).sort((a, b) => modelMap[b] - modelMap[a]).slice(0, 5);
    const topModelQtyList = sortedModels.map(m => modelMap[m]);

    const ctxModels = document.getElementById("topModelsChart");
    if (ctxModels && typeof Chart !== 'undefined') {
        if (topModelsChartInstance) {
            topModelsChartInstance.destroy();
        }

        // Format labels into multi-line arrays if long to fit space cleanly
        const formattedLabels = sortedModels.map(m => {
            const fullStr = getModelWithGroupLabel(m);
            if (fullStr.includes(' (')) {
                const parts = fullStr.split(' (');
                return [parts[0].trim(), '(' + parts.slice(1).join(' (').trim()];
            }
            return fullStr;
        });

        topModelsChartInstance = new Chart(ctxModels, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [{
                    label: 'ยอดผลิต (ชิ้น)',
                    data: topModelQtyList,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
                    ],
                    borderRadius: { topRight: 8, bottomRight: 8 }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal Bar for perfect space fitting
                plugins: {
                    legend: { display: false },
                    zoom: {
                        pan: { enabled: true, mode: 'y' },
                        zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'y' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `ยอดผลิต: ${context.raw.toLocaleString()} ชิ้น`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 10 } },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        ticks: {
                            color: '#e2e8f0',
                            font: { family: 'Sarabun', size: 10, weight: '500' }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 4. Cache Quality Data & Render Quality Yield / NG Chart
    const pctOkList = datesList.map(d => {
        const total = dateTotalProdMap[d] || 0;
        const defects = dateDefectsMap[d] || 0;
        const good = Math.max(0, total - defects);
        return total > 0 ? Number(((good / total) * 100).toFixed(1)) : 100;
    });

    const pctNgList = datesList.map(d => {
        const total = dateTotalProdMap[d] || 0;
        const defects = dateDefectsMap[d] || 0;
        return total > 0 ? Number(((defects / total) * 100).toFixed(1)) : 0;
    });

    globalQualityChartCache = { datesList, pctOkList, pctNgList };
    renderQualityYieldChart();
}

async function updateQualityChartMode() {
    const select = document.getElementById("qualityViewMode");
    if (select) {
        currentQualityViewMode = select.value;
    }
    if (!globalQualityChartCache.datesList || globalQualityChartCache.datesList.length === 0) {
        await renderDailyReportCharts();
    } else {
        renderQualityYieldChart();
    }
}

function renderQualityYieldChart() {
    const select = document.getElementById("qualityViewMode");
    if (select) {
        currentQualityViewMode = select.value;
    }

    const { datesList, pctOkList, pctNgList } = globalQualityChartCache;
    const ctxQuality = document.getElementById("qualityYieldChart");
    if (!ctxQuality || typeof Chart === 'undefined' || !datesList || datesList.length === 0) return;

    if (qualityYieldChartInstance) {
        qualityYieldChartInstance.destroy();
        qualityYieldChartInstance = null;
    }

    let datasets = [];
    let yMin = 0;
    let yMax = 100;

    const maxNg = pctNgList.length > 0 ? Math.max(...pctNgList) : 0;
    const minOk = pctOkList.length > 0 ? Math.min(...pctOkList) : 100;

    const mode = String(currentQualityViewMode || 'ng').toLowerCase();

    if (mode === 'ng') {
        // STRICT % NG MODE: ONLY 1 dataset (% NG Rate) with zoomed Y-axis
        yMin = 0;
        yMax = Math.min(100, Math.max(5, Math.ceil(maxNg + 2)));
        datasets = [
            {
                label: '% งานเสีย (% NG Rate)',
                data: pctNgList,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#ef4444',
                fill: true,
                tension: 0.3
            }
        ];
    } else if (mode === 'yield') {
        // Zoom mode for % Yield Rate (e.g. 85% to 100%)
        yMin = Math.max(0, Math.floor(minOk - 3));
        yMax = 100;
        datasets = [
            {
                label: '% งานดี (% OK Yield Rate)',
                data: pctOkList,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#10b981',
                fill: true,
                tension: 0.3
            }
        ];
    } else {
        // Both % OK & % NG (0 - 100%)
        yMin = 0;
        yMax = 100;
        datasets = [
            {
                label: '% งานดี (% OK Rate)',
                data: pctOkList,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderWidth: 3,
                pointRadius: 4,
                fill: true,
                tension: 0.3
            },
            {
                label: '% งานเสีย (% NG Rate)',
                data: pctNgList,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderWidth: 3,
                pointRadius: 4,
                fill: true,
                tension: 0.3
            }
        ];
    }

    qualityYieldChartInstance = new Chart(ctxQuality, {
        type: 'line',
        data: {
            labels: datesList,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', font: { family: 'Sarabun', size: 11 } }
                },
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8', font: { family: 'Sarabun', size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    min: yMin,
                    max: yMax,
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) { return value + '%'; }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' }
                }
            }
        }
    });
}

// --- FULLSCREEN CHART & WHEEL ZOOM MANAGEMENT ---
let fullscreenChartInstance = null;

function openChartFullscreen(chartId, title) {
    const sourceCanvas = document.getElementById(chartId);
    if (!sourceCanvas) return;

    const sourceChart = Chart.getChart(sourceCanvas);
    if (!sourceChart) return;

    const modal = document.getElementById("chartFullscreenModal");
    const modalTitle = document.getElementById("fullscreenChartTitle");
    const fullscreenCanvas = document.getElementById("fullscreenCanvas");

    if (!modal || !fullscreenCanvas) return;

    if (modalTitle) {
        modalTitle.innerHTML = `📊 ${title || 'ขยายกราฟแสดงผลเต็มหน้าจอ'}`;
    }

    modal.classList.add("active");

    if (fullscreenChartInstance) {
        fullscreenChartInstance.destroy();
        fullscreenChartInstance = null;
    }

    // Clone datasets and config
    const rawData = JSON.parse(JSON.stringify({
        labels: sourceChart.config.data.labels || [],
        datasets: sourceChart.config.data.datasets || []
    }));

    const sourceOptions = sourceChart.config.options || {};
    const isHorizontal = sourceOptions.indexAxis === 'y';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: sourceOptions.indexAxis || 'x',
        plugins: {
            legend: sourceOptions.plugins && sourceOptions.plugins.legend !== undefined ? sourceOptions.plugins.legend : {
                labels: { color: '#e2e8f0', font: { family: 'Sarabun', size: 12 } }
            },
            zoom: {
                pan: { enabled: true, mode: isHorizontal ? 'y' : 'x' },
                zoom: {
                    wheel: { enabled: true, speed: 0.1 },
                    pinch: { enabled: true },
                    mode: isHorizontal ? 'y' : 'x'
                }
            },
            tooltip: sourceOptions.plugins && sourceOptions.plugins.tooltip ? sourceOptions.plugins.tooltip : {}
        },
        scales: sourceOptions.scales ? JSON.parse(JSON.stringify(sourceOptions.scales)) : {}
    };

    fullscreenChartInstance = new Chart(fullscreenCanvas, {
        type: sourceChart.config.type || 'bar',
        data: rawData,
        options: options
    });
}

function closeChartFullscreen() {
    const modal = document.getElementById("chartFullscreenModal");
    if (modal) {
        modal.classList.remove("active");
    }
    if (fullscreenChartInstance) {
        fullscreenChartInstance.destroy();
        fullscreenChartInstance = null;
    }
}

function resetChartZoomInFullscreen() {
    if (fullscreenChartInstance && typeof fullscreenChartInstance.resetZoom === 'function') {
        fullscreenChartInstance.resetZoom();
    }
}
