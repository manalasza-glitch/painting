/* Spare parts inventory page */

let sparePartsInventoryState = { parts: [], transactions: [] };
let sparePartsInitialized = false;
let sparePartsLoading = false;

const SPARE_PART_STARTER_FALLBACK = [
    ["SP-001", "หัวเทียน", "ไฟฟ้า / จุดระเบิด", "ชิ้น"],
    ["SP-002", "ทรานฟอร์เมอร์", "ไฟฟ้า", "ชิ้น"],
    ["SP-003", "สายพาน", "ระบบขับเคลื่อน", "เส้น"],
    ["SP-004", "จ๊กแขวนงาน", "แขวนงาน", "ชิ้น"],
    ["SP-005", "ปืนพ่นสี", "ระบบพ่นสี", "กระบอก"],
    ["SP-006", "สายสี", "ระบบสี", "เส้น"],
    ["SP-007", "สายลม", "ระบบลม", "เส้น"],
    ["SP-008", "ฟิลเตอร์", "กรองอากาศ / สี", "ชิ้น"]
];

function sparePartEscapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sparePartFormatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0";
    return number.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

function sparePartFormatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function sparePartTypeLabel(type) {
    return ({ IN: "รับเข้า", OUT: "เบิกออก", RETURN: "คืนคลัง" }[String(type || "").toUpperCase()] || type || "-");
}

function sparePartStatus(part) {
    const minStock = Number(part?.minStock || 0);
    const onHand = Number(part?.onHand || 0);
    if (minStock <= 0) return { key: "unset", label: "ยังไม่ตั้งจุดสั่งซื้อ" };
    if (onHand <= minStock) return { key: "low", label: "ต้องเติมสต็อก" };
    return { key: "ok", label: "ปกติ" };
}

function sparePartShowToast(message, type = "success") {
    if (typeof showToast === "function") showToast(message, type);
    else if (message) console.warn(message);
}

function sparePartFallbackInventory() {
    return {
        parts: SPARE_PART_STARTER_FALLBACK.map(item => ({
            partId: item[0], partName: item[1], category: item[2], machine: "ยังไม่ระบุ", unit: item[3],
            openingStock: 0, minStock: 0, maxStock: 0, onHand: 0, location: "ยังไม่ระบุ", supplier: "", notes: "", active: true, status: "unset"
        })),
        transactions: []
    };
}

async function initSparePartsModule(force = false) {
    if (sparePartsLoading) return;
    if (sparePartsInitialized && !force) {
        renderSparePartsPage();
        return;
    }

    sparePartsLoading = true;
    try {
        const inventory = await fetchSparePartsFromAPI();
        if (inventory && Array.isArray(inventory.parts) && inventory.parts.length) {
            sparePartsInventoryState = inventory;
        } else if (!sparePartsInventoryState.parts.length) {
            sparePartsInventoryState = sparePartFallbackInventory();
        }
        sparePartsInitialized = true;
        renderSparePartsPage();
    } catch (error) {
        console.warn("Spare parts page load failed:", error);
        if (!sparePartsInventoryState.parts.length) sparePartsInventoryState = sparePartFallbackInventory();
        renderSparePartsPage();
    } finally {
        sparePartsLoading = false;
    }
}

function refreshSpareParts(force = true) {
    return initSparePartsModule(force);
}

function renderSparePartsPage() {
    ensureSparePartImageInput();
    ensureSparePartImageInput();
    const parts = Array.isArray(sparePartsInventoryState.parts) ? sparePartsInventoryState.parts : [];
    const transactions = Array.isArray(sparePartsInventoryState.transactions) ? sparePartsInventoryState.transactions : [];
    const lowStock = parts.filter(part => sparePartStatus(part).key === "low").length;
    const totalStock = parts.reduce((sum, part) => sum + (Number(part.onHand) || 0), 0);
    const totalIssued = transactions.filter(tx => String(tx.type || "").toUpperCase() === "OUT").reduce((sum, tx) => sum + (Number(tx.quantity) || 0), 0);

    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText("sparePartsSkuCount", sparePartFormatNumber(parts.length));
    setText("sparePartsStockCount", sparePartFormatNumber(totalStock));
    setText("sparePartsLowStockCount", sparePartFormatNumber(lowStock));
    setText("sparePartsIssuedCount", sparePartFormatNumber(totalIssued));

    renderSparePartSelector(parts);
    renderSparePartsTable();
    renderSparePartTransactions(transactions);
}

function renderSparePartSelector(parts) {
    const select = document.getElementById("spareTransactionPartId");
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">เลือกอะไหล่</option>` + parts.map(part =>
        `<option value="${sparePartEscapeHtml(part.partId)}">${sparePartEscapeHtml(part.partId)} · ${sparePartEscapeHtml(part.partName)} (คงเหลือ ${sparePartFormatNumber(part.onHand)} ${sparePartEscapeHtml(part.unit)})</option>`
    ).join("");
    if (parts.some(part => part.partId === current)) select.value = current;
}

