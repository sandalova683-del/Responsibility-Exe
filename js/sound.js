/* =====================================================
   Ответственность.exe - Sound Engine
   Version: 1.0.2
   © 2026
===================================================== */

const SoundEngine = (() => {
    'use strict';

    let audioContext = null;
    let audioBuffer = null;
    let isInitialized = false;
    let isWarmedUp = false;
    let wakeupInterval = null;
    let playTimeout = null;

    const SOUND_URL = 'sounds/whoosh.mp3';

    // Инициализация AudioContext
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
            if (context.state === 'suspended') {
                context.resume();
            }

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
            }, 50);

            isWarmedUp = true;
            console.log('🔊 SoundEngine прогрет');
            
            startKeepAlive();
        } catch (error) {
            console.warn('Ошибка прогрева звука', error);
        }
    }

    // Keep-alive: каждые 3 секунды "будим" AudioContext
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
                
                // Создаём тихий звук, чтобы держать контекст активным
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
        }, 3000); // Каждые 3 секунды (было 5)
    }

    // Воспроизведение звука
    function play() {
        // Очищаем предыдущий таймаут, если был
        if (playTimeout) {
            clearTimeout(playTimeout);
            playTimeout = null;
        }

        try {
            const context = initContext();
            if (!context) {
                console.warn('Нет AudioContext');
                return;
            }

            // iOS: ВСЕГДА пробуждаем контекст
            if (context.state === 'suspended') {
                context.resume();
                console.log('🔊 AudioContext возобновлён');
            }

            // Если звук не загружен — загружаем
            if (!audioBuffer) {
                loadSound().then(() => {
                    warmUp();
                    playTimeout = setTimeout(() => play(), 150);
                });
                return;
            }

            // Если не прогреты — прогреваем
            if (!isWarmedUp) {
                warmUp();
                playTimeout = setTimeout(() => play(), 150);
                return;
            }

            // Ещё раз проверяем контекст
            if (context.state === 'suspended') {
                context.resume();
                playTimeout = setTimeout(() => play(), 100);
                return;
            }

            // Воспроизводим звук
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.start(0);

            console.log('🔊 Звук воспроизведён');

        } catch (error) {
            console.warn('Ошибка воспроизведения звука', error);
            
            // При ошибке переинициализируем
            if (error.name === 'InvalidStateError' || error.name === 'NotAllowedError') {
                audioContext = null;
                isWarmedUp = false;
                if (wakeupInterval) {
                    clearInterval(wakeupInterval);
                    wakeupInterval = null;
                }
                setTimeout(() => {
                    init();
                    playTimeout = setTimeout(() => play(), 300);
                }, 150);
            }
        }
    }

    // Инициализация (вызывается по первому касанию)
    function init() {
        if (isInitialized) return;

        const context = initContext();
        if (!context) return;

        if (context.state === 'suspended') {
            context.resume();
        }

        loadSound().then(() => {
            isInitialized = true;
            console.log('🔊 SoundEngine готов');
            warmUp();
        });
    }

    // Остановка keep-alive (для очистки)
    function destroy() {
        if (wakeupInterval) {
            clearInterval(wakeupInterval);
            wakeupInterval = null;
        }
        if (playTimeout) {
            clearTimeout(playTimeout);
            playTimeout = null;
        }
        if (audioContext && audioContext.state === 'running') {
            try {
                audioContext.close();
            } catch(e) {}
        }
        audioContext = null;
        isWarmedUp = false;
        isInitialized = false;
        console.log('🔊 SoundEngine уничтожен');
    }

    return {
        init,
        play,
        destroy,
        isReady: () => isInitialized && isWarmedUp
    };
})();