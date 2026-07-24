let inspectionRecords = [];
let dailyChartInstance = null;
let donutChartInstance = null;

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

    // Poll data every 15 seconds only if there are no pending sync requests
    setInterval(() => {
        if (typeof activeSyncRequests !== 'undefined' && activeSyncRequests === 0) {
            loadDataFromAPI(true); // silent reload
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
    
    if (!silent) showToast("โหลดข้อมูลสำเร็จ (" + inspectionRecords.length + " รายการ)", "success");
}

function switchTab(tabId, element) {
    document.querySelectorAll(".tab-page").forEach(page => page.style.display = "none");
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.style.display = "block";

    if (element) {
        element.classList.add("active");
    } else {
        const matchingNav = document.querySelector(`.nav-link[onclick*="${tabId}"]`);
        if (matchingNav) matchingNav.classList.add("active");
    }

    if (tabId === "dashboard-tab") {
        renderDashboard();
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
    if (!inspectionRecords || inspectionRecords.length === 0) return;

    // 1. Calculate KPI Metrics
    let totalInspections = inspectionRecords.length;
    let totalRust = 0, totalDent = 0, totalWeld = 0, totalChemical = 0, totalOil = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    let todayDefects = 0;

    inspectionRecords.forEach(r => {
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

    const topCategory = defectsCategory[0];
    document.getElementById("kpiTopDefect").innerText = topCategory.val > 0 ? topCategory.name : "-";
    document.getElementById("kpiTopDefectCount").innerText = topCategory.val > 0 ? `${topCategory.val} ชิ้น` : "0 ชิ้น";

    document.getElementById("kpiTodayDefects").innerText = todayDefects;

    // 2. Render Daily Statistics Chart
    renderDailyChart();

    // 3. Render Defect Donut Chart
    renderDonutChart(defectsCategory, grandTotalDefects);

    // 4. Render Defect Progress Bars
    renderSeverityBars(defectsCategory, grandTotalDefects);
}

function renderDailyChart() {
    const ctx = document.getElementById("dailyChart");
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded");
        return;
    }

    // Aggregate last 7 days of records
    const recentRecords = [...inspectionRecords].reverse().slice(-7);
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
    renderRecentTable();
    renderFullHistoryTable(inspectionRecords);
}

function renderRecentTable() {
    const tbody = document.getElementById("recentTableBody");
    if (!tbody) return;

    const recent = inspectionRecords.slice(0, 5);
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
