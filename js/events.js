// 5M1E Event Management Logic (js/events.js)

let currentEvents = [];

// Color map and icons for 5M1E Categories
const EVENT_CATEGORY_CONFIG = {
    "Man": { label: "Man (คน / พนักงาน)", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", icon: "👨‍🌾" },
    "Machine": { label: "Machine (เครื่องจักร / อุปกรณ์)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: "⚙️" },
    "Material": { label: "Material (วัตถุดิบ / สารเคมี / สี)", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: "📦" },
    "Method": { label: "Method (วิธีการ / พารามิเตอร์)", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: "📐" },
    "Measurement": { label: "Measurement (การวัด / เครื่องมือ)", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)", icon: "🧪" },
    "Environment": { label: "Environment (สภาพแวดล้อม)", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", icon: "🌍" }
};

document.addEventListener("DOMContentLoaded", () => {
    // Event data is fetched when the Event tab is opened, not during dashboard startup.
});

async function loadEventsData() {
    if (typeof fetchEventsFromAPI === 'function') {
        currentEvents = await fetchEventsFromAPI();
        renderEventsTab();
    }
}

function renderEventsTab() {
    const tableBody = document.getElementById("eventsTableBody");
    if (!tableBody) return;

    // Filter controls
    const searchInput = document.getElementById("eventSearchInput");
    const catSelect = document.getElementById("eventCategoryFilter");
    const dateInput = document.getElementById("eventDateFilter");

    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const catFilter = catSelect ? catSelect.value : "";
    const dateFilter = dateInput ? dateInput.value : "";

    let filtered = currentEvents;

    if (catFilter) {
        filtered = filtered.filter(e => e.category === catFilter);
    }

    if (dateFilter) {
        filtered = filtered.filter(e => {
            const eDateStr = typeof getStandardISODate === 'function' ? getStandardISODate(e.date || e.timestamp) : String(e.date).substring(0, 10);
            return eDateStr === dateFilter;
        });
    }

    if (keyword) {
        filtered = filtered.filter(e => 
            (e.title && e.title.toLowerCase().includes(keyword)) ||
            (e.detail && e.detail.toLowerCase().includes(keyword)) ||
            (e.process && e.process.toLowerCase().includes(keyword)) ||
            (e.recorder && e.recorder.toLowerCase().includes(keyword))
        );
    }

    // Update KPI summary cards
    const counts = { Man: 0, Machine: 0, Material: 0, Method: 0, Measurement: 0, Environment: 0 };
    currentEvents.forEach(e => {
        if (counts[e.category] !== undefined) {
            counts[e.category]++;
        }
    });

    Object.keys(counts).forEach(cat => {
        const kpiEl = document.getElementById(`kpiEvt_${cat}`);
        if (kpiEl) kpiEl.innerText = counts[cat].toLocaleString();
    });

    // Render Table Rows
    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #94a3b8;">
                    🚫 ไม่พบข้อมูลบันทึกเหตุการณ์ 5M1E ที่ตรงตามเงื่อนไข
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map((evt, idx) => {
        const cfg = EVENT_CATEGORY_CONFIG[evt.category] || { label: evt.category, color: '#64748b', bg: '#f1f5f9', icon: '📝' };
        
        return `
            <tr>
                <td style="white-space: nowrap; font-weight: 600;">
                    <div>${evt.date || '-'}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">⏱️ ${evt.time || '08:00'}</div>
                </td>
                <td style="white-space: nowrap;">
                    <span style="background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
                        ${evt.shift || 'กะเช้า'}
                    </span>
                </td>
                <td style="white-space: nowrap;">
                    <span style="background: ${cfg.bg}; color: ${cfg.color}; padding: 0.25rem 0.65rem; border-radius: 12px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <span>${cfg.icon}</span>
                        <span>${evt.category}</span>
                    </span>
                </td>
                <td style="font-weight: 700; color: #1e3a8a;">${evt.process || '-'}</td>
                <td>
                    <div style="font-weight: 700; color: #0f172a; margin-bottom: 0.2rem;">${evt.title || '-'}</div>
                    <div style="font-size: 0.85rem; color: #475569;">${evt.detail || '-'}</div>
                </td>
                <td style="font-size: 0.85rem; color: #166534; background: rgba(240, 253, 244, 0.6); padding: 0.5rem; border-radius: 6px;">
                    🛡️ ${evt.action || '-'}
                </td>
                <td style="text-align:center; font-weight:800; color:#0ea5e9; white-space:nowrap;">${Number(evt.quantity) || 0}</td>
                <td style="white-space: nowrap; font-size: 0.85rem; color: #475569;">
                    👤 ${evt.recorder || '-'}
                </td>
                <td style="text-align: center; white-space: nowrap;">
                    <button class="btn-action btn-delete" onclick="deleteEventRecord('${evt.id}', ${evt.rowIndex || 0}, '${(evt.title || '').replace(/'/g, "\\'")}')" title="ลบรายการ">🗑️</button>
                </td>
            </tr>
        `;
    }).join("");
}

function openEventModal() {
    const modal = document.getElementById("eventModal");
    if (!modal) return;

    // Reset Form
    const form = document.getElementById("eventForm");
    if (form) form.reset();

    // Set Default Date & Time
    const now = new Date();
    const dateInput = document.getElementById("eventDate");
    const timeInput = document.getElementById("eventTime");
    const quantityInput = document.getElementById("eventQuantity");
    
    if (dateInput) dateInput.value = now.toISOString().substring(0, 10);
    if (timeInput) {
        const hh = ('0' + now.getHours()).slice(-2);
        const mm = ('0' + now.getMinutes()).slice(-2);
        timeInput.value = `${hh}:${mm}`;
    }
    if (quantityInput) quantityInput.value = "0";

    // Populate Recorder Dropdown from global recorders list
    populateEventRecorderDropdown();

    modal.classList.add("active");
}

function closeEventModal() {
    const modal = document.getElementById("eventModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function populateEventRecorderDropdown() {
    const select = document.getElementById("eventRecorderSelect");
    if (!select) return;

    let recordersList = ["สมชาย ใจดี", "วิชัย มีสุข", "สมศักดิ์ ขยันงาน", "อนันต์ ราบรื่น", "ประเสริฐ ดีเยี่ยม"];
    
    // Check if global staff list is available
    if (window.staffList && Array.isArray(window.staffList) && window.staffList.length > 0) {
        recordersList = window.staffList;
    }

    select.innerHTML = recordersList.map(name => `<option value="${name}">${name}</option>`).join("");
}

async function handleEventFormSubmit(event) {
    event.preventDefault();

    const date = document.getElementById("eventDate").value;
    const time = document.getElementById("eventTime").value;
    const shift = document.getElementById("eventShift").value;
    const category = document.getElementById("eventCategory").value;
    const process = document.getElementById("eventProcess").value.trim();
    const quantity = Math.max(0, Number(document.getElementById("eventQuantity")?.value || 0) || 0);
    const title = document.getElementById("eventTitle").value.trim();
    const detail = document.getElementById("eventDetail").value.trim();
    const actionTaken = document.getElementById("eventActionTaken").value.trim();
    const recorder = document.getElementById("eventRecorderSelect").value;

    if (!date || !title || !detail) {
        if (typeof showToast === 'function') showToast("กรุณากรอกวันที่, หัวข้อ และรายละเอียดการเปลี่ยนแปลง", "warning");
        return;
    }

    const eventData = {
        date,
        time,
        shift,
        category,
        process,
        quantity,
        title,
        detail,
        actionTaken,
        recorder
    };

    closeEventModal();
    if (typeof showToast === 'function') showToast("บันทึกข้อมูลเหตุการณ์ 5M1E สำเร็จ", "success");

    if (typeof sendEventToAPI === 'function') {
        await sendEventToAPI(eventData);
    }

    await loadEventsData();
}

async function deleteEventRecord(id, rowIndex, title) {
    if (!confirm("คุณต้องการลบบันทึกเหตุการณ์ 5M1E นี้อย่างถาวรใช่หรือไม่?")) return;

    if (typeof showToast === 'function') showToast("กำลังลบรายการ...", "info");

    // Remove item in memory immediately
    currentEvents = currentEvents.filter(evt => String(evt.id) !== String(id) && (title ? String(evt.title || "").trim() !== String(title).trim() : true));

    // Save updated list to cache immediately and mark as initialized
    localStorage.setItem("PAINTING_EVENTS_CACHE", JSON.stringify(currentEvents));
    localStorage.setItem("PAINTING_EVENTS_INIT", "true");

    // Re-render UI table and update KPI cards immediately
    renderEventsTab();

    // Trigger cloud deletion
    if (typeof deleteEventFromAPI === 'function') {
        await deleteEventFromAPI(id, rowIndex, title);
    }

    if (typeof showToast === 'function') showToast("ลบรายการบันทึกเรียบร้อยแล้ว", "success");
}
