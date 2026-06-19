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
// ปรับฟังก์ชันให้รับพารามิเตอร์ type
async function fetchAndDisplayFlights(type = 'all') {
    const container = document.getElementById('flight-container');
    if (!container) return;
    container.innerHTML = '<div class="text-center mt-10 text-gray-500">กำลังโหลดข้อมูล...</div>';

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        container.innerHTML = "";

        // 1. กรองข้อมูล (ถ้ามี)
        let filteredData = data; 
        if (type === 'intl') {
            filteredData = data.filter(row => row[10] === 'International');
        } else if (type === 'dom') {
            filteredData = data.filter(row => row[10] === 'Domestic');
        }

        // 2. หา Recent Flight (ใช้ข้อมูลดิบจาก data ชุดแรก)
        let latestRowIdx = -1;
        for (let rowIdx = 499; rowIdx >= 3; rowIdx--) {
            if (data[rowIdx] && data[rowIdx][4]) {
                latestRowIdx = rowIdx;
                break;
            }
        }

        if (latestRowIdx !== -1) {
            container.innerHTML += `
                <div class="w-full max-w-sm mb-6">
                    <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Flight</h2>
                    ${renderSingleFlight(data, latestRowIdx, 4)}
                </div>
            `;
        }

        // 3. วนลูปสร้างปี/เดือน
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
    } catch (e) {
        container.innerHTML = '<div class="text-center mt-10 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
        console.error("Error:", e);
    }
}

