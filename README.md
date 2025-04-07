# Google Classroom 자동 채점 시스템 사용 설명서

## 목차
1. [시스템 개요](#1-시스템-개요)
2. [준비 사항](#2-준비-사항)
3. [Google Cloud Console 설정](#3-google-cloud-console-설정)
4. [Gemini API 키 발급 받기](#4-gemini-api-키-발급-받기)
5. [Apps Script 프로젝트 설정](#5-apps-script-프로젝트-설정)
6. [시스템 초기 설정](#6-시스템-초기-설정)
7. [시스템 사용 방법](#7-시스템-사용-방법)
8. [문제 해결](#8-문제-해결)
9. [추가 설정](#9-추가-설정)

---

바로 복사 링크 : https://script.google.com/d/1VWBasfeP-62x5T8Pk-wUSxY1sLTqk6T7-4-sRBBRYSmFfWrlW0ogH9yx/copy

## 1. 시스템 개요

Google Classroom 자동 채점 시스템은 Google Classroom을 통해 제출된 학생들의 논술형 과제를 AI(Gemini)를 활용하여 자동으로 채점하는 도구입니다. 이 시스템은 다음과 같은 기능을 제공합니다:

- **자동 채점**: Gemini API를 사용하여 학생 답안을 자동으로 채점합니다.
- **점수 할당**: 채점 결과를 Google Classroom에 자동으로 등록합니다.
- **피드백 제공**: 학생 답안에 상세한 피드백과 코멘트를 추가합니다.
- **일괄 처리**: 여러 학생의 과제를 한 번에 처리할 수 있습니다.

---

## 2. 준비 사항

시스템 사용을 위해 다음이 필요합니다:

- **Google 계정**: Google Classroom, Google Drive, Google Apps Script 접근 권한이 있어야 합니다.
- **Google Classroom**: 운영 중인 Google Classroom 과목과 과제가 있어야 합니다.
- **Google Cloud 프로젝트**: API 사용을 위한 프로젝트가 필요합니다.
- **Gemini API 키**: AI 기반 채점을 위한 API 키가 필요합니다.
- **문제 및 루브릭 문서**: Google Docs에 작성된 문제와 채점 기준이 필요합니다.

---

## 3. Google Cloud Console 설정

### 3.1 Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 상단의 프로젝트 선택 드롭다운을 클릭하고 "새 프로젝트"를 선택합니다.
3. 프로젝트 이름(예: "Classroom Auto Grader")을 입력하고 "만들기"를 클릭합니다.
4. 프로젝트가 생성될 때까지 기다립니다(약 1분 소요).

### 3.2 Google Classroom API 활성화

1. 왼쪽 메뉴에서 "API 및 서비스" > "라이브러리"를 선택합니다.
2. 검색창에 "Google Classroom"을 입력합니다.
3. 검색 결과에서 "Google Classroom API"를 클릭합니다.
4. "사용 설정" 버튼을 클릭하여 API를 활성화합니다.
5. 같은 방법으로 다음 API들도 활성화합니다:
   - Google Docs API
   - Google Drive API

### 3.3 OAuth 동의 화면 설정

1. 왼쪽 메뉴에서 "API 및 서비스" > "OAuth 동의 화면"을 선택합니다.
2. 사용자 유형으로 "외부"를 선택하고 "만들기"를 클릭합니다.
3. 앱 정보를 입력합니다:
   - 앱 이름: "Classroom Auto Grader"
   - 사용자 지원 이메일: 본인의 이메일 주소
   - 개발자 연락처 정보: 본인의 이메일 주소
4. "저장 후 계속"을 클릭합니다.
5. 범위 추가 화면에서 "범위 추가" 버튼을 클릭하고 다음 범위를 추가합니다:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.students`
   - `https://www.googleapis.com/auth/classroom.coursework.me`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/classroom.student-submissions.students.readonly`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/drive`
6. "저장 후 계속"을 클릭합니다.
7. 테스트 사용자 화면에서 "테스트 사용자 추가" 버튼을 클릭하고 본인의 이메일 주소를 추가합니다.
8. "저장 후 계속"을 클릭하여 설정을 완료합니다.

### 3.4 OAuth 클라이언트 ID 생성

1. 왼쪽 메뉴에서 "API 및 서비스" > "사용자 인증 정보"를 선택합니다.
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"를 클릭합니다.
3. 애플리케이션 유형으로 "웹 애플리케이션"을 선택합니다.
4. 이름을 입력합니다(예: "Classroom Auto Grader Web App").
5. "승인된 리디렉션 URI" 섹션에서 "URI 추가" 버튼을 클릭합니다.
6. 다음 URI를 입력합니다:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```
   > **참고**: {SCRIPT_ID}는 나중에 Apps Script 프로젝트를 만든 후에 알 수 있습니다. 지금은 임시 값(예: YOUR_SCRIPT_ID)을 입력하고 나중에 수정하겠습니다.
7. "만들기" 버튼을 클릭합니다.
8. 표시되는 "클라이언트 ID"와 "클라이언트 보안 비밀번호"를 메모장에 복사해둡니다. 이 정보는 나중에 필요합니다.

---

## 4. Gemini API 키 발급 받기

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속합니다.
2. "Get API key" 버튼을 클릭합니다.
3. 기존 API 키가 있다면 "Create new API key"를 클릭하여 새 키를 생성합니다.
4. 생성된 API 키를 메모장에 복사해둡니다. 이 키는 나중에 시스템 설정에 사용됩니다.

---

## 5. Apps Script 프로젝트 설정

### 5.1 새 Apps Script 프로젝트 생성

1. [Google Drive](https://drive.google.com/)에 접속합니다.
2. "새로 만들기" > "더보기" > "Google Apps Script"를 클릭합니다.
3. 프로젝트 이름을 "Classroom Auto Grader"로 변경합니다.

### 5.2 스크립트 ID 확인

1. Apps Script 편집기에서 "프로젝트 설정"을 클릭합니다(또는 File > Project settings).
2. "스크립트 ID"를 메모장에 복사해둡니다.

### 5.3 Google Cloud Console에서 리디렉션 URI 업데이트

1. [Google Cloud Console](https://console.cloud.google.com/)로 돌아갑니다.
2. "API 및 서비스" > "사용자 인증 정보"로 이동합니다.
3. 이전에 만든 OAuth 클라이언트 ID를 클릭합니다.
4. "승인된 리디렉션 URI"에서 임시로 입력한 URI를 삭제하고 스크립트 ID를 포함한 정확한 URI를 입력합니다:
   ```
   https://script.google.com/macros/d/{실제_스크립트_ID}/usercallback
   ```
5. "저장" 버튼을 클릭합니다.

### 5.4 코드 파일 작성

1. Apps Script 편집기로 돌아갑니다.
2. 기본 `Code.gs` 파일의 내용을 모두 삭제하고, 제공된 코드를 복사하여 붙여넣습니다.
3. "파일" > "새로 만들기" > "HTML 파일"을 클릭합니다.
4. 파일 이름을 `oauth_setup.html`로 지정하고, 제공된 HTML 코드를 복사하여 붙여넣습니다.
5. 동일한 방법으로 다음 HTML 파일들을 추가합니다:
   - `api_key_setup.html`
   - `docs_setup.html`
   - `courses_setup.html`
   - `index.html`
6. 각 파일에 해당하는 코드를 복사하여 붙여넣습니다.
7. "파일" > "저장"을 클릭하여 모든 변경사항을 저장합니다.

### 5.5 웹 앱으로 배포

1. "배포" > "새 배포"를 클릭합니다.
2. "유형 선택" 드롭다운에서 "웹 앱"을 선택합니다.
3. 아래 설정을 입력합니다:
   - 설명: "Classroom Auto Grader"
   - 웹 앱 실행 방식: "나(your@email.com)로 실행"
   - 액세스 권한이 있는 사용자: "모든 사용자" 또는 필요에 따라 제한
4. "배포" 버튼을 클릭합니다.
5. 권한 요청 창이 나타나면 "권한 검토"를 클릭합니다.
6. Google 계정으로 로그인합니다.
7. "Classroom Auto Grader은(는) 확인되지 않았습니다" 경고가 표시되면, "고급"을 클릭한 후 "Classroom Auto Grader(안전하지 않음)로 이동"을 클릭합니다.
8. 요청된 권한을 검토하고 "허용" 버튼을 클릭합니다.
9. 배포가 완료되면 웹 앱 URL이 표시됩니다. 이 URL을 메모장에 복사해둡니다.

---

## 6. 시스템 초기 설정

### 6.1 웹 앱 접속

1. 배포 시 받은 웹 앱 URL을 브라우저에 입력하여 접속합니다.
2. 시스템이 단계별 설정 화면을 표시할 것입니다.

### 6.2 OAuth 설정

1. 첫 번째 설정 화면에서 Google Cloud Console에서 복사해둔 OAuth 클라이언트 정보를 입력합니다:
   - 클라이언트 ID
   - 클라이언트 보안 비밀번호(시크릿)
2. "저장 및 다음 단계로" 버튼을 클릭합니다.
3. Google 계정 인증 화면이 나타나면 로그인하고 권한을 허용합니다.

### 6.3 Gemini API 키 설정

1. API 키 설정 화면에서 Google AI Studio에서 복사해둔 Gemini API 키를 입력합니다.
2. "저장 및 다음 단계로" 버튼을 클릭합니다.

### 6.4 문서 설정

채점에 사용할 문제 및 루브릭 문서를 설정합니다.

1. 먼저 Google Drive에 다음 두 문서를 준비합니다:
   - **문제 문서**: 학생들에게 제시한 문제/과제 내용이 담긴 Google Docs 문서
   - **루브릭 문서**: 채점 기준과 배점이 담긴 Google Docs 문서

2. 각 문서를 열고 URL에서 문서 ID를 확인합니다:
   ```
   https://docs.google.com/document/d/{문서_ID}/edit
   ```

3. 문서 설정 화면에서 복사한 문서 ID를 각각 입력합니다:
   - 문제 문서 ID
   - 루브릭(채점 기준) 문서 ID

4. "문서 확인" 버튼을 클릭하여 문서 접근이 가능한지 확인합니다.
5. 확인이 완료되면 "저장 및 다음 단계로" 버튼을 클릭합니다.

### 6.5 과목 설정

1. 과목 설정 화면에서 "Google Classroom에서 과목 가져오기" 버튼을 클릭합니다.
2. 시스템이 Google Classroom에서 사용 가능한 과목 목록을 가져옵니다.
3. 가져온 과목을 확인하고 필요하다면 추가 과목을 수동으로 입력할 수 있습니다:
   - 과목 이름: 예) "1반 기술"
   - 과목 ID: Google Classroom 과목 URL에서 확인 가능
4. "설정 완료 및 앱 시작하기" 버튼을 클릭합니다.

---

## 7. 시스템 사용 방법

초기 설정을 완료한 후 메인 화면에서 다음과 같이 자동 채점 시스템을 사용할 수 있습니다:

### 7.1 과목 및 과제 선택

1. 과목 선택 드롭다운에서 채점하려는 과목을 선택합니다.
2. 과제 선택 드롭다운에서 채점하려는 과제를 선택합니다.
3. 시스템이 해당 과제를 제출한 학생 목록을 로드합니다.

### 7.2 학생 선택

1. 학생 목록에서 채점할 학생들을 선택합니다. 최대 30명까지 선택 가능합니다.
2. "모두 선택" 버튼을 클릭하여 모든 학생을 한 번에 선택할 수 있습니다.
3. "모두 선택 해제" 버튼을 클릭하여 선택을 취소할 수 있습니다.

### 7.3 자동 채점 실행

1. 학생을 선택한 후 "선택한 학생 채점하기" 버튼을 클릭합니다.
2. 확인 메시지가 표시되면 "확인"을 클릭합니다.
3. 시스템이 채점 과정을 시작하고 진행 상황을 보여줍니다.
4. 채점이 완료되면 각 학생별 결과가 로그에 표시됩니다.

### 7.4 채점 결과 확인

채점이 완료되면 다음과 같은 결과가 반영됩니다:

1. **Google Classroom**: 각 학생의 점수가 자동으로 등록됩니다.
2. **학생 문서**: 
   - 문서 상단에 점수와 피드백 요약이 추가됩니다.
   - 문서 내용 중 오류나 개선이 필요한 부분에 댓글이 추가됩니다.
3. **과제 상태**: "제출됨" 상태의 과제는 자동으로 "반환됨" 상태로 변경됩니다.

---

## 8. 문제 해결

### 8.1 OAuth 인증 오류

**문제**: "redirect_uri_mismatch" 오류가 발생합니다.

**해결 방법**:
1. Apps Script 편집기에서 스크립트 ID를 다시 확인합니다.
2. Google Cloud Console에서 OAuth 클라이언트 ID의 리디렉션 URI가 정확한지 확인합니다:
   ```
   https://script.google.com/macros/d/{정확한_스크립트_ID}/usercallback
   ```
3. 변경 후 저장하고 다시 시도합니다.

### 8.2 Gemini API 오류

**문제**: 채점 시 "Gemini API error" 메시지가 표시됩니다.

**해결 방법**:
1. API 키가 올바른지 확인합니다.
2. API 키 사용량 한도가 초과되었는지 확인합니다.
3. 인터넷 연결 상태를 확인합니다.
4. 시스템 설정에서 API 키를 재설정합니다.

### 8.3 문서 접근 오류

**문제**: "Failed to read documents" 오류가 발생합니다.

**해결 방법**:
1. 문제 및 루브릭 문서의 ID가 올바른지 확인합니다.
2. 문서 공유 설정에서 앱이 문서에 접근할 수 있는지 확인합니다.
3. 문서 설정을 다시 진행합니다.

### 8.4 권한 초기화

어떤 이유로든 인증 정보를 초기화하려면:

1. 메인 화면 하단의 "인증 정보 초기화" 버튼을 클릭합니다.
2. 확인 메시지가 표시되면 "확인"을 클릭합니다.
3. 페이지가 새로고침되고 초기 설정 화면이 표시됩니다.

---

## 9. 추가 설정

### 9.1 시스템 프롬프트 수정

Gemini AI에 전달되는 프롬프트를 수정하여 채점 방식을 사용자화할 수 있습니다:

1. 메인 화면에서 "시스템 프롬프트 설정 보기/숨기기" 버튼을 클릭합니다.
2. 현재 프롬프트가 표시됩니다.
3. 필요에 따라 프롬프트를 수정합니다. 다음 변수는 자동으로 대체됩니다:
   - `{questionText}`: 문제 내용
   - `{rubricText}`: 채점 기준
   - `{studentAnswer}`: 학생 답안
4. "프롬프트 저장" 버튼을 클릭하여 변경사항을 저장합니다.
5. 기본 프롬프트로 돌아가려면 "기본값으로 초기화" 버튼을 클릭합니다.

---

이 설명서는 Google Classroom 자동 채점 시스템의 설정과 사용 방법을 안내합니다. 추가 질문이나 문제가 있으면 시스템 개발자에게 문의하세요.