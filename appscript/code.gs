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
  function doGet() {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_NAME);

  const values = sheet.getDataRange().getValues();

  const header = values.shift();

  const result = values.map(r => ({
    date: r[0],
    rust: r[1],
    dent: r[2],
    weld: r[3],
    chemical: r[4],
    oil: r[5],
    note: r[6],
    timestamp: r[7]
  }));

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);

}

}
