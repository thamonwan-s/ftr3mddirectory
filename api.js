// api.js
async function loadPageData(pageKey) {
    const pageConfig = CONFIG[pageKey]; // ดึงข้อมูลจาก CONFIG ด้านบน
    if (!pageConfig) {
        console.error('ไม่พบการตั้งค่าสำหรับหน้านี้:', pageKey);
        return [];
    }
    
    // เรียกใช้ Web App URL
    const SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
    const response = await fetch(`${SCRIPT_URL}?fileId=${pageConfig.fileId}&action=${pageConfig.action}`);
    return await response.json();
}
