/* =====================================================
   Ответственность.exe
   Version: 1.0.0 Release
   app.js
   © 2026
===================================================== */
const VERA_CHANCE = 0.08;
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const mainScreen = document.getElementById('main-screen');
const welcomeScreen = document.getElementById('welcome-screen');
const closeWelcomeButton = document.getElementById('close-welcome');
const welcomeFact = document.getElementById('welcome-fact');
const button = document.getElementById('decision-button');
const ball = document.getElementById('oracle-ball');
const ballImage = document.getElementById('ball-image');
const answer = document.getElementById('answer');
const status = document.getElementById('status');
const counter = document.getElementById('counter');
const resultCaption = document.getElementById('result-caption');
const changingCaption = document.getElementById('changing-caption');
const footerQuote = document.getElementById('footer-quote');
const disclaimer = document.getElementById('disclaimer');
const aboutButton = document.getElementById('about-button');
const aboutModal = document.getElementById('about-modal');
const closeAboutButton = document.getElementById('close-about');
const whooshSound = document.getElementById('whoosh-sound');
const developerModal = document.getElementById('developer-modal');
const developerOutput = document.getElementById('developer-output');
const developerInput = document.getElementById('developer-input');

let appData = loadData();
let isThinking = false;

const THINKING_CONFIG = {
    fast: { chance: 0.20, duration: 4800 },
    medium: { chance: 0.80, duration: 5700 },
    slow: { duration: 6800 }
};

const memory = {
    thinking: null,
    caption: null,
    personalCaption: null,
    footer: null,
    disclaimer: null,
    counter: null,
    vera: null,
    resultCaption: null,
    sameAnswer: null,
    streak: null
};

let developerTapCount = 0;
let developerTimer = null;

const BALL_IMAGES = {
    default: 'assets/ball.png',
    thinking: 'assets/ball-thinking.png',
    gold: 'assets/ball-gold.png'
};

document.addEventListener("DOMContentLoaded", startApp);
button.addEventListener('click', makeDecision);
closeWelcomeButton.addEventListener('click', closeWelcome);
aboutButton.addEventListener('click', () => {
    developerTapCount++;
    clearTimeout(developerTimer);
    developerTimer = setTimeout(() => {
        developerTapCount = 0;
    }, 1200);
    if (developerTapCount >= 5) {
        developerTapCount = 0;
        openDeveloper();
        return;
    }
    if (developerTapCount === 1) {
        setTimeout(() => {
            if (developerTapCount === 1) {
                developerTapCount = 0;
                openAbout();
            }
        }, 350);
    }
});

closeAboutButton.addEventListener('click', closeAbout);

aboutModal.addEventListener('click', event => {
    if(event.target === aboutModal){
        closeAbout();
    }
});

developerModal.addEventListener('click', event => {
    if(event.target === developerModal){
        closeDeveloper();
    }
});

document.addEventListener('keydown', event => {
    if(event.key === 'Escape'){
        closeAbout();
        closeDeveloper();
    }
});

developerInput.addEventListener("keydown", event => {
    if(event.key !== "Enter") return;
    const command = developerInput.value.trim().toLowerCase();
    developerOutput.textContent += command + "\n";
    switch(command){
        case "help":
            developerOutput.textContent +=
`
Доступные команды

help
version
stats
history
reset
cache
vera
clear
exit

> `;
            break;
        case "version":
            developerOutput.textContent +=
`
Ответственность.exe
Version 1.0

> `;
            break;
        case "stats":
            developerOutput.textContent +=
`
Ответов: ${appData.count}

ДА: ${appData.stats.yes}

НЕТ: ${appData.stats.no}

ВЕРА: ${appData.stats.vera}

> `;
            break;
        case "history":
            const history = appData.history || [];
            if(history.length === 0){
                developerOutput.textContent += `\nИстория пуста.\n\n> `;
            } else {
                const last10 = history.slice(-10).reverse();
                let output = '\nПоследние 10 решений:\n\n';
                last10.forEach((item, index) => {
                    const label = item.answer === 'yes' ? 'ДА' : (item.answer === 'no' ? 'НЕТ' : 'ВЕРА');
                    const time = new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    output += `  ${index+1}. ${label}  (${time})\n`;
                });
                output += `\n> `;
                developerOutput.textContent += output;
            }
            break;
        case "reset":
            if(confirm("Удалить данные?")){
                localStorage.removeItem(STORAGE_KEY); 
                location.reload();
            }
            developerOutput.textContent += "\n> ";
            break;
        case "cache":
            if("caches" in window){
                caches.keys().then(keys=>{
                    keys.forEach(key=>caches.delete(key));
                    developerOutput.textContent +=
`
Кэш очищён.

> `;
                });
            }
            break;
        case "vera":
            closeDeveloper();
            answer.textContent = "НАПИШИ ВЕРЕ";
            answer.className = "answer gold";
            answer.classList.remove("hidden");
            break;
        case "clear":
            developerOutput.textContent =
`Ответственность.exe Developer Console

> `;
            break;
        case "exit":
            closeDeveloper();
            break;
        default:
            developerOutput.textContent +=
`
Неизвестная команда.

Введите help

> `;
    }
    developerOutput.scrollTop = developerOutput.scrollHeight;
    developerInput.value="";
});