function renderSparePartsTable() {
    const body = document.getElementById("sparePartsTableBody");
    if (!body) return;
    const query = String(document.getElementById("sparePartSearch")?.value || "").trim().toLowerCase();
    const statusFilter = String(document.getElementById("sparePartStatusFilter")?.value || "");
    const parts = (sparePartsInventoryState.parts || []).filter(part => {
        const haystack = [part.partId, part.partName, part.category, part.machine, part.location].join(" ").toLowerCase();
        return (!query || haystack.includes(query)) && (!statusFilter || sparePartStatus(part).key === statusFilter);
    });

    if (!parts.length) {
        body.innerHTML = `<tr><td colspan="9" class="spare-empty-state">ไม่พบรายการอะไหล่ตามเงื่อนไข</td></tr>`;
        return;
    }

    body.innerHTML = parts.map(part => {
        const status = sparePartStatus(part);
        return `<tr>
            <td><strong>${sparePartEscapeHtml(part.partId)}</strong></td>
            <td>${sparePartEscapeHtml(part.partName)}</td>
            <td>${sparePartEscapeHtml(part.category || "-")}</td>
            <td>${sparePartEscapeHtml(part.machine || "-")}</td>
            <td><span class="spare-stock-value" style="color:`${Number(part.onHand || 0) < 1 ? '#ff4d6d' : '#22d3ee'}`;font-weight:800;">`${sparePartFormatNumber(part.onHand)} ${sparePartEscapeHtml(part.unit)}`</span></td>
            <td>${Number(part.minStock) > 0 ? sparePartFormatNumber(part.minStock) : "-"}</td>
            <td>${sparePartEscapeHtml(part.location || "-")}</td>
            <td><span class="spare-status-badge ${status.key}">${status.label}</span></td>
            <td><button type="button" class="spare-row-action" onclick="selectSparePartForTransaction('${sparePartEscapeHtml(part.partId)}')">เบิก/รับ</button></td>
        </tr>`;
    }).join("");
}

function renderSparePartTransactions(transactions = sparePartsInventoryState.transactions || []) {
    const body = document.getElementById("sparePartsTransactionsBody");
    if (!body) return;
    const partMap = new Map((sparePartsInventoryState.parts || []).map(part => [part.partId, part]));
    const rows = transactions.slice(0, 30);
    if (!rows.length) {
        body.innerHTML = `<tr><td colspan="7" class="spare-empty-state">ยังไม่มีประวัติการเคลื่อนไหว</td></tr>`;
        return;
    }
    body.innerHTML = rows.map(tx => {
        const part = partMap.get(tx.partId);
        return `<tr>
            <td>${sparePartEscapeHtml(sparePartFormatDate(tx.timestamp))}</td>
            <td>${sparePartEscapeHtml(tx.partId)} · ${sparePartEscapeHtml(part?.partName || "ไม่พบชื่อ")}</td>
            <td><span class="spare-status-badge ${String(tx.type).toUpperCase() === "OUT" ? "low" : "ok"}">${sparePartTypeLabel(tx.type)}</span></td>
            <td>${sparePartFormatNumber(tx.quantity)} ${sparePartEscapeHtml(part?.unit || "")}</td>
            <td>${sparePartEscapeHtml(tx.machine || "-")}</td>
            <td>${sparePartEscapeHtml(tx.reference || "-")}</td>
            <td>${sparePartEscapeHtml(tx.recorder || "-")}</td>
        </tr>`;
    }).join("");
}