function formatTime(val) {
    if (!val) return '--:--';
    const date = new Date(val);
    if (isNaN(date.getTime())) return val.toString().substring(0, 5);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

// ฟังก์ชันเดียวจบสำหรับสร้าง HTML การ์ด

// ฟังก์ชันตัวใหม่ (สำหรับรายการปีใน All Flights)
function createNarrowFlightCardHTML(data, rowIdx, setIdx) {
    // --- ดึงตรรกะคำนวณมาใส่ให้ครบ ---
        const d = new Date(data[rowIdx][setIdx]);
        const dayName = d.toLocaleDateString('en-US', {weekday: 'short'}).toUpperCase();
        const dayNum = d.getDate();
        const month = d.toLocaleDateString('en-US', {month: 'short'}).toUpperCase();
        
        const h4 = data[rowIdx][setIdx+3] === true;
        const i4 = data[rowIdx][setIdx+4] === true;
        const statusIcon = h4 && i4 ? '🛄' : h4 ? '🛫' : i4 ? '🛬' : '⛔';
        const showMeeting = (h4 || i4);
        
        const flightRaw = String(data[rowIdx][setIdx+6] || '');
        const flightCode = flightRaw.trim().split(' ')[0].toLowerCase(); 
        const airlineMapping = { "tvj": "vj", "pal": "2p" };
        const finalFlightCode = airlineMapping[flightCode] || flightCode;
        const logoUrl = finalFlightCode ? `https://edge.wego.com/image/upload/flights/airlines_square/${finalFlightCode}` : '';
        
        const j5 = data[rowIdx+1][setIdx+5] || '';
        const j6 = data[rowIdx+2][setIdx+5] || '';
        const j7 = data[rowIdx+3][setIdx+5] || '';
        const bottomText = showMeeting ? `${j5} ${j6} : ${j7}` : `${j5} ${j6}`;

        // --- โครงสร้าง HTML เดียวกับที่ใช้ในลูป (ตัดส่วน Floating Bar ออก) ---
        return `
          <div class="bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm mx-auto my-2"> 
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-[6px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded">${dayName}</span> 
              <span class="text-[9px] font-semibold text-gray-700">${dayNum} ${month}</span>
              <span class="text-[9px] text-gray-300 mx-1">|</span>
              <span class="text-[9px] text-gray-600">${data[rowIdx][setIdx+5]}</span>
              <div class="flex flex-1 justify-end items-center text-right">
                <div class="mr-1.5">
                  <div class="text-[9px] font-bold text-gray-800">${data[rowIdx][setIdx+6]}</div>
                  <div class="text-[6px] text-gray-400 font-medium">${data[rowIdx][setIdx+7]}</div>
                </div>
                <img src="${logoUrl}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
              </div>
            </div>

            <div class="flex justify-between items-center text-lg font-black text-[#333333] my-1">
              <div class="flex items-center justify-start">
                <div class="text-sm font-bold text-gray-800">${data[rowIdx+2][setIdx+3]}
                    <i data-lucide="plane-takeoff" class="w-3 h-3 mb-1"></i>
                    <span class="text-xs font-bold text-gray-800">${formatTime(data[rowIdx+1][setIdx+3])}</span>
                </div>
                <div class="text-[6px] text-gray-500 leading-tight">${data[rowIdx+3][setIdx+3] || ''}</div>
              </div>
              <div class="text-gray-300 text-sm">→</div>
              <div class="flex items-center justify-end text-right">
                <div class="text-xs font-bold text-gray-800">${formatTime(data[rowIdx+1][setIdx+4])}
                    <i data-lucide="plane-landing" class="w-3 h-3 mb-1"></i>
                    <span class="text-sm font-bold text-gray-800">${data[rowIdx+2][setIdx+4]}</span>
                </div>
                <div class="text-[6px] text-gray-500 leading-tight">${data[rowIdx+3][setIdx+4] || ''}</div>
              </div>
            </div>
    
            <div class="pt-1 border-t text-[6px] text-blue-800 font-bold">
              ${statusIcon} ${bottomText}
            </div>
          </div>`;
    }


function renderSingleFlight(data, rowIdx, setIdx) {
        // --- ดึงตรรกะคำนวณมาใส่ให้ครบ ---
        const d = new Date(data[rowIdx][setIdx]);
        const dayName = d.toLocaleDateString('en-US', {weekday: 'short'}).toUpperCase();
        const dayNum = d.getDate();
        const month = d.toLocaleDateString('en-US', {month: 'short'}).toUpperCase();
        
        const h4 = data[rowIdx][setIdx+3] === true;
        const i4 = data[rowIdx][setIdx+4] === true;
        const statusIcon = h4 && i4 ? '🛄' : h4 ? '🛫' : i4 ? '🛬' : '⛔';
        const showMeeting = (h4 || i4);
        
        const flightRaw = String(data[rowIdx][setIdx+6] || '');
        const flightCode = flightRaw.trim().split(' ')[0].toLowerCase(); 
        const airlineMapping = { "tvj": "vj", "pal": "2p" };
        const finalFlightCode = airlineMapping[flightCode] || flightCode;
        const logoUrl = finalFlightCode ? `https://edge.wego.com/image/upload/flights/airlines_square/${finalFlightCode}` : '';
        
        const j5 = data[rowIdx+1][setIdx+5] || '';
        const j6 = data[rowIdx+2][setIdx+5] || '';
        const j7 = data[rowIdx+3][setIdx+5] || '';
        const bottomText = showMeeting ? `${j5} ${j6} : ${j7}` : `${j5} ${j6}`;

        // --- โครงสร้าง HTML เดียวกับที่ใช้ในลูป (ตัดส่วน Floating Bar ออก) ---
        return `
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm mx-auto"> 
            <div class="flex items-center space-x-2 mb-4">
              <span class="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded">${dayName}</span> 
              <span class="text-sm font-semibold text-gray-700">${dayNum} ${month}</span>
              <span class="text-gray-300 mx-2"> | </span>
              <span class="text-sm text-gray-700">${data[rowIdx][setIdx+5]}</span>
              <div class="flex flex-1 justify-end items-center text-right">
                <div class="mr-2">
                  <div class="text-sm font-bold text-gray-800">${data[rowIdx][setIdx+6]}</div>
                  <div class="text-[9px] text-gray-400 font-medium">${data[rowIdx][setIdx+7]}</div>
                </div>
                <img src="${logoUrl}" class="w-6 h-6 object-contain" onerror="this.style.display='none'">
              </div>
            </div>

            <div class="flex justify-between items-center text-2xl sm:text-3xl font-black text-[#333333] my-4">
              <div class="text-center">
                <div>${data[rowIdx+2][setIdx+3]}</div>
                <div class="text-lg font-bold text-gray-800">${formatTime(data[rowIdx+1][setIdx+3])}</div>
                <div class="text-xs text-gray-500">${data[rowIdx+3][setIdx+3] || ''}</div>
              </div>
              <div class="text-gray-400 text-lg">→</div>
              <div class="text-center">
                <div>${data[rowIdx+2][setIdx+4]}</div>
                <div class="text-lg font-bold text-gray-800">${formatTime(data[rowIdx+1][setIdx+4])}</div>
                <div class="text-xs text-gray-500">${data[rowIdx+3][setIdx+4] || ''}</div>
              </div>
            </div>

            <div class="pt-4 border-t text-[11px] text-blue-800 font-bold">
              ${statusIcon} ${bottomText}
            </div>
          </div>`;
    }

function renderFlights(data, setIdx) {
    let html = '';
    for (let rowIdx = 3; rowIdx < 500; rowIdx += 4) {
        if (!data[rowIdx] || !data[rowIdx][setIdx]) break;
        
        // เปลี่ยนจาก createFlightCardHTML เป็น createNarrowFlightCardHTML
        // และเอา parameter showFloatingBar ออก เพราะ narrow card ของคุณไม่มีส่วนนี้
        html += createNarrowFlightCardHTML(data, rowIdx, setIdx);
    }
    const container = document.getElementById('card-container');
    if (container) {
        container.innerHTML = html;
        
        // 2. เรียกใช้ Lucide ทันทีหลังจากใส่ HTML เข้าไปแล้ว เพื่อเปลี่ยน <i> ให้เป็นไอคอน
        // ใน main.js ตรงจุดที่คุณสั่ง createIcons() ให้แก้เป็นบรรทัดนี้:

        if (typeof lucide !== 'undefined') {
            lucide.createIcons({
                icons: lucide, // ใส่ชื่อไอคอนทั้งหมดที่มีให้มัน
                nameAttr: 'data-lucide'
            });
        } else if (window.lucide) {
            window.lucide.createIcons({
                icons: window.lucide,
                nameAttr: 'data-lucide'
            });
        }
    }
    return html;
}

// --- ส่วนที่ 3: สั่งให้ทำงานเมื่อโหลดหน้าเสร็จ ---
document.addEventListener('DOMContentLoaded', () => {
    updateBreadcrumb();
    init(); // เรียกใช้ระบบ Login เมื่อโหลดหน้าเว็บ
    lucide.createIcons({ icons: lucide });
});
