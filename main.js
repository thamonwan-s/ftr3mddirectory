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
        'international.html': { name: 'Interational', parent: 'flights.html' },
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
        const data = await fetchFlights('ALL_FLIGHTS');
        let htmlContent = '';
        
        // 2. หา Recent Flight (ใช้ข้อมูลดิบจาก data ชุดแรก)
        const years = Object.keys(data); // จะได้ ["2022", "2023", ..., "2026"]
        const latestYear = years[years.length - 1]; // ดึงปีท้ายสุดออกมา
        
        const entries = Object.keys(data[latestYear]); // ได้ ["0", "1", ..., "12"]
        const latestEntryKey = entries[entries.length - 1]; // ดึง Index ท้ายสุดออกมา
        
        const latestFlight = data[latestYear][latestEntryKey];

        htmlContent += `
                <div class="w-full max-w-sm mb-6">
                    <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Flight</h2>
                    ${renderSingleFlight(latestFlight)}
                </div>
            `;

        // 3. วนลูปสร้างปี/เดือน
        for (const year of years.reverse()) {
            
            htmlContent += `
                <div id="year-${year}" class="year-section w-full max-w-sm">
                    <button onclick="toggleYear(this)" class="w-full flex justify-between items-center text-lg font-bold text-[#333333] border-b-2 border-[#333333] pb-1 mt-6 mb-2">
                        ${year} <span class="arrow">◂</span>
                    </button>
                    <div class="content hidden w-full">${renderFlights(data, year)}</div>
                </div>`;
        }
        container.innerHTML = htmlContent;
    } catch (e) {
        container.innerHTML = '<div class="text-center mt-10 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
        console.error("Error:", e);
    }
}

function renderSortFlight(data, pageKey_Name) {
    // 1. จัดการ Mapping ข้อมูลจาก Row ให้เป็น Object
    const mappedFlights = data.map(row => {
        // ดึงข้อมูลพื้นฐานที่ทุกหน้ามีเหมือนกัน
        const flight = {
            date: row[0],
            timeFly: row[1],
            timeLand: row[2],
            // กำหนดค่าเริ่มต้นเป็น null
            origin: null,
            destination: null,
            type: null,
            code: null,
            airline: null,
            note: null
        };

        // 2. ใช้ Logic ตามเงื่อนไข pageKey_Name เพื่อใส่ค่า
        if (pageKey_Name === 'INTER_FLIGHTS') {
            [flight.origin, flight.destination, flight.type, flight.code, flight.airline, flight.note] = [row[3], row[4], row[5], row[6], row[7], row[8]];
        } else if (pageKey_Name === 'DEP_FLIGHTS') {
            [flight.origin, flight.type, flight.code, flight.airline, flight.note] = [row[3], row[4], row[5], row[6], row[7]];
        } else if (pageKey_Name === 'RET_FLIGHTS') {
            [flight.destination, flight.type, flight.code, flight.airline, flight.note] = [row[3], row[4], row[5], row[6], row[7]];
        }
        
        return flight;
    });

    // 3. ส่งข้อมูลที่ Map แล้ว ไปให้หน้า HTML นั้นๆ จัดการต่อ
    if (typeof window.displayFlights === 'function') {
        window.displayFlights(mappedFlights, pageKey_Name);
    }
}

