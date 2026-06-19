/**
 * main.js - ไฟล์หลักสำหรับควบคุมการทำงานของเว็บไซต์
 */

// --- ส่วนที่ 1: ระบบจัดการ Breadcrumb ---
// ใน main.js
function updateBreadcrumb() {
    const breadcrumbEl = document.getElementById('breadcrumb');
    if (!breadcrumbEl) return;

    const path = window.location.pathname;
    const fileName = path.split('/').pop();
    
    if (fileName === 'index.html' || fileName === '') return;

    // ระบบลำดับชั้น (เพิ่มหน้าใหม่ได้ที่นี่ที่เดียว!)
    const pageMap = {
        'flights.html': { name: 'Flights', parent: null },
        'all-flights.html': { name: 'All Flights', parent: 'flights.html' },
        'schedule.html': { name: 'Schedule', parent: null }
    };

    const currentPage = pageMap[fileName];
    if (!currentPage) return;

    let html = '<li><a href="index.html">Home</a></li>';

    // ถ้ามี Parent ให้ใส่ Parent ก่อน
    if (currentPage.parent && pageMap[currentPage.parent]) {
        const parent = pageMap[currentPage.parent];
        html += `<li>/ <a href="${currentPage.parent}">${parent.name}</a></li>`;
    }

    // ใส่หน้าปัจจุบัน
    html += `<li class="text-gray-400">/ ${currentPage.name}</li>`;
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

// ใน main.js
async function fetchAndDisplayFlights() {
    const container = document.getElementById('flight-container');
    if (!container) return;

    // แสดงสถานะโหลด
    container.innerHTML = '<div class="text-center mt-10 text-gray-500">กำลังโหลดข้อมูล...</div>';

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        // เคลียร์โหลดดิ้ง
        container.innerHTML = "";

        // --- ตรงนี้คือการนำตรรกะเดิมของคุณมาใส่ ---
        // 1. แสดง Recent Flight (ถ้ามี)
        // [ก๊อปปี้โค้ดส่วนที่สร้าง Recent Flight จาก HTML เดิมมาใส่ตรงนี้]

        // 2. ลูปสร้างปี/เดือน
        for (let setIdx = 4; setIdx < 200; setIdx += 9) {
            if (!data[0] || !data[0][setIdx]) continue;
            const year = data[0][setIdx].toString();
            
            container.innerHTML += `
                <div id="year-${year}" class="year-section w-full max-w-sm">
                    <button onclick="toggleYear(this)" class="w-full flex justify-between items-center text-lg font-bold text-[#333333] border-b-2 border-[#333333] pb-1 mt-6 mb-2">
                        ${year} <span class="arrow">◂</span>
                    </button>
                    <div class="content hidden w-full">${renderFlights(data, setIdx)}</div>
                </div>`;
        }
        
    } catch (error) {
        container.innerHTML = '<div class="text-center mt-10 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
        console.error("Error:", error);
    }
}

// --- ส่วนที่ 3: สั่งให้ทำงานเมื่อโหลดหน้าเสร็จ ---
document.addEventListener('DOMContentLoaded', () => {
    updateBreadcrumb();
    init(); // เรียกใช้ระบบ Login เมื่อโหลดหน้าเว็บ
});
