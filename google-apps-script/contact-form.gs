/**
 * neurosam.AI Contact Form Handler
 *
 * Google Apps Script로 정적 사이트의 문의 폼을 처리합니다.
 * - POST 요청으로 폼 데이터 수신 (form-encoded)
 * - Google Sheets에 기록
 * - 관리자에게 이메일 알림 발송
 *
 * === 설정 방법 ===
 * 1. Google Sheets에서 새 스프레드시트 생성
 * 2. 확장 프로그램 > Apps Script 열기
 * 3. 이 코드를 붙여넣기
 * 4. ADMIN_EMAIL을 실제 수신 이메일로 변경
 * 5. 배포 > 새 배포 > 웹 앱 선택
 *    - 실행 사용자: 본인
 *    - 액세스 권한: 모든 사용자
 * 6. 배포 후 받은 URL을 웹사이트 폼의 APPS_SCRIPT_URL에 설정
 *
 * === 동작 방식 ===
 * 웹사이트에서 hidden iframe으로 form POST를 보냅니다.
 * Apps Script가 처리 후 JSON을 반환하면 iframe의 load 이벤트가
 * 발생하고, 웹사이트가 이를 감지하여 성공 메시지를 표시합니다.
 */

const ADMIN_EMAIL = 'hello@neurosam.com';
const SHEET_NAME = '문의';

function doPost(e) {
  try {
    var name = e.parameter.name;
    var email = e.parameter.email;
    var company = e.parameter.company;
    var message = e.parameter.message;

    if (!name || !email || !message) {
      return jsonResponse({ success: false, error: 'missing fields' });
    }

    saveToSheet(name, email, company, message);
    sendNotification(name, email, company, message);

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function saveToSheet(name, email, company, message) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['접수일시', '이름', '이메일', '회사명', '문의 내용', '상태']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([timestamp, name, email, company || '-', message, '신규']);
}

function sendNotification(name, email, company, message) {
  var subject = '[neurosam.AI 문의] ' + name + '님의 새 문의가 접수되었습니다';

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
    'Google Sheets에서 전체 문의 목록을 확인할 수 있습니다.',
  ].join('\n');

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    body: body,
    replyTo: email,
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({ status: 'ok', service: 'neurosam.ai contact form' });
}
