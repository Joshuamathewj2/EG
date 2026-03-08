const STORAGE_KEY = 'eg_study_data';
const SCHEDULE_KEY = 'eg_daily_schedule';
const SETTINGS_KEY = 'eg_settings';
const LAST_GEN_KEY = 'lastGeneratedDate';
const FCM_TOKEN_KEY = 'eg_fcm_token';

const Storage = {
    getData: () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || { subjects: [] },
    saveData: (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)),

    getSchedule: () => JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || null,
    saveSchedule: (schedule) => localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule)),

    getSettings: () => JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { reminderTime: '19:00', notificationsEnabled: false },
    saveSettings: (settings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)),

    clearSchedule: () => {
        localStorage.removeItem(SCHEDULE_KEY);
        localStorage.removeItem(LAST_GEN_KEY);
    },

    getLastGeneratedDate: () => localStorage.getItem(LAST_GEN_KEY),
    setLastGeneratedDate: (dateStr) => localStorage.setItem(LAST_GEN_KEY, dateStr),

    getFcmToken: () => localStorage.getItem(FCM_TOKEN_KEY),
    setFcmToken: (token) => localStorage.setItem(FCM_TOKEN_KEY, token)
};
