const SHEET_NAME = "Inspection";
const DAILY_REPORT_ID_HEADER = "SubmissionId";
const DAILY_REPORT_COLOR_HEADER = "Color";
const DAILY_REPORT_PRODUCT_GROUP_HEADER = "ProductGroup";
const DAILY_REPORT_PART_CATEGORY_HEADER = "PartCategory";
const DAILY_REPORT_COLOR_CODE_HEADER = "ColorCode";
const DAILY_REPORT_DUST_HEADER = "Dust";
const DAILY_REPORT_OIL_HEADER = "Oil";
const DAILY_REPORT_RUST_HEADER = "Rust";
const PARAMETER_CHECKLIST_SHEET_NAME = "ParameterChecklist";
const WATER_PARAMETER_CHECKLIST_SHEET_NAME = "WaterParameterChecklist";
const EQUIPMENT_CHECKLIST_SHEET_NAME = "EquipmentChecklist";
const REWORK_SHEET_NAME = "REWORK";
// Dedicated storage for the Screen checklist menu (created on first use).
const SCREEN_SHEET_NAME = "SCREEN";
const QC_PENDING_SUFFIX = "_Pending";
const QC_REVIEWED_SUFFIX = "_Reviewed";
const QC_MIGRATION_SOURCES = ["ParameterChecklist", "WaterParameterChecklist", "EquipmentChecklist", "SCREEN", "REWORK", "outputdiary"];
const PARAMETER_CHECKLIST_ID_HEADER = "SubmissionId";
const ALL_PERMISSIONS = ["dashboard.read", "qc7.read", "qc.read", "inspection.create", "daily_report.read", "rework.read", "screen.read", "checklist.read", "events.read", "history.read", "users.manage"];
const DEFAULT_USER_PERMISSIONS = ["dashboard.read", "qc7.read", "qc.read", "inspection.create", "daily_report.read", "rework.read", "screen.read", "checklist.read", "events.read", "history.read"];

// Production catalog used by the daily report cascading selectors.
const PART_MODEL_CATALOG = {
  "LC600 Classic": { colors: [{ value: "GREY BUTTER", label: "GREY BUTTER (1025216PX20)", code: "1025216PX20" }], categories: {
    "Flat Door": [{ value: "7517016200", label: "Flat Door (7517016200)" }],
    "Gland Plate": [{ value: "7517014800", label: "Gland Plate (7517014800)" }],
    "Cover (Four types)": [
      { value: "75170152", label: "Cover (Four types) (75170152)" },
      { value: "75170153", label: "Cover (Four types) (75170153)" },
      { value: "75170154", label: "Cover (Four types) (75170154)" },
      { value: "75170155", label: "Cover (Four types) (75170155)" }
    ],
    "Box": [{ value: "7517014500", label: "Box (7517014500)" }]
  } },
  "LC600 Visi-smart": { colors: [{ value: "WHITE", label: "WHITE (1003532PX20)", code: "1003532PX20" }], categories: {
    "Curve Door": [{ value: "7517016600", label: "Curve Door (7517016600)" }],
    "Gland Plate": [{ value: "7517014000", label: "Gland Plate (7517014000)" }],
    "Cover (Four types)": [
      { value: "75170152", label: "Cover (Four types) (75170152)" },
      { value: "75170153", label: "Cover (Four types) (75170153)" },
      { value: "75170154", label: "Cover (Four types) (75170154)" },
      { value: "75170155", label: "Cover (Four types) (75170155)" }
    ],
    "Box": [{ value: "7517014500", label: "Box (7517014500)" }]
  } },
  "PDB": { colors: [{ value: "WHITE N-47", label: "WHITE N-47 (1214891PX20)", code: "1214891PX20" }], categories: {
    "PDB": [
      { value: "827111-S", label: "DBS30 (827111-S)" },
      { value: "827198-S", label: "DBS45 (827198-S)" },
      { value: "827285-S", label: "DBS60 (827285-S)" }
    ]
  } },
  "CU (resi thai)": { colors: [{ value: "White 2910", label: "White 2910 (1223326PX20)", code: "1223326PX20" }], categories: {
    "Metal Box": [
      { value: "BRU30887", label: "METAL BOX 4/6 WAY (BRU30887)" },
      { value: "BRU30888", label: "METAL BOX 8/10 WAY (BRU30888)" },
      { value: "BRU30889", label: "METAL BOX 14 WAY (BRU30889)" }
    ],
    "Metal Cover": [
      { value: "BRU30890", label: "METAL COVER 4 WAY (BRU30890)" },
      { value: "BRU30891", label: "METAL COVER 6 WAY (BRU30891)" },
      { value: "BRU30892", label: "METAL COVER 8 WAY (BRU30892)" },
      { value: "BRU30893", label: "METAL COVER 10 WAY (BRU30893)" },
      { value: "BRU30894", label: "METAL COVER 14 WAY (BRU30894)" }
    ]
  } },
  "NLC": { colors: [
    { value: "GREY", label: "GREY (1259025)", code: "1259025" },
    { value: "WHITE SE3", label: "WHITE SE3 (1259107)", code: "1259107" }
  ], categories: {
    "U BOX": [["BRU53714", "U BOX 450mm"], ["BRU53715", "U BOX 600mm"], ["BRU53716", "U BOX 750mm"], ["BRU53771", "U BOX 900mm"]].map(x => ({ value: x[0], label: x[1] + " (" + x[0] + ")" })),
    "Door": [["BRU53743", "Door 450mm"], ["BRU53744", "Door 600mm"], ["BRU53747", "Door 750mm"], ["BRU53749", "Door 900mm"]].map(x => ({ value: x[0], label: x[1] + " (" + x[0] + ")" })),
    "Gland Plate": [{ value: "BRU53717", label: "Gland Plate (BRU53717)" }],
    "Cover 100EZ": [["BRU53718", "Cover EZ100 450mm 12 way"], ["BRU53719", "Cover EZ100 600mm 18 way"], ["BRU53720", "Cover EZ100 600mm 24 way"], ["BRU53721", "Cover EZ100 600mm 30 way"], ["BRU53722", "Cover EZ100 750mm 36 way"], ["BRU53723", "Cover EZ100 750mm 42 way"]].map(x => ({ value: x[0], label: x[1] + " (" + x[0] + ")" })),
    "Cover 100LUG": [["BRU53724", "Cover LUG100 450mm 12 way"], ["BRU53725", "Cover LUG100 450mm 18 way"], ["BRU53726", "Cover LUG100 600mm 24 way"], ["BRU53727", "Cover LUG100 600mm 30 way"], ["BRU53728", "Cover LUG100 600mm 36 way"], ["BRU53729", "Cover LUG100 750mm 42 way"]].map(x => ({ value: x[0], label: x[1] + " (" + x[0] + ")" })),
    "Cover 250EZ": [["BRU53730", "Cover EZ250 600mm 12 way"], ["BRU53731", "Cover EZ250 600mm 18 way"], ["BRU53732", "Cover EZ250 750mm 24 way"], ["BRU53734", "Cover EZ250 750mm 30 way"], ["BRU53735", "Cover EZ250 900mm 36 way"], ["BRU53736", "Cover EZ250 900mm 42 way"], ["BRU53737", "Cover EZ250 900mm 48 way"]].map(x => ({ value: x[0], label: x[1] + " (" + x[0] + ")" })),
    "Cover 250LUG": [["BRU53738", "Cover LUG250 450mm 12 way"], ["BRU53739", "Cover LUG250 600mm 18 way"], ["BRU53740", "Cover LUG250 600mm 24 way"], ["BRU53741", "Cover LUG250 600mm 30 way"], ["BRU53742", "Cover LUG250 750mm 36 way"], ["BRU53745", "Cover LUG250 750mm 42 way"], ["BRU53746", "Cover LUG250 900mm 48 way"]].map(x => ({ value: x[0], label: x[1] + " (" + x[0] + ")" }))
  } },
  // Keep NMS selectable while its part/model catalog is being prepared.
  "NMS": { colors: [], categories: { "Box": [], "Cover": [] } }
};

function getDefaultPermissions(role) {
  return String(role || "").trim() === "Super Admin" ? ALL_PERMISSIONS.slice() : DEFAULT_USER_PERMISSIONS.slice();
}

function parsePermissions(value, role) {
  if (String(role || "").trim() === "Super Admin") return ALL_PERMISSIONS.slice();
  if (!value) return getDefaultPermissions(role);
  try {
    const parsed = Array.isArray(value) ? value : JSON.parse(String(value));
    if (!Array.isArray(parsed)) return getDefaultPermissions(role);
    return parsed.filter(p => ALL_PERMISSIONS.indexOf(String(p)) >= 0);
  } catch (e) {
    return getDefaultPermissions(role);
  }
}

function permissionsJson(value, role) {
  return JSON.stringify(parsePermissions(value, role));
}

// Keep daily-report submissions idempotent. If the browser times out after
// Google Sheets has already written the rows, retrying the same submissionId
// must not append a duplicate set of rows.
function ensureDailyReportIdColumn(sheet) {
  const lastColumn = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const existingIndex = headers.indexOf(DAILY_REPORT_ID_HEADER);
  if (existingIndex >= 0) return existingIndex + 1;
  const newColumn = lastColumn + 1;
  sheet.getRange(1, newColumn).setValue(DAILY_REPORT_ID_HEADER);
  return newColumn;
}

function ensureDailyReportColorColumn(sheet) {
  const lastColumn = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const existingIndex = headers.indexOf(DAILY_REPORT_COLOR_HEADER);
  if (existingIndex >= 0) return existingIndex + 1;
  const newColumn = lastColumn + 1;
  sheet.getRange(1, newColumn).setValue(DAILY_REPORT_COLOR_HEADER);
  return newColumn;
}

