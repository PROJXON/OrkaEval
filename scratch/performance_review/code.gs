// ── CENTRAL CONFIG — change values here only ─────────────────────────────
var CONFIG = {
  SPREADSHEET_ID: '1v3h7KOgVbfZdp-RZg79BZyxUXBqJuU9aRHioy109qzQ',
  ROSTER_SHEET:   'Team Roster',
  RECORD_SHEET:   'Performance Review Records'
};

// ─────────────────────────────────────────────────────────────────────────
// doGet() renders the main index page, with graceful error handling.
// ─────────────────────────────────────────────────────────────────────────
function doGet() {
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Performance Review | Projxon')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput(
      '<h2 style="font-family:sans-serif;color:#c00">Setup Error</h2>' +
      '<p style="font-family:sans-serif">Could not load <strong>Index.html</strong>.<br>' +
      'Ensure the file exists in this project named exactly <code>Index</code>.</p>' +
      '<pre style="background:#f4f4f4;padding:12px;border-radius:6px">' + e.message + '</pre>'
    ).setTitle('Setup Error | Projxon');
  }
}

// ── Safe spreadsheet opener ───────────────────────────────────────────────
function openSpreadsheet_() {
  // 1. Try to get the active container spreadsheet (if container-bound)
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      return activeSs;
    }
  } catch (e) {
    Logger.log('getActiveSpreadsheet failed: ' + e.message);
  }

  // 2. Try to find a spreadsheet named "Performance Review Records" in Drive
  try {
    var files = DriveApp.getFilesByName('Performance Review Records');
    while (files.hasNext()) {
      var file = files.next();
      if (file.getMimeType() === 'application/vnd.google-apps.spreadsheet') {
        var ss = SpreadsheetApp.open(file);
        if (ss) return ss;
      }
    }
  } catch (e) {
    Logger.log('DriveApp search for "Performance Review Records" failed: ' + e.message);
  }

  // 3. Fallback to opening by hardcoded ID
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) throw new Error('openById returned null.');
    return ss;
  } catch (e) {
    throw new Error(
      'Cannot open spreadsheet (ID: ' + CONFIG.SPREADSHEET_ID + '). ' +
      'Check it exists, is not in Trash, and this script has Editor access. ' +
      'Detail: ' + e.message
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// getTeamRoster() retrieves the roster for autocomplete.
// Throws a proper error for the failure handler in Google Apps Script.
// ─────────────────────────────────────────────────────────────────────────
function getTeamRoster() {
  var ss    = openSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.ROSTER_SHEET);

  if (!sheet) {
    throw new Error(
      'Sheet "' + CONFIG.ROSTER_SHEET + '" not found. ' +
      'Check the tab name matches CONFIG.ROSTER_SHEET exactly (case-sensitive).'
    );
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];   // Empty or header-only — not an error

  var dataRows = lastRow - 1;   // Always >= 1
  var data     = sheet.getRange(2, 1, dataRows, 3).getValues();
  var roster   = [];

  for (var r = 0; r < data.length; r++) {
    var name = String(data[r][0] || '').trim();
    if (!name) continue;
    roster.push({
      name:       name,
      department: String(data[r][1] || '').trim(),
      email:      String(data[r][2] || '').trim()
    });
  }

  Logger.log('Roster loaded: ' + roster.length + ' participants');
  return roster;
}

// ─────────────────────────────────────────────────────────────────────────
// getOrCreateSheet_() opens or creates the Performance Review sheet
// and ensures headers are correctly placed on the first row.
// ─────────────────────────────────────────────────────────────────────────
function getOrCreateSheet_() {
  var ss    = openSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.RECORD_SHEET);
  if (!sheet) sheet = ss.insertSheet(CONFIG.RECORD_SHEET);

  var headers = [
    'Timestamp', 'Coach Name', 'Coach Email', 'Coachee Name', 'Coachee Email', 'Team',
    'Technical Skills Rating', 'Technical Skills Evidence', 'Technical Skills Growth Action',
    'Communication Rating', 'Communication Evidence', 'Communication Growth Action',
    'Leadership Rating', 'Leadership Evidence', 'Leadership Growth Action',
    'Growth Rating', 'Growth Evidence', 'Growth Growth Action',
    'Culture Rating', 'Culture Evidence', 'Culture Growth Action',
    'Greatest Achievement', 'Challenges & Resolution', 'Self-Correction',
    'Goal 1 (Short-term)', 'Goal 2 (Medium-term)', 'Priority Competency', 'General Comments',
    'Session Status', 'Email Status'
  ];

  var currentLastRow  = sheet.getLastRow();
  var existingHeaders = currentLastRow > 0
    ? sheet.getRange(1, 1, 1, headers.length).getValues()[0]
    : [];

  var headersMatch =
    existingHeaders.length === headers.length &&
    headers.every(function (h, i) { return existingHeaders[i] === h; });

  if (!headersMatch) {
    if (currentLastRow === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      var firstCell = String(existingHeaders[0] || '').trim();
      if (firstCell !== 'Timestamp') {
        sheet.insertRowBefore(1);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      } else {
        Logger.log('Warning: headers exist but do not fully match. Manual review recommended.');
      }
    }
  }

  return sheet;
}

