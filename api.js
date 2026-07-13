// api.js
async function fetchFlights(pageKey) {
    // ดึงค่าจาก CONFIG ที่อยู่ใน config.js
    const { fileId, action } = CONFIG[pageKey];
    
    // เรียกใช้ SCRIPT_URL จาก config.js ได้เลย
    const response = await fetch(`${SCRIPT_URL}?fileId=${fileId}&action=${action}`);
    
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
}

// เพิ่มฟังก์ชันนี้ลงใน api.js
async function getFlightsByCategory(fileId, category) {
    // ใช้ Template Literal ในการส่ง category ต่อท้าย URL ไปที่ Apps Script
    const url = `${SCRIPT_URL}?fileId=${fileId}&action=getInterData&type=${category}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
}