function ensureDailyReportCatalogColumns(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(String);
  const names = [DAILY_REPORT_PRODUCT_GROUP_HEADER, DAILY_REPORT_PART_CATEGORY_HEADER, DAILY_REPORT_COLOR_CODE_HEADER, DAILY_REPORT_DUST_HEADER, DAILY_REPORT_OIL_HEADER, DAILY_REPORT_RUST_HEADER];
  names.forEach(name => {
    if (headers.indexOf(name) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(name);
      headers.push(name);
    }
  });
  return names.reduce((result, name) => {
    result[name] = headers.indexOf(name) + 1;
    return result;
  }, {});
}

function hasDailyReportSubmission(sheet, submissionId, idColumn) {
  if (!submissionId || sheet.getLastRow() < 2) return false;
  const values = sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1).getValues();
  return values.some(row => String(row[0] || "").trim() === submissionId);
}

// REWORK intentionally uses its own sheet, while keeping the same row shape
// as outputdiary so the production form can be reused without mixing data.
function reworkReportHeaders_() {
  return [
    "Timestamp", "Date", "Shift", "Recorder", "Checker",
    "Downtime_Burner", "Downtime_Wash", "Downtime_Oven_Etc", "Downtime_Note",
    "Model", "TimeSlot", "ProdQty", "Dent", "ColorDrop", "ThinPaint", "ThickPaint",
    "WaterStain", "OtherDefect", "TotalDefect", DAILY_REPORT_ID_HEADER, DAILY_REPORT_COLOR_HEADER,
    DAILY_REPORT_PRODUCT_GROUP_HEADER, DAILY_REPORT_PART_CATEGORY_HEADER, DAILY_REPORT_COLOR_CODE_HEADER,
    DAILY_REPORT_DUST_HEADER, DAILY_REPORT_OIL_HEADER, DAILY_REPORT_RUST_HEADER
  ];
}

function ensureReworkReportSheet_(ss) {
  let sheet = ss.getSheetByName(REWORK_SHEET_NAME + QC_PENDING_SUFFIX);
  if (!sheet) sheet = ss.insertSheet(REWORK_SHEET_NAME + QC_PENDING_SUFFIX);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(reworkReportHeaders_());
    sheet.setFrozenRows(1);
  }
  ensureDailyReportIdColumn(sheet);
  ensureDailyReportColorColumn(sheet);
  ensureDailyReportCatalogColumns(sheet);
  return sheet;
}

function appendReworkReport_(ss, payload) {
  const sheet = ensureReworkReportSheet_(ss);
  const submissionId = String(payload.submissionId || "").trim();
  const idColumn = ensureDailyReportIdColumn(sheet);
  if (hasDailyReportSubmission(sheet, submissionId, idColumn)) return { duplicate: true };

  const now = new Date();
  const dateVal = String(payload.date || formatDateStr(now, false));
  const shiftVal = String(payload.shift || "");
  const recorderVal = String(payload.recorder || "");
  const checkerVal = String(payload.checker || "");
  const dt = payload.downtime || {};
  const burner = Number(dt.burner) || 0;
  const wash = Number(dt.wash) || 0;
  const ovenEtc = (Number(dt.oven) || 0) + (Number(dt.gun) || 0) + (Number(dt.power) || 0) + (Number(dt.motor) || 0) + (Number(dt.other) || 0);
  const dtNote = String(dt.note || "");
  const records = Array.isArray(payload.records) ? payload.records : [];

  records.forEach(r => {
    const values = [
      now, dateVal, shiftVal, recorderVal, checkerVal,
      burner, wash, ovenEtc, dtNote,
      String(r.model || ""), String(r.timeSlot || ""), Number(r.prodQty) || 0,
      Number(r.dent) || 0, Number(r.colorDrop) || 0, Number(r.thinPaint) || 0,
      Number(r.thickPaint) || 0, Number(r.waterStain) || 0, Number(r.otherDefect) || 0,
      Number(r.totalDefect) || 0, submissionId, String(r.color || ""),
      String(r.productGroup || ""), String(r.partCategory || ""), String(r.colorCode || ""),
      Number(r.dust) || 0, Number(r.oil) || 0, Number(r.rust) || 0
    ];
    sheet.appendRow(values);
  });
  SpreadsheetApp.flush();
  return { duplicate: false, rows: records.length };
}

function readReworkReports_(ss, requestedDate) {
  const sheet = ss.getSheetByName(REWORK_SHEET_NAME + QC_PENDING_SUFFIX);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const values = sheet.getDataRange().getValues();
  values.shift();
  const data = values.map(r => ({
    timestamp: formatDateStr(r[0], true), date: formatDateStr(r[1], false), shift: String(r[2] || ""),
    recorder: String(r[3] || ""), checker: String(r[4] || ""), downtimeBurner: Number(r[5]) || 0,
    downtimeWash: Number(r[6]) || 0, downtimeOvenEtc: Number(r[7]) || 0, downtimeNote: String(r[8] || ""),
    model: String(r[9] || ""), timeSlot: String(r[10] || ""), prodQty: Number(r[11]) || 0,
    dent: Number(r[12]) || 0, colorDrop: Number(r[13]) || 0, thinPaint: Number(r[14]) || 0,
    thickPaint: Number(r[15]) || 0, waterStain: Number(r[16]) || 0, otherDefect: Number(r[17]) || 0,
    totalDefect: Number(r[18]) || 0, submissionId: String(r[19] || ""), color: String(r[20] || ""),
    productGroup: String(r[21] || ""), partCategory: String(r[22] || ""), colorCode: String(r[23] || ""),
    dust: Number(r[24]) || 0, oil: Number(r[25]) || 0, rust: Number(r[26]) || 0
  }));
  const filter = String(requestedDate || "").trim();
  return filter ? data.filter(r => String(r.date || "").substring(0, 10) === filter) : data;
}

// SCREEN intentionally uses its own sheet while sharing the REWORK row shape.
function screenReportHeaders_() {
  return [
    "Timestamp", "Date", "Shift", "Recorder", "Checker",
    "Downtime_Burner", "Downtime_Wash", "Downtime_Oven_Etc", "Downtime_Note",
    "Model", "TimeSlot", "ProdQty", "Dent", "ColorDrop", "ThinPaint", "ThickPaint",
    "WaterStain", "OtherDefect", "TotalDefect", DAILY_REPORT_ID_HEADER, DAILY_REPORT_COLOR_HEADER,
    DAILY_REPORT_PRODUCT_GROUP_HEADER, DAILY_REPORT_PART_CATEGORY_HEADER, DAILY_REPORT_COLOR_CODE_HEADER,
    DAILY_REPORT_DUST_HEADER, DAILY_REPORT_OIL_HEADER, DAILY_REPORT_RUST_HEADER
  ];
}

function ensureScreenReportSheet_(ss) {
  let sheet = ss.getSheetByName(SCREEN_SHEET_NAME + QC_PENDING_SUFFIX);
  if (!sheet) sheet = ss.insertSheet(SCREEN_SHEET_NAME + QC_PENDING_SUFFIX);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(screenReportHeaders_());
    sheet.setFrozenRows(1);
  }
  ensureDailyReportIdColumn(sheet);
  ensureDailyReportColorColumn(sheet);
  ensureDailyReportCatalogColumns(sheet);
  return sheet;
}

function appendScreenReport_(ss, payload) {
  const sheet = ensureScreenReportSheet_(ss);
  const submissionId = String(payload.submissionId || "").trim();
  const idColumn = ensureDailyReportIdColumn(sheet);
  if (hasDailyReportSubmission(sheet, submissionId, idColumn)) return { duplicate: true };

  const now = new Date();
  const dateVal = String(payload.date || formatDateStr(now, false));
  const shiftVal = String(payload.shift || "");
  const recorderVal = String(payload.recorder || "");
  const checkerVal = String(payload.checker || "");
  const dt = payload.downtime || {};
  const burner = Number(dt.burner) || 0;
  const wash = Number(dt.wash) || 0;
  const ovenEtc = (Number(dt.oven) || 0) + (Number(dt.gun) || 0) + (Number(dt.power) || 0) + (Number(dt.motor) || 0) + (Number(dt.other) || 0);
  const dtNote = String(dt.note || "");
  const records = Array.isArray(payload.records) ? payload.records : [];
  records.forEach(r => {
    sheet.appendRow([
      now, dateVal, shiftVal, recorderVal, checkerVal,
      burner, wash, ovenEtc, dtNote,
      String(r.model || ""), String(r.timeSlot || ""), Number(r.prodQty) || 0,
      Number(r.dent) || 0, Number(r.colorDrop) || 0, Number(r.thinPaint) || 0,
      Number(r.thickPaint) || 0, Number(r.waterStain) || 0, Number(r.otherDefect) || 0,
      Number(r.totalDefect) || 0, submissionId, String(r.color || ""),
      String(r.productGroup || ""), String(r.partCategory || ""), String(r.colorCode || ""),
      Number(r.dust) || 0, Number(r.oil) || 0, Number(r.rust) || 0
    ]);
  });
  SpreadsheetApp.flush();
  return { duplicate: false, rows: records.length };
}

function readScreenReports_(ss, requestedDate) {
  const sheet = ss.getSheetByName(SCREEN_SHEET_NAME + QC_PENDING_SUFFIX);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const values = sheet.getDataRange().getValues();
  values.shift();
  const data = values.map(r => ({
    timestamp: formatDateStr(r[0], true), date: formatDateStr(r[1], false), shift: String(r[2] || ""),
    recorder: String(r[3] || ""), checker: String(r[4] || ""), downtimeBurner: Number(r[5]) || 0,
    downtimeWash: Number(r[6]) || 0, downtimeOvenEtc: Number(r[7]) || 0, downtimeNote: String(r[8] || ""),
    model: String(r[9] || ""), timeSlot: String(r[10] || ""), prodQty: Number(r[11]) || 0,
    dent: Number(r[12]) || 0, colorDrop: Number(r[13]) || 0, thinPaint: Number(r[14]) || 0,
    thickPaint: Number(r[15]) || 0, waterStain: Number(r[16]) || 0, otherDefect: Number(r[17]) || 0,
    totalDefect: Number(r[18]) || 0, submissionId: String(r[19] || ""), color: String(r[20] || ""),
    productGroup: String(r[21] || ""), partCategory: String(r[22] || ""), colorCode: String(r[23] || ""),
    dust: Number(r[24]) || 0, oil: Number(r[25]) || 0, rust: Number(r[26]) || 0
  }));
  const filter = String(requestedDate || "").trim();
  return filter ? data.filter(r => String(r.date || "").substring(0, 10) === filter) : data;
}