function startApp(){
    startLoader();
    setTimeout(registerServiceWorker,3000);
}

function startLoader(){
    let index = Math.floor(Math.random() * loadingMessages.length);
    loaderText.textContent = loadingMessages[index];

    const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        loaderText.textContent = loadingMessages[index];
    }, 320);

    setTimeout(() => {
        clearInterval(interval);
        loader.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        initializeApp();
    }, 900);
}

function setBallImage(type = 'default'){
    if(!ballImage){
        return;
    }

    ballImage.src = BALL_IMAGES[type] || BALL_IMAGES.default;
}

function initializeApp(){
    setBallImage();
    // Устанавливаем data-атрибуты для анимации
    counter.dataset.counterTo = appData.count;
    counter.dataset.counterFrom = 0;
    counter.dataset.counterDuration = 1200;
    counter.dataset.counterDecimals = 0;
    // Запускаем анимацию через AppEffects (если доступен)
    if(window.AppEffects && typeof AppEffects.animateCounter === 'function'){
        AppEffects.animateCounter(counter);
    } else {
        counter.textContent = getCounterText();
    }
    
    // Статус всегда "Готов к делегированию ответственности" при загрузке
    status.textContent = 'Готов к делегированию ответственности.';
    
    // changing-caption: пустая при первом запуске (если нет нажатий)
    if (appData.count === 0) {
        changingCaption.textContent = '';
    } else {
        changingCaption.textContent = getRandomCaption();
    }
    
    footerQuote.textContent = getRandomFooterQuote();
    disclaimer.textContent = getRandomDisclaimer();
    checkFirstLaunch();

    // Инициализация SoundEngine для iOS
    if (window.SoundEngine) {
        const initSound = () => {
            SoundEngine.init();
            document.removeEventListener('touchstart', initSound);
            document.removeEventListener('click', initSound);
            console.log('🔊 SoundEngine инициализирован');
        };
        document.addEventListener('touchstart', initSound, { once: true });
        document.addEventListener('click', initSound, { once: true });
    }
}

function checkFirstLaunch(){
    if(!appData.firstLaunch){
        return;
    }

    welcomeFact.textContent = getUniqueRandom(welcomeFacts, 'welcome');
    welcomeScreen.classList.remove('hidden');
    // Принудительно перезапускаем анимацию, если окно уже было показано
    welcomeScreen.style.animation = 'none';
    welcomeScreen.offsetHeight; // триггер перерисовки
    welcomeScreen.style.animation = '';
}

function closeWelcome(){
    welcomeScreen.classList.add('hidden');
    appData.firstLaunch = false;
    saveData(appData);
    footerQuote.textContent = getRandomFooterQuote();
}

function openAbout(){
    aboutModal.classList.remove('hidden');
}

function getRandomDisclaimer(){
    return getUniqueRandom(
        disclaimers,
        'disclaimer'
    );
}

function closeAbout(){
    aboutModal.classList.add('hidden');
}