// ── Email validation ───────────────────────────────────────────────────────
function isValidEmail_(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// ─────────────────────────────────────────────────────────────────────────
// sendReviewEmail_() emails details of the Performance Review.
// Gracefully handles MailApp exception quotas.
// ─────────────────────────────────────────────────────────────────────────
function sendReviewEmail_(data, timestamp) {
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new Error('Daily email quota exhausted. Session was saved but no email was sent.');
  }

  var seen = {};
  var recipients = [
    String(data.coachEmail  || '').trim(),
    String(data.coacheeEmail || '').trim()
  ].filter(function (e) {
    if (!isValidEmail_(e) || seen[e]) return false;
    seen[e] = true;
    return true;
  }).join(',');

  if (!recipients) return 'Skipped - no valid recipient';

  var formattedDate = Utilities.formatDate(
    timestamp, Session.getScriptTimeZone(), 'MMMM d, yyyy h:mm a'
  );

  var body =
    'Hello,\n\n' +
    'This is a formal confirmation that a Performance Review session has been completed and recorded.\n\n' +
    'Session Details:\n' +
    'Coach: '                   + (data.coachName    || '') + '\n' +
    'Coachee: '                 + (data.coacheeName  || '') + '\n' +
    'Team: '                    + (data.team         || '') + '\n' +
    'Date and Time: '           + formattedDate             + '\n' +
    'Session Status: '          + (data.sessionStatus || 'Completed') + '\n\n' +
    
    '=========================================\n' +
    'COMPETENCY EVALUATIONS & COMMENTS\n' +
    '=========================================\n\n' +
    
    '1. Technical Skills & Quality\n' +
    '- Rating: ' + (data.techRating || 'Not Rated') + '/5\n' +
    '- Evidence: ' + (data.techEvidence || 'None provided') + '\n' +
    '- Growth Action: ' + (data.techAction || 'None planned') + '\n\n' +
    
    '2. Communication & Collaboration\n' +
    '- Rating: ' + (data.commRating || 'Not Rated') + '/5\n' +
    '- Evidence: ' + (data.commEvidence || 'None provided') + '\n' +
    '- Growth Action: ' + (data.commAction || 'None planned') + '\n\n' +
    
    '3. Leadership & Initiative\n' +
    '- Rating: ' + (data.leadRating || 'Not Rated') + '/5\n' +
    '- Evidence: ' + (data.leadEvidence || 'None provided') + '\n' +
    '- Growth Action: ' + (data.leadAction || 'None planned') + '\n\n' +
    
    '4. Growth & Learning\n' +
    '- Rating: ' + (data.growthRating || 'Not Rated') + '/5\n' +
    '- Evidence: ' + (data.growthEvidence || 'None provided') + '\n' +
    '- Growth Action: ' + (data.growthAction || 'None planned') + '\n\n' +
    
    '5. Culture & Professional Growth\n' +
    '- Rating: ' + (data.cultureRating || 'Not Rated') + '/5\n' +
    '- Evidence: ' + (data.cultureEvidence || 'None provided') + '\n' +
    '- Growth Action: ' + (data.cultureAction || 'None planned') + '\n\n' +
    
    '=========================================\n' +
    'SELF-REFLECTION & GOALS\n' +
    '=========================================\n\n' +
    
    '- Greatest Achievement:\n' + (data.greatestAchievement || 'None provided') + '\n\n' +
    '- Challenges & Resolution:\n' + (data.biggestChallenge || 'None provided') + '\n\n' +
    '- Self-Correction (Do Differently):\n' + (data.doDifferently || 'None provided') + '\n\n' +
    '- Goal 1 (Short-term):\n' + (data.goal1 || 'None provided') + '\n\n' +
    '- Goal 2 (Medium-term):\n' + (data.goal2 || 'None provided') + '\n\n' +
    '- Priority Competency for Next Cycle:\n' + (data.priorityCompetency || 'None provided') + '\n\n' +
    '- General Feedback / Comments for Supervisor:\n' + (data.generalComments || 'None provided') + '\n\n' +
    
    'Please retain this email for your records.\n\n' +
    'Best regards,\nProjxon Performance Review System';

  MailApp.sendEmail({
    to:      recipients,
    subject: 'Confirmation of Projxon Performance Review Session',
    body:    body
  });

  return 'Sent';
}

function authorizeMailOnly() {
  MailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    'Mail authorization test',
    'Mail authorization completed.'
  );
}

