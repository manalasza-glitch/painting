const SHEET_NAME = "Inspection";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.date,
      data.rust,
      data.dent,
      data.weld,
      data.chemical,
      data.oil,
      data.note,
      new Date()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success"
      }))
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

function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();

    if (!values || values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const header = values.shift();

    const result = values.map(r => ({
      date: r[0],
      rust: Number(r[1]) || 0,
      dent: Number(r[2]) || 0,
      weld: Number(r[3]) || 0,
      chemical: Number(r[4]) || 0,
      oil: Number(r[5]) || 0,
      note: r[6] || "",
      timestamp: r[7] || ""
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

