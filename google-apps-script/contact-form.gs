/**
 * neurosam.AI Contact Form Handler
 *
 * Google Apps Script로 정적 사이트의 문의 폼을 처리합니다.
 * - POST 요청으로 폼 데이터 수신
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
 */

const ADMIN_EMAIL = 'hello@neurosam.com';
const SHEET_NAME = '문의';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { name, email, company, message } = data;

    if (!name || !email || !message) {
      return jsonResponse(400, { error: '필수 항목이 누락되었습니다.' });
    }

    // 1. Google Sheets에 기록
    saveToSheet(name, email, company, message);

    // 2. 관리자에게 이메일 발송
    sendNotification(name, email, company, message);

    return jsonResponse(200, { success: true });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
}

function saveToSheet(name, email, company, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['접수일시', '이름', '이메일', '회사명', '문의 내용', '상태']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([timestamp, name, email, company || '-', message, '신규']);
}

function sendNotification(name, email, company, message) {
  const subject = `[neurosam.AI 문의] ${name}님의 새 문의가 접수되었습니다`;

  const body = [
    '새로운 문의가 접수되었습니다.',
    '',
    `이름: ${name}`,
    `이메일: ${email}`,
    `회사명: ${company || '-'}`,
    '',
    '--- 문의 내용 ---',
    message,
    '',
    '---',
    `접수 시각: ${Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')}`,
    'Google Sheets에서 전체 문의 목록을 확인할 수 있습니다.',
  ].join('\n');

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    body: body,
    replyTo: email,
  });
}

function jsonResponse(status, data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse(200, { status: 'ok', service: 'neurosam.ai contact form' });
}
