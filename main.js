/**
 * main.js - ไฟล์หลักสำหรับควบคุมการทำงานของเว็บไซต์
 */

// 1. ฟังก์ชันสร้าง Breadcrumb
function updateBreadcrumb() {
    const breadcrumbEl = document.getElementById('breadcrumb');
    if (!breadcrumbEl) return;

    const path = window.location.pathname;
    
    // ถ้าเป็นหน้าแรก (Home) ให้ลบ Breadcrumb ทิ้ง
    if (path.endsWith('index.html') || path === '/' || path === '') {
        breadcrumbEl.innerHTML = '';
        return; 
    }

    // สร้างโครงสร้าง Breadcrumb
    let html = '<li><a href="index.html">Home</a></li>';
    
    // ตรวจสอบหน้าปัจจุบันเพื่อเพิ่มชื่อหน้า
    if (path.includes('flights.html')) {
        html += '<li>/ Flights</li>';
    } else if (path.includes('schedule.html')) {
        html += '<li>/ Schedule</li>';
    }
    
    breadcrumbEl.innerHTML = html;
}

// 2. ฟังก์ชันตรวจสอบรหัสผ่าน (ใช้ JSONP เพื่อเลี่ยงปัญหา CORS)
function checkPassword() {
    const input = document.getElementById('pass').value;
    
    // สร้างฟังก์ชันรับค่ากลับแบบ Global
    window.handleResponse = function(isCorrect) {
        if (isCorrect === true) {
            localStorage.setItem('loginTime', Date.now().toString());
            location.reload();
        } else {
            alert("Incorrect password");
        }
        // ลบ script tag ทิ้งหลังทำงานเสร็จ
        document.body.removeChild(scriptTag);
    };

    const scriptTag = document.createElement('script');
    // เรียกใช้ SCRIPT_URL จาก config.js
    scriptTag.src = `${SCRIPT_URL}?function=checkPassword&pass=${input}&callback=handleResponse`;
    document.body.appendChild(scriptTag);
}

// 3. ฟังก์ชันดึงข้อมูล Flights (ตัวอย่างการเขียนแยกฟังก์ชัน)
async function fetchFlightsData() {
    // โค้ดสำหรับดึงข้อมูล Flights ไปแสดงผล
    console.log("Fetching flight data...");
    // ใส่ logic การดึงข้อมูลจาก SCRIPT_URL ที่นี่...
}

// 4. สั่งให้ทำงานเมื่อโหลดหน้าเว็บเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
    updateBreadcrumb();
    
    // ตรวจสอบการ Login (ถ้ามี)
    // init(); 
});
