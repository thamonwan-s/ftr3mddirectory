// api.js (แบบรวมฟังก์ชันเดียว)
async function fetchFlights(pageKey) {
    const { fileId, action } = CONFIG[pageKey];

    // แปลง params (เช่น {type: 'intl'}) ให้เป็น query string
    const queryString = new URLSearchParams({ fileId: fileId, function: action }).toString();

    // api.js บรรทัดที่ 8 เปลี่ยนเป็นแบบนี้
    const url = SCRIPT_URL + "?fileId=" + encodeURIComponent(fileId) + "&function=" + encodeURIComponent(action);
    const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
    });
    const textData = await response.text();
    let rawData;
    console.log("ข้อมูลที่ได้จาก Server (Raw):", textData);
    try {
        rawData = JSON.parse(textData);
    } catch (e) {
        console.error("Server ไม่ได้ส่ง JSON กลับมา! สิ่งที่ได้คือ:", textData);
        throw new Error("Server response is not valid JSON");
    }

    // 3. เมื่อข้อมูลเป็น JSON ที่ถูกต้องแล้ว ค่อยส่งไป Mapping
    return prepareGridData(rawData, pageKey);
}

/**
 * เปลี่ยนข้อมูล JSON แนวนอนให้เป็น Grid ที่โค้ดเดิมรู้จัก
 */
function prepareGridData(rawData, pageKey) {
    const result = {};
    if (pageKey === 'REC_FLIGHTS'){
        const setIdx=4;
        const year = rawData[0][setIdx];
        let i = 0;
            if (!result[year]) {
                result[year] = {};; // เริ่มนับจาก 1 สำหรับแต่ละปี
            }
    
            for (let r = 3; r<rawData.length; r+=4){
                const row1 = rawData[r];
                if(!row1[setIdx]) continue;
                const row2 = rawData[r+1];
                const row3 = rawData[r+2];
                const row4 = rawData[r+3];
    
                i = i+1;
                const flightObj = {};
    
                flightObj['date']=row1[setIdx +0];
                flightObj['dep_ch']=row1[setIdx +3];
                flightObj['dep_t']=row2[setIdx +3];
                flightObj['dep_ap']=row3[setIdx +3];
                flightObj['dep_pl']=row4[setIdx +3];
                flightObj['arr_ch']=row1[setIdx +4];
                flightObj['arr_t']=row2[setIdx +4];
                flightObj['arr_ap']=row3[setIdx +4];
                flightObj['arr_pl']=row4[setIdx +4];
                flightObj['name']=row1[setIdx +5];
                flightObj['desc']=row2[setIdx +5];
                flightObj['place']=row3[setIdx +5];
                flightObj['airport']=row4[setIdx +5];
                flightObj['flight']=row1[setIdx +6];
                flightObj['airline']=row1[setIdx +7];
    
                result[year][i] = flightObj;
            }
    }
    else if (pageKey  === 'ALL_FLIGHTS'){
        const headerRow = rawData[0];
        for (let setIdx=4; setIdx<headerRow.length; setIdx+=9){
            const year = headerRow[setIdx];
            let i = 0;
            if (!year) continue;
            if (!result[year]) {
                result[year] = {};; // เริ่มนับจาก 1 สำหรับแต่ละปี
            }
    
            for (let r = 3; r<rawData.length; r+=4){
                const row1 = rawData[r];
                if(!row1[setIdx]) continue;
                const row2 = rawData[r+1];
                const row3 = rawData[r+2];
                const row4 = rawData[r+3];
    
                i = i+1;
                const flightObj = {};
    
                flightObj['date']=row1[setIdx +0];
                flightObj['dep_ch']=row1[setIdx +3];
                flightObj['dep_t']=row2[setIdx +3];
                flightObj['dep_ap']=row3[setIdx +3];
                flightObj['dep_pl']=row4[setIdx +3];
                flightObj['arr_ch']=row1[setIdx +4];
                flightObj['arr_t']=row2[setIdx +4];
                flightObj['arr_ap']=row3[setIdx +4];
                flightObj['arr_pl']=row4[setIdx +4];
                flightObj['name']=row1[setIdx +5];
                flightObj['desc']=row2[setIdx +5];
                flightObj['place']=row3[setIdx +5];
                flightObj['airport']=row4[setIdx +5];
                flightObj['flight']=row1[setIdx +6];
                flightObj['airline']=row1[setIdx +7];
    
                result[year][i] = flightObj;
            }
        }
    }
        console.log("ข้อมูลที่ได้จาก Server (Raw):", result);
        return result;
}
