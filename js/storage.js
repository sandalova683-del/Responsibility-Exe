/* =====================================================
   Ответственность.exe
   Version: 1.0.0 Release
   storage.js
   © 2026
===================================================== */

const STORAGE_KEY = 'responsibility_exe_v1';

const defaultData = {
    count: 0,
    lastAnswer: null,
    answerStreak: 0,
    firstLaunch: true,
    settings: {
        sound: true,
        vibration: true,
        animations: true,
        history: false
    },
    stats: {
        yes: 0,
        no: 0,
        vera: 0
    },
    history: []
};

function cloneDefaultData(){
    if(typeof structuredClone === 'function'){
        return structuredClone(defaultData);
    }

    return JSON.parse(JSON.stringify(defaultData));
}

function mergeData(savedData){
    const base = cloneDefaultData();

    return {
        ...base,
        ...savedData,
        settings: {
            ...base.settings,
            ...(savedData && savedData.settings ? savedData.settings : {})
        },
        stats: {
            ...base.stats,
            ...(savedData && savedData.stats ? savedData.stats : {})
        },
        history: Array.isArray(savedData && savedData.history) ? savedData.history : base.history
    };
}

function loadData(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY);

        if(!raw){
            return cloneDefaultData();
        }

        return mergeData(JSON.parse(raw));
    }
    catch(error){
        console.warn('Ошибка чтения LocalStorage', error);
        return cloneDefaultData();
    }
}

function saveData(data){
    try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch(error){
        console.warn('Ошибка записи LocalStorage', error);
    }
}

function resetData(){
    try{
        localStorage.removeItem(STORAGE_KEY);
    } catch(error){
        console.warn('Ошибка сброса LocalStorage', error);
    }
}