function makeDecision(){
    if(isThinking){
        return;
    }

    isThinking = true;
    button.disabled = true;

    answer.className = 'answer hidden';
    answer.textContent = '';
    resultCaption.className = 'result-caption hidden';
    resultCaption.textContent = '';
    ball.classList.remove('yes','no','gold','flash');
    setBallImage('default');

    if(appData.settings.vibration && 'vibrate' in navigator){
        navigator.vibrate(80);
    }

    // Вместо playSound();
    if (window.SoundEngine) {
        SoundEngine.play();
    } else {
        // Fallback на старый способ
        if (whooshSound && appData.settings.sound) {
            whooshSound.currentTime = 0;
            whooshSound.play().catch(() => {});
        }
    }
    
    setBallImage('thinking');
    ball.classList.add('thinking');

    const thinkingTime = getThinkingTime();
    think(thinkingTime);

    setTimeout(() => {
        ball.classList.add('flash');
    }, Math.max(0, thinkingTime - 450));

    setTimeout(() => {
        ball.classList.remove('flash');
        showAnswer();
    }, thinkingTime);
}

function getThinkingTime(){
    const random = Math.random();

    if(random < THINKING_CONFIG.fast.chance){
        return THINKING_CONFIG.fast.duration;
    }

    if(random < THINKING_CONFIG.medium.chance){
        return THINKING_CONFIG.medium.duration;
    }

    return THINKING_CONFIG.slow.duration;
}

function think(duration){
    const moments = [0, Math.floor(duration / 3), Math.floor(duration / 3 * 2)];

    moments.forEach(delay => {
        setTimeout(() => {
            status.textContent = getThinkingMessage();
            status.classList.remove('fade-in');
            void status.offsetWidth;
            status.classList.add('fade-in');
        }, delay);
    });
}

function getThinkingMessage(){
    if(Math.random() < 0.025){
        return getUniqueRandom(fakeErrors, 'thinking');
    }

    const random = Math.random();

    if(random < messageChances.ultraRarePersonal){
        return getUniqueRandom(ultraRarePersonal, 'thinking');
    }

    if(random < messageChances.ultraRarePersonal + messageChances.ultraRare){
        return getUniqueRandom(ultraRareStatuses, 'thinking');
    }

    if(random < messageChances.ultraRarePersonal + messageChances.ultraRare + messageChances.personal){
        return getUniqueRandom(personalStatuses, 'thinking');
    }

    return getUniqueRandom(thinkingMessages, 'thinking');
}

function showAnswer(){
    const result = getRandomAnswer();
    const isVera = result === 'vera';
    const visualClass = isVera ? 'gold' : result;
    const answerText = isVera ? 'НАПИШИ ВЕРЕ' : (result === 'yes' ? 'ДА' : 'НЕТ');

    updateStats(result);
    updateStreak(result);

    ball.classList.remove('thinking');

    if(isVera){
        setBallImage('gold');
    }
    else{
        setBallImage('default');
    }

    ball.classList.add(visualClass);

    answer.textContent = answerText;
    answer.className = `answer ${visualClass}`;
    answer.classList.remove('hidden');

    resultCaption.textContent = getResultCaption(result);
    resultCaption.classList.remove('hidden');

    appData.lastAnswer = result;
    appData.count += 1;

    // Сохраняем историю (максимум 50 записей)
    appData.history.push({
        answer: result,
        timestamp: new Date().toISOString()
    });
    if(appData.history.length > 50){
        appData.history.shift();
    }

    status.textContent = getStatusAfterAnswer(result);
    // Обновляем счётчик с анимацией
    counter.dataset.counterTo = appData.count;
    if(window.AppEffects && typeof AppEffects.animateCounter === 'function'){
        AppEffects.animateCounter(counter);
    } else {
        counter.textContent = getCounterText();
    }
    // changing-caption: пустая при первом запуске (если нет нажатий)
    if (appData.count === 0) {
        changingCaption.textContent = '';
    } else {
        changingCaption.textContent = getRandomCaption();
    }
    footerQuote.textContent = getRandomFooterQuote();
    disclaimer.textContent = getRandomDisclaimer();

    saveData(appData);

    isThinking = false;
    button.disabled = false;

    if(appData.settings.vibration && 'vibrate' in navigator){
        navigator.vibrate(isVera ? [80,60,120] : 45);
    }
}