function ensureParameterChecklistSheet(ss, checklistType) {
  const isWater = String(checklistType || "full").toLowerCase() === "water";
  const sheetName = isWater
    ? WATER_PARAMETER_CHECKLIST_SHEET_NAME
    : PARAMETER_CHECKLIST_SHEET_NAME;
  const baseHeaders = [
    "Timestamp", "Date", "Operator", "TeamLeader", "ItemNo", "Process",
    "CheckItem", "Standard", "ActualValue", "Status", "Note", PARAMETER_CHECKLIST_ID_HEADER, "ChecklistType"
  ];
  const headers = isWater ? baseHeaders.concat(["Time"]) : baseHeaders;
  let sheet = ss.getSheetByName(sheetName + QC_PENDING_SUFFIX);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName + QC_PENDING_SUFFIX);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else if (sheet.getLastColumn() < 13) {
    sheet.getRange(1, 13).setValue("ChecklistType");
  }
  if (isWater) {
    const lastColumn = Math.max(1, sheet.getLastColumn());
    const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
    if (currentHeaders.indexOf("Time") < 0) {
      sheet.getRange(1, lastColumn + 1).setValue("Time");
    }
  }
  return sheet;
}

function hasParameterChecklistSubmission(sheet, submissionId) {
  if (!submissionId || sheet.getLastRow() < 2) return false;
  const lastColumn = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const idIndex = headers.indexOf(PARAMETER_CHECKLIST_ID_HEADER);
  if (idIndex < 0) return false;
  const values = sheet.getRange(2, idIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  return values.some(row => String(row[0] || "").trim() === submissionId);
}

function ensureEquipmentChecklistSheet(ss) {
  let sheet = ss.getSheetByName(EQUIPMENT_CHECKLIST_SHEET_NAME + QC_PENDING_SUFFIX);
  if (!sheet) {
    sheet = ss.insertSheet(EQUIPMENT_CHECKLIST_SHEET_NAME + QC_PENDING_SUFFIX);
    sheet.appendRow([
      "Timestamp", "Date", "Operator", "TeamLeader", "ItemNo", "CheckItem",
      "Method", "Standard", "ImageUrl", "Status", "Note", PARAMETER_CHECKLIST_ID_HEADER
    ]);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", "Date", "Operator", "TeamLeader", "ItemNo", "CheckItem",
      "Method", "Standard", "ImageUrl", "Status", "Note", PARAMETER_CHECKLIST_ID_HEADER
    ]);
  }
  return sheet;
}

function hasEquipmentChecklistSubmission(sheet, submissionId) {
  if (!submissionId || sheet.getLastRow() < 2) return false;
  const lastColumn = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const idIndex = headers.indexOf(PARAMETER_CHECKLIST_ID_HEADER);
  if (idIndex < 0) return false;
  const values = sheet.getRange(2, idIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  return values.some(row => String(row[0] || "").trim() === submissionId);
}

function formatDateStr(d, includeTime) {
  if (!d) return "";
  if (d instanceof Date) {
    var yyyy = d.getFullYear();
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    var hh = ('0' + d.getHours()).slice(-2);
    var min = ('0' + d.getMinutes()).slice(-2);
    if (includeTime) {
      return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min;
    }
    return yyyy + '-' + mm + '-' + dd;
  }
  var str = String(d).trim();
  if (str.includes('T')) {
    try {
      var dt = new Date(str);
      if (!isNaN(dt.getTime())) {
        var y = dt.getFullYear();
        var m = ('0' + (dt.getMonth() + 1)).slice(-2);
        var day = ('0' + dt.getDate()).slice(-2);
        var h = ('0' + dt.getHours()).slice(-2);
        var mi = ('0' + dt.getMinutes()).slice(-2);
        return y + '-' + m + '-' + day + (includeTime ? (' ' + h + ':' + mi) : '');
      }
    } catch(e) {}
    return str.split('T')[0];
  }
  return str;
}

// QC review decisions are append-only and are stored separately from the
// source tables.  A row is added only after a QC user explicitly clicks ✓/✕.
function ensureQCMirrorSheets_(ss, sourceSheetName, rowValues) {
  const base = String(sourceSheetName || "QC").trim() || "QC";
  const pendingName = base + QC_PENDING_SUFFIX;
  const reviewedName = base + QC_REVIEWED_SUFFIX;
  [pendingName, reviewedName].forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      const source = ss.getSheetByName(base);
      const headers = source && source.getLastColumn() > 0
        ? source.getRange(1, 1, 1, source.getLastColumn()).getValues()[0]
        : (Array.isArray(rowValues) ? rowValues.map((_, i) => "Column" + (i + 1)) : []);
      sheet.appendRow(headers.concat(["QCStatus", "QCReviewedAt", "QCReviewedBy", "QCReviewKey"]));
      sheet.setFrozenRows(1);
    }
  });
  return { pending: ss.getSheetByName(pendingName), reviewed: ss.getSheetByName(reviewedName) };
}

function ensureAllQCMirrorSheets_(ss) {
  QC_MIGRATION_SOURCES.forEach(name => {
    ensureQCMirrorSheets_(ss, name, []);
  });
}