async function loadPageData(pageKey) {
    if (pageKey === 'ALL_FLIGHTS') {
        fetchAndDisplayFlights('all');
    } else {
        const data = await fetchFlights(pageKey);
        // ถ้าหน้า HTML นั้นมีฟังก์ชันแสดงผล ให้เรียกใช้ได้เลย
        renderSortFlight(data, pageKey);
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
function createNarrowFlightCardHTML(flightData) {
    // --- ดึงตรรกะคำนวณมาใส่ให้ครบ ---
        const d = new Date(flightData.date);
        const dayName = d.toLocaleDateString('en-US', {weekday: 'short'}).toUpperCase();
        const dayNum = d.getDate();
        const month = d.toLocaleDateString('en-US', {month: 'short'}).toUpperCase();
        
        const h4 = flightData.dep_ch === true;
        const i4 = flightData.arr_ch === true;
        const statusIcon = h4 && i4 ? '🛄' : h4 ? '🛫' : i4 ? '🛬' : '⛔';
        const showMeeting = (h4 || i4);
        
        const flightRaw = String(flightData.flight || '');
        const flightCode = flightRaw.trim().split(' ')[0].toLowerCase(); 
        const airlineMapping = { "tvj": "vj", "pal": "2p" };
        const finalFlightCode = airlineMapping[flightCode] || flightCode;
        const logoUrl = finalFlightCode ? `https://edge.wego.com/image/upload/flights/airlines_square/${finalFlightCode}` : '';
        
        const j5 = flightData.desc || '';
        const j6 = flightData.place || '';
        const j7 = flightData.airport || '';
        const bottomText = showMeeting ? `${j5} ${j6} : ${j7}` : `${j5} ${j6}`;

        // --- โครงสร้าง HTML เดียวกับที่ใช้ในลูป (ตัดส่วน Floating Bar ออก) ---
        return `
          <div class="bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm mx-auto my-2"> 
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-[6px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded">${dayName}</span> 
              <span class="text-[9px] font-semibold text-gray-700">${dayNum} ${month}</span>
              <span class="text-[9px] text-gray-300 mx-1">|</span>
              <span class="text-[9px] text-gray-600">${flightData.name}</span>
              <div class="flex flex-1 justify-end items-center text-right">
                <div class="mr-1.5">
                  <div class="text-[9px] font-bold text-gray-800">${flightRaw}</div>
                  <div class="text-[6px] text-gray-400 font-medium leading-none">${flightData.airline}</div>
                </div>
                <img src="${logoUrl}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">
              </div>
            </div>

            <div class="grid grid-cols-[1fr,auto,1fr] items-end text-lg font-black text-[#333333] my-1 gap-2">
              <div class="flex items-baseline items-end justify-start gap-1 overflow-hidden">
                    <span class="text-sm font-bold text-gray-800">${flightData.dep_ap}</span>
                    <span class="text-[6px] text-gray-500 text-center">${flightData.dep_pl || ''}</span>
              </div>
              
              <div class="grid grid-cols-[1fr,auto,1fr] items-center gap-1 px-2">
                    <div class="flex text-xs font-bold text-gray-800 items-center justify-center">${formatTime(flightData.dep_t)}</div>
                    <div class="text-gray-300 text-sm justify-center mx-2">→</div>
                    <div class="flex text-xs font-bold text-gray-800 items-center justify-center">${formatTime(flightData.arr_t)}</div>
                </div>
              
              <div class="flex items-baseline items-end justify-end text-right gap-1 overflow-hidden">
                    <span class="text-[6px] text-gray-500 text-center">${flightData.arr_pl || ''}</span>
                    <span class="text-sm font-bold text-gray-800 text-left justify-start">${flightData.arr_ap}</span>
              </div>
              
            </div>
    
            <div class="pt-1 border-t text-[6px] text-blue-800 font-bold">
              ${statusIcon} ${bottomText}
            </div>
          </div>`;
    }


function renderSingleFlight(latestFlight) {
        // --- ดึงตรรกะคำนวณมาใส่ให้ครบ ---
        const d = new Date(latestFlight.date);
        const dayName = d.toLocaleDateString('en-US', {weekday: 'short'}).toUpperCase();
        const dayNum = d.getDate();
        const month = d.toLocaleDateString('en-US', {month: 'short'}).toUpperCase();
        
        const h4 = latestFlight.dep_ch === true;
        const i4 = latestFlight.arr_ch === true;
        const statusIcon = h4 && i4 ? '🛄' : h4 ? '🛫' : i4 ? '🛬' : '⛔';
        const showMeeting = (h4 || i4);
        
        const flightRaw = String(latestFlight.flight || '');
        const flightCode = flightRaw.trim().split(' ')[0].toLowerCase(); 
        const airlineMapping = { "tvj": "vj", "pal": "2p" };
        const finalFlightCode = airlineMapping[flightCode] || flightCode;
        const logoUrl = finalFlightCode ? `https://edge.wego.com/image/upload/flights/airlines_square/${finalFlightCode}` : '';
        
        const j5 = latestFlight.desc || '';
        const j6 = latestFlight.place || '';
        const j7 = latestFlight.airport || '';
        const bottomText = showMeeting ? `${j5} ${j6} : ${j7}` : `${j5} ${j6}`;

        // --- โครงสร้าง HTML เดียวกับที่ใช้ในลูป (ตัดส่วน Floating Bar ออก) ---
        return `
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm mx-auto"> 
            <div class="flex items-center space-x-2 mb-4">
              <span class="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded">${dayName}</span> 
              <span class="text-sm font-semibold text-gray-700">${dayNum} ${month}</span>
              <span class="text-gray-300 mx-2"> | </span>
              <span class="text-sm text-gray-700">${latestFlight.name}</span>
              <div class="flex flex-1 justify-end items-center text-right">
                <div class="mr-2">
                  <div class="text-sm font-bold text-gray-800">${flightRaw}</div>
                  <div class="text-[9px] text-gray-400 font-medium">${latestFlight.airline}</div>
                </div>
                <img src="${logoUrl}" class="w-6 h-6 object-contain" onerror="this.style.display='none'">
              </div>
            </div>

            <div class="flex justify-between items-center text-2xl sm:text-3xl font-black text-[#333333] my-4">
              <div class="text-center">
                <div>${latestFlight.dep_ap}</div>
                <div class="text-lg font-bold text-gray-800">${formatTime(latestFlight.dep_t)}</div>
                <div class="text-xs text-gray-500">${latestFlight.dep_pl || ''}</div>
              </div>
              <div class="text-gray-400 text-lg">→</div>
              <div class="text-center">
                <div>${latestFlight.arr_ap}</div>
                <div class="text-lg font-bold text-gray-800">${formatTime(latestFlight.arr_t)}</div>
                <div class="text-xs text-gray-500">${latestFlight.arr_pl || ''}</div>
              </div>
            </div>

            <div class="pt-4 border-t text-[11px] text-blue-800 font-bold">
              ${statusIcon} ${bottomText}
            </div>
          </div>`;
    }



function renderFlights(data, year) {
    let html = '';
    const flightsOfYear = Object.values(data[year]);
    flightsOfYear.forEach(flightData => {
        // คุณไม่ต้องส่ง rowIdx หรือ setIdx เข้าไปใน renderSingleFlight แล้ว
        // เพราะเรามี Object 'flightData' ที่มีข้อมูลครบถ้วนอยู่ในมือ
        html += createNarrowFlightCardHTML(flightData);
    });
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
