/**
 * main.js - ไฟล์หลักสำหรับควบคุมการทำงานของเว็บไซต์
 */

// --- ส่วนที่ 1: ระบบจัดการ Breadcrumb ---
function updateBreadcrumb() {
    const breadcrumbEl = document.getElementById('breadcrumb');
    if (!breadcrumbEl) return;

    const path = window.location.pathname;
    
    // 1. ถ้าเป็นหน้าแรก ให้ซ่อน
    if (path.endsWith('index.html') || path === '/' || path === '') {
        breadcrumbEl.innerHTML = '';
        return; 
    }

    // 2. ดึงชื่อไฟล์ออกมา เช่น "flights.html"
    const fileName = path.split('/').pop(); 
    
    // 3. แปลงชื่อไฟล์เป็นชื่อเมนูที่สวยงาม (แทนที่ .html ด้วยช่องว่าง แล้วจัดตัวพิมพ์ใหญ่)
    // ตัวอย่าง: "flights.html" -> "Flights" หรือ "all-flights.html" -> "All Flights"
    let pageName = fileName.replace('.html', '').replace(/-/g, ' ');
    pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

    // 4. สร้าง HTML อัตโนมัติ
    let html = `<li><a href="index.html">Home</a></li>`;
    html += `<li>/ ${pageName}</li>`;
    
    breadcrumbEl.innerHTML = html;
}

// --- ส่วนที่ 2: ระบบ Login / Session ---
const SESSION_DURATION = 12 * 60 * 60 * 1000; 

function init() {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const timePassed = Date.now() - parseInt(loginTime);
        if (timePassed < SESSION_DURATION) {
            showLogoutState();
            startCountdown(parseInt(loginTime) + SESSION_DURATION);
        } else {
            logout(); 
        }
    }
}

function checkPassword() {
    const input = document.getElementById('pass').value;
    
    window.handleResponse = function(isCorrect) {
        if (isCorrect === true) {
            localStorage.setItem('loginTime', Date.now().toString());
            location.reload();
        } else {
            alert("Incorrect password");
        }
        document.body.removeChild(scriptTag);
    };

    const scriptTag = document.createElement('script');
    scriptTag.src = `${SCRIPT_URL}?function=checkPassword&pass=${input}&callback=handleResponse`;
    document.body.appendChild(scriptTag);
}

function showLogoutState() {
    const loginForm = document.getElementById('login-form');
    const logoutForm = document.getElementById('logout-form');
    if (loginForm) loginForm.classList.add('hidden');
    if (logoutForm) logoutForm.classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('loginTime');
    location.reload();
}

function startCountdown(endTime) {
    const timer = setInterval(() => {
        const distance = endTime - Date.now();
        const countdownEl = document.getElementById('countdown');
        if (distance < 0) { logout(); clearInterval(timer); return; }
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        if (countdownEl) countdownEl.innerText = `auto-logout in: ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// --- ส่วนที่ 3: สั่งให้ทำงานเมื่อโหลดหน้าเสร็จ ---
document.addEventListener('DOMContentLoaded', () => {
    updateBreadcrumb();
    init(); // เรียกใช้ระบบ Login เมื่อโหลดหน้าเว็บ
});
