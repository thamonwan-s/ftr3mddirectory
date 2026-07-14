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
        const year = new Date(rawData[0][0]).getFullYear();    
        const row1 = rawData[0];
        const row2 = rawData[1];
        const row3 = rawData[2];
        const row4 = rawData[3];
        const flightObj = {};
    
        flightObj['date']=row1[0];
        flightObj['dep_ch']=row1[1];
        flightObj['dep_t']=row2[1];
        flightObj['dep_ap']=row3[1];
        flightObj['dep_pl']=row4[1];
        flightObj['arr_ch']=row1[2];
        flightObj['arr_t']=row2[2];
        flightObj['arr_ap']=row3[2];
        flightObj['arr_pl']=row4[2];
        flightObj['name']=row1[3];
        flightObj['desc']=row2[3];
        flightObj['place']=row3[3];
        flightObj['airport']=row4[3];
        flightObj['flight']=row1[4];
        flightObj['airline']=row1[5];
    
        result[year]['1'] = flightObj;
    
    }
    else if (pageKey  === 'ALL_FLIGHTS'){
        const headerRow = rawData[0];
        for (let setIdx=1; setIdx<rawData.length-1; setIdx++){
            const row1 = rawData[setIdx];
            const row2 = rawData[setIdx][1];
            const row3 = rawData[setIdx][2];
            const row4 = rawData[setIdx][3];
    
            const flightObj = {};
    
            flightObj['date']=row1[0];
            flightObj['dep_ch']=row1[1];
            flightObj['dep_t']=row2[1];
            flightObj['dep_ap']=row3[1];
            flightObj['dep_pl']=row4[1];
            flightObj['arr_ch']=row1[2];
            flightObj['arr_t']=row2[2];
            flightObj['arr_ap']=row3[2];
            flightObj['arr_pl']=row4[2];
            flightObj['name']=row1[3];
            flightObj['desc']=row2[3];
            flightObj['place']=row3[3];
            flightObj['airport']=row4[3];
            flightObj['flight']=row1[4];
            flightObj['airline']=row1[5];

            const year = new Date(row1[0]).getFullYear();
            if (!result[year]) {
                result[year] = {};; // เริ่มนับจาก 1 สำหรับแต่ละปี
            }
            result[year][Object.keys(result[year]).length + 1] = flightObj;
            }
        }
        console.log("ข้อมูลที่ได้จาก All Flights Server (Raw):", result);
        return result;
}