function migrateExistingQCData_(ss) {
  const moved = [];
  QC_MIGRATION_SOURCES.forEach(base => {
    const source = ss.getSheetByName(base);
    if (!source || source.getLastRow() <= 1) return;
    const pendingName = base + QC_PENDING_SUFFIX;
    let pending = ss.getSheetByName(pendingName);
    if (!pending) pending = ss.insertSheet(pendingName);
    const sourceValues = source.getDataRange().getValues();
    if (pending.getLastRow() === 0) {
      pending.getRange(1, 1, sourceValues.length, sourceValues[0].length).setValues(sourceValues);
    } else {
      const existing = pending.getLastRow();
      const rows = sourceValues.slice(1);
      if (rows.length) pending.getRange(existing + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    source.deleteRows(2, source.getLastRow() - 1);
    moved.push({ source: base, pending: pendingName, rows: sourceValues.length - 1 });
  });
  SpreadsheetApp.flush();
  return moved;
}

function appendQCReviewRecord_(ss, payload) {
  let sourceName = String(payload && payload.sourceSheet || "QC").trim() || "QC";
  if (sourceName === "ScreenReports") sourceName = "SCREEN";
  const record = payload && payload.record && Array.isArray(payload.record.cells) ? payload.record.cells : [];
  const mirrors = ensureQCMirrorSheets_(ss, sourceName, record);
  const sourceSheet = ss.getSheetByName(sourceName + QC_PENDING_SUFFIX) || ss.getSheetByName(sourceName);
  const reviewedSheet = mirrors.reviewed;
  const reviewKey = String(payload && payload.reviewKey || "").trim();
  if (reviewKey && reviewedSheet.getLastRow() > 1) {
    const keys = reviewedSheet.getRange(2, reviewedSheet.getLastColumn(), reviewedSheet.getLastRow() - 1, 1).getValues();
    if (keys.some(row => String(row[0] || "").trim() === reviewKey)) {
      return { duplicate: true };
    }
  }

  const reviewer = payload && payload.reviewedBy;
  const reviewerName = typeof reviewer === "string"
    ? reviewer
    : String((reviewer && (reviewer.displayName || reviewer.name || reviewer.employeeId)) || "");
  const status = String(payload && payload.status || "").trim();
  const reviewedAt = new Date();
  reviewedSheet.appendRow(record.concat([status, reviewedAt, reviewerName, reviewKey]));
  // Copy-first, delete-second: the source row is removed only after the reviewed copy exists.
  if (sourceSheet && sourceSheet.getLastRow() > 1 && record.length) {
    const values = sourceSheet.getDataRange().getDisplayValues();
    for (let i = values.length - 1; i >= 1; i--) {
      const row = values[i].map(v => String(v == null ? "" : v).trim());
      const wanted = record.map(v => String(v == null ? "" : v).trim());
      if (row.length >= wanted.length && wanted.every((v, idx) => row[idx] === v)) {
        sourceSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  SpreadsheetApp.flush();
  return { duplicate: false };
}

function readQCReviewRecords_(ss) {
  const result = [];
  QC_MIGRATION_SOURCES.forEach(base => {
    const sheet = ss.getSheetByName(base + QC_REVIEWED_SUFFIX);
    if (!sheet || sheet.getLastRow() <= 1) return;
    const values = sheet.getDataRange().getValues();
    const headers = values.shift().map(String);
    const statusIndex = headers.indexOf("QCStatus");
    const reviewedAtIndex = headers.indexOf("QCReviewedAt");
    const reviewerIndex = headers.indexOf("QCReviewedBy");
    const keyIndex = headers.indexOf("QCReviewKey");
    values.forEach(row => result.push({
      reviewedAt: formatDateStr(row[reviewedAtIndex], true),
      status: String(row[statusIndex] || ""),
      sourceSheet: base,
      reviewKey: String(row[keyIndex] || ""),
      reviewedBy: String(row[reviewerIndex] || ""),
      record: { cells: row.slice(0, statusIndex) }
    }));
  });
  return result;
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // QC review writes must not initialize/read the legacy inspection sheet.
    // That unnecessary operation was making the button wait or time out.
    const earlyAction = (e && e.parameter && e.parameter.action) || "";
    if (earlyAction === "submitQCReview") {
      let earlyPayload = {};
      try {
        earlyPayload = e && e.postData && e.postData.contents
          ? JSON.parse(e.postData.contents) : (e.parameter || {});
      } catch (parseErr) { earlyPayload = e.parameter || {}; }
      const earlyResult = appendQCReviewRecord_(ss, earlyPayload || {});
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", action: "submitQCReview", duplicate: !!earlyResult.duplicate
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let sheet = ss.getSheetByName(SHEET_NAME);

    /* Inspection writes are sent as GET by the web client for Apps Script CORS compatibility.
    // Keep the GET endpoint write-capable as well as the POST endpoint.
    if (action === "create") {
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(["Date", "Rust", "Dent", "Weld", "Chemical", "Oil", "Note", "Timestamp"]);
      }

      const dateVal = String((e && e.parameter && e.parameter.date) || formatDateStr(new Date(), true));
      const rustVal = Number((e && e.parameter && e.parameter.rust) || 0) || 0;
      const dentVal = Number((e && e.parameter && e.parameter.dent) || 0) || 0;
      const weldVal = Number((e && e.parameter && e.parameter.weld) || 0) || 0;
      const chemicalVal = Number((e && e.parameter && e.parameter.chemical) || 0) || 0;
      const oilVal = Number((e && e.parameter && e.parameter.oil) || 0) || 0;
      const noteVal = String((e && e.parameter && e.parameter.note) || "");

      sheet.appendRow([dateVal, rustVal, dentVal, weldVal, chemicalVal, oilVal, noteVal, new Date()]);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "create" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update") {
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "update", message: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);

      const dateVal = String((e && e.parameter && e.parameter.date) || formatDateStr(new Date(), true));
      const rustVal = Number((e && e.parameter && e.parameter.rust) || 0) || 0;
      const dentVal = Number((e && e.parameter && e.parameter.dent) || 0) || 0;
      const weldVal = Number((e && e.parameter && e.parameter.weld) || 0) || 0;
      const chemicalVal = Number((e && e.parameter && e.parameter.chemical) || 0) || 0;
      const oilVal = Number((e && e.parameter && e.parameter.oil) || 0) || 0;
      const noteVal = String((e && e.parameter && e.parameter.note) || "");
      let targetRowIndex = Number((e && e.parameter && e.parameter.rowIndex) || 0);
      const originalDate = String((e && e.parameter && e.parameter.originalDate) || dateVal);
      const values = sheet.getDataRange().getValues();

      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
        for (let i = 1; i < values.length; i++) {
          const rowDateStr = formatDateStr(values[i][0], true);
          if (rowDateStr === originalDate || rowDateStr === dateVal) {
            targetRowIndex = i + 1;
            break;
          }
        }
      }

      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.getRange(targetRowIndex, 1, 1, 8).setValues([[dateVal, rustVal, dentVal, weldVal, chemicalVal, oilVal, noteVal, new Date()]]);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "update", updatedRow: targetRowIndex })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "update", message: "Row not found for update" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "delete", message: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);

      const values = sheet.getDataRange().getValues();
      let targetRowIndex = Number((e && e.parameter && e.parameter.rowIndex) || 0);
      const searchDate = String((e && e.parameter && e.parameter.date) || "");
      const searchNote = String((e && e.parameter && e.parameter.note) || "");
      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
        for (let i = 1; i < values.length; i++) {
          const rowDateStr = formatDateStr(values[i][0], true);
          const rowNoteStr = String(values[i][6] || "");
          if ((searchDate && rowDateStr === searchDate) || (searchNote && rowNoteStr === searchNote)) {
            targetRowIndex = i + 1;
            break;
          }
        }
      }

      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(targetRowIndex);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "delete", deletedRow: targetRowIndex })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "delete", message: "Row not found for deletion" })).setMimeType(ContentService.MimeType.JSON);
    }

    */
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Date", "Rust", "Dent", "Weld", "Chemical", "Oil", "Note", "Timestamp"]);
    }

    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (pErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Explicitly check URL parameter first, then JSON body
    const action = (e && e.parameter && e.parameter.action) || (data && data.action) || "create";

    if (action === "submitQCReview") {
      const result = appendQCReviewRecord_(ss, data || {});
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", action: "submitQCReview", duplicate: !!result.duplicate
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle checkBootstrap
    if (action === "checkBootstrap") {
      let uSheet = getOrCreateUsersSheet(ss);
      const rows = uSheet.getLastRow();
      return ContentService.createTextOutput(JSON.stringify({ isBootstrap: rows <= 1 })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle login
    if (action === "login") {
      let uSheet = getOrCreateUsersSheet(ss);
      const empId = String((data && data.employeeId) || (e && e.parameter && e.parameter.employeeId) || "").trim();
      const passHash = String((data && data.passwordHash) || (e && e.parameter && e.parameter.passwordHash) || "").trim();

      const values = uSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        const rowEmpId = String(values[i][0] || "").trim();
        const rowHash = String(values[i][3] || "").trim();
        if (rowEmpId === empId) {
          if (rowHash !== passHash) {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "รหัสผ่านไม่ถูกต้อง" })).setMimeType(ContentService.MimeType.JSON);
          }
          const status = String(values[i][5] || "Pending").trim();
          if (status === "Pending") {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "บัญชีของคุณกำลังรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ" })).setMimeType(ContentService.MimeType.JSON);
          }
          if (status === "Disabled") {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "บัญชีของคุณถูกระงับการใช้งาน" })).setMimeType(ContentService.MimeType.JSON);
          }

          // Update Last Login
          const nowStr = formatDateStr(new Date(), true);
          uSheet.getRange(i + 1, 8).setValue(nowStr);
          SpreadsheetApp.flush();

          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            user: {
              employeeId: values[i][0],
              displayName: values[i][1],
              department: values[i][2],
              role: values[i][4],
              status: values[i][5],
              permissions: parsePermissions(values[i][8], values[i][4])
            }
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ไม่พบรหัสพนักงานนี้ในระบบ" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle register
    if (action === "register") {
      let uSheet = getOrCreateUsersSheet(ss);
      const empId = String((data && data.employeeId) || (e && e.parameter && e.parameter.employeeId) || "").trim();
      const name = String((data && data.displayName) || (e && e.parameter && e.parameter.displayName) || "").trim();
      const dept = String((data && data.department) || (e && e.parameter && e.parameter.department) || "Engineer").trim();
      const passHash = String((data && data.passwordHash) || (e && e.parameter && e.parameter.passwordHash) || "").trim();

      const values = uSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === empId) {
          return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "รหัสพนักงานนี้ลงทะเบียนไว้แล้ว" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      const isFirstUser = values.length <= 1;
      const role = isFirstUser ? "Super Admin" : "Inspector";
      const status = isFirstUser ? "Active" : "Pending";
      const permissions = getDefaultPermissions(role);
      const nowStr = formatDateStr(new Date(), true);

      uSheet.appendRow([empId, name, dept, passHash, role, status, nowStr, "", JSON.stringify(permissions)]);
      SpreadsheetApp.flush();

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        isSuperAdmin: isFirstUser,
        role: role,
        userStatus: status
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getUsers
    if (action === "getUsers") {
      let uSheet = getOrCreateUsersSheet(ss);
      const values = uSheet.getDataRange().getValues();
      if (!values || values.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", users: [] })).setMimeType(ContentService.MimeType.JSON);
      }
      values.shift();
      const usersList = values.map(r => ({
        employeeId: String(r[0] || ""),
        displayName: String(r[1] || ""),
        department: String(r[2] || ""),
        role: String(r[4] || "Inspector"),
        status: String(r[5] || "Pending"),
        permissions: parsePermissions(r[8], String(r[4] || "Inspector")),
        createdAt: formatDateStr(r[6], true),
        lastLogin: formatDateStr(r[7], true)
      }));
      return ContentService.createTextOutput(JSON.stringify({ status: "success", users: usersList })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle updateUserStatus
    if (action === "updateUserStatus") {
      let uSheet = getOrCreateUsersSheet(ss);
      const empId = String((data && data.employeeId) || (e && e.parameter && e.parameter.employeeId) || "").trim();
      const newStatus = String((data && data.userStatus) || (e && e.parameter && e.parameter.userStatus) || "").trim();
      const newRole = String((data && data.userRole) || (e && e.parameter && e.parameter.userRole) || "").trim();
      const newPermissions = (data && data.permissions) || (e && e.parameter && e.parameter.permissions) || "";

      const values = uSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === empId) {
          if (newStatus) uSheet.getRange(i + 1, 6).setValue(newStatus);
          if (newRole) uSheet.getRange(i + 1, 5).setValue(newRole);
          if (newPermissions) uSheet.getRange(i + 1, 9).setValue(permissionsJson(newPermissions, newRole || values[i][4]));
          SpreadsheetApp.flush();
          return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "User not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle DELETE action
    if (action === "delete") {
      let targetRowIndex = Number((e && e.parameter && e.parameter.rowIndex) || data.rowIndex);
      const searchDate = (e && e.parameter && e.parameter.date) || data.date || data.originalDate;
      const searchNote = String((e && e.parameter && e.parameter.note) || data.note || "");

      const values = sheet.getDataRange().getValues();

      // If rowIndex is provided and valid, verify or use directly
      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
        targetRowIndex = 0;
        for (let i = 1; i < values.length; i++) {
          const rowDateStr = formatDateStr(values[i][0], true);
          const rowNoteStr = String(values[i][6] || "");
          if (rowDateStr === searchDate || (searchNote && rowNoteStr === searchNote)) {
            targetRowIndex = i + 1;
            break;
          }
        }
      }

      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(targetRowIndex);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "delete", deletedRow: targetRowIndex })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "delete", message: "Row not found for deletion" })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Handle UPDATE action
    if (action === "update") {
      const dateVal = data.date || (e && e.parameter && e.parameter.date) || formatDateStr(new Date(), true);
      const rustVal = Number(data.rust || (e && e.parameter && e.parameter.rust)) || 0;
      const dentVal = Number(data.dent || (e && e.parameter && e.parameter.dent)) || 0;
      const weldVal = Number(data.weld || (e && e.parameter && e.parameter.weld)) || 0;
      const chemicalVal = Number(data.chemical || (e && e.parameter && e.parameter.chemical)) || 0;
      const oilVal = Number(data.oil || (e && e.parameter && e.parameter.oil)) || 0;
      const noteVal = data.note || (e && e.parameter && e.parameter.note) || "";

      let targetRowIndex = Number((e && e.parameter && e.parameter.rowIndex) || data.rowIndex);
      const origDate = data.originalDate || (e && e.parameter && e.parameter.originalDate) || dateVal;

      const values = sheet.getDataRange().getValues();

      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
        targetRowIndex = 0;
        for (let i = 1; i < values.length; i++) {
          const rowDateStr = formatDateStr(values[i][0], true);
          if (rowDateStr === origDate || rowDateStr === dateVal) {
            targetRowIndex = i + 1;
            break;
          }
        }
      }

      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.getRange(targetRowIndex, 1, 1, 8).setValues([[
          dateVal,
          rustVal,
          dentVal,
          weldVal,
          chemicalVal,
          oilVal,
          noteVal,
          new Date()
        ]]);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "update", updatedRow: targetRowIndex })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "update", message: "Row not found for update" })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Handle REWORK submissions in the separate REWORK sheet.
    if (action === "submitReworkReport") {
      const result = appendReworkReport_(ss, data || {});
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitReworkReport", duplicate: !!result.duplicate, rows: result.rows || 0 })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle SCREEN submissions in the separate SCREEN sheet.
    if (action === "submitScreenReport") {
      const result = appendScreenReport_(ss, data || {});
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitScreenReport", duplicate: !!result.duplicate, rows: result.rows || 0 })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle submitDailyReport action
    if (action === "submitDailyReport") {
      const TARGET_SHEET_NAME = "outputdiary" + QC_PENDING_SUFFIX;
      let prodSheet = ss.getSheetByName(TARGET_SHEET_NAME);
      if (!prodSheet) {
        prodSheet = ss.insertSheet(TARGET_SHEET_NAME);
      }
      
      // If sheet is empty, create header row
      if (prodSheet.getLastRow() === 0) {
        prodSheet.appendRow([
          "Timestamp", "Date", "Shift", "Recorder", "Checker", 
          "Downtime_Burner", "Downtime_Wash", "Downtime_Oven_Etc", "Downtime_Note", 
          "Model", "TimeSlot", "ProdQty", "Dent", "ColorDrop", "ThinPaint", "ThickPaint", "WaterStain", "OtherDefect", "TotalDefect", DAILY_REPORT_ID_HEADER, DAILY_REPORT_COLOR_HEADER, DAILY_REPORT_PRODUCT_GROUP_HEADER, DAILY_REPORT_PART_CATEGORY_HEADER, DAILY_REPORT_COLOR_CODE_HEADER, DAILY_REPORT_DUST_HEADER, DAILY_REPORT_OIL_HEADER, DAILY_REPORT_RUST_HEADER
        ]);
      }

      const submissionId = String(data.submissionId || "").trim();
      const submissionIdColumn = ensureDailyReportIdColumn(prodSheet);
      ensureDailyReportColorColumn(prodSheet);
      ensureDailyReportCatalogColumns(prodSheet);
      if (hasDailyReportSubmission(prodSheet, submissionId, submissionIdColumn)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitDailyReport", duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const now = new Date();
      const dateVal = data.date || formatDateStr(now, false);
      const shiftVal = data.shift || "";
      const recorderVal = data.recorder || "";
      const checkerVal = data.checker || "";

      const dt = data.downtime || {};
      const burner = dt.burner || 0;
      const wash = dt.wash || 0;
      const ovenEtc = (dt.oven||0) + (dt.gun||0) + (dt.power||0) + (dt.motor||0) + (dt.other||0);
      const dtNote = dt.note || "";
      
      if (data.records && Array.isArray(data.records)) {
        data.records.forEach(r => {
          // Columns A-I (1-9): General Info & Downtime
          // Column J (10) onwards: Model, TimeSlot, ProdQty, Dent, ColorDrop, ThinPaint, ThickPaint, WaterStain, OtherDefect, TotalDefect; catalog fields, Dust, and Oil follow afterward.
          prodSheet.appendRow([
            now,
            dateVal,
            shiftVal,
            recorderVal,
            checkerVal,
            burner,
            wash,
            ovenEtc,
            dtNote,
            r.model,          // Column J (Column 10)
            r.timeSlot,       // Column K (Column 11)
            r.prodQty,        // Column L (Column 12)
            r.dent,           // Column M (Column 13)
            r.colorDrop,      // Column N (Column 14)
            r.thinPaint,      // Column O (Column 15)
            r.thickPaint,     // Column P (Column 16)
            r.waterStain,     // Column Q (Column 17)
            r.otherDefect,    // Column R (Column 18)
            r.totalDefect,    // Column S (Column 19)
            submissionId,     // Column T: idempotency key
            r.color || "",           // Column U: production color
            r.productGroup || "",    // Column V: product group
            r.partCategory || "",     // Column W: part category
            r.colorCode || "",        // Column X: color code
            r.dust || 0,               // Column Y: dust defect
            r.oil || 0,                // Column Z: oil defect
            r.rust || 0                // Column AA: rust defect
          ]);
        });
      }

      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitDailyReport" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle parameter checklist submission
    if (action === "submitParameterChecklist") {
      const checklistType = String(data.checklistType || "full").toLowerCase() === "water" ? "water" : "full";
      const checklistSheet = ensureParameterChecklistSheet(ss, checklistType);
      const submissionId = String(data.submissionId || "").trim();
      if (hasParameterChecklistSubmission(checklistSheet, submissionId)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitParameterChecklist", duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      }

      const now = new Date();
      const dateVal = String(data.date || formatDateStr(now, false));
      const operatorVal = String(data.operator || "");
      const leaderVal = String(data.teamLeader || "");
      const timeVal = checklistType === "water" ? String(data.time || "") : "";
      const records = Array.isArray(data.records) ? data.records : [];
      records.forEach(item => {
        const row = [
          now,
          dateVal,
          operatorVal,
          leaderVal,
          Number(item.itemNo) || 0,
          String(item.process || ""),
          String(item.checkItem || ""),
          String(item.standard || ""),
          String(item.actualValue || ""),
          String(item.status || ""),
          String(item.note || ""),
          submissionId,
          checklistType
        ];
        if (checklistType === "water") row.push(timeVal);
        checklistSheet.appendRow(row);
      });
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitParameterChecklist" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle equipment checklist submission
    if (action === "submitEquipmentChecklist") {
      const checklistSheet = ensureEquipmentChecklistSheet(ss);
      const submissionId = String(data.submissionId || "").trim();
      if (hasEquipmentChecklistSubmission(checklistSheet, submissionId)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitEquipmentChecklist", duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      }

      const now = new Date();
      const dateVal = String(data.date || formatDateStr(now, false));
      const operatorVal = String(data.operator || "");
      const leaderVal = String(data.teamLeader || "");
      const records = Array.isArray(data.records) ? data.records : [];
      records.forEach(item => {
        checklistSheet.appendRow([
          now,
          dateVal,
          operatorVal,
          leaderVal,
          Number(item.itemNo) || 0,
          String(item.checkItem || ""),
          String(item.method || ""),
          String(item.standard || ""),
          String(item.imageUrl || ""),
          String(item.status || ""),
          String(item.note || ""),
          submissionId
        ]);
      });
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitEquipmentChecklist" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle addRecorder action
    if (action === "addRecorder") {
      let recSheet = ss.getSheetByName("Recorders");
      if (!recSheet) {
        recSheet = ss.insertSheet("Recorders");
        recSheet.appendRow(["Name"]);
      }
      const newName = String(data.name || (e && e.parameter && e.parameter.name) || "").trim();
      if (newName) {
        const values = recSheet.getDataRange().getValues();
        let exists = false;
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][0]).trim() === newName) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          recSheet.appendRow([newName]);
          SpreadsheetApp.flush();
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", name: newName })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle deleteRecorder action
    if (action === "deleteRecorder") {
      let recSheet = ss.getSheetByName("Recorders");
      if (recSheet) {
        const targetName = String(data.name || (e && e.parameter && e.parameter.name) || "").trim();
        if (targetName) {
          const values = recSheet.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]).trim() === targetName) {
              recSheet.deleteRow(i + 1);
              SpreadsheetApp.flush();
              break;
            }
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle CREATE action ONLY
    if (action === "create") {
      const dateVal = data.date || (e && e.parameter && e.parameter.date) || formatDateStr(new Date(), true);
      const rustVal = Number(data.rust || (e && e.parameter && e.parameter.rust)) || 0;
      const dentVal = Number(data.dent || (e && e.parameter && e.parameter.dent)) || 0;
      const weldVal = Number(data.weld || (e && e.parameter && e.parameter.weld)) || 0;
      const chemicalVal = Number(data.chemical || (e && e.parameter && e.parameter.chemical)) || 0;
      const oilVal = Number(data.oil || (e && e.parameter && e.parameter.oil)) || 0;
      const noteVal = data.note || (e && e.parameter && e.parameter.note) || "";

      sheet.appendRow([
        dateVal,
        rustVal,
        dentVal,
        weldVal,
        chemicalVal,
        oilVal,
        noteVal,
        new Date()
      ]);

      SpreadsheetApp.flush();

      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          action: "create"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateUsersSheet(ss) {
  let uSheet = ss.getSheetByName("Users");
  if (!uSheet) {
    uSheet = ss.insertSheet("Users");
    uSheet.appendRow(["EmployeeID", "DisplayName", "Department", "PasswordHash", "Role", "Status", "CreatedAt", "LastLogin", "Permissions"]);
    SpreadsheetApp.flush();
  } else if (uSheet.getLastColumn() < 9) {
    uSheet.getRange(1, 9).setValue("Permissions");
    SpreadsheetApp.flush();
  }
  return uSheet;
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) || "";

    if (action === "migrateQCData") {
      ensureAllQCMirrorSheets_(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: action, moved: migrateExistingQCData_(ss), sheets: QC_MIGRATION_SOURCES.map(name => ({ pending: name + QC_PENDING_SUFFIX, reviewed: name + QC_REVIEWED_SUFFIX })) })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "submitQCReview") {
      let payload = {};
      try { payload = JSON.parse(String((e && e.parameter && e.parameter.payload) || "{}")); } catch (parseErr) {}
      const result = appendQCReviewRecord_(ss, payload);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", action: "submitQCReview", duplicate: !!result.duplicate
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getQCReviewData") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", data: readQCReviewRecords_(ss)
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle checkBootstrap
    if (action === "checkBootstrap") {
      let uSheet = getOrCreateUsersSheet(ss);
      const rows = uSheet.getLastRow();
      return ContentService.createTextOutput(JSON.stringify({ isBootstrap: rows <= 1 })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle login
    if (action === "login") {
      let uSheet = getOrCreateUsersSheet(ss);
      const empId = String((e && e.parameter && e.parameter.employeeId) || "").trim();
      const passHash = String((e && e.parameter && e.parameter.passwordHash) || "").trim();

      const values = uSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        const rowEmpId = String(values[i][0] || "").trim();
        const rowHash = String(values[i][3] || "").trim();
        if (rowEmpId === empId) {
          if (rowHash !== passHash) {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "รหัสผ่านไม่ถูกต้อง" })).setMimeType(ContentService.MimeType.JSON);
          }
          const status = String(values[i][5] || "Pending").trim();
          if (status === "Pending") {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "บัญชีของคุณกำลังรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ" })).setMimeType(ContentService.MimeType.JSON);
          }
          if (status === "Disabled") {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "บัญชีของคุณถูกระงับการใช้งาน" })).setMimeType(ContentService.MimeType.JSON);
          }

          // Update Last Login
          const nowStr = formatDateStr(new Date(), true);
          uSheet.getRange(i + 1, 8).setValue(nowStr);
          SpreadsheetApp.flush();

          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            user: {
              employeeId: values[i][0],
              displayName: values[i][1],
              department: values[i][2],
              role: values[i][4],
              status: values[i][5],
              permissions: parsePermissions(values[i][8], values[i][4])
            }
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ไม่พบรหัสพนักงานนี้ในระบบ" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle register
    if (action === "register") {
      let uSheet = getOrCreateUsersSheet(ss);
      const empId = String((e && e.parameter && e.parameter.employeeId) || "").trim();
      const name = String((e && e.parameter && e.parameter.displayName) || "").trim();
      const dept = String((e && e.parameter && e.parameter.department) || "แผนกพ่นสี").trim();
      const passHash = String((e && e.parameter && e.parameter.passwordHash) || "").trim();

      const values = uSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === empId) {
          return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "รหัสพนักงานนี้ลงทะเบียนไว้แล้ว" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      const isFirstUser = values.length <= 1;
      const role = isFirstUser ? "Super Admin" : "Inspector";
      const status = isFirstUser ? "Active" : "Pending";
      const permissions = getDefaultPermissions(role);
      const nowStr = formatDateStr(new Date(), true);

      uSheet.appendRow([empId, name, dept, passHash, role, status, nowStr, "", JSON.stringify(permissions)]);
      SpreadsheetApp.flush();

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        isSuperAdmin: isFirstUser,
        role: role,
        userStatus: status
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getUsers
    if (action === "getUsers") {
      let uSheet = getOrCreateUsersSheet(ss);
      const values = uSheet.getDataRange().getValues();
      if (!values || values.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", users: [] })).setMimeType(ContentService.MimeType.JSON);
      }
      values.shift();
      const usersList = values.map(r => ({
        employeeId: String(r[0] || ""),
        displayName: String(r[1] || ""),
        department: String(r[2] || ""),
        role: String(r[4] || "Inspector"),
        status: String(r[5] || "Pending"),
        permissions: parsePermissions(r[8], String(r[4] || "Inspector")),
        createdAt: formatDateStr(r[6], true),
        lastLogin: formatDateStr(r[7], true)
      }));
      return ContentService.createTextOutput(JSON.stringify({ status: "success", users: usersList })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle updateUserStatus
    if (action === "updateUserStatus") {
      let uSheet = getOrCreateUsersSheet(ss);
      const empId = String((e && e.parameter && e.parameter.employeeId) || "").trim();
      const newStatus = String((e && e.parameter && e.parameter.userStatus) || "").trim();
      const newRole = String((e && e.parameter && e.parameter.userRole) || "").trim();
      const newPermissions = (e && e.parameter && e.parameter.permissions) || "";

      const values = uSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === empId) {
          if (newStatus) uSheet.getRange(i + 1, 6).setValue(newStatus);
          if (newRole) uSheet.getRange(i + 1, 5).setValue(newRole);
          if (newPermissions) uSheet.getRange(i + 1, 9).setValue(permissionsJson(newPermissions, newRole || values[i][4]));
          SpreadsheetApp.flush();
          return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "User not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle REWORK submission via GET (fallback used by the static web app).
    if (action === "submitReworkReport") {
      let reworkPayload = {};
      if (e && e.parameter && e.parameter.payload) {
        try { reworkPayload = JSON.parse(e.parameter.payload); } catch (parseErr) {}
      } else {
        reworkPayload = e && e.parameter ? e.parameter : {};
      }
      const result = appendReworkReport_(ss, reworkPayload);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitReworkReport", duplicate: !!result.duplicate, rows: result.rows || 0 })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle SCREEN submission via GET (fallback used by the static web app).
    if (action === "submitScreenReport") {
      let screenPayload = {};
      if (e && e.parameter && e.parameter.payload) {
        try { screenPayload = JSON.parse(e.parameter.payload); } catch (parseErr) {}
      } else {
        screenPayload = e && e.parameter ? e.parameter : {};
      }
      const result = appendScreenReport_(ss, screenPayload);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitScreenReport", duplicate: !!result.duplicate, rows: result.rows || 0 })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle submitDailyReport via GET (fallback)
    if (action === "submitDailyReport") {
      const TARGET_SHEET_NAME = "outputdiary" + QC_PENDING_SUFFIX;
      let prodSheet = ss.getSheetByName(TARGET_SHEET_NAME);
      if (!prodSheet) {
        prodSheet = ss.insertSheet(TARGET_SHEET_NAME);
      }
      if (prodSheet.getLastRow() === 0) {
        prodSheet.appendRow([
          "Timestamp", "Date", "Shift", "Recorder", "Checker", 
          "Downtime_Burner", "Downtime_Wash", "Downtime_Oven_Etc", "Downtime_Note", 
          "Model", "TimeSlot", "ProdQty", "Dent", "ColorDrop", "ThinPaint", "ThickPaint", "WaterStain", "OtherDefect", "TotalDefect", DAILY_REPORT_ID_HEADER, DAILY_REPORT_COLOR_HEADER, DAILY_REPORT_PRODUCT_GROUP_HEADER, DAILY_REPORT_PART_CATEGORY_HEADER, DAILY_REPORT_COLOR_CODE_HEADER, DAILY_REPORT_DUST_HEADER, DAILY_REPORT_OIL_HEADER, DAILY_REPORT_RUST_HEADER
        ]);
      }

      let payloadData = {};
      if (e && e.parameter && e.parameter.payload) {
        try { payloadData = JSON.parse(e.parameter.payload); } catch(pErr){}
      } else {
        payloadData = e.parameter || {};
      }

      const submissionId = String(payloadData.submissionId || "").trim();
      const submissionIdColumn = ensureDailyReportIdColumn(prodSheet);
      ensureDailyReportColorColumn(prodSheet);
      ensureDailyReportCatalogColumns(prodSheet);
      if (hasDailyReportSubmission(prodSheet, submissionId, submissionIdColumn)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitDailyReport", duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      }

      const now = new Date();
      const dateVal = payloadData.date || formatDateStr(now, false);
      const shiftVal = payloadData.shift || "";
      const recorderVal = payloadData.recorder || "";
      const checkerVal = payloadData.checker || "";

      const dt = payloadData.downtime || {};
      const burner = dt.burner || 0;
      const wash = dt.wash || 0;
      const ovenEtc = (dt.oven||0) + (dt.gun||0) + (dt.power||0) + (dt.motor||0) + (dt.other||0);
      const dtNote = dt.note || "";

      let recs = payloadData.records;
      if (!recs && e.parameter.model) {
        recs = [{
          model: e.parameter.model,
          timeSlot: e.parameter.timeSlot || "08:00 - 09:00",
          prodQty: Number(e.parameter.prodQty) || 0,
          dent: Number(e.parameter.dent) || 0,
          colorDrop: Number(e.parameter.colorDrop) || 0,
          thinPaint: Number(e.parameter.thinPaint) || 0,
          thickPaint: Number(e.parameter.thickPaint) || 0,
          waterStain: Number(e.parameter.waterStain) || 0,
          oil: Number(e.parameter.oil) || 0,
          rust: Number(e.parameter.rust) || 0,
          dust: Number(e.parameter.dust) || 0,
          otherDefect: Number(e.parameter.otherDefect) || 0,
          totalDefect: Number(e.parameter.totalDefect) || 0,
          color: e.parameter.color || "",
          productGroup: e.parameter.productGroup || "",
          partCategory: e.parameter.partCategory || "",
          colorCode: e.parameter.colorCode || ""
        }];
      }

      if (recs && Array.isArray(recs)) {
        recs.forEach(r => {
          prodSheet.appendRow([
            now, dateVal, shiftVal, recorderVal, checkerVal,
            burner, wash, ovenEtc, dtNote,
            r.model, r.timeSlot, r.prodQty,
             r.dent, r.colorDrop, r.thinPaint, r.thickPaint, r.waterStain, r.otherDefect, r.totalDefect, submissionId, r.color || "", r.productGroup || "", r.partCategory || "", r.colorCode || "", r.dust || 0, r.oil || 0, r.rust || 0
          ]);
        });
      }

      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitDailyReport" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle parameter checklist submission via GET fallback
    if (action === "submitParameterChecklist") {
      let payload = {};
      if (e && e.parameter && e.parameter.payload) {
        try { payload = JSON.parse(e.parameter.payload); } catch (parseErr) {}
      } else {
        payload = e.parameter || {};
      }

      const checklistType = String(payload.checklistType || "full").toLowerCase() === "water" ? "water" : "full";
      const checklistSheet = ensureParameterChecklistSheet(ss, checklistType);

      const submissionId = String(payload.submissionId || "").trim();
      if (hasParameterChecklistSubmission(checklistSheet, submissionId)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitParameterChecklist", duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      }

      const now = new Date();
      const timeVal = checklistType === "water" ? String(payload.time || "") : "";
      const records = Array.isArray(payload.records) ? payload.records : [];
      records.forEach(item => {
        const row = [
          now,
          String(payload.date || formatDateStr(now, false)),
          String(payload.operator || ""),
          String(payload.teamLeader || ""),
          Number(item.itemNo) || 0,
          String(item.process || ""),
          String(item.checkItem || ""),
          String(item.standard || ""),
          String(item.actualValue || ""),
          String(item.status || ""),
          String(item.note || ""),
          submissionId,
          checklistType
        ];
        if (checklistType === "water") row.push(timeVal);
        checklistSheet.appendRow(row);
      });
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitParameterChecklist" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle equipment checklist submission via GET fallback
    if (action === "submitEquipmentChecklist") {
      let payload = {};
      if (e && e.parameter && e.parameter.payload) {
        try { payload = JSON.parse(e.parameter.payload); } catch (parseErr) {}
      } else {
        payload = e.parameter || {};
      }

      const checklistSheet = ensureEquipmentChecklistSheet(ss);
      const submissionId = String(payload.submissionId || "").trim();
      if (hasEquipmentChecklistSubmission(checklistSheet, submissionId)) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitEquipmentChecklist", duplicate: true })).setMimeType(ContentService.MimeType.JSON);
      }

      const now = new Date();
      const records = Array.isArray(payload.records) ? payload.records : [];
      records.forEach(item => {
        checklistSheet.appendRow([
          now,
          String(payload.date || formatDateStr(now, false)),
          String(payload.operator || ""),
          String(payload.teamLeader || ""),
          Number(item.itemNo) || 0,
          String(item.checkItem || ""),
          String(item.method || ""),
          String(item.standard || ""),
          String(item.imageUrl || ""),
          String(item.status || ""),
          String(item.note || ""),
          submissionId
        ]);
      });
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitEquipmentChecklist" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle REWORK history. Opening the menu creates the dedicated sheet
    // without touching outputdiary.
    if (action === "getReworkReportData") {
      const requestedDate = String((e && e.parameter && e.parameter.date) || "").trim();
      ensureReworkReportSheet_(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: readReworkReports_(ss, requestedDate) })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle SCREEN history. Opening the menu creates SCREEN on demand.
    if (action === "getScreenReportData") {
      const requestedDate = String((e && e.parameter && e.parameter.date) || "").trim();
      ensureScreenReportSheet_(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: readScreenReports_(ss, requestedDate) })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getDailyReportData action (outputdiary sheet tab)
    if (action === "getDailyReportData") {
      let prodSheet = ss.getSheetByName("outputdiary");
      if (!prodSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      }

      const values = prodSheet.getDataRange().getValues();
      if (!values || values.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      }

      values.shift(); // remove header row
      const data = values.map(r => ({
        timestamp: formatDateStr(r[0], true),
        date: formatDateStr(r[1], false),
        shift: String(r[2] || ""),
        recorder: String(r[3] || ""),
        checker: String(r[4] || ""),
        downtimeBurner: Number(r[5]) || 0,
        downtimeWash: Number(r[6]) || 0,
        downtimeOvenEtc: Number(r[7]) || 0,
        downtimeNote: String(r[8] || ""),
        model: String(r[9] || ""),
        timeSlot: String(r[10] || ""),
        prodQty: Number(r[11]) || 0,
        dent: Number(r[12]) || 0,
        colorDrop: Number(r[13]) || 0,
        thinPaint: Number(r[14]) || 0,
        thickPaint: Number(r[15]) || 0,
        waterStain: Number(r[16]) || 0,
        otherDefect: Number(r[17]) || 0,
        totalDefect: Number(r[18]) || 0,
        submissionId: String(r[19] || ""),
        color: String(r[20] || ""),
        productGroup: String(r[21] || ""),
        partCategory: String(r[22] || ""),
        colorCode: String(r[23] || ""),
        dust: Number(r[24]) || 0,
        oil: Number(r[25]) || 0,
        rust: Number(r[26]) || 0
      }));

      const requestedDate = String((e && e.parameter && e.parameter.date) || "").trim();
      const filteredData = requestedDate
        ? data.filter(r => String(r.date || "").substring(0, 10) === requestedDate)
        : data;

      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: filteredData })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle parameter checklist history and create its sheet on first access
    if (action === "getParameterChecklistData") {
      const requestedType = String((e && e.parameter && e.parameter.type) || "full").toLowerCase() === "water" ? "water" : "full";
      const checklistName = requestedType === "water" ? WATER_PARAMETER_CHECKLIST_SHEET_NAME : PARAMETER_CHECKLIST_SHEET_NAME;
      const checklistSheet = ss.getSheetByName(checklistName + QC_PENDING_SUFFIX) || ss.getSheetByName(checklistName);
      if (!checklistSheet) return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      if (checklistSheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      }

      const values = checklistSheet.getDataRange().getValues();
      values.shift();
      const data = values.map((r, i) => ({
        rowIndex: i + 2,
        timestamp: formatDateStr(r[0], true),
        date: formatDateStr(r[1], false),
        operator: String(r[2] || ""),
        teamLeader: String(r[3] || ""),
        itemNo: Number(r[4]) || 0,
        process: String(r[5] || ""),
        checkItem: String(r[6] || ""),
        standard: String(r[7] || ""),
        actualValue: String(r[8] || ""),
        status: String(r[9] || ""),
        note: String(r[10] || ""),
        submissionId: String(r[11] || ""),
        checklistType: String(r[12] || requestedType),
        time: requestedType === "water" ? String(r[13] || "") : ""
      }));

      const requestedDate = String((e && e.parameter && e.parameter.date) || "").trim();
      const filteredData = requestedDate
        ? data.filter(r => String(r.date || "").substring(0, 10) === requestedDate)
        : data;
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: filteredData })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle equipment checklist history and create its sheet on first access
    if (action === "getEquipmentChecklistData") {
      const checklistSheet = ss.getSheetByName(EQUIPMENT_CHECKLIST_SHEET_NAME + QC_PENDING_SUFFIX) || ss.getSheetByName(EQUIPMENT_CHECKLIST_SHEET_NAME);
      if (!checklistSheet) return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      if (checklistSheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      }

      const values = checklistSheet.getDataRange().getValues();
      values.shift();
      const data = values.map((r, i) => ({
        rowIndex: i + 2,
        timestamp: formatDateStr(r[0], true),
        date: formatDateStr(r[1], false),
        operator: String(r[2] || ""),
        teamLeader: String(r[3] || ""),
        itemNo: Number(r[4]) || 0,
        checkItem: String(r[5] || ""),
        method: String(r[6] || ""),
        standard: String(r[7] || ""),
        imageUrl: String(r[8] || ""),
        status: String(r[9] || ""),
        note: String(r[10] || ""),
        submissionId: String(r[11] || "")
      }));

      const requestedDate = String((e && e.parameter && e.parameter.date) || "").trim();
      const filteredData = requestedDate
        ? data.filter(r => String(r.date || "").substring(0, 10) === requestedDate)
        : data;
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: filteredData })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getPartModels action. Keep the legacy PartModel sheet untouched;
    // the related catalog is stored in a dedicated PartModelCatalog sheet.
    if (action === "getPartModels") {
      let catalogSheet = ss.getSheetByName("PartModelCatalog");
      if (!catalogSheet) {
        catalogSheet = ss.insertSheet("PartModelCatalog");
        catalogSheet.appendRow(["ProductGroup", "PartCategory", "ModelCode", "ModelName", "ColorName", "ColorCode"]);
        Object.keys(PART_MODEL_CATALOG).forEach(groupName => {
          const group = PART_MODEL_CATALOG[groupName];
          const firstColor = (group.colors || [])[0] || {};
          Object.keys(group.categories || {}).forEach(category => {
            (group.categories[category] || []).forEach(model => {
              catalogSheet.appendRow([groupName, category, model.value, model.label, firstColor.value || "", firstColor.code || ""]);
            });
          });
        });
        catalogSheet.setFrozenRows(1);
        SpreadsheetApp.flush();
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", groups: PART_MODEL_CATALOG })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getRecorders action (Cloud Sync)
    if (action === "getRecorders") {
      let recSheet = ss.getSheetByName("Recorders");
      if (!recSheet) {
        recSheet = ss.insertSheet("Recorders");
        recSheet.appendRow(["Name"]);
      }

      // Remove only the old sample names from the Recorders sheet. Other sheets are untouched.
      const mockRecorders = ["สมชาย ใจดี", "วิชัย มีสุข", "สมศักดิ์ ขยันงาน", "อนันต์ ราบรื่น", "ประเสริฐ ดีเยี่ยม"];
      const valuesBeforeCleanup = recSheet.getDataRange().getValues();
      for (let i = valuesBeforeCleanup.length - 1; i >= 1; i--) {
        const name = String(valuesBeforeCleanup[i][0] || "").trim();
        if (mockRecorders.indexOf(name) >= 0) recSheet.deleteRow(i + 1);
      }

      const values = recSheet.getDataRange().getValues();
      const list = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i][0]) {
          list.push(String(values[i][0]).trim());
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", recorders: list })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle addRecorder action via GET fallback
    if (action === "addRecorder") {
      let recSheet = ss.getSheetByName("Recorders");
      if (!recSheet) {
        recSheet = ss.insertSheet("Recorders");
        recSheet.appendRow(["Name"]);
      }
      const newName = String((e && e.parameter && e.parameter.name) || "").trim();
      if (newName) {
        const values = recSheet.getDataRange().getValues();
        let exists = false;
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][0]).trim() === newName) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          recSheet.appendRow([newName]);
          SpreadsheetApp.flush();
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", name: newName })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle deleteRecorder action via GET fallback
    if (action === "deleteRecorder") {
      let recSheet = ss.getSheetByName("Recorders");
      if (recSheet) {
        const targetName = String((e && e.parameter && e.parameter.name) || "").trim();
        if (targetName) {
          const values = recSheet.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]).trim() === targetName) {
              recSheet.deleteRow(i + 1);
              SpreadsheetApp.flush();
              break;
            }
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle 5M1E Events (getEvents)
    if (action === "getEvents" || (e && e.parameter && e.parameter.sheet === "events") || (e && e.parameter && e.parameter.sheet === "5M1E_Events")) {
      let evtSheet = getOrCreateEventsSheet(ss);

      const values = evtSheet.getDataRange().getValues();
      if (!values || values.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] })).setMimeType(ContentService.MimeType.JSON);
      }

      const header = values.shift();
      const eventsData = values.map((r, i) => ({
        rowIndex: i + 2,
        date: formatDateStr(r[0], false),
        time: String(r[1] || ""),
        shift: String(r[2] || "กะเช้า"),
        category: String(r[3] || "Machine"),
        process: String(r[4] || ""),
        title: String(r[5] || ""),
        detail: String(r[6] || ""),
        action: String(r[7] || ""),
        recorder: String(r[8] || ""),
        timestamp: formatDateStr(r[9] || r[0], true),
        id: String(r[10] || ("evt_" + (i + 1))),
        quantity: Number(r[11]) || 0
      }));

      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: eventsData })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle createEvent action via GET/POST fallback
    if (action === "createEvent") {
      let evtSheet = getOrCreateEventsSheet(ss);
      const eDate = String((e && e.parameter && e.parameter.date) || "").trim();
      const eTime = String((e && e.parameter && e.parameter.time) || "").trim();
      const eShift = String((e && e.parameter && e.parameter.shift) || "กะเช้า").trim();
      const eCat = String((e && e.parameter && e.parameter.category) || "Machine").trim();
      const eProc = String((e && e.parameter && e.parameter.process) || "").trim();
      const eTitle = String((e && e.parameter && e.parameter.title) || "").trim();
      const eDetail = String((e && e.parameter && e.parameter.detail) || "").trim();
      const eAct = String((e && e.parameter && e.parameter.actionTaken) || (e && e.parameter && e.parameter.action) || "").trim();
      const eRec = String((e && e.parameter && e.parameter.recorder) || "").trim();
      const eQuantity = Math.max(0, Number((e && e.parameter && e.parameter.quantity) || 0) || 0);
      const eId = "evt_" + new Date().getTime();
      const nowStr = formatDateStr(new Date(), true);

      evtSheet.appendRow([eDate, eTime, eShift, eCat, eProc, eTitle, eDetail, eAct, eRec, nowStr, eId, eQuantity]);
      SpreadsheetApp.flush();

      return ContentService.createTextOutput(JSON.stringify({ status: "success", id: eId })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle deleteEvent action via GET/POST fallback
    if (action === "deleteEvent") {
      let evtSheet = getOrCreateEventsSheet(ss);
      if (evtSheet) {
        const targetId = String((e && e.parameter && e.parameter.id) || "").trim();
        const targetRow = Number((e && e.parameter && e.parameter.rowIndex) || 0);
        if (targetRow && targetRow >= 2 && targetRow <= evtSheet.getLastRow()) {
          evtSheet.deleteRow(targetRow);
          SpreadsheetApp.flush();
        } else if (targetId) {
          const values = evtSheet.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][10]).trim() === targetId || String(values[i][5]).trim() === targetId) {
              evtSheet.deleteRow(i + 1);
              SpreadsheetApp.flush();
              break;
            }
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Inspection writes are sent as GET by the web client for Apps Script CORS compatibility.
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (action === "create") {
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(["Date", "Rust", "Dent", "Weld", "Chemical", "Oil", "Note", "Timestamp"]);
      }
      const dateVal = String((e && e.parameter && e.parameter.date) || formatDateStr(new Date(), true));
      const rustVal = Number((e && e.parameter && e.parameter.rust) || 0) || 0;
      const dentVal = Number((e && e.parameter && e.parameter.dent) || 0) || 0;
      const weldVal = Number((e && e.parameter && e.parameter.weld) || 0) || 0;
      const chemicalVal = Number((e && e.parameter && e.parameter.chemical) || 0) || 0;
      const oilVal = Number((e && e.parameter && e.parameter.oil) || 0) || 0;
      const noteVal = String((e && e.parameter && e.parameter.note) || "");
      sheet.appendRow([dateVal, rustVal, dentVal, weldVal, chemicalVal, oilVal, noteVal, new Date()]);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "create" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update") {
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "update", message: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      const dateVal = String((e && e.parameter && e.parameter.date) || formatDateStr(new Date(), true));
      const rustVal = Number((e && e.parameter && e.parameter.rust) || 0) || 0;
      const dentVal = Number((e && e.parameter && e.parameter.dent) || 0) || 0;
      const weldVal = Number((e && e.parameter && e.parameter.weld) || 0) || 0;
      const chemicalVal = Number((e && e.parameter && e.parameter.chemical) || 0) || 0;
      const oilVal = Number((e && e.parameter && e.parameter.oil) || 0) || 0;
      const noteVal = String((e && e.parameter && e.parameter.note) || "");
      let targetRowIndex = Number((e && e.parameter && e.parameter.rowIndex) || 0);
      const originalDate = String((e && e.parameter && e.parameter.originalDate) || dateVal);
      const values = sheet.getDataRange().getValues();
      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
        for (let i = 1; i < values.length; i++) {
          const rowDateStr = formatDateStr(values[i][0], true);
          if (rowDateStr === originalDate || rowDateStr === dateVal) { targetRowIndex = i + 1; break; }
        }
      }
      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.getRange(targetRowIndex, 1, 1, 8).setValues([[dateVal, rustVal, dentVal, weldVal, chemicalVal, oilVal, noteVal, new Date()]]);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "update", updatedRow: targetRowIndex })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "update", message: "Row not found for update" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "delete", message: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      const values = sheet.getDataRange().getValues();
      let targetRowIndex = Number((e && e.parameter && e.parameter.rowIndex) || 0);
      const searchDate = String((e && e.parameter && e.parameter.date) || "");
      const searchNote = String((e && e.parameter && e.parameter.note) || "");
      if (!targetRowIndex || targetRowIndex < 2 || targetRowIndex > values.length) {
        for (let i = 1; i < values.length; i++) {
          const rowDateStr = formatDateStr(values[i][0], true);
          const rowNoteStr = String(values[i][6] || "");
          if ((searchDate && rowDateStr === searchDate) || (searchNote && rowNoteStr === searchNote)) { targetRowIndex = i + 1; break; }
        }
      }
      if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(targetRowIndex);
        SpreadsheetApp.flush();
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "delete", deletedRow: targetRowIndex })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", action: "delete", message: "Row not found for deletion" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const values = sheet.getDataRange().getValues();

    if (!values || values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const header = values.shift();

    const result = values.map((r, i) => ({
      rowIndex: i + 2,
      date: formatDateStr(r[0], true),
      rust: Number(r[1]) || 0,
      dent: Number(r[2]) || 0,
      weld: Number(r[3]) || 0,
      chemical: Number(r[4]) || 0,
      oil: Number(r[5]) || 0,
      note: r[6] || "",
      timestamp: formatDateStr(r[7] || r[0], true)
    }));

    const requestedDate = String((e && e.parameter && e.parameter.date) || "").trim();
    const filteredResult = requestedDate
      ? result.filter(r => String(r.date || r.timestamp || "").substring(0, 10) === requestedDate)
      : result;

    return ContentService
      .createTextOutput(JSON.stringify(filteredResult))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateEventsSheet(ss) {
  let evtSheet = ss.getSheetByName("5M1E_Events") || ss.getSheetByName("events");
  if (!evtSheet) {
    evtSheet = ss.insertSheet("5M1E_Events");
    evtSheet.appendRow(["Date", "Time", "Shift", "Category", "Process", "Title", "Detail", "Action", "Recorder", "Timestamp", "ID", "Quantity"]);
    SpreadsheetApp.flush();
  } else if (evtSheet.getName() === "events" && !ss.getSheetByName("5M1E_Events")) {
    try {
      evtSheet.setName("5M1E_Events");
    } catch(e) {}
  }
  const lastColumn = Math.max(1, evtSheet.getLastColumn());
  const headers = evtSheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  if (headers.indexOf("Quantity") < 0) {
    evtSheet.getRange(1, lastColumn + 1).setValue("Quantity");
  }
  return evtSheet;
}
