/* =====================================================
   Ответственность.exe - Sound Engine
   Version: 1.0.1
   © 2026
===================================================== */

const SoundEngine = (() => {
    'use strict';

    let audioContext = null;
    let audioBuffer = null;
    let isInitialized = false;
    let isWarmedUp = false;
    let wakeupInterval = null;

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
            
            // Запускаем "keep-alive" интервал для iOS
            startKeepAlive();
        } catch (error) {
            console.warn('Ошибка прогрева звука', error);
        }
    }

    // Keep-alive: каждые 5 секунд "будим" AudioContext
    function startKeepAlive() {
        if (wakeupInterval) return;
        
        wakeupInterval = setInterval(() => {
            const context = audioContext;
            if (!context) return;
            
            try {
                // Если контекст уснул — пробуждаем
                if (context.state === 'suspended') {
                    context.resume();
                    console.log('🔊 AudioContext разбужен');
                }
                
                // Создаём "пустой" звук, чтобы держать контекст активным
                if (audioBuffer && context.state === 'running') {
                    const gainNode = context.createGain();
                    gainNode.gain.value = 0;
                    gainNode.connect(context.destination);
                    
                    const source = context.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(gainNode);
                    source.start(0);
                    
                    setTimeout(() => {
                        try { 
                            source.stop(0);
                            gainNode.disconnect();
                        } catch(e) {}
                    }, 10);
                }
            } catch (error) {
                // Игнорируем ошибки keep-alive
            }
        }, 5000); // каждые 5 секунд
    }

    // Воспроизведение звука
    function play() {
        try {
            const context = initContext();
            if (!context) {
                console.warn('Нет AudioContext');
                return;
            }

            // iOS: если контекст приостановлен, ВСЕГДА возобновляем
            if (context.state === 'suspended') {
                context.resume();
                console.log('🔊 AudioContext возобновлён для воспроизведения');
            }

            // Если звук ещё не загружен — загружаем
            if (!audioBuffer) {
                loadSound().then(() => {
                    warmUp();
                    // Пробуем снова через 100 мс
                    setTimeout(() => play(), 100);
                });
                return;
            }

            // Если ещё не прогреты — прогреваем
            if (!isWarmedUp) {
                warmUp();
                // Пробуем снова через 100 мс
                setTimeout(() => play(), 100);
                return;
            }

            // iOS: дополнительная проверка — если контекст всё ещё suspended
            if (context.state === 'suspended') {
                context.resume();
                setTimeout(() => play(), 50);
                return;
            }

            // Создаём источник и воспроизводим
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.start(0);

            console.log('🔊 Звук воспроизведён');

        } catch (error) {
            console.warn('Ошибка воспроизведения звука', error);
            // Если ошибка, пробуем переинициализировать
            if (error.name === 'InvalidStateError' || error.name === 'NotAllowedError') {
                audioContext = null;
                isWarmedUp = false;
                setTimeout(() => {
                    init();
                    setTimeout(() => play(), 200);
                }, 100);
            }
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