function getRandomAnswer(){
    if(Math.random() < VERA_CHANCE){
        return 'vera';
    }

    return Math.random() < 0.5 ? 'yes' : 'no';
}

function updateStats(result){
    if(!appData.stats){
        appData.stats = {yes:0,no:0,vera:0};
    }

    appData.stats[result] = (appData.stats[result] || 0) + 1;
}

function updateStreak(result){
    if(appData.lastAnswer === result){
        appData.answerStreak += 1;
    }
    else{
        appData.answerStreak = 1;
    }
}

function getStatusAfterAnswer(result){
    if(result === 'vera'){
        return getUniqueRandom(veraMessages, 'vera');
    }

    if(appData.lastAnswer === result && appData.answerStreak >= 2){
        if(appData.answerStreak >= 3){
            return getUniqueRandom(streakMessages[result], 'streak');
        }

        return getUniqueRandom(sameAnswerDelayMessages, 'sameAnswer');
    }

    return result === 'yes' ? 'Решение принято. Ответ: ДА.' : 'Решение принято. Ответ: НЕТ.';
}

function getResultCaption(result){
    const key = result === 'vera' ? 'vera' : result;
    return getUniqueRandom(resultCaptions[key], 'resultCaption');
}

function getCounterText(){
    return `${getUniqueRandom(counterTexts, 'counter')} ${appData.count}`;
}

function getRandomCaption(){
    if(Math.random() < captionChances.personal){
        return getUniqueRandom(
            personalCaptions,
            'personalCaption'
        );
    }
    return getUniqueRandom(
        captions,
        'caption'
    );
}

function getRandomFooterQuote(){
    return getUniqueRandom(footerQuotes, 'footer');
}

function getUniqueRandom(list, memoryKey){
    if(!Array.isArray(list) || list.length === 0){
        return '';
    }

    if(list.length === 1){
        memory[memoryKey] = list[0];
        return list[0];
    }

    let item = list[Math.floor(Math.random() * list.length)];
    let guard = 0;

    while(item === memory[memoryKey] && guard < 20){
        item = list[Math.floor(Math.random() * list.length)];
        guard += 1;
    }

    memory[memoryKey] = item;
    return item;
}

function playSound(){
    if(!appData.settings.sound || !whooshSound){
        return;
    }

    // iOS: пробуем "разбудить" аудио
    try{
        // Если звук не загружен, загружаем
        if(whooshSound.readyState === 0){
            whooshSound.load();
        }
        
        whooshSound.currentTime = 0;
        
        // iOS 15+ fix: нужно явно разрешить звук через пользовательское действие
        const promise = whooshSound.play();
        
        if(promise && typeof promise.catch === 'function'){
            promise.catch((error) => {
                // Если звук заблокирован, пересоздаём аудиоэлемент
                if(error.name === 'NotAllowedError' || error.name === 'NotSupportedError'){
                    console.warn('Звук заблокирован, пересоздаём...');
                    const newSound = document.createElement('audio');
                    newSound.src = 'sounds/whoosh.mp3';
                    newSound.preload = 'auto';
                    whooshSound.parentNode.replaceChild(newSound, whooshSound);
                    // Обновляем глобальную ссылку
                    window.whooshSound = newSound;
                    // Пробуем снова
                    setTimeout(() => {
                        newSound.play().catch(() => {});
                    }, 50);
                }
            });
        }
    }
    catch(error){
        console.warn('Звук недоступен', error);
    }
}

function registerServiceWorker(){
    if('serviceWorker' in navigator){
        navigator.serviceWorker.register('sw.js').catch(error => {
            console.warn('Service Worker не зарегистрирован', error);
        });
    }
}

function openDeveloper(){
    developerModal.classList.remove('hidden');
    developerOutput.textContent =
`Ответственность.exe Developer Console v1.0

Введите команду.

help - список команд

> `;
    developerInput.value = "";
    developerInput.focus();
}

function closeDeveloper(){
    developerModal.classList.add("hidden");
    developerInput.blur();
}