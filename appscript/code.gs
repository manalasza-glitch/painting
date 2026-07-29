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

    // Handle submitDailyReport via GET (fallback)
    if (action === "submitDailyReport") {
      const TARGET_SHEET_NAME = "outputdiary";
      let prodSheet = ss.getSheetByName(TARGET_SHEET_NAME);
      if (!prodSheet) {
        prodSheet = ss.insertSheet(TARGET_SHEET_NAME);
      }
      if (prodSheet.getLastRow() === 0) {
        prodSheet.appendRow([
          "Timestamp", "Date", "Shift", "Recorder", "Checker", 
          "Downtime_Burner", "Downtime_Wash", "Downtime_Oven_Etc", "Downtime_Note", 
          "Model", "TimeSlot", "ProdQty", "Dent", "ColorDrop", "ThinPaint", "ThickPaint", "WaterStain", "OtherDefect", "TotalDefect"
        ]);
      }

      let payloadData = {};
      if (e && e.parameter && e.parameter.payload) {
        try { payloadData = JSON.parse(e.parameter.payload); } catch(pErr){}
      } else {
        payloadData = e.parameter || {};
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
          otherDefect: Number(e.parameter.otherDefect) || 0,
          totalDefect: Number(e.parameter.totalDefect) || 0
        }];
      }

      if (recs && Array.isArray(recs)) {
        recs.forEach(r => {
          prodSheet.appendRow([
            now, dateVal, shiftVal, recorderVal, checkerVal,
            burner, wash, ovenEtc, dtNote,
            r.model, r.timeSlot, r.prodQty,
            r.dent, r.colorDrop, r.thinPaint, r.thickPaint, r.waterStain, r.otherDefect, r.totalDefect
          ]);
        });
      }

      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "submitDailyReport" })).setMimeType(ContentService.MimeType.JSON);
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
        totalDefect: Number(r[18]) || 0
      }));

      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getPartModels action (PartModel sheet tab)
    if (action === "getPartModels") {
      let pmSheet = ss.getSheetByName("PartModel");
      if (!pmSheet) {
        pmSheet = ss.insertSheet("PartModel");
        pmSheet.appendRow(["PartGroup", "ModelName"]);
        const defaultGroups = {
          "Gland Plate": ["[75170148] Gland Plate LC600", "[BRU53717] Gland Plate NLC600"],
          "Box & U-Box": ["Box NMS 4/6 W. 240 mm.", "BOX 300x400x200", "BOX 400x500x200", "U-BOX STANDARD", "[BRU53714] U Box 450 mm.", "[75170145] U Box LC600 mm.", "[BRU53715] U Box NLC600 mm."],
          "Door (บานประตู)": ["Door NLC 450 mm.", "DOOR PANEL NLC-01", "DOOR PANEL NMS-01", "Flat Door LC 600", "[BRU53715] Door NLC 600 mm."],
          "Cover NMS": ["Cover NMS 6 w. 245 mm.", "[BRU30890] Cover NMS 4 w. 245 mm.", "[BRU30892] Cover NMS 8 w. 325 mm."],
          "Cover NLC (EZ / LUG)": ["Cover NLC EZ100 600 mm.", "[BRU53718] Cover NLC EZ100 450 mm. 12 w.", "[BRU53738] Cover NLC LUG250 450 mm. 12 w."]
        };
        for (const grp in defaultGroups) {
          defaultGroups[grp].forEach(m => pmSheet.appendRow([grp, m]));
        }
        SpreadsheetApp.flush();
      }

      const values = pmSheet.getDataRange().getValues();
      const groupsMap = {};
      if (values && values.length > 1) {
        for (let i = 1; i < values.length; i++) {
          const group = String(values[i][0] || "").trim();
          const model = String(values[i][1] || "").trim();
          if (group && model) {
            if (!groupsMap[group]) groupsMap[group] = [];
            if (!groupsMap[group].includes(model)) {
              groupsMap[group].push(model);
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", groups: groupsMap })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle getRecorders action (Cloud Sync)
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
        id: String(r[10] || ("evt_" + (i + 1)))
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
      const eId = "evt_" + new Date().getTime();
      const nowStr = formatDateStr(new Date(), true);

      evtSheet.appendRow([eDate, eTime, eShift, eCat, eProc, eTitle, eDetail, eAct, eRec, nowStr, eId]);
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

function getOrCreateEventsSheet(ss) {
  let evtSheet = ss.getSheetByName("5M1E_Events") || ss.getSheetByName("events");
  if (!evtSheet) {
    evtSheet = ss.insertSheet("5M1E_Events");
    evtSheet.appendRow(["Date", "Time", "Shift", "Category", "Process", "Title", "Detail", "Action", "Recorder", "Timestamp", "ID"]);
    
    // Seed sample 5M1E Events for Painting Line
    const samples = [
      ["2026-07-27", "08:30", "กะเช้า", "Machine", "เตาอบสี (Baking Oven)", "ปรับเพิ่มอุณหภูมิตู้อบสี", "เพิ่มอุณหภูมิอบสีจาก 180°C เป็น 190°C เพื่อรองรับความหนาชิ้นงานรุ่นใหม่", "สุ่มตรวจความหนาและพ่นติดของสีผ่านเกณฑ์ 100%", "สมชาย ใจดี", "2026-07-27 08:30", "evt_101"],
      ["2026-07-26", "10:15", "กะเช้า", "Material", "ห้องผสมสี (Color Mix Room)", "เปลี่ยนล็อตสีพ่นผงชั่วคราว", "เปิดใช้สีผงล็อตใหม่ Batch #20260726-A เนื่องจากสีล็อตเดิมหมดสต็อก", "ทำการเทียบเฉดสี Gloss & Color Shade อยู่ในเกณฑ์มาตรฐาน", "วิชัย มีสุข", "2026-07-26 10:15", "evt_102"],
      ["2026-07-25", "13:40", "กะเช้า", "Man", "ไลน์พ่นสีชิ้นงาน", "เปลี่ยนตัวพนักงานพ่นสีหลัก", "พนักงานประจำลาป่วย ให้พนักงานสำรองดำเนินการพ่นสีแทน", "หัวหน้างานเข้ากำกับเทคนิคการพ่นสีใกล้ชิดตลอดกะ", "สมศักดิ์ ขยันงาน", "2026-07-25 13:40", "evt_103"],
      ["2026-07-24", "15:00", "กะเช้า", "Environment", "ห้องพ่นสี (Spray Booth)", "เปลี่ยนแผ่นกรองฝุ่นห้องพ่นสี", "ทำความสะอาดและเปลี่ยน Filter กรองอากาศใหม่เนื่องจากฝุ่นสะสม", "วัดค่าแรงดันลมในห้องพ่นสีกลับสู่สภาวะปกติ", "สมชาย ใจดี", "2026-07-24 15:00", "evt_104"],
      ["2026-07-23", "09:20", "กะเช้า", "Measurement", "ห้อง QC ตรวจสอบ", "สอบเทียบเครื่องวัดความหนาสี (Elcometer)", "ปรับแต่ง Calibration Zero & Foil Shim สำหรับเครื่องวัดความหนาสี", "เครื่องมือผ่านการ Calibration พร้อมติดสติ๊กเกอร์รับรอง", "วิชัย มีสุข", "2026-07-23 09:20", "evt_105"]
    ];
    samples.forEach(row => evtSheet.appendRow(row));
    SpreadsheetApp.flush();
  } else if (evtSheet.getName() === "events" && !ss.getSheetByName("5M1E_Events")) {
    try {
      evtSheet.setName("5M1E_Events");
    } catch(e) {}
  }
  return evtSheet;
}
