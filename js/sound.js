/* =====================================================
   Ответственность.exe - Sound Engine
   Version: 1.0.0
   © 2026
===================================================== */

const SoundEngine = (() => {
    'use strict';

    let audioContext = null;
    let audioBuffer = null;
    let isInitialized = false;

    const SOUND_URL = 'sounds/whoosh.mp3';

    // Инициализация AudioContext (только по действию пользователя)
    function initContext() {
        if (audioContext) return audioContext;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            return audioContext;
        } catch (error) {
            console.warn('Web Audio не поддерживается', error);
            return null;
        }
    }

    // Загрузка звука в буфер
    async function loadSound() {
        if (audioBuffer) return audioBuffer;

        try {
            const response = await fetch(SOUND_URL);
            if (!response.ok) throw new Error('Sound not found');
            
            const arrayBuffer = await response.arrayBuffer();
            const context = initContext();
            if (!context) return null;

            audioBuffer = await context.decodeAudioData(arrayBuffer);
            isInitialized = true;
            return audioBuffer;
        } catch (error) {
            console.warn('Не удалось загрузить звук', error);
            return null;
        }
    }

    // Воспроизведение звука
    function play() {
        try {
            const context = initContext();
            if (!context || !audioBuffer) {
                // Если звук ещё не загружен, загружаем и пробуем снова
                loadSound().then(() => play());
                return;
            }

            // iOS: если контекст приостановлен, возобновляем
            if (context.state === 'suspended') {
                context.resume();
            }

            // Создаём источник и воспроизводим
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.start(0);

        } catch (error) {
            console.warn('Ошибка воспроизведения звука', error);
        }
    }

    // Инициализация (вызывается по первому касанию)
    function init() {
        if (isInitialized) return;

        const context = initContext();
        if (!context) return;

        // iOS: пробуждаем AudioContext
        if (context.state === 'suspended') {
            context.resume();
        }

        // Загружаем звук
        loadSound().then(() => {
            isInitialized = true;
            console.log('🔊 SoundEngine готов');
        });
    }

    // Публичное API
    return {
        init,
        play,
        isReady: () => isInitialized
    };
})();