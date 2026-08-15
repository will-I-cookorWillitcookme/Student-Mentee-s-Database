// ══════════════════════════════════════════════════════════════
//  risk_engine.js  —  JSU Mentoring  |  Check-In Risk Scorer
//  Mirrors Python scoring logic using conditional rules.
// ══════════════════════════════════════════════════════════════

/**
 * SCORING SYSTEM
 * Each check-in field contributes points to a raw score (0–100).
 * Higher score  →  LOWER risk.
 *
 * Fields & weights:
 *   sleepHours       (0–20 pts)
 *   studyHours       (0–20 pts)
 *   assignmentAvg    (0–30 pts)   ← heaviest weight (academic outcome)
 *   stressLevel      (0–15 pts)   ← inverted  (High stress = low pts)
 *   motivationLevel  (0–15 pts)
 *                          ─────
 *                   Total  0–100
 *
 * Risk Bands:
 *   score >= 70  →  LIKELY TO SUCCEED   (green)
 *   score >= 45  →  STABLE              (yellow)
 *   score <  45  →  AT RISK             (red)
 */

// ── Individual field scorers ──────────────────────────────────

function scoreSleep(hours) {
    // hours is a number parsed from "6 Hours" → 6
    if (hours >= 8)  return 20;
    if (hours === 7) return 14;
    if (hours === 6) return 8;
    return 4; // < 6
}

function scoreStudy(hours) {
    if (hours >= 5)  return 20;
    if (hours === 4) return 16;
    if (hours === 3) return 10;
    if (hours === 2) return 5;
    return 2; // < 2
}

function scoreAssignment(avg) {
    // avg is a number 0–100
    if (avg >= 75) return 30;
    if (avg >= 60) return 22;
    if (avg >= 50) return 14;
    if (avg >= 40) return 7;
    return 2;
}

function scoreStress(level) {
    // level: "Low" | "Medium" | "High"
    const map = { Low: 15, Medium: 8, High: 2 };
    return map[level] ?? 8;
}

function scoreMotivation(level) {
    // level: "Low" | "Medium" | "High"
    const map = { Low: 3, Medium: 9, High: 15 };
    return map[level] ?? 9;
}

// ── Main scorer ───────────────────────────────────────────────

/**
 * computeRisk(checkIn) → { score, band, reasons, breakdown }
 *
 * @param {Object} checkIn  — stored check-in object
 * @returns {Object}
 */
function computeRisk(checkIn) {
    const sleep      = parseFloat(checkIn.sleepHours)    || 0;
    const study      = parseFloat(checkIn.studyHours)    || 0;
    const assignment = parseFloat(checkIn.assignmentAvg) || 0;
    const stress     = checkIn.stressLevel     || 'Medium';
    const motivation = checkIn.motivationLevel || 'Medium';

    const sleepPts      = scoreSleep(sleep);
    const studyPts      = scoreStudy(study);
    const assignmentPts = scoreAssignment(assignment);
    const stressPts     = scoreStress(stress);
    const motivPts      = scoreMotivation(motivation);

    const score = sleepPts + studyPts + assignmentPts + stressPts + motivPts;

    // ── Risk band ──
    let band;
    if (score >= 70) {
        band = 'SUCCESS';
    } else if (score >= 45) {
        band = 'STABLE';
    } else {
        band = 'AT RISK';
    }

    // ── Human-readable reasons ──
    const reasons = [];
    if (sleep < 7)          reasons.push(`Low sleep (${sleep}h)`);
    if (study < 3)          reasons.push(`Low study time (${study}h)`);
    if (assignment < 60)    reasons.push(`Assignment avg below 60% (${assignment}%)`);
    if (stress === 'High')  reasons.push('High stress level');
    if (motivation === 'Low') reasons.push('Low motivation');

    if (reasons.length === 0) {
        reasons.push('All indicators healthy');
    }

    return {
        score,
        band,
        reasons,
        breakdown: { sleepPts, studyPts, assignmentPts, stressPts, motivPts }
    };
}

// ── Storage helpers ───────────────────────────────────────────

const CHECK_IN_KEY = 'checkIns'; // localStorage key

/**
 * Save a mentee's check-in.
 * Stores an array of check-ins per email so history is preserved.
 */
function saveCheckIn(email, data) {
    const all = JSON.parse(localStorage.getItem(CHECK_IN_KEY)) || {};
    if (!all[email]) all[email] = [];
    all[email].push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem(CHECK_IN_KEY, JSON.stringify(all));
}

/**
 * Get the latest check-in for a specific mentee email.
 */
function getLatestCheckIn(email) {
    const all = JSON.parse(localStorage.getItem(CHECK_IN_KEY)) || {};
    const entries = all[email];
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1];
}

/**
 * Get all mentees who have submitted at least one check-in,
 * with their latest check-in and computed risk.
 */
function getAllMenteeRisks() {
    const all = JSON.parse(localStorage.getItem(CHECK_IN_KEY)) || {};
    return Object.entries(all).map(([email, entries]) => {
        const latest = entries[entries.length - 1];
        const risk   = computeRisk(latest);
        // Pull name from users list if available
        const users  = JSON.parse(localStorage.getItem('users')) || [];
        const user   = users.find(u => u.email === email);
        return {
            email,
            name:      user ? user.name : email,
            checkIn:   latest,
            ...risk
        };
    });
}
