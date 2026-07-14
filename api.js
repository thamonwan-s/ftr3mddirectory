async function fetchFlights(pageKey) {
    const { url } = CONFIG[pageKey]; // ดึง URL แยกตาม pageKey
    
    try {
        const response = await fetch(url);
        const text = await response.text();

        // แปลง CSV เป็น Array (โครงสร้าง CSV คือ text, split ตามบรรทัดและคอมม่า)
        const rawData = text.split('\n').map(row => row.split(','));
        
        // ส่งเข้าเตรียมข้อมูลแบบเดิมที่คุณทำไว้
        return prepareGridData(rawData, pageKey);
    } catch (e) {
        console.error("Error fetching CSV for " + pageKey, e);
        return {};
    }
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
