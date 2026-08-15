// Authentication System — JSU Mentoring

// ── REGISTER USER ──
function registerUser(role) {
    const nameEl    = document.getElementById('fullname');
    const emailEl   = document.getElementById('email');
    const pwEl      = document.getElementById('password');
    const confirmEl = document.getElementById('confirm-password');

    const name     = nameEl.value.trim();
    const email    = emailEl.value.trim();
    const password = pwEl.value;
    const confirm  = confirmEl ? confirmEl.value : password;

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

    let users = JSON.parse(localStorage.getItem('users')) || [];

    const existing = users.find(u => u.email === email);
    if (existing) {
        alert('An account with this email already exists.');
        return;
    }

    users.push({ name, email, password, role });
    localStorage.setItem('users', JSON.stringify(users));

    window.location.href = 'signup_success.html';
}


// ── LOGIN USER ──
// Called from either index.html (root) or Pages/index.html
function loginUser() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter your email and password.');
        return;
    }

    const users     = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
        alert('Invalid email or password.');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify(foundUser));

    // Determine if called from root index.html or Pages/index.html
    const isFromRoot = window.location.pathname.endsWith('/index.html');
    const isFromPages = window.location.pathname.includes('/Pages/index.html');
    
    let dashboardPath;
    if (isFromPages) {
        // Called from Pages/index.html — use relative paths to Pages/
        dashboardPath = foundUser.role === 'mentor' 
            ? './Mentors/mentor_dashboard.html'
            : './Mentees/student_dashboard.html';
    } else {
        // Called from root index.html — use relative paths to Pages/
        dashboardPath = foundUser.role === 'mentor' 
            ? './Pages/Mentors/mentor_dashboard.html'
            : './Pages/Mentees/student_dashboard.html';
    }
    
    window.location.href = dashboardPath;
}


// ── LOGOUT USER ──
// Called from Pages/Mentors/ or Pages/Mentees/ — index.html is one level up
function logoutUser() {
    localStorage.removeItem('currentUser');
    // Pages/* pages are two levels deep relative to root index.html
    window.location.href = '../../index.html';
}


// ── CHECK LOGIN ──
// Called from Pages/Mentors/ or Pages/Mentees/ — index.html is one level up
//function checkLogin(requiredRole) {
   //const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    //if (!currentUser) {
        //alert('Please log in first.');
        //Ensure redirect reaches root index.html from Pages/* subfolders
        //window.location.href = '../../index.html';
        //return;
   // }

   // if (currentUser.role !== requiredRole) {
       // alert('Access denied.');
        //window.location.href = '../../index.html';
   // }
//}