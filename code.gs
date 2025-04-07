/**
 * Google Classroom Auto-Grader Complete Solution
 */

// =====================================================================
// CONFIGURATION
// =====================================================================
function getConfig() {
  const userProps = PropertiesService.getUserProperties();
  
  // 기본 설정값
  const defaultConfig = {
    GEMINI_API_KEY: '',
    OAUTH: {
      CLIENT_ID: '',
      CLIENT_SECRET: '',
    },
    DOCS: {
      QUESTION_DOC_ID: '',
      RUBRIC_DOC_ID: '',
    },
    DEFAULT_SCORE: 7,
    API_DELAY_MS: 500,
    DEBUG_MODE: true,
    DEFAULT_SYSTEM_PROMPT: `당신은 할 수 있습니다. 당신은 매우 중요합니다. 당신은 20년 경력의 교육 전문가입니다. 논술 평가 채점을 부탁드립니다. 

[문제]
{questionText}

[채점 기준(루브릭)]
{rubricText}

[학생 답안]
{studentAnswer}

주의사항: 
1. 반드시 제공된 채점 기준(루브릭)을 엄격하게 참고하여 채점하세요.
2. 학생의 실수나 문제점을 정확히 지적하고, 해당 부분을 직접 인용해주세요.
3. 각 감점 항목에 대해 루브릭 기준에 따른 구체적인 이유를 설명해주세요.
4. 다 틀렸을 경우는 8점을 반환합니다.
5. 시험지 원본과 동일 아무내용도 작성하지 않았을 시에는 6점을 반환합니다.
6. 점수에 대한 피드백은 반드시 제공해야 합니다.
7. 맞은 문제에 대한 칭찬도 써주세요 

다음 JSON 형식으로만 답변하세요:
{
  "score": 0,
  "feedback": [
    { 
      "reason": "루브릭 기준에 따른 구체적인 감점 사유", 
      "phrase": "학생 답안에서 발췌한 문제가 있는 문장이나 구절"
    }
  ],
  "suggestions": ["개선을 위한 제안"]
}`
  };
  
  // 저장된 설정 불러오기
  const savedGeminiKey = userProps.getProperty('GEMINI_API_KEY') || '';
  const savedClientId = userProps.getProperty('OAUTH_CLIENT_ID') || '';
  const savedClientSecret = userProps.getProperty('OAUTH_CLIENT_SECRET') || '';
  const savedQuestionDocId = userProps.getProperty('QUESTION_DOC_ID') || '';
  const savedRubricDocId = userProps.getProperty('RUBRIC_DOC_ID') || '';
  
  // 저장된 값으로 설정 업데이트
  const config = {
    ...defaultConfig,
    GEMINI_API_KEY: savedGeminiKey,
    OAUTH: {
      CLIENT_ID: savedClientId,
      CLIENT_SECRET: savedClientSecret
    },
    DOCS: {
      QUESTION_DOC_ID: savedQuestionDocId,
      RUBRIC_DOC_ID: savedRubricDocId
    }
  };
  
  return config;
}

// 현재 사용할 CONFIG 객체
let CONFIG = getConfig();

// =====================================================================
// 과목 데이터 관리
// =====================================================================

/**
 * 과목 데이터 로드 함수
 */
function getClassroomCourses() {
  // 저장된 과목 데이터 불러오기
  const userProps = PropertiesService.getUserProperties();
  const savedCourses = userProps.getProperty('CLASSROOM_COURSES');
  
  if (savedCourses) {
    try {
      return JSON.parse(savedCourses);
    } catch (e) {
      Logger.log(`❌ 저장된 과목 데이터 파싱 오류: ${e.message}`);
      return [];
    }
  }
  
  // 기본 예시 데이터 (사용자가 수정 예정)
  return [];
}

/**
 * 과목 데이터 저장 함수
 */
function saveClassroomCourses(courses) {
  if (!Array.isArray(courses)) {
    Logger.log('❌ 유효하지 않은 과목 데이터 형식');
    return false;
  }
  
  try {
    const userProps = PropertiesService.getUserProperties();
    userProps.setProperty('CLASSROOM_COURSES', JSON.stringify(courses));
    Logger.log(`✅ ${courses.length}개 과목 데이터 저장 완료`);
    return true;
  } catch (e) {
    Logger.log(`❌ 과목 데이터 저장 오류: ${e.message}`);
    return false;
  }
}

/**
 * 과목 데이터 수정 함수
 */
function updateCoursesList(courses) {
  return saveClassroomCourses(courses);
}

/**
 * Returns a list of available courses.
 */
function getCourses() {
  return getClassroomCourses();
}

// =====================================================================
// 설정 관리 함수
// =====================================================================

