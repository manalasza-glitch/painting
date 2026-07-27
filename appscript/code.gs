const SHEET_NAME = "Inspection";

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

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
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

    // Handle submitDailyReport action
    if (action === "submitDailyReport") {
      const TARGET_SHEET_NAME = "outputdiary";
      let prodSheet = ss.getSheetByName(TARGET_SHEET_NAME);
      if (!prodSheet) {
        prodSheet = ss.insertSheet(TARGET_SHEET_NAME);
      }
      
      // If sheet is empty, create header row
      if (prodSheet.getLastRow() === 0) {
        prodSheet.appendRow([
          "Timestamp", "Date", "Shift", "Recorder", "Checker", 
          "Downtime_Burner", "Downtime_Wash", "Downtime_Oven_Etc", "Downtime_Note", 
          "Model", "TimeSlot", "ProdQty", "Dent", "ColorDrop", "ThinPaint", "ThickPaint", "WaterStain", "OtherDefect", "TotalDefect"
        ]);
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
          // Column J (10) onwards: Model, TimeSlot, ProdQty, Dent, ColorDrop, ThinPaint, ThickPaint, WaterStain, OtherDefect, TotalDefect
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
            r.totalDefect     // Column S (Column 19)
          ]);
        });
      }

      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitDailyReport" })).setMimeType(ContentService.MimeType.JSON);
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

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) || "";

    // Handle getRecorders action
    if (action === "getRecorders") {
      let recSheet = ss.getSheetByName("Recorders");
      if (!recSheet) {
        recSheet = ss.insertSheet("Recorders");
        recSheet.appendRow(["Name"]);
        const defaults = ["สมชาย ใจดี", "วิชัย มีสุข", "สมศักดิ์ ขยันงาน"];
        defaults.forEach(n => recSheet.appendRow([n]));
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

    let sheet = ss.getSheetByName(SHEET_NAME);
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

    return ContentService
      .createTextOutput(JSON.stringify(result))
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
