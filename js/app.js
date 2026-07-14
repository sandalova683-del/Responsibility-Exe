/* =====================================================
   Ответственность.exe
   Version: 1.0.0 Release
   app.js
   © 2026
===================================================== */

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

let appData = loadData();
let isThinking = false;

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

const BALL_IMAGES = {
    default: 'assets/ball.png',
    thinking: 'assets/ball-thinking.png',
    gold: 'assets/ball-gold.png'
};

window.onload = startApp;
button.addEventListener('click', makeDecision);
closeWelcomeButton.addEventListener('click', closeWelcome);
aboutButton.addEventListener('click', openAbout);
closeAboutButton.addEventListener('click', closeAbout);
aboutModal.addEventListener('click', event => {
    if(event.target === aboutModal){
        closeAbout();
    }
});

document.addEventListener('keydown', event => {
    if(event.key === 'Escape'){
        closeAbout();
    }
});

function startApp(){
    startLoader();
    registerServiceWorker();
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
    }, 2200);
}

function setBallImage(type = 'default'){
    if(!ballImage){
        return;
    }

    ballImage.src = BALL_IMAGES[type] || BALL_IMAGES.default;
}

function initializeApp(){
    setBallImage();
    counter.textContent = getCounterText();
    changingCaption.textContent = getRandomCaption();
    footerQuote.textContent = getRandomFooterQuote();
    disclaimer.textContent = getRandomDisclaimer();
    checkFirstLaunch();
}

function checkFirstLaunch(){
    if(!appData.firstLaunch){
        return;
    }

    welcomeFact.textContent = getUniqueRandom(welcomeFacts, 'welcome');
    welcomeScreen.classList.remove('hidden');
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

    playSound();
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

    if(random < 0.20){
        return 4800;
    }

    if(random < 0.80){
        return 5700;
    }

    return 6800;
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
    const answerText = isVera ? 'НАПИШИ ВЕРЕ' : result.toUpperCase();

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

    status.textContent = getStatusAfterAnswer(result);
    counter.textContent = getCounterText();
    changingCaption.textContent = getRandomCaption();
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
    const veraChance = 0.08;

    if(Math.random() < veraChance){
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

    try{
        whooshSound.currentTime = 0;
        const promise = whooshSound.play();

        if(promise && typeof promise.catch === 'function'){
            promise.catch(() => {});
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