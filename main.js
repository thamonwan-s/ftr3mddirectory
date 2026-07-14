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

async function checkPassword() {
    const input = document.getElementById('pass').value;
    if (!input) return;

    // เปลี่ยนมาใช้ fetch ดึงข้อมูล JSON ตรงๆ
    // ไม่ต้องมี &callback=... อีกต่อไป
    const url = `${SCRIPT_URL}?function=checkPassword&pass=${encodeURIComponent(input)}`;

    try {
        const response = await fetch(url);
        const isCorrect = await response.json(); // รับค่า true/false จาก JSON ที่คุณ return ออกมา

        if (isCorrect === true) {
            localStorage.setItem('loginTime', Date.now().toString());
            window.location.href = 'index.html';
        } else {
            alert("Incorrect password");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
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
async function fetchRecentFlights() {
    // 1. เช็คก่อนว่ามีข้อมูลใน SessionStorage ไหม (เพื่อความเร็ว)
    const cached = sessionStorage.getItem('REC_FLIGHTS_DATA');
    if (cached) {
        window.recFlight = JSON.parse(cached);
        window.dispatchEvent(new CustomEvent('recdataReady'));
        return; // มีของแล้ว ไม่ต้อง Fetch ใหม่
    }

    // 2. ถ้าไม่มี ค่อย Fetch จริง
    try {
        const response = await fetchFlights('REC_FLIGHTS');
        
        // เก็บเข้า Memory และ SessionStorage
        window.recFlight = response;
        sessionStorage.setItem('REC_FLIGHTS_DATA', JSON.stringify(response));
        
        // ส่งสัญญาณบอกว่าโหลดเสร็จแล้ว
        window.dispatchEvent(new CustomEvent('recdataReady', { detail: response }));
    } catch (e) {
        console.error("Error fetching REC_FLIGHTS:", e);
    }
}

// ใน main.js
// ปรับฟังก์ชันให้รับพารามิเตอร์ type
async function fetchAndDisplayFlights(type = 'all') {
    const container = document.getElementById('flight-container');
    if (!container) return;

    // 1. ตรวจสอบข้อมูลใน Storage (เพื่อการแสดงผลทันที)
    const cached = sessionStorage.getItem('REC_FLIGHTS_DATA');
    if (cached) {
        window.recFlight = JSON.parse(cached);
    }

    // 2. ถ้ามีข้อมูลเก่า ให้ Render ไปก่อน แล้วอัปเดตเงียบๆ
    if (window.recFlight) {
        renderUI(window.recFlight); // แสดงผลข้อมูลเก่าทันที
        backgroundUpdate();         // แอบไปโหลดใหม่
        return;
    }

    // 3. ถ้าไม่มีข้อมูลเลย (โหลดครั้งแรก) ต้องยอมรอ
    container.innerHTML = '<div class="text-center mt-10 text-gray-500">กำลังโหลดข้อมูล...</div>';
        // สร้าง Promise รอรับสัญญาณ แต่มี Timeout 10 วินาที
        const data = await Promise.race([
            new Promise(resolve => window.addEventListener('recdataReady', (e) => resolve(e.detail), { once: true })),
            new Promise(resolve => setTimeout(() => resolve(null), 10000)) // ถ้าเกิน 10 วิให้คืนค่า null
        ]);

        if (!data) {
            container.innerHTML = '<div class="text-center mt-10 text-red-500">โหลดข้อมูลไม่สำเร็จ (Timeout)</div>';
            return;
        }
        window.recFlight = data;
        renderUI(window.recFlight);
    }

function renderUI(dataToDisplay) {
    const container = document.getElementById('flight-container');
    const {flightObj, years} = dataToDisplay;

    // 1. เก็บสถานะปีที่เปิดค้างไว้ก่อน (เช็คจาก div.content ที่ไม่มี class 'hidden')
    const openYears = JSON.parse(sessionStorage.getItem('openYears') || '[]');
    
    let htmlContent = `
        <div class="w-full max-w-sm mb-6">
            <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Flight</h2>
            ${renderSingleFlight(flightObj)}
        </div>
    `;

    for (let y in years) {
        const yearId = `year-${years[y]}`;
        const isOpen = openYears.includes(yearId);

        // --- จุดแก้: ดึงข้อมูลเก่าจาก localStorage มาแปะไว้ใน div เลย ---
        const savedData = localStorage.getItem(`flight-data-${years[y]}`) || "";
        
        htmlContent += `
            <div id="year-${years[y]}" class="year-section w-full max-w-sm">
                <button onclick="toggleYear(this); loadAndToggleYear(this, '${years[y]}')" 
                        data-year="${years[y]}" data-loaded="false" 
                        class="w-full flex justify-between items-center text-lg font-bold text-[#333333] border-b-2 border-[#333333] pb-1 mt-6 mb-2">
                    ${years[y]} <span class="arrow">◂</span>
                </button>
                <div class="content ${isOpen ? '' : 'hidden'} w-full"></div>
            </div>`;
    }
    container.innerHTML = htmlContent;
}

// ฟังก์ชันอัปเดตเงียบๆ (Background Update)
async function backgroundUpdate() {
    const popup = document.getElementById('update-popup');
    if(popup) popup.style.display = 'block'; // แสดง Popup
    
    try {
        // 1. บันทึก ID ของปีที่เปิดอยู่ก่อนที่จะ Render ใหม่
        const openYearIds = [];
        document.querySelectorAll('.year-section .content:not(.hidden)').forEach(el => {
            const parent = el.closest('.year-section');
            if (parent) openYearIds.push(parent.id);
        });
        
        const response = await fetchFlights('REC_FLIGHTS');
        window.recFlight = response;
        sessionStorage.setItem('REC_FLIGHTS_DATA', JSON.stringify(response));
        
        renderUI(window.recFlight); // อัปเดตข้อมูลใหม่ลงหน้าจอ

        // 3. กางปีที่เคยเปิดค้างไว้ออกมาใหม่
        openYearIds.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                const btn = section.querySelector('button');
                const contentDiv = section.querySelector('.content');
                
                // กาง div ออกโดยตรงโดยไม่ใช้ toggleYear (เพื่อไม่ให้มันสลับกลับ)
                contentDiv.classList.remove('hidden');
                
                // อัปเดตลูกศรให้ชี้ลง (ถ้ามี)
                const arrow = btn.querySelector('.arrow');
                if (arrow) arrow.innerText = '▾';
                
                // สั่งโหลดข้อมูลใหม่ลงใน div นั้น
                btn.setAttribute('data-loaded', 'false');
                loadAndToggleYear(btn, btn.getAttribute('data-year'));
            }
        });
        
    } catch (e) {
        console.error("Update failed", e);
    } finally {
        if(popup) popup.style.display = 'none'; // ซ่อน Popup
    }
}

function renderSortFlight(data, pageKey_Name) {
    // 1. จัดการ Mapping ข้อมูลจาก Row ให้เป็น Object
        const flight = 'tested';
        console.log("Inter Flights Preloaded!");
        return flight;
}

async function loadPageData(pageKey) {
    if (pageKey === 'ALL_FLIGHTS') {
        await fetchAndDisplayFlights('all');
    } else {
        const data = await fetchFlights(pageKey);
        // ถ้าหน้า HTML นั้นมีฟังก์ชันแสดงผล ให้เรียกใช้ได้เลย
        renderSortFlight(data.result, pageKey);
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
    if (!data || typeof data !== 'object') {
        console.warn("renderFlights: ได้รับข้อมูลที่ไม่ถูกต้อง", data);
        return '<div class="p-4 text-center text-red-500">ไม่พบข้อมูลสำหรับปีนี้</div>';
    }
    console.log("ข้อมูลที่ได้จาก Data (Raw):", data);
    console.log("ข้อมูลที่ได้จาก Year (Raw):", year);
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