function selectSparePartForTransaction(partId) {
    const select = document.getElementById("spareTransactionPartId");
    if (select) select.value = partId;
    const type = document.getElementById("spareTransactionType");
    if (type) type.value = "OUT";
    document.getElementById("sparePartTransactionForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function ensureSparePartImageInput() {
    const form = document.getElementById('sparePartMasterForm');
    if (!form || document.getElementById('spareMasterImage')) return;
    const wrap = document.createElement('div');
    wrap.className = 'form-group spare-image-upload';
    wrap.innerHTML = '<label for=spareMasterImage>รูปภาพอะไหล่</label><input id=spareMasterImage type=file accept=image/*><small>เลือกรูปภาพประกอบอะไหล่</small>';
    form.appendChild(wrap);
}
function ensureSparePartImageInput() {
    const form = document.getElementById('sparePartMasterForm');
    if (!form || document.getElementById('spareMasterImage')) return;
    const input = document.createElement('input');
    input.id = 'spareMasterImage'; input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none';
    const picker = document.createElement('label');
    picker.htmlFor = 'spareMasterImage'; picker.className = 'spare-image-picker';
    picker.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border:1px solid #159ed3;border-radius:10px;background:linear-gradient(135deg,#123454,#0d223d);color:#dff6ff;font-weight:700;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.2);';
    picker.textContent = '📷 เลือกรูปภาพ';
    const name = document.createElement('span');
    name.className = 'spare-image-name'; name.textContent = 'ยังไม่ได้เลือกไฟล์';
    name.style.cssText = 'display:block;margin-top:7px;color:#94a9bd;font-size:12px;';
    input.addEventListener('change', () => { name.textContent = input.files && input.files[0] ? input.files[0].name : 'ยังไม่ได้เลือกไฟล์'; });
    form.appendChild(picker); form.appendChild(input); form.appendChild(name);
}
function toggleSparePartMasterForm() {
    const card = document.getElementById("sparePartMasterFormCard");
    if (!card) return;
    card.hidden = !card.hidden;
    if (!card.hidden) card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function currentSparePartRecorder() {
    return String(window.PaintingAuth?.currentUser?.displayName || window.PaintingAuth?.currentUser?.employeeId || "ไม่ระบุผู้บันทึก");
}

async function saveSparePartMaster(event) {
    event?.preventDefault();
    const payload = {
        partId: document.getElementById("spareMasterPartId")?.value.trim(),
        partName: document.getElementById("spareMasterPartName")?.value.trim(),
        category: document.getElementById("spareMasterCategory")?.value.trim(),
        machine: document.getElementById("spareMasterMachine")?.value.trim(),
        unit: document.getElementById("spareMasterUnit")?.value.trim() || "ชิ้น",
        openingStock: document.getElementById("spareMasterOpeningStock")?.value,
        minStock: document.getElementById("spareMasterMinStock")?.value,
        maxStock: document.getElementById("spareMasterMaxStock")?.value,
        location: document.getElementById("spareMasterLocation")?.value.trim(),
        supplier: document.getElementById("spareMasterSupplier")?.value.trim(),
        notes: document.getElementById("spareMasterNotes")?.value.trim()
    };
    if (!payload.partName) {
        sparePartShowToast("กรุณาระบุชื่ออะไหล่", "error");
        return;
    }
    try {
        const result = await saveSparePartToAPI(payload);
        if (result?.status !== "success") throw new Error(result?.message || "บันทึกข้อมูลไม่สำเร็จ");
        sparePartShowToast("บันทึกข้อมูลอะไหล่แล้ว", "success");
        document.getElementById("sparePartMasterForm")?.reset();
        document.getElementById("spareMasterUnit").value = "ชิ้น";
        document.getElementById("sparePartMasterFormCard").hidden = true;
        await initSparePartsModule(true);
    } catch (error) {
        sparePartShowToast(error.message || "บันทึกข้อมูลอะไหล่ไม่สำเร็จ", "error");
    }
}

async function submitSparePartTransaction(event) {
    event?.preventDefault();
    const payload = {
        partId: document.getElementById("spareTransactionPartId")?.value,
        type: document.getElementById("spareTransactionType")?.value,
        quantity: document.getElementById("spareTransactionQuantity")?.value,
        machine: document.getElementById("spareTransactionMachine")?.value.trim(),
        reference: document.getElementById("spareTransactionReference")?.value.trim(),
        note: document.getElementById("spareTransactionNote")?.value.trim(),
        recorder: currentSparePartRecorder()
    };
    const quantity = Number(payload.quantity);
    if (!payload.partId || !payload.type || !Number.isFinite(quantity) || quantity <= 0) {
        sparePartShowToast("กรุณาเลือกอะไหล่ ประเภทรายการ และจำนวนให้ครบ", "error");
        return;
    }
    const selectedPart = (sparePartsInventoryState.parts || []).find(part => part.partId === payload.partId);
    if (payload.type === "OUT" && selectedPart && quantity > Number(selectedPart.onHand || 0)) {
        sparePartShowToast(`ยอดคงเหลือไม่พอ (คงเหลือ ${sparePartFormatNumber(selectedPart.onHand)} ${selectedPart.unit})`, "error");
        return;
    }
    try {
        const result = await recordSparePartTransactionToAPI(payload);
        if (result?.status !== "success") throw new Error(result?.message || "บันทึกรายการไม่สำเร็จ");
        sparePartShowToast("บันทึกรายการคลังอะไหล่แล้ว", "success");
        document.getElementById("sparePartTransactionForm")?.reset();
        await initSparePartsModule(true);
    } catch (error) {
        sparePartShowToast(error.message || "บันทึกรายการคลังอะไหล่ไม่สำเร็จ", "error");
    }
}


// spare part image upload enabled