// ─────────────────────────────────────────────────────────────────────────
// recordPerformanceReview() appends performance review data to the sheet,
// fires the email confirmation, and handles potential quota limits.
// ─────────────────────────────────────────────────────────────────────────
function recordPerformanceReview(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid payload received. Please try submitting again.');
  }

  try {
    var sheet = getOrCreateSheet_();

    var record = {
      coachName:             String(data.coachName             || '').trim(),
      coachEmail:            String(data.coachEmail            || '').trim(),
      coacheeName:           String(data.coacheeName           || '').trim(),
      coacheeEmail:          String(data.coacheeEmail          || '').trim(),
      team:                  String(data.team                  || '').trim(),
      
      // Competencies
      techRating:            String(data.techRating            || '').trim(),
      techEvidence:          String(data.techEvidence          || '').trim(),
      techAction:            String(data.techAction            || '').trim(),
      
      commRating:            String(data.commRating            || '').trim(),
      commEvidence:          String(data.commEvidence          || '').trim(),
      commAction:            String(data.commAction            || '').trim(),
      
      leadRating:            String(data.leadRating            || '').trim(),
      leadEvidence:          String(data.leadEvidence          || '').trim(),
      leadAction:            String(data.leadAction            || '').trim(),
      
      growthRating:          String(data.growthRating          || '').trim(),
      growthEvidence:        String(data.growthEvidence        || '').trim(),
      growthAction:          String(data.growthAction          || '').trim(),
      
      cultureRating:         String(data.cultureRating         || '').trim(),
      cultureEvidence:       String(data.cultureEvidence       || '').trim(),
      cultureAction:         String(data.cultureAction         || '').trim(),
      
      // Reflection
      greatestAchievement:   String(data.greatestAchievement   || '').trim(),
      biggestChallenge:      String(data.biggestChallenge      || '').trim(),
      doDifferently:         String(data.doDifferently         || '').trim(),
      goal1:                 String(data.goal1                 || '').trim(),
      goal2:                 String(data.goal2                 || '').trim(),
      priorityCompetency:    String(data.priorityCompetency    || '').trim(),
      generalComments:       String(data.generalComments       || '').trim(),
      
      sessionStatus:         String(data.sessionStatus         || 'Completed').trim()
    };

    if (!record.coachName || !record.coacheeName || !record.team) {
      throw new Error('Coach name, coachee name, and team are required.');
    }

    var targetRow = sheet.getLastRow() + 1;

    sheet.appendRow([
      new Date(),
      record.coachName,
      record.coachEmail,
      record.coacheeName,
      record.coacheeEmail,
      record.team,
      
      // Competencies
      record.techRating, record.techEvidence, record.techAction,
      record.commRating, record.commEvidence, record.commAction,
      record.leadRating, record.leadEvidence, record.leadAction,
      record.growthRating, record.growthEvidence, record.growthAction,
      record.cultureRating, record.cultureEvidence, record.cultureAction,
      
      // Reflection
      record.greatestAchievement,
      record.biggestChallenge,
      record.doDifferently,
      record.goal1,
      record.goal2,
      record.priorityCompetency,
      record.generalComments,
      
      record.sessionStatus,
      'Pending'
    ]);

    var emailStatus = 'Not attempted';
    try {
      emailStatus = sendReviewEmail_(record, new Date());
    } catch (emailError) {
      emailStatus = 'Failed - ' + emailError.message;
      Logger.log('Email failed: ' + emailError.message);
    }

    sheet.getRange(targetRow, 29).setValue(emailStatus); // 29 is Email Status column index (1-based)

    return {
      success: true,
      message: emailStatus === 'Sent'
        ? 'Performance Review recorded and confirmation email sent.'
        : 'Performance Review recorded. Email status: ' + emailStatus
    };
  } catch (error) {
    Logger.log('recordPerformanceReview failed: ' + error.message);
    throw new Error('Recording failed: ' + error.message);
  }
}

// ── Health check — run manually from Apps Script editor ───────────────────
function healthCheck() {
  Logger.log('=== Performance Review Health Check ===');
  try {
    var ss = openSpreadsheet_();
    Logger.log('✅ Spreadsheet: ' + ss.getName());

    var roster = ss.getSheetByName(CONFIG.ROSTER_SHEET);
    Logger.log(roster
      ? '✅ Roster sheet found (' + Math.max(0, roster.getLastRow() - 1) + ' members)'
      : '❌ Roster sheet MISSING — expected tab: "' + CONFIG.ROSTER_SHEET + '"');

    var record = ss.getSheetByName(CONFIG.RECORD_SHEET);
    Logger.log(record
      ? '✅ Record sheet found (' + Math.max(0, record.getLastRow() - 1) + ' sessions)'
      : '⚠️  Record sheet not yet created — auto-creates on first submission');

    Logger.log('✅ Mail quota remaining: ' + MailApp.getRemainingDailyQuota());
  } catch (e) {
    Logger.log('❌ Health check FAILED: ' + e.message);
  }
}
