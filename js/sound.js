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
    let isWarmedUp = false;

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
            return audioBuffer;
        } catch (error) {
            console.warn('Не удалось загрузить звук', error);
            return null;
        }
    }

    // "Прогрев" звуковой системы
    function warmUp() {
        if (isWarmedUp) return;
        
        const context = audioContext;
        if (!context || !audioBuffer) return;

        try {
            // iOS: если контекст приостановлен, возобновляем
            if (context.state === 'suspended') {
                context.resume();
            }

            // Воспроизводим звук с нулевой громкостью
            const gainNode = context.createGain();
            gainNode.gain.value = 0;
            gainNode.connect(context.destination);

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gainNode);
            source.start(0);
            
            // Останавливаем через 50 мс
            setTimeout(() => {
                try { 
                    source.stop(0);
                    gainNode.disconnect();
                } catch(e) {}
            }, 50);

            isWarmedUp = true;
            console.log('🔊 SoundEngine прогрет');
        } catch (error) {
            console.warn('Ошибка прогрева звука', error);
        }
    }

    // Воспроизведение звука
    function play() {
        try {
            const context = initContext();
            if (!context || !audioBuffer) {
                // Если звук ещё не загружен, загружаем и пробуем снова
                loadSound().then(() => {
                    warmUp();
                    play();
                });
                return;
            }

            // iOS: если контекст приостановлен, возобновляем
            if (context.state === 'suspended') {
                context.resume();
            }

            // Если ещё не прогреты — прогреваем
            if (!isWarmedUp) {
                warmUp();
                // Даём время на прогрев
                setTimeout(() => play(), 50);
                return;
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
            
            // Прогреваем звук сразу после загрузки
            warmUp();
        });
    }

    // Публичное API
    return {
        init,
        play,
        isReady: () => isInitialized && isWarmedUp
    };
})();