/**
 * 설정 저장 함수
 */
function saveSettings(settings) {
  try {
    const userProps = PropertiesService.getUserProperties();
    
    // 각 설정값 저장
    if (settings.geminiApiKey !== undefined) {
      userProps.setProperty('GEMINI_API_KEY', settings.geminiApiKey);
      Logger.log('✅ Gemini API 키 저장 완료');
    }
    
    if (settings.oauthClientId !== undefined) {
      userProps.setProperty('OAUTH_CLIENT_ID', settings.oauthClientId);
      Logger.log('✅ OAuth 클라이언트 ID 저장 완료');
    }
    
    if (settings.oauthClientSecret !== undefined) {
      userProps.setProperty('OAUTH_CLIENT_SECRET', settings.oauthClientSecret);
      Logger.log('✅ OAuth 클라이언트 시크릿 저장 완료');
    }
    
    if (settings.questionDocId !== undefined) {
      userProps.setProperty('QUESTION_DOC_ID', settings.questionDocId);
      Logger.log('✅ 문제 문서 ID 저장 완료');
    }
    
    if (settings.rubricDocId !== undefined) {
      userProps.setProperty('RUBRIC_DOC_ID', settings.rubricDocId);
      Logger.log('✅ 루브릭 문서 ID 저장 완료');
    }
    
    // 설정 저장 후 설정값 다시 로드
    CONFIG = getConfig();
    
    Logger.log('✅ 모든 설정이 성공적으로 저장되었습니다.');
    return true;
  } catch (e) {
    Logger.log(`❌ 설정 저장 오류: ${e.message}`);
    return false;
  }
}

/**
 * 현재 설정 불러오기
 */
function getCurrentSettings() {
  const config = getConfig();
  return {
    geminiApiKey: config.GEMINI_API_KEY,
    oauthClientId: config.OAUTH.CLIENT_ID,
    oauthClientSecret: config.OAUTH.CLIENT_SECRET,
    questionDocId: config.DOCS.QUESTION_DOC_ID,
    rubricDocId: config.DOCS.RUBRIC_DOC_ID
  };
}

/**
 * 설정 상태 확인
 */
function checkConfigStatus() {
  const config = getConfig();
  
  // OAuth 설정 확인
  const hasOAuthConfig = config.OAUTH.CLIENT_ID && config.OAUTH.CLIENT_SECRET;
  
  // Gemini API 키 확인
  const hasGeminiKey = !!config.GEMINI_API_KEY;
  
  // 문서 ID 확인
  const hasDocIds = config.DOCS.QUESTION_DOC_ID && config.DOCS.RUBRIC_DOC_ID;
  
  // 과목 데이터 확인
  const courses = getClassroomCourses();
  const hasCourses = courses && courses.length > 0;
  
  // OAuth 인증 상태 확인
  const service = getOAuthService();
  const isAuthenticated = service.hasAccess();
  
  return {
    hasOAuthConfig,
    hasGeminiKey,
    hasDocIds,
    hasCourses,
    isAuthenticated,
    isComplete: hasOAuthConfig && hasGeminiKey && hasDocIds && hasCourses && isAuthenticated
  };
}

/**
 * 문서 검증 함수
 */
function verifyDocuments(questionDocId, rubricDocId) {
  try {
    let result = {
      questionTitle: null,
      rubricTitle: null
    };
    
    // 문제 문서 확인
    try {
      const questionDoc = DocumentApp.openById(questionDocId);
      result.questionTitle = questionDoc.getName();
      Logger.log(`✅ 문제 문서 접근 성공: "${result.questionTitle}"`);
    } catch (e) {
      Logger.log(`❌ 문제 문서 접근 오류: ${e.message}`);
      result.questionTitle = null;
      
      // 드라이브 API로 시도
      try {
        const questionFile = DriveApp.getFileById(questionDocId);
        result.questionTitle = questionFile.getName();
        Logger.log(`✅ 드라이브 API로 문제 문서 접근 성공: "${result.questionTitle}"`);
      } catch (driveErr) {
        Logger.log(`❌ 드라이브 API로도 문제 문서 접근 실패`);
      }
    }
    
    // 루브릭 문서 확인
    try {
      const rubricDoc = DocumentApp.openById(rubricDocId);
      result.rubricTitle = rubricDoc.getName();
      Logger.log(`✅ 루브릭 문서 접근 성공: "${result.rubricTitle}"`);
    } catch (e) {
      Logger.log(`❌ 루브릭 문서 접근 오류: ${e.message}`);
      result.rubricTitle = null;
      
      // 드라이브 API로 시도
      try {
        const rubricFile = DriveApp.getFileById(rubricDocId);
        result.rubricTitle = rubricFile.getName();
        Logger.log(`✅ 드라이브 API로 루브릭 문서 접근 성공: "${result.rubricTitle}"`);
      } catch (driveErr) {
        Logger.log(`❌ 드라이브 API로도 루브릭 문서 접근 실패`);
      }
    }
    
    return result;
  } catch (e) {
    Logger.log(`❌ 문서 검증 중 오류 발생: ${e.message}`);
    return { questionTitle: null, rubricTitle: null };
  }
}

