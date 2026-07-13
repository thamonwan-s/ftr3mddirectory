// api.js (แบบรวมฟังก์ชันเดียว)
async function fetchFlights(pageKey) {
    const { fileId, action } = CONFIG[pageKey];
    
    // แปลง params (เช่น {type: 'intl'}) ให้เป็น query string
    const queryString = new URLSearchParams({ fileId: fileId, function: action }).toString();
    
    const response = await fetch(`${SCRIPT_URL}?${queryString}`,{
        method: 'GET',
        redirect: 'follow'
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
}
