// api.js (แบบรวมฟังก์ชันเดียว)
async function fetchFlights(pageKey) {
    const { fileId, action } = CONFIG[pageKey];
    
    // แปลง params (เช่น {type: 'intl'}) ให้เป็น query string
    const queryString = new URLSearchParams({ fileId: fileId, function: action }).toString();
    
    // api.js บรรทัดที่ 8 เปลี่ยนเป็นแบบนี้
    const url = SCRIPT_URL + "?fileId=" + encodeURIComponent(fileId) + "&function=" + encodeURIComponent(action);
    const response = await fetch(url, {
        method: 'GET',
    });
    const textData = await response.text();
    console.log("ข้อมูลที่ได้จาก Server (Raw):", textData); // <--- เช็คใน Console ว่ามันขึ้นเป็น { ... } หรือขึ้นเป็น <html>
    
    // เปลี่ยนบรรทัดที่ 16 เป็น:
    if (!response.ok) {
        const errorText = await response.text(); // ดูว่า Google พ่นข้อความ Error อะไรออกมา
        console.error("Server Error Details:", errorText);
        throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
    }
    return await response.json();
}
