const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUNtQdcsQr3CPMFP8-UkaNA_nPNSKqjvZNldWKru7L08aUZuz11NQolnTHnbzzk9Buzg/exec';
// config.js
const CONFIG = {
    // กำหนดไฟล์และ Action ที่ใช้ในแต่ละหน้า
    ALL_FLIGHTS: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB6Dl9jPkU0voM_2uo6VmrLp87G2hE0wX_JuIewzQEVNX9qi4DbYTk7ThsBUb7Y9UG92ybk6Du79A_/pub?gid=1823900951&single=true&output=csv',
        fileId: '1LTuNtQ7ChcHYkdbI63_zPpr2pTH95BnLCs_JB8dNE50',
        action: 'getFlights',
        sheetname: 'Flights'
    },
    INTER_FLIGHTS: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB6Dl9jPkU0voM_2uo6VmrLp87G2hE0wX_JuIewzQEVNX9qi4DbYTk7ThsBUb7Y9UG92ybk6Du79A_/pub?gid=1972764598&single=true&output=csv',
        fileId: '1LTuNtQ7ChcHYkdbI63_zPpr2pTH95BnLCs_JB8dNE50',
        action: 'getInter',
        sheetname: 'Inter'
    },
    DEP_FLIGHTS: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB6Dl9jPkU0voM_2uo6VmrLp87G2hE0wX_JuIewzQEVNX9qi4DbYTk7ThsBUb7Y9UG92ybk6Du79A_/pub?gid=165850010&single=true&output=csv',
        fileId: '1LTuNtQ7ChcHYkdbI63_zPpr2pTH95BnLCs_JB8dNE50',
        action: 'getDep',
        sheetname: 'Dep'
    },
    RET_FLIGHTS: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB6Dl9jPkU0voM_2uo6VmrLp87G2hE0wX_JuIewzQEVNX9qi4DbYTk7ThsBUb7Y9UG92ybk6Du79A_/pub?gid=410610101&single=true&output=csv',
        fileId: '1LTuNtQ7ChcHYkdbI63_zPpr2pTH95BnLCs_JB8dNE50',
        action: 'getRet',
        sheetname: 'Ret'
    },
    REC_FLIGHTS: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB6Dl9jPkU0voM_2uo6VmrLp87G2hE0wX_JuIewzQEVNX9qi4DbYTk7ThsBUb7Y9UG92ybk6Du79A_/pub?gid=1823900951&single=true&output=csv',
        fileId: '1LTuNtQ7ChcHYkdbI63_zPpr2pTH95BnLCs_JB8dNE50',
        action: 'getRecent',
        sheetname: 'Flights'
    }
    // เพิ่มหน้าใหม่ๆ ได้ที่นี่เลย
};
