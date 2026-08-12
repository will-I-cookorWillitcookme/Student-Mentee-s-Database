// Authentication System — JSU Mentoring
// Now backed by Supabase (real database + secure password handling)
// instead of localStorage.

// ── REGISTER USER ──
async function registerUser(role) {
    const nameEl    = document.getElementById('fullname');
    const emailEl   = document.getElementById('email');
    const pwEl      = document.getElementById('password');
    const confirmEl = document.getElementById('confirm-password');
    const subjectEl = document.getElementById('subject'); // optional field

    const name     = nameEl.value.trim();
    const email    = emailEl.value.trim();
    const password = pwEl.value;
    const confirm  = confirmEl ? confirmEl.value : password;
    const subject  = subjectEl ? subjectEl.value.trim() : null;

    if (!name || !email || !password || !confirm) {
        alert('Please fill in all fields.');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }
    if (password !== confirm) {
        alert('Passwords do not match.');
        return;
    }

    // 1. Create the login (Supabase handles password security)
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        alert(error.message);
        return;
    }

    // 2. Save the extra profile info (name, role, subject)
    const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: name,
        email: email,
        role: role,
        subject: subject
    });

    if (profileError) {
        alert('Account created, but saving profile failed: ' + profileError.message);
        return;
    }

    window.location.href = 'signup_success.html';
}


// ── LOGIN USER ──
// Called from either index.html (root) or Pages/index.html
async function loginUser() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter your email and password.');
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert('Invalid email or password.');
        return;
    }

    // Fetch the matching profile (name, role, subject)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile) {
        alert('Logged in, but could not load your profile.');
        return;
    }

    // Cache the profile locally so other pages can read it quickly.
    // (The real session is still managed securely by Supabase.)
    localStorage.setItem('currentUser', JSON.stringify(profile));

    // Determine if called from root index.html or Pages/index.html
    const isFromRoot = window.location.pathname.endsWith('/index.html');
    const isFromPages = window.location.pathname.includes('/Pages/index.html');

    let dashboardPath;
    if (isFromPages) {
        dashboardPath = profile.role === 'mentor'
            ? './Mentors/mentor_dashboard.html'
            : './Mentees/student_dashboard.html';
    } else {
        dashboardPath = profile.role === 'mentor'
            ? './Pages/Mentors/mentor_dashboard.html'
            : './Pages/Mentees/student_dashboard.html';
    }

    window.location.href = dashboardPath;
}


// ── LOGOUT USER ──
// Called from Pages/Mentors/ or Pages/Mentees/ — index.html is one level up
async function logoutUser() {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}


// ── CHECK LOGIN ──
// Called from Pages/Mentors/ or Pages/Mentees/ — index.html is one level up
function checkLogin(requiredRole) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('Please log in first.');
        window.location.href = '../index.html';
        return;
    }

    if (currentUser.role !== requiredRole) {
        alert('Access denied.');
        window.location.href = '../index.html';
    }
}