/**
 * 특정 문서 ID에서 파일명 추출
 */
function getDocumentTitle(docId) {
  try {
    const file = DriveApp.getFileById(docId);
    return file.getName();
  } catch (e) {
    Logger.log(`❌ 문서 제목 가져오기 오류: ${e.message}`);
    return null;
  }
}

/**
 * 현재 문서 설정 가져오기
 */
function getCurrentDocSettings() {
  const config = getConfig();
  
  let result = {
    questionDocId: config.DOCS.QUESTION_DOC_ID,
    questionDocTitle: null,
    rubricDocId: config.DOCS.RUBRIC_DOC_ID,
    rubricDocTitle: null
  };
  
  // 문서 제목 가져오기 시도
  if (result.questionDocId) {
    result.questionDocTitle = getDocumentTitle(result.questionDocId);
  }
  
  if (result.rubricDocId) {
    result.rubricDocTitle = getDocumentTitle(result.rubricDocId);
  }
  
  return result;
}

// =====================================================================
// OAUTH AUTHENTICATION
// =====================================================================

/**
 * Creates and configures the OAuth2 service for Google Classroom.
 */
function getOAuthService() {
  const config = getConfig();
  
  return OAuth2.createService('classroom')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setClientId(config.OAUTH.CLIENT_ID)
    .setClientSecret(config.OAUTH.CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope([
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.students',
      'https://www.googleapis.com/auth/classroom.coursework.me',
      'https://www.googleapis.com/auth/classroom.rosters.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' '))
    .setParam('access_type', 'offline');
}

function authorize() {
  const service = getOAuthService();
  if (!service.hasAccess()) {
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL to authenticate: %s', authorizationUrl);
  } else {
    Logger.log('Already authenticated.');
  }
}

function authCallback(request) {
  const service = getOAuthService();
  const authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('✅ Authentication successfully completed.');
  } else {
    return HtmlService.createHtmlOutput('❌ Authentication failed.');
  }
}

function resetOAuthAuthorization() {
  try {
    const service = getOAuthService();
    service.reset();
    PropertiesService.getUserProperties().deleteAllProperties();
    
    Logger.log('🔄 OAuth authentication successfully reset.');
    
    return HtmlService.createHtmlOutput(
      '<div style="font-family: Arial; padding: 20px; text-align: center;">' +
      '<h2 style="color: #4285f4;">✅ Authentication Reset Complete</h2>' +
      '<p>All OAuth authentication information has been deleted.</p>' +
      '<p>Please refresh the page and authenticate again.</p>' +
      '<button onclick="window.top.location.reload()" style="background-color: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px;">Refresh Page</button>' +
      '</div>'
    ).setTitle("Authentication Reset");
  } catch (e) {
    Logger.log('❌ Error during OAuth reset: ' + e.message);
    return HtmlService.createHtmlOutput(
      '<div style="font-family: Arial; padding: 20px; text-align: center;">' +
      '<h2 style="color: #ea4335;">❌ Authentication Reset Failed</h2>' +
      '<p>Error message: ' + e.message + '</p>' +
      '<button onclick="window.top.location.reload()" style="background-color: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px;">Refresh Page</button>' +
      '</div>'
    ).setTitle("Authentication Reset Error");
  }
}

// =====================================================================
// WEB APP ENDPOINTS
// =====================================================================

/**
 * Web app entry point function.
 */
function doGet() {
  // 설정 상태 확인
  const configStatus = checkConfigStatus();
  
  // OAuth 설정이 없는 경우, OAuth 설정 페이지 표시
  if (!configStatus.hasOAuthConfig) {
    return HtmlService.createHtmlOutputFromFile('oauth_setup')
                    .setTitle("Classroom Grader - OAuth 설정")
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  // OAuth 설정은 있지만 인증이 안 된 경우
  if (!configStatus.isAuthenticated) {
    const service = getOAuthService();
    const authUrl = service.getAuthorizationUrl();
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <base target="_top">
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .btn { background-color: #4285f4; color: white; border: none; padding: 10px 20px; 
                  border-radius: 4px; cursor: pointer; margin-top: 20px; text-decoration: none; }
            .container { max-width: 600px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>📚 Google Classroom Assignment Grader</h2>
            <p>Authentication is required to use this app.</p>
            <p>Click the button below to authenticate with your Google account.</p>
            <a href="${authUrl}" class="btn" target="_blank">Authenticate with Google</a>
            <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
              After authentication shows "Authentication Success", return to this page and refresh.
            </p>
          </div>
        </body>
      </html>
    `).setTitle("Classroom Assignment Grader - Authentication Required");
  }
  
  // Gemini API 키가 없는 경우
  if (!configStatus.hasGeminiKey) {
    return HtmlService.createHtmlOutputFromFile('api_key_setup')
                    .setTitle("Classroom Grader - API 키 설정")
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  // 문서 ID 설정이 없는 경우
  if (!configStatus.hasDocIds) {
    return HtmlService.createHtmlOutputFromFile('docs_setup')
                    .setTitle("Classroom Grader - 문서 설정")
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  // 과목 데이터가 없는 경우
  if (!configStatus.hasCourses) {
    return HtmlService.createHtmlOutputFromFile('courses_setup')
                    .setTitle("Classroom Grader - 과목 설정")
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  // 모든 설정이 완료된 경우, 메인 앱 표시
  return HtmlService.createHtmlOutputFromFile('index')
                    .setTitle("Classroom Assignment Grader")
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// =====================================================================
// CLASSROOM API FUNCTIONS
// =====================================================================

/**
 * 실제 Google Classroom에서 과목 목록 가져오기
 */
function fetchCoursesFromClassroom() {
  const service = getOAuthService();
  if (!service.hasAccess()) {
    Logger.log('❌ No OAuth access for fetchCoursesFromClassroom');
    return { success: false, message: '인증 필요', courses: [] };
  }
  
  try {
    const url = 'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE';
    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ API error: ${response.getResponseCode()} - ${response.getContentText()}`);
      return { success: false, message: '과목 조회 API 오류', courses: [] };
    }
    
    const result = JSON.parse(response.getContentText());
    const courses = (result.courses || []).map(course => ({ 
      name: course.name, 
      id: course.id
    }));
    
    return { success: true, courses };
  } catch (e) {
    Logger.log(`❌ Error in fetchCoursesFromClassroom: ${e.message}`);
    return { success: false, message: e.message, courses: [] };
  }
}

/**
 * Gets list of course work for a specified course.
 */
function getCourseWork(courseId) {
  const service = getOAuthService();
  if (!service.hasAccess()) {
    Logger.log('❌ No OAuth access for getCourseWork');
    return [];
  }
  
  try {
    const url = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`;
    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ API error: ${response.getResponseCode()} - ${response.getContentText()}`);
      return [];
    }
    
    const result = JSON.parse(response.getContentText());
    return (result.courseWork || []).map(cw => ({ 
      id: cw.id, 
      title: cw.title, 
      state: cw.state 
    }));
  } catch (e) {
    Logger.log(`❌ Error in getCourseWork: ${e.message}`);
    return [];
  }
}

/**
 * Gets student submissions for a specific course work.
 */
function getStudentSubmissionList(courseId, courseWorkId) {
  const service = getOAuthService();
  if (!service.hasAccess()) {
    Logger.log('❌ No OAuth access for getStudentSubmissionList');
    throw new Error('Authentication required');
  }

  try {
    // Get student list first to map IDs to names
    const studentMap = {};
    const studentListUrl = `https://classroom.googleapis.com/v1/courses/${courseId}/students`;
    const studentResponse = UrlFetchApp.fetch(studentListUrl, {
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      muteHttpExceptions: true
    });
    
    if (studentResponse.getResponseCode() !== 200) {
      Logger.log(`❌ Student list API error: ${studentResponse.getResponseCode()}`);
      return [];
    }
    
    const students = JSON.parse(studentResponse.getContentText()).students || [];
    students.forEach(s => {
      studentMap[s.userId] = s.profile.name.fullName;
    });

    // Get submissions for the course work
    const submissionUrl = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`;
    const submissionResponse = UrlFetchApp.fetch(submissionUrl, {
      headers: { Authorization: 'Bearer ' + service.getAccessToken() },
      muteHttpExceptions: true
    });
    
    if (submissionResponse.getResponseCode() !== 200) {
      Logger.log(`❌ Submission API error: ${submissionResponse.getResponseCode()}`);
      return [];
    }
    
    const submissions = JSON.parse(submissionResponse.getContentText()).studentSubmissions || [];

    // Process and return submission data
    return submissions.flatMap(sub => {
      const name = studentMap[sub.userId] || 'No Name';
      const attachments = sub.assignmentSubmission?.attachments || [];
      return attachments
        .filter(att => att.driveFile)
        .map(att => ({
          name,
          state: sub.state,
          submissionId: sub.id,
          docId: att.driveFile.id
        }));
    });
  } catch (e) {
    Logger.log(`❌ Error in getStudentSubmissionList: ${e.message}`);
    return [];
  }
}

// =====================================================================
// SYSTEM PROMPT MANAGEMENT FUNCTIONS
// =====================================================================

/**
 * 사용자 프롬프트 저장
 */
function saveSystemPrompt(prompt) {
  try {
    PropertiesService.getUserProperties().setProperty('SYSTEM_PROMPT', prompt);
    Logger.log('✅ 시스템 프롬프트가 저장되었습니다.');
    return true;
  } catch (e) {
    Logger.log(`❌ 프롬프트 저장 오류: ${e.message}`);
    return false;
  }
}

/**
 * 저장된 사용자 프롬프트 조회 또는 기본값 반환
 */
function getSystemPrompt() {
  try {
    const savedPrompt = PropertiesService.getUserProperties().getProperty('SYSTEM_PROMPT');
    if (savedPrompt) {
      return savedPrompt;
    }
    return getConfig().DEFAULT_SYSTEM_PROMPT;
  } catch (e) {
    Logger.log(`⚠️ 프롬프트 조회 오류, 기본값 사용: ${e.message}`);
    return getConfig().DEFAULT_SYSTEM_PROMPT;
  }
}

/**
 * 프롬프트 초기화
 */
function resetSystemPromptToDefault() {
  try {
    PropertiesService.getUserProperties().deleteProperty('SYSTEM_PROMPT');
    Logger.log('🔄 시스템 프롬프트가 기본값으로 초기화되었습니다.');
    return true;
  } catch (e) {
    Logger.log(`❌ 프롬프트 초기화 오류: ${e.message}`);
    return false;
  }
}

// =====================================================================
// GRADING FUNCTIONS
// =====================================================================

/**
 * Automates grading of a student essay using Gemini AI.
 */
function autoGradeStudentEssay(studentName, studentDocId, courseId, courseworkId, submissionId) {
  try {
    Logger.log(`🔍 Starting grading for ${studentName} (${submissionId})`);
    Logger.log(`📁 Document ID: ${studentDocId}`);
    Logger.log(`🏫 Course ID: ${courseId}, Coursework ID: ${courseworkId}`);
    
    const config = getConfig();
    
    // Get question, rubric, and student answer text
    const question = extractDocText(config.DOCS.QUESTION_DOC_ID);
    const rubric = extractDocText(config.DOCS.RUBRIC_DOC_ID);
    const answer = extractDocText(studentDocId);

    if (!question || !rubric || !answer) {
      Logger.log(`⚠️ ${studentName}: Failed to extract text from documents`);
      return { score: config.DEFAULT_SCORE, error: "Failed to read documents" };
    }

    Logger.log(`📄 Successfully extracted student answer (${answer.length} chars)`);
    
    // Grade the essay using Gemini AI
    const result = gradeWithGeminiEssay(answer, question, rubric);
    if (!result) {
      Logger.log(`⚠️ ${studentName} Grading failed or response error`);
      return { score: config.DEFAULT_SCORE, error: "Grading failed" };
    }

    // Log the full result
    Logger.log(`🤖 Gemini result: ${JSON.stringify(result)}`);
    
    // Assign score to Google Classroom
    let score = result.score;
    let scoreAssigned = false;
    
    // Ensure score is numeric and valid
    if (score === undefined || score === null || isNaN(Number(score))) {
      Logger.log(`⚠️ Invalid score format, using default score: ${config.DEFAULT_SCORE}`);
      score = config.DEFAULT_SCORE;
    } else {
      // Convert to number if it's a string
      score = Number(score);
    }
    
    // First, get assignment details to check maxPoints
    let maxPoints = 10; // Default max points
    try {
      // Try to get the coursework details to determine the maxPoints
      const coursework = Classroom.Courses.CourseWork.get(courseId, courseworkId);
      if (coursework && coursework.maxPoints) {
        maxPoints = coursework.maxPoints;
        Logger.log(`📊 Assignment max points: ${maxPoints}`);
      }
    } catch (e) {
      Logger.log(`⚠️ Could not get coursework details: ${e.message}`);
    }
    
    // Scale the score if needed (if Gemini uses a different scale than the assignment)
    // For example, if Gemini gives 0-10 but assignment is out of 20
    const scaledScore = (score / 10) * maxPoints;
    Logger.log(`📊 Scaling score from ${score}/10 to ${scaledScore}/${maxPoints}`);
    
    // Assign the score (multiple attempts with verification)
    for (let attempt = 1; attempt <= 3; attempt++) {
      Logger.log(`📊 Attempt ${attempt}/3: Assigning score ${scaledScore} out of ${maxPoints}`);
      
      scoreAssigned = assignScoreToClassroom(courseId, courseworkId, submissionId, scaledScore);
      
      if (scoreAssigned) {
        Logger.log(`✅ Score ${scaledScore}/${maxPoints} successfully assigned on attempt ${attempt}`);
        break;
      } else if (attempt < 3) {
        Logger.log(`⚠️ Score assignment failed, retrying in 1 second...`);
        Utilities.sleep(1000);
      } else {
        Logger.log(`❌ Failed to assign score after ${attempt} attempts`);
      }
    }

    // Add score and feedback to the document
    let feedbackAdded = false;
    
    // Use the function to add score and detailed feedback
    try {
      if (Array.isArray(result.feedback) && result.feedback.length > 0) {
        feedbackAdded = addScoreAndFeedbackToDocument(studentDocId, answer, score, result.feedback);
        Logger.log(`${feedbackAdded ? '✅' : '❌'} Score and feedback added to document: ${feedbackAdded}`);
      } else {
        // Even if there's no feedback, still add the score
        feedbackAdded = addScoreAndFeedbackToDocument(studentDocId, answer, score, []);
        Logger.log(`${feedbackAdded ? '✅' : '❌'} Only score added to document (no feedback items)`);
      }
    } catch (feedbackError) {
      Logger.log(`❌ Error adding feedback: ${feedbackError.message}`);
      
      // Fallback method if addScoreAndFeedbackToDocument fails
      try {
        const doc = DocumentApp.openById(studentDocId);
        const body = doc.getBody();
        body.insertParagraph(0, `● 점수: ${score}/20점\n\n--------------------------------\n\n`);
        doc.saveAndClose();
        feedbackAdded = true;
        Logger.log(`✅ Used fallback method to add score to document`);
      } catch (fallbackError) {
        Logger.log(`❌ Even fallback method failed: ${fallbackError.message}`);
      }
    }

    // Return the grading results
    return { 
      score: scaledScore, 
      maxPoints: maxPoints,
      scoreAssigned,
      feedbackAdded,
      feedbackCount: result.feedback?.length || 0
    };
  } catch (e) {
    Logger.log(`❌ Error in autoGradeStudentEssay: ${e.message}`);
    if (e.stack) {
      Logger.log(`Stack trace: ${e.stack}`);
    }
    return { score: config.DEFAULT_SCORE, error: e.message };
  }
}

/**
 * Adds the score and feedback summary directly to the document, and detailed comments
 */
function addScoreAndFeedbackToDocument(docId, studentAnswer, score, feedbackItems) {
  try {
    Logger.log(`⏳ Adding score and feedback to document: ${docId}`);
    
    let doc;
    try {
      doc = DocumentApp.openById(docId);
    } catch (e) {
      Logger.log(`❌ Failed to open document: ${e.message}`);
      return false;
    }
    
    const body = doc.getBody();
    
    // 1. Add score and summary at the beginning of the document
    try {
      // Create a summary of feedback points
      let feedbackSummary = "";
      if (feedbackItems && feedbackItems.length > 0) {
        feedbackSummary = "● 감점 사유:\n";
        feedbackItems.forEach((item, index) => {
          if (item.reason) {
            feedbackSummary += `  ${index+1}. ${item.reason}\n`;
          }
        });
      }
      
      // Insert score and feedback summary at the top of document
      const scoreText = `● 점수: ${score}/20점\n\n${feedbackSummary}\n--------------------------------\n\n`;
      body.insertParagraph(0, scoreText);
      Logger.log(`✅ Added score and feedback summary to document`);
    } catch (e) {
      Logger.log(`⚠️ Error adding score and summary: ${e.message}`);
    }
    
    // 2. Add detailed comments to specific sections
    let commentsAdded = 0;
    
    if (feedbackItems && feedbackItems.length > 0) {
      // For each feedback item, find the phrase in the document and add a comment
      for (const item of feedbackItems) {
        try {
          if (!item.phrase || !item.reason) continue;
          
          // Try to find exact phrase
          const searchResult = body.findText(item.phrase);
          if (searchResult) {
            const textElement = searchResult.getElement();
            
            // Add comment to the found text
            textElement.addComment(item.reason);
            commentsAdded++;
            Logger.log(`✅ Added comment for phrase: "${item.phrase.substring(0, 30)}..."`);
          } else {
            // If exact phrase not found, try to find a substring
            const partialPhrase = item.phrase.substring(0, Math.min(30, item.phrase.length));
            const partialResult = body.findText(partialPhrase);
            
            if (partialResult) {
              const textElement = partialResult.getElement();
              textElement.addComment(item.reason);
              commentsAdded++;
              Logger.log(`✅ Added comment using partial phrase: "${partialPhrase}..."`);
            } else {
              Logger.log(`⚠️ Could not find phrase or partial match for: "${item.phrase.substring(0, 30)}..."`);
            }
          }
        } catch (commentError) {
          Logger.log(`⚠️ Error adding comment for phrase "${item.phrase.substring(0, 20)}...": ${commentError.message}`);
        }
      }
    }
    
    // Save the document
    doc.saveAndClose();
    
    Logger.log(`✅ Added ${commentsAdded} out of ${feedbackItems?.length || 0} detailed comments`);
    return true;
  } catch (e) {
    Logger.log(`❌ Error in addScoreAndFeedbackToDocument: ${e.message}`);
    if (e.stack) {
      Logger.log(`Stack trace: ${e.stack}`);
    }
    return false;
  }
}

/**
 * Extracts text content from a Google Doc.
 */
function extractDocText(docId) {
  try {
    Logger.log(`📄 Attempting to extract text from doc: ${docId}`);
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    const text = body.getText();
    Logger.log(`✅ Successfully extracted ${text.length} characters`);
    return text;
  } catch (e) {
    Logger.log(`❌ Error extracting text from ${docId}: ${e.message}`);
    
    // Try using the Drive API as fallback
    try {
      Logger.log(`⚠️ Trying Drive API fallback to access document`);
      
      // Attempt to read file content via Drive
      const file = DriveApp.getFileById(docId);
      const content = file.getBlob().getDataAsString();
      
      // If we got content, it's likely a plain text file
      if (content && content.length > 0) {
        Logger.log(`✅ Successfully extracted ${content.length} characters via Drive API`);
        return content;
      }
    } catch (driveError) {
      Logger.log(`❌ Drive API fallback also failed: ${driveError.message}`);
    }
    
    return null;
  }
}

/**
 * Assigns a score to a student submission in Google Classroom.
 */
function assignScoreToClassroom(courseId, courseworkId, submissionId, score) {
  try {
    Logger.log(`📌 SCORE ASSIGNMENT ATTEMPT`);
    Logger.log(`📌 Course ID: ${courseId}`);
    Logger.log(`📌 CourseWork ID: ${courseworkId}`);
    Logger.log(`📌 Submission ID: ${submissionId}`);
    Logger.log(`📌 Score: ${score}`);
    
    if (!courseId || !courseworkId || !submissionId) {
      Logger.log(`❌ Missing required parameters`);
      return false;
    }
    
    // Try using advanced Classroom service
    try {
      Logger.log(`📌 Using Classroom API service`);
      
      // Ensure the score is a number
      const numericScore = Number(score);
      if (isNaN(numericScore)) {
        Logger.log(`❌ Invalid score value: ${score}`);
        return false;
      }
      
      // First get the current submission
      const submission = Classroom.Courses.CourseWork.StudentSubmissions.get(
        courseId, courseworkId, submissionId);
      
      Logger.log(`📌 Current submission state: ${submission.state}`);
      
      // Update with the new grade
      const patchedSubmission = Classroom.Courses.CourseWork.StudentSubmissions.patch({
        assignedGrade: numericScore,
        draftGrade: numericScore
      }, courseId, courseworkId, submissionId, {
        updateMask: 'assignedGrade,draftGrade'
      });
      
      Logger.log(`📌 Updated submission, new grade: ${patchedSubmission.assignedGrade}`);
      
      // If the state was TURNED_IN, also return it to the student
      if (submission.state === 'TURNED_IN') {
        Logger.log(`📌 Setting state to RETURNED`);
        const returnedSubmission = Classroom.Courses.CourseWork.StudentSubmissions.patch({
          state: 'RETURNED'
        }, courseId, courseworkId, submissionId, {
          updateMask: 'state'
        });
        
        Logger.log(`📌 Submission returned, state: ${returnedSubmission.state}`);
      }
      
      return true;
      
    } catch (e) {
      Logger.log(`⚠️ Classroom API service error: ${e.message}`);
      
      // Fall back to direct API call method
      return assignScoreViaDirectAPI(courseId, courseworkId, submissionId, score);
    }
  } catch (e) {
    Logger.log(`❌ Error in assignScoreToClassroom: ${e.message}`);
    return false;
  }
}

/**
 * Fallback method to assign scores using direct API call.
 */
function assignScoreViaDirectAPI(courseId, courseworkId, submissionId, score) {
  try {
    Logger.log(`📌 Trying direct API method`);
    
    const service = getOAuthService();
    if (!service.hasAccess()) {
      Logger.log(`❌ No OAuth access`);
      return false;
    }
    
    // Ensure the score is a number
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      Logger.log(`❌ Invalid score value: ${score}`);
      return false;
    }
    
    // First get the current submission
    const getUrl = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseworkId}/studentSubmissions/${submissionId}`;
    
    const getResponse = UrlFetchApp.fetch(getUrl, {
      headers: { 
        'Authorization': 'Bearer ' + service.getAccessToken(),
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    if (getResponse.getResponseCode() !== 200) {
      Logger.log(`❌ Failed to get submission: ${getResponse.getResponseCode()}`);
      return false;
    }
    
    const submission = JSON.parse(getResponse.getContentText());
    Logger.log(`📌 Current submission state: ${submission.state}`);
    
    // Update the grade
    const patchUrl = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseworkId}/studentSubmissions/${submissionId}?updateMask=assignedGrade,draftGrade`;
    const payload = {
      assignedGrade: numericScore,
      draftGrade: numericScore
    };
    
    const patchResponse = UrlFetchApp.fetch(patchUrl, {
      method: 'patch',
      contentType: 'application/json',
      headers: { 
        'Authorization': 'Bearer ' + service.getAccessToken(),
        'Accept': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (patchResponse.getResponseCode() !== 200) {
      Logger.log(`❌ Failed to update grade: ${patchResponse.getResponseCode()}`);
      return false;
    }
    
    // If the submission was TURNED_IN, set it to RETURNED
    if (submission.state === 'TURNED_IN') {
      Logger.log(`📌 Setting state to RETURNED`);
      
      const returnUrl = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseworkId}/studentSubmissions/${submissionId}?updateMask=state`;
      const returnPayload = { state: 'RETURNED' };
      
      const returnResponse = UrlFetchApp.fetch(returnUrl, {
        method: 'patch',
        contentType: 'application/json',
        headers: { 
          'Authorization': 'Bearer ' + service.getAccessToken(),
          'Accept': 'application/json'
        },
        payload: JSON.stringify(returnPayload),
        muteHttpExceptions: true
      });
      
      if (returnResponse.getResponseCode() !== 200) {
        Logger.log(`⚠️ Failed to return submission: ${returnResponse.getResponseCode()}`);
        // Continue anyway since the grade was assigned
      }
    }
    
    return true;
    
  } catch (e) {
    Logger.log(`❌ Error in assignScoreViaDirectAPI: ${e.message}`);
    return false;
  }
}

/**
 * Uses Gemini AI to grade an essay.
 */
function gradeWithGeminiEssay(studentAnswer, questionText, rubricText) {
  try {
    Logger.log(`🤖 Starting Gemini API grading process`);
    const config = getConfig();
    const apiKey = config.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // 사용자 프롬프트 가져오기
    let promptTemplate = getSystemPrompt();
    
    // 템플릿 변수 대체
    const prompt = promptTemplate
      .replace('{questionText}', questionText)
      .replace('{rubricText}', rubricText)
      .replace('{studentAnswer}', studentAnswer);

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ Gemini API error: ${response.getContentText()}`);
      return { score: config.DEFAULT_SCORE, feedback: [] };
    }

    const result = JSON.parse(response.getContentText());
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      Logger.log(`❌ No text in Gemini response`);
      return { score: config.DEFAULT_SCORE, feedback: [] };
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      
      // Validate score
      if (parsed.score === undefined || parsed.score === null || isNaN(Number(parsed.score))) {
        parsed.score = config.DEFAULT_SCORE;
      } else {
        parsed.score = Number(parsed.score);
        parsed.score = Math.max(0, Math.min(10, parsed.score));
      }
      
      // Ensure feedback is an array
      if (!Array.isArray(parsed.feedback)) {
        parsed.feedback = [];
      }
      
      // Ensure suggestions is an array
      if (!Array.isArray(parsed.suggestions)) {
        parsed.suggestions = [];
      }
      
      return parsed;
    } catch (parseError) {
      Logger.log(`⚠️ JSON parsing failed: ${parseError.message}`);
      
      // Extract score using regex as fallback
      const scoreMatch = text.match(/"score"\s*:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : config.DEFAULT_SCORE;
      
      return { 
        score: score, 
        feedback: [],
        error: "Response parsing failed" 
      };
    }
  } catch (e) {
    Logger.log(`❌ Gemini API request error: ${e.message}`);
    return { 
      score: config.DEFAULT_SCORE, 
      feedback: [],
      error: e.message 
    };
  }
}