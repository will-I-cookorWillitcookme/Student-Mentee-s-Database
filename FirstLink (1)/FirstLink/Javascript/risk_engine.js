// ══════════════════════════════════════════════════════════════
//  risk_engine.js  —  JSU Mentoring  |  Check-In Risk Scorer
//  Scoring logic is unchanged. Storage now goes to Supabase
//  instead of localStorage.
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
    if (avg >= 75) return 30;
    if (avg >= 60) return 22;
    if (avg >= 50) return 14;
    if (avg >= 40) return 7;
    return 2;
}

function scoreStress(level) {
    const map = { Low: 15, Medium: 8, High: 2 };
    return map[level] ?? 8;
}

function scoreMotivation(level) {
    const map = { Low: 3, Medium: 9, High: 15 };
    return map[level] ?? 9;
}

// ── Main scorer ───────────────────────────────────────────────

/**
 * computeRisk(checkIn) → { score, band, reasons, breakdown }
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

    let band;
    if (score >= 70) {
        band = 'SUCCESS';
    } else if (score >= 45) {
        band = 'STABLE';
    } else {
        band = 'AT RISK';
    }

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

// ── Storage helpers (now backed by Supabase) ────────────────────

/**
 * Save a mentee's check-in to the check_ins table.
 * Computes the risk score/band and stores it alongside the answers.
 */
async function saveCheckIn(email, data) {
    // Look up the mentee's profile id from their email
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (profileError || !profile) {
        alert('Could not find your profile. Please log in again.');
        return;
    }

    const risk = computeRisk(data);

    const { error } = await supabase.from('check_ins').insert({
        mentee_id: profile.id,
        sleep_hours: data.sleepHours,
        study_hours: data.studyHours,
        assignment_avg: data.assignmentAvg,
        stress_level: data.stressLevel,
        motivation_level: data.motivationLevel,
        risk_score: risk.score,
        risk_band: risk.band
    });

    if (error) {
        alert('Could not save your check-in: ' + error.message);
    }
}

/**
 * Get the latest check-in for a specific mentee email.
 */
async function getLatestCheckIn(email) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (!profile) return null;

    const { data: entries } = await supabase
        .from('check_ins')
        .select('*')
        .eq('mentee_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

    return entries && entries.length > 0 ? entries[0] : null;
}

/**
 * Get all mentees who have submitted at least one check-in,
 * with their latest check-in and computed risk.
 * (Used by the mentor's risk_indicators dashboard.)
 */
async function getAllMenteeRisks() {
    // Pull every check-in, newest first, joined with the mentee's profile
    const { data: rows, error } = await supabase
        .from('check_ins')
        .select('*, profiles!check_ins_mentee_id_fkey(full_name, email)')
        .order('created_at', { ascending: false });

    if (error || !rows) return [];

    // Keep only the newest row per mentee (rows are already newest-first)
    const seen = new Set();
    const latestPerMentee = [];
    for (const row of rows) {
        if (seen.has(row.mentee_id)) continue;
        seen.add(row.mentee_id);
        latestPerMentee.push(row);
    }

    return latestPerMentee.map(row => {
        const checkIn = {
            sleepHours: row.sleep_hours,
            studyHours: row.study_hours,
            assignmentAvg: row.assignment_avg,
            stressLevel: row.stress_level,
            motivationLevel: row.motivation_level
        };
        const risk = computeRisk(checkIn);
        return {
            email: row.profiles?.email,
            name: row.profiles?.full_name || row.profiles?.email,
            checkIn,
            ...risk
        };
    });
}