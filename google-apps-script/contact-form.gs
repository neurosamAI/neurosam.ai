/**
 * neurosam.AI Contact Form Handler (JSONP)
 *
 * 웹사이트에서 script 태그로 GET 요청을 보내고,
 * Apps Script가 JSONP 콜백으로 결과를 반환합니다.
 * CORS, iframe, CSP 이슈가 전혀 없는 방식입니다.
 *
 * === 설정 방법 ===
 * 1. Google Sheets에서 새 스프레드시트 생성
 * 2. 확장 프로그램 > Apps Script 열기
 * 3. 이 코드를 붙여넣기
 * 4. 배포 > 새 배포 > 웹 앱 선택
 *    - 실행 사용자: 본인
 *    - 액세스 권한: 모든 사용자
 * 5. 배포 후 받은 URL을 웹사이트 폼의 APPS_SCRIPT_URL에 설정
 */

var ADMIN_EMAIL = 'hello@neurosam.com';
var SHEET_NAME = '문의';

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

    saveToSheet(name, email, company, message);
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

  GmailApp.sendEmail(ADMIN_EMAIL, subject, body, {
    name: 'neurosam.AI 문의접수',
    replyTo: email,
  });

  // 받은편지함 강제 이동 + 스팸 해제
  Utilities.sleep(2000);
  var threads = GmailApp.search('subject:"' + subject + '" newer_than:1m', 0, 1);
  if (threads.length > 0) {
    threads[0].moveToInbox();
    threads[0].markUnread();
    threads[0].markImportant();
  }
}
