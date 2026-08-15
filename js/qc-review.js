/* QC review queue and reviewed history.
 * The source checklist rows remain in their original sheets.  A row is copied
 * to `finish cheak` only after a QC user explicitly presses ✓ or ✕.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'PAINTING_QC_REVIEW_STATUS_V1';
    const state = { view: 'pending', statuses: {}, loading: false, observerTimer: null };
    const bodySources = {
        qcParameterChecklistHistoryBody: 'ParameterChecklist',
        qcWaterChecklistHistoryBody: 'WaterParameterChecklist',
        qcEquipmentChecklistHistoryBody: 'EquipmentChecklist'
    };

    function readLocal() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
        catch (e) { return {}; }
    }

    function writeLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.statuses)); } catch (e) {}
    }

    function currentReviewer() {
        const user = window.PaintingAuth && PaintingAuth.currentUser;
        return user ? {
            employeeId: user.employeeId || '',
            displayName: user.displayName || user.name || user.employeeId || ''
        } : '';
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function normalizeStatus(value) {
        const text = String(value || '').toLowerCase();
        if (['approved', 'approve', 'pass', 'passed', 'ok', 'ผ่าน', 'ถูก'].includes(text)) return 'approved';
        if (['rejected', 'reject', 'fail', 'failed', 'ng', 'ไม่ผ่าน', 'ผิด'].includes(text)) return 'rejected';
        return text;
    }

    function loadLocalStatuses() {
        const local = readLocal();
        Object.keys(local).forEach(key => {
            if (local[key] && local[key].status) state.statuses[key] = local[key];
        });
    }

    async function loadReviewStatuses() {
        loadLocalStatuses();
        if (state.loading) return;
        state.loading = true;
        try {
            if (typeof fetchQCReviewDataFromAPI === 'function') {
                const rows = await fetchQCReviewDataFromAPI({ retryOptions: { attempts: 2, timeoutMs: 12000, skipQueue: true } });
                (rows || []).forEach(row => {
                    const key = String(row.reviewKey || '').trim();
                    if (key) state.statuses[key] = { status: normalizeStatus(row.status), reviewedAt: row.reviewedAt, reviewedBy: row.reviewedBy };
                });
                writeLocal();
            }
        } catch (error) {
            console.warn('QC review status loading failed:', error);
        } finally {
            state.loading = false;
        }
    }

    function sourceForTable(table) {
        const body = table && table.tBodies && table.tBodies[0];
        if (body && body.id && bodySources[body.id]) return bodySources[body.id];
        if (table && table.classList.contains('qc-screen-group-table')) return 'ScreenReports';
        if (table && table.classList.contains('qc-daily-group-table')) return 'outputdiary';
        if (table && table.classList.contains('qc-rework-group-table')) return 'REWORK';
        return 'QC';
    }

    function tableRows(table) {
        const body = table && table.tBodies && table.tBodies[0];
        if (!body) return [];
        return Array.from(body.rows).filter(row => {
            if (!row.cells.length) return false;
            if (row.cells.length === 1 && Number(row.cells[0].colSpan || 1) > 1) return false;
            return !row.classList.contains('qc-review-detail-row')
                && !row.classList.contains('qc-history-detail-row');
        });
    }

    function reviewKey(source, row, index) {
        const values = Array.from(row.cells)
            .filter(cell => !cell.classList.contains('qc-review-cell'))
            .map(cell => String(cell.textContent || '').replace(/\s+/g, ' ').trim());
        // Use the row's actual displayed values so a newly inserted record at
        // the top does not change the review key of older records.
        const table = row.closest('table');
        const group = table && (
            table.classList.contains('qc-screen-group-table')
            || table.classList.contains('qc-rework-group-table')
        )
            ? String(table.dataset.qcGroup || '').trim()
            : '';
        return `${group ? `${source}|${group}` : source}|${values.join('|')}`;
    }

    function readRecordRef(row) {
        const encoded = row && row.getAttribute('data-qc-record-ref');
        if (!encoded) return {};
        try { return JSON.parse(decodeURIComponent(encoded)) || {}; }
        catch (error) { return {}; }
    }

    function toggleDailyDetail(button, event) {
        if (!button) return;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const detailRow = document.getElementById(button.dataset.qcDailyDetailId || '');
        if (!detailRow) return;
        const isOpen = detailRow.style.display === 'table-row';
        detailRow.dataset.qcDetailExpanded = isOpen ? 'false' : 'true';
        detailRow.style.display = isOpen ? 'none' : 'table-row';
        button.textContent = isOpen ? 'ดูรายละเอียด' : 'ซ่อนรายละเอียด';
        button.dataset.qcDetailHandledAt = String(Date.now());
    }

    function bindDailyDetailClicks() {
        if (document.documentElement.dataset.qcDailyDetailDelegated === 'true') return;
        document.documentElement.dataset.qcDailyDetailDelegated = 'true';
        const handle = event => {
            const button = event.target && event.target.closest
                ? event.target.closest('button.qc-history-detail-button[data-qc-daily-detail-id]')
                : null;
            if (!button) return;
            const handledAt = Number(button.dataset.qcDetailHandledAt || 0);
            // A physical mouse click can emit pointerdown, mousedown, then
            // click. Toggle only once while still supporting click-only input.
            if (event.type === 'click' && handledAt && Date.now() - handledAt < 500) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (event.type !== 'click' && handledAt && Date.now() - handledAt < 80) return;
            toggleDailyDetail(button, event);
        };
        document.addEventListener('pointerdown', handle, true);
        document.addEventListener('mousedown', handle, true);
        document.addEventListener('click', handle, true);
        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            handle(event);
        }, true);
    }

    function headerAndRows(table) {
        const body = table && table.tBodies && table.tBodies[0];
        const rows = tableRows(table);
        if (!body || !rows.length) return;
        table.classList.add('qc-review-table');
        const source = sourceForTable(table);
        const headerRow = table.tHead && table.tHead.rows[0];
        if (headerRow && !headerRow.querySelector('.qc-review-heading')) {
            const th = document.createElement('th');
            th.className = 'qc-review-heading';
            th.textContent = 'QC ตรวจ';
            th.style.textAlign = 'center';
            headerRow.appendChild(th);
        }

        rows.forEach((row, index) => {
            const key = reviewKey(source, row, index);
            row.dataset.qcReviewKey = key;
            const status = state.statuses[key] && normalizeStatus(state.statuses[key].status);
            const detail = row.nextElementSibling && (
                row.nextElementSibling.classList.contains('qc-review-detail-row')
                || row.nextElementSibling.classList.contains('qc-history-detail-row')
            ) ? row.nextElementSibling : null;
            if (detail) {
                const outerCell = detail.querySelector(':scope > td[colspan]');
                if (outerCell && headerRow) outerCell.colSpan = headerRow.cells.length;
            }
            const rowVisible = state.view === 'reviewed' ? !!status : !status;
            if (detail) {
                const expanded = detail.dataset.qcDetailExpanded === 'true';
                detail.style.display = rowVisible && expanded ? 'table-row' : 'none';
            }
            row.style.display = rowVisible ? '' : 'none';
            // Keep a live save button stable while the observer watches table updates.
            if (state.view !== 'reviewed' && row.dataset.qcReviewSaving === 'true') return;
            const old = row.querySelector('.qc-review-cell');
            if (old) old.remove();
            const cell = document.createElement('td');
            cell.className = 'qc-review-cell';
            cell.style.textAlign = 'center';
            if (state.view === 'reviewed') {
                cell.innerHTML = status === 'approved'
                    ? '<span class="qc-review-badge qc-review-pass">✓ ผ่าน</span>'
                    : '<span class="qc-review-badge qc-review-fail">✕ ไม่ผ่าน</span>';
            } else {
                cell.innerHTML = '<button type="button" class="qc-review-action qc-review-complete" data-qc-status="approved" title="ตรวจแล้ว">ตรวจแล้ว</button>';
                const actionButton = cell.querySelector('button');
                const handleReviewPointer = event => {
                    if (actionButton.disabled) return;
                    decide(event, actionButton, source, row, key, readRecordRef(row));
                };
                // Start on pointerdown so the user gets immediate feedback even
                // when the browser does not synthesize a later click event.
                // The button is disabled synchronously by decide(), preventing
                // pointerup/click/delegated handlers from submitting twice.
                actionButton.addEventListener('pointerdown', handleReviewPointer, true);
                actionButton.addEventListener('pointerup', handleReviewPointer, true);
                actionButton.addEventListener('click', handleReviewPointer, true);
                actionButton.onpointerdown = handleReviewPointer;
                actionButton.onclick = handleReviewPointer;
            }
            row.appendChild(cell);
        });
    }

    function bindReviewClicks(root) {
        if (!root || root.dataset.qcReviewClickBound === 'true') return;
        root.dataset.qcReviewClickBound = 'true';
        // Delegate from the stable tab root. Tables are rebuilt while each
        // checklist loads, so per-button listeners can disappear with a
        // freshly rendered row even though the button remains visible.
        root.addEventListener('click', event => {
            const button = event.target && event.target.closest
                ? event.target.closest('button.qc-review-action')
                : null;
            if (!button || !root.contains(button) || button.disabled) return;
            const row = button.closest('tr');
            const table = button.closest('table');
            if (!row || !table) return;
            const source = sourceForTable(table);
            const key = row.dataset.qcReviewKey || reviewKey(source, row, 0);
            decide(event, button, source, row, key, readRecordRef(row));
        });
    }

    async function decide(event, button, source, row, key, recordRef = {}) {
        event.preventDefault();
        event.stopPropagation();
        const status = button.dataset.qcStatus;
        const reviewer = currentReviewer() || { employeeId: '', displayName: 'ไม่ระบุผู้ตรวจ' };
        const payload = {
            action: 'submitQCReview',
            reviewKey: key,
            status,
            sourceSheet: source,
            recordRef,
            reviewedBy: reviewer,
            record: { cells: Array.from(row.cells)
                .filter(cell => !cell.classList.contains('qc-review-cell'))
                .map(cell => String(cell.textContent || '').replace(/\s+/g, ' ').trim()) }
        };
        row.querySelectorAll('button').forEach(item => {
            item.disabled = true;
            if (item.classList.contains('qc-review-complete')) item.textContent = 'กำลังบันทึก...';
        });
        row.dataset.qcReviewSaving = 'true';
        try {
            if (typeof sendQCChecklistReviewToAPI !== 'function') {
                throw new Error('ไม่พบการเชื่อมต่อ Apps Script สำหรับบันทึกผลตรวจ');
            }
            await sendQCChecklistReviewToAPI(payload);
            state.statuses[key] = { status, reviewedBy: reviewer.displayName || reviewer.employeeId || 'ไม่ระบุผู้ตรวจ' };
            writeLocal();
            delete row.dataset.qcReviewSaving;
            if (typeof showToast === 'function') showToast(status === 'approved' ? 'บันทึกผลตรวจผ่านแล้ว' : 'บันทึกผลตรวจไม่ผ่านแล้ว', 'success');
            enhanceAll();
        } catch (error) {
            delete row.dataset.qcReviewSaving;
            row.querySelectorAll('button').forEach(item => {
                item.disabled = false;
                if (item.classList.contains('qc-review-complete')) item.textContent = 'ตรวจแล้ว';
            });
            if (typeof showToast === 'function') showToast('บันทึกผลตรวจไม่สำเร็จ: ' + (error.message || error), 'error');
        }
    }

    function enhanceAll() {
        const root = document.getElementById('qc-history-tab');
        if (!root || root.style.display === 'none') return;
        bindReviewClicks(root);
        Object.keys(bodySources).forEach(id => {
            const body = document.getElementById(id);
            if (body && body.closest('table')) headerAndRows(body.closest('table'));
        });
        root.querySelectorAll('table.qc-daily-group-table').forEach(headerAndRows);
        root.querySelectorAll('table.qc-screen-group-table').forEach(headerAndRows);
        root.querySelectorAll('table.qc-rework-group-table').forEach(headerAndRows);
        const title = root.querySelector('.page-title');
        const subtitle = root.querySelector('.section-title-bar span');
        if (title) title.textContent = state.view === 'reviewed' ? 'QC — ตรวจแล้ว' : 'QC — รอตรวจ';
        if (subtitle) subtitle.textContent = state.view === 'reviewed' ? 'รายการที่ QC ตรวจและบันทึกผลแล้ว' : 'รายการที่รอ QC ตรวจสอบ';
    }

    function scheduleEnhance() {
        clearTimeout(state.observerTimer);
        state.observerTimer = setTimeout(enhanceAll, 30);
    }

    function openQCReviewView(view, element) {
        // Submenu items carry the same qc.read permission as the parent QC
        // link. Exclude them from the parent-toggle branch so clicking
        // "รอตรวจ" or "ตรวจแล้ว" actually switches the view.
        const isReviewSubmenuItem = !!(element && element.matches('[data-qc-review-view]'));
        const isQCParent = !!(element && (
            element.matches('.sidebar-nav a.nav-link[data-permission="qc.read"]')
            || element.matches('.mobile-nav-item[data-permission="qc.read"]')
        )) && !isReviewSubmenuItem;
        const isSubmenuOpen = !!document.querySelector('.qc-review-submenu.is-open, .mobile-qc-review-submenu.is-open');
        if (isQCParent && isSubmenuOpen) {
            setReviewSubmenuOpen(false);
            return false;
        }
        state.view = view === 'reviewed' ? 'reviewed' : 'pending';
        setReviewSubmenuOpen(true);
        if (typeof switchTab === 'function') switchTab('qc-history-tab', element);
        // Pending rows already come from *_Pending sheets, so do not make the
        // slow six-sheet Reviewed read block the actionable queue. Load review
        // metadata only when the user opens the Reviewed view.
        if (state.view === 'reviewed') loadReviewStatuses().then(enhanceAll);
        else enhanceAll();
        return false;
    }

    function setReviewSubmenuOpen(open) {
        const expanded = !!open;
        document.querySelectorAll('.qc-review-submenu, .mobile-qc-review-submenu').forEach(menu => {
            menu.classList.toggle('is-open', expanded);
            menu.setAttribute('aria-hidden', expanded ? 'false' : 'true');
        });
        const desktop = document.querySelector('.sidebar-nav a.nav-link[data-permission="qc.read"]');
        if (desktop) desktop.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        const mobile = document.querySelector('.mobile-nav-item[data-permission="qc.read"]');
        if (mobile) mobile.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    // Match the checklist menu affordance: a down caret when collapsed and
    // an up caret while the QC review submenu is expanded.  The caret is
    // injected here so both desktop and mobile navigation stay in sync with
    // the dynamically-created review submenu.
    function addQCCaret(parent) {
        if (!parent || parent.querySelector('.qc-review-menu-caret')) return;
        parent.classList.add('qc-review-menu-parent');
        const caret = document.createElement('span');
        caret.className = 'qc-review-menu-caret';
        caret.setAttribute('aria-hidden', 'true');
        caret.textContent = '▾';
        parent.appendChild(caret);
    }

    function addDesktopSubmenu(parent) {
        if (!parent || document.getElementById('qc-review-submenu')) return;
        const submenu = document.createElement('div');
        submenu.id = 'qc-review-submenu';
        submenu.className = 'sidebar-submenu qc-review-submenu';
        submenu.innerHTML = '<a href="javascript:void(0)" class="nav-link submenu-item" data-permission="qc.read" data-qc-review-view="pending"><span style="width:20px;text-align:center;">•</span>รอตรวจ</a>'
            + '<a href="javascript:void(0)" class="nav-link submenu-item" data-permission="qc.read" data-qc-review-view="reviewed"><span style="width:20px;text-align:center;">•</span>ตรวจแล้ว</a>';
        parent.insertAdjacentElement('afterend', submenu);
        submenu.querySelectorAll('[data-qc-review-view]').forEach(link => link.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            openQCReviewView(link.dataset.qcReviewView, link);
        }));
    }

    function addMobileSubmenu(parent) {
        if (!parent || document.getElementById('mobile-qc-review-submenu')) return;
        const menu = document.createElement('div');
        menu.id = 'mobile-qc-review-submenu';
        menu.className = 'mobile-qc-review-submenu';
        menu.innerHTML = '<button type="button" data-qc-review-view="pending">รอตรวจ</button><button type="button" data-qc-review-view="reviewed">ตรวจแล้ว</button>';
        parent.insertAdjacentElement('afterend', menu);
        menu.querySelectorAll('[data-qc-review-view]').forEach(button => button.addEventListener('click', event => {
            event.preventDefault();
            openQCReviewView(button.dataset.qcReviewView, button);
        }));
    }

    function injectStyles() {
        if (document.getElementById('qc-review-styles')) return;
        const style = document.createElement('style');
        style.id = 'qc-review-styles';
        style.textContent = `
            .qc-review-submenu {
                display: flex;
                flex-direction: column;
                gap: 2px;
                margin: -4px 0 6px 24px;
                padding: 3px 0 3px 10px;
                border-left: 1px solid rgba(48, 183, 255, .35);
                max-height: 0;
                overflow: hidden;
                opacity: 0;
                transform: translateY(-4px);
                pointer-events: none;
                transition: max-height .22s ease, opacity .18s ease, transform .22s ease;
            }
            .qc-review-submenu.is-open {
                max-height: 96px;
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            .qc-review-submenu .submenu-item {
                display: flex;
                align-items: center;
                gap: 7px;
                min-height: 34px;
                padding: 5px 10px;
                border-radius: 8px;
                font-size: .86rem;
                white-space: nowrap;
            }
            .qc-review-submenu .submenu-item:hover,
            .qc-review-submenu .submenu-item.active {
                background: rgba(26, 126, 232, .18);
            }
            .mobile-qc-review-submenu {
                display: flex;
                gap: 8px;
                width: 100%;
                overflow-x: auto;
                padding: 5px 10px 7px;
                background: #071322;
                -webkit-overflow-scrolling: touch;
                max-height: 0;
                opacity: 0;
                overflow-y: hidden;
                pointer-events: none;
                transition: max-height .22s ease, opacity .18s ease;
            }
            .mobile-qc-review-submenu.is-open {
                max-height: 54px;
                opacity: 1;
                pointer-events: auto;
            }
            .mobile-qc-review-submenu button {
                flex: 0 0 auto;
                border: 1px solid rgba(48, 183, 255, .4);
                border-radius: 8px;
                background: #102442;
                color: #eaf4ff;
                padding: 7px 13px;
                font: inherit;
                white-space: nowrap;
            }
            .qc-review-menu-parent {
                display: flex;
                align-items: center;
            }
            .qc-review-menu-caret {
                margin-left: auto;
                flex: 0 0 auto;
                font-size: .9rem;
                opacity: .9;
                transition: transform .2s ease;
            }
            .qc-review-menu-parent[aria-expanded="true"] .qc-review-menu-caret {
                transform: rotate(180deg);
            }
            .qc-review-cell { white-space: nowrap; min-width: 76px; }
            .qc-review-action {
                width: 30px;
                height: 30px;
                margin: 0 2px;
                padding: 0;
                border: 0;
                border-radius: 8px;
                color: #fff;
                font-size: 1rem;
                font-weight: 800;
                line-height: 30px;
                cursor: pointer;
            }
            .qc-review-action:disabled { opacity: .55; cursor: wait; }
            .qc-review-complete {
                background: #10b981;
                min-width: 76px;
                padding: 0 10px;
                font-size: .8rem;
                transition: background-color .15s ease, box-shadow .15s ease;
            }
            .qc-review-complete:hover,
            .qc-review-complete:focus-visible {
                background: #047857;
                box-shadow: 0 4px 12px rgba(4, 120, 87, .32);
                transform: none;
                animation: none;
            }
            .qc-review-complete:active {
                background: #065f46;
                transform: none;
            }
            .qc-review-badge {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                padding: 4px 8px;
                border-radius: 999px;
                font-size: .82rem;
                white-space: nowrap;
            }
            .qc-review-pass { color: #10b981; background: rgba(16, 185, 129, .12); }
            .qc-review-fail { color: #f87171; background: rgba(239, 68, 68, .12); }
            @media (max-width: 700px) {
                .qc-review-cell { min-width: 68px; }
                .qc-review-action { width: 28px; height: 28px; line-height: 28px; }
            }
            /* Keep the QC decision column inside the history card.  The base
               history tables have eight columns; the review action is added
               dynamically as the ninth, so constrain only enhanced QC tables. */
            .qc-review-table {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
                table-layout: fixed !important;
                box-sizing: border-box;
            }
            .qc-review-table th,
            .qc-review-table td {
                min-width: 0 !important;
                box-sizing: border-box;
                white-space: normal;
                overflow-wrap: anywhere;
                word-break: break-word;
            }
            .qc-review-table th:nth-child(1), .qc-review-table td:nth-child(1) { width: 13% !important; }
            .qc-review-table th:nth-child(2), .qc-review-table td:nth-child(2) { width: 10% !important; }
            .qc-review-table th:nth-child(3), .qc-review-table td:nth-child(3) { width: 13% !important; }
            .qc-review-table th:nth-child(4), .qc-review-table td:nth-child(4) { width: 15% !important; }
            .qc-review-table th:nth-child(5), .qc-review-table td:nth-child(5) { width: 11% !important; }
            .qc-review-table th:nth-child(6), .qc-review-table td:nth-child(6) { width: 8% !important; }
            .qc-review-table th:nth-child(7), .qc-review-table td:nth-child(7) { width: 8% !important; }
            .qc-review-table th:nth-child(8), .qc-review-table td:nth-child(8) { width: 11% !important; }
            .qc-review-table th:nth-child(9), .qc-review-table td:nth-child(9) { width: 11% !important; }
            .qc-review-table .qc-review-cell {
                width: 11% !important;
                min-width: 0 !important;
                padding: .35rem .2rem;
                white-space: nowrap;
                text-align: center;
            }
            .qc-review-table .qc-review-action {
                width: 28px;
                height: 28px;
                margin: 0 1px;
                line-height: 28px;
                font-size: .9rem;
            }
            @media (max-width: 700px) {
                .qc-review-table { font-size: .72rem; }
                .qc-review-table th,
                .qc-review-table td { padding: .35rem .18rem !important; }
                .qc-review-table .qc-review-action {
                    width: 24px;
                    height: 24px;
                    margin: 0;
                    line-height: 24px;
                    font-size: .8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        injectStyles();
        bindDailyDetailClicks();
        const desktop = document.querySelector('.sidebar-nav a.nav-link[data-permission="qc.read"]');
        const mobile = document.querySelector('.mobile-nav-item[data-permission="qc.read"]');
        addQCCaret(desktop);
        addQCCaret(mobile);
        addDesktopSubmenu(desktop);
        addMobileSubmenu(mobile);
        setReviewSubmenuOpen(false);
        document.querySelectorAll('.sidebar-nav a.nav-link:not([data-permission="qc.read"]), .mobile-nav-item:not([data-permission="qc.read"])').forEach(link => {
            link.addEventListener('click', () => setReviewSubmenuOpen(false));
        });
        const root = document.getElementById('qc-history-tab');
        if (root) new MutationObserver(scheduleEnhance).observe(root, { childList: true, subtree: true });
        // Pending rows are read directly from *_Pending sheets by the QC
        // history loader. Do not block that page on the slower six-sheet
        // Reviewed metadata request; it is only needed for the Reviewed view.
        enhanceAll();
    }

    window.openQCReviewView = openQCReviewView;
    window.refreshQCReviewStatuses = function () { loadReviewStatuses().then(enhanceAll); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
