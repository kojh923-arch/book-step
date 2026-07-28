// 독서한걸음 Google Apps Script
// 이 파일만 Apps Script의 Code.gs에 붙여넣으세요.
// localStorage는 브라우저 전용 기능이므로 이 파일에는 사용하지 않습니다.

const SHEET_NAME = '\uB3C5\uC11C\uAE30\uB85D';

function doGet() {
  return ContentService
    .createTextOutput('\uB3C5\uC11C\uD55C\uAC78\uC74C \uAE30\uB85D \uC218\uC9D1\uAE30\uAC00 \uC2E4\uD589 \uC911\uC785\uB2C8\uB2E4.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  // HTML 앱이 보낸 JSON 데이터를 읽습니다.
  const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');

  // 이 Apps Script를 연결한 Google Sheet를 사용합니다.
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  // 첫 실행 시 제목 행을 만듭니다.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '\uC800\uC7A5 \uC2DC\uAC01',
      '\uB2C9\uB124\uC784',
      '\uCC45 \uC81C\uBAA9',
      '\uC800\uC790',
      '\uC77D\uC740 \uB0A0\uC9DC',
      '\uBCC4\uC810',
      '\uBBF8\uC158 \uBD84\uC57C',
      '\uBBF8\uC158 \uB0B4\uC6A9',
      '\uBBF8\uC158 \uB2F5\uBCC0',
      '\uB204\uC801 \uAD8C\uC218',
      '\uB204\uC801 \uC2A4\uD2F0\uCEE4'
    ]);
  }

  // 학생 한 명의 미션 답변을 한 행으로 저장합니다.
  sheet.appendRow([
    new Date(),
    payload.nickname || '',
    payload.title || '',
    payload.author || '',
    payload.date || '',
    payload.rating || 0,
    payload.category || '',
    payload.mission || '',
    payload.answer || '',
    payload.books || 0,
    payload.stickers || 0
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
