/**
 * neurosam.AI Contact Form Handler (JSONP)
 *
 * 웹사이트에서 fetch GET 요청을 보내고,
 * Apps Script가 이메일 알림을 발송합니다.
 *
 * === 설정 방법 ===
 * 1. script.google.com에서 새 프로젝트 생성 (hello@ 계정)
 * 2. 이 코드를 붙여넣기
 * 3. testAuth 실행 → 권한 승인
 * 4. 배포 > 새 배포 > 웹 앱
 *    - 실행 사용자: 본인
 *    - 액세스 권한: 모든 사용자
 * 5. 배포 URL을 hugo.toml의 contactFormURL에 설정
 *
 * === 시트 기록이 필요하면 ===
 * SPREADSHEET_ID를 설정하고 saveToSheet 관련 코드의 주석을 해제
 */

var ADMIN_EMAIL = 'hello@neurosam.com';
// var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';  // 시트 기록 시 설정
// var SHEET_NAME = '문의';

function doGet(e) {
  var callback = e.parameter.callback || 'callback';

  try {
    var name = e.parameter.name;
    var email = e.parameter.email;
    var company = e.parameter.company;
    var message = e.parameter.message;

    if (!name || !email || !message) {
      return jsonpResponse(callback, { success: false, error: 'missing_fields' });
    }

    // saveToSheet(name, email, company, message);  // 시트 기록 시 주석 해제
    sendNotification(name, email, company, message);

    return jsonpResponse(callback, { success: true });
  } catch (err) {
    return jsonpResponse(callback, { success: false, error: err.message });
  }
}

function jsonpResponse(callback, data) {
  var output = callback + '(' + JSON.stringify(data) + ');';
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sendNotification(name, email, company, message) {
  var subject = '[neurosam.AI 문의] ' + name + '님 (' + email + ')';

  var body = [
    '새로운 문의가 접수되었습니다.',
    '',
    '이름: ' + name,
    '이메일: ' + email,
    '회사명: ' + (company || '-'),
    '',
    '--- 문의 내용 ---',
    message,
    '',
    '---',
    '접수 시각: ' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
  ].join('\n');

  GmailApp.sendEmail(ADMIN_EMAIL, subject, body, {
    name: 'neurosam.AI 문의접수',
    replyTo: email,
  });
}

/*
// 시트 기록이 필요하면 주석 해제 + SPREADSHEET_ID 설정
function saveToSheet(name, email, company, message) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['접수일시', '이름', '이메일', '회사명', '문의 내용', '상태']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([timestamp, name, email, company || '-', message, '신규']);
}
*/

function testAuth() {
  sendNotification('권한테스트', 'test@test.com', '테스트', '권한 승인 테스트');
}
