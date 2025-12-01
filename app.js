// Глобальные переменные
let currentUser = null;
let userKey = null;
let keyExpiry = null;
let isOffline = false;
let uploadedPhotos = [];

// DOM элементы
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    keyStatus: document.getElementById('keyStatus'),
    keyTimer: document.getElementById('keyTimer'),
    daysLeft: document.getElementById('daysLeft'),
    progressFill: document.getElementById('progressFill'),
    expiryDate: document.getElementById('expiryDate'),
    equationInput: document.getElementById('equationInput'),
    solveBtn: document.getElementById('solveBtn'),
    stepsContainer: document.getElementById('stepsContainer'),
    resultContainer: document.getElementById('resultContainer'),
    menuToggle: document.getElementById('menuToggle'),
    mainNav: document.getElementById('mainNav'),
    navLinks: document.querySelectorAll('.nav-link'),
    sections: document.querySelectorAll('.section'),
    loader: document.getElementById('loader'),
    notification: document.getElementById('notification'),
    keyInput: document.getElementById('keyInput'),
    activateKey: document.getElementById('activateKey'),
    photoUpload: document.getElementById('photoUpload'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadArea: document.getElementById('uploadArea'),
    gallery: document.getElementById('gallery'),
    operationBtns: document.querySelectorAll('.operation-btn'),
    opDisplay: document.getElementById('opDisplay'),
    calculateColumn: document.getElementById('calculateColumn'),
    columnResult: document.getElementById('columnResult')
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('УчебаНа5+ загружается...');
    
    // Создаем уникальный ID пользователя
    await initializeUser();
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Инициализируем тему
    initializeTheme();
    
    // Инициализируем навигацию
    initializeNavigation();
    
    // Инициализируем загрузку фото
    initializePhotoUpload();
    
    // Инициализируем решалку
    initializeSolver();
    
    // Инициализируем математику в столбик
    initializeColumnMath();
    
    // Инициализируем систему ключей
    initializeKeySystem();
    
    // Проверяем онлайн статус
    checkOnlineStatus();
    
    // Регистрируем Service Worker для PWA
    registerServiceWorker();
    
    // Скрываем загрузчик
    setTimeout(() => {
        elements.loader.style.display = 'none';
        showNotification('Приложение загружено!', 'success');
    }, 1000);
});

// ==================== СИСТЕМА ПОЛЬЗОВАТЕЛЯ ====================

async function initializeUser() {
    let userId = localStorage.getItem('user_id');
    
    if (!userId) {
        // Генерируем уникальный ID пользователя
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
        
        // Записываем первую дату использования
        const firstUse = {
            date: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        localStorage.setItem('first_use', JSON.stringify(firstUse));
    }
    
    currentUser = {
        id: userId,
        deviceId: await getDeviceId()
    };
    
    console.log('Пользователь инициализирован:', currentUser.id);
}

async function getDeviceId() {
    // Создаем уникальный ID устройства на основе доступной информации
    const navigatorInfo = navigator.userAgent + navigator.platform + navigator.language;
    const canvasId = await getCanvasFingerprint();
    
    // Хешируем для конфиденциальности
    const hash = await sha256(navigatorInfo + canvasId);
    return hash;
}

async function getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('УчебаНа5+', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('УчебаНа5+', 4, 17);
    
    return canvas.toDataURL();
}

async function sha256(message) {
    // Простой хеш для демонстрации
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUserData() {
    // Загружаем тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        updateThemeIcon();
    }
    
    // Загружаем фото
    const savedPhotos = localStorage.getItem('user_photos');
    if (savedPhotos) {
        uploadedPhotos = JSON.parse(savedPhotos);
        renderGallery();
    }
    
    // Загружаем данные ключа
    const savedKeyData = localStorage.getItem('key_data');
    if (savedKeyData) {
        const keyData = JSON.parse(savedKeyData);
        userKey = keyData.key;
        keyExpiry = new Date(keyData.expiry);
        
        if (isKeyValid()) {
            activatePremiumFeatures(true);
            updateKeyTimer();
        } else {
            // Ключ истек
            localStorage.removeItem('key_data');
            userKey = null;
            keyExpiry = null;
        }
    }
}

// ==================== ТЕМА ====================

function initializeTheme() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    updateThemeIcon();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark-theme');
    }
    
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('i');
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        icon.className = 'fas fa-sun';
        elements.themeToggle.title = 'Включить светлую тему';
    } else {
        icon.className = 'fas fa-moon';
        elements.themeToggle.title = 'Включить темную тему';
    }
}

// ==================== НАВИГАЦИЯ ====================

function initializeNavigation() {
    // Меню для мобильных
    elements.menuToggle.addEventListener('click', () => {
        elements.mainNav.classList.toggle('active');
    });
    
    // Переключение разделов
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Убираем активный класс у всех ссылок
            elements.navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            link.classList.add('active');
            
            // Скрываем все разделы
            elements.sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем нужный раздел
            const targetId = link.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
            
            // Скрываем меню на мобильных
            if (window.innerWidth <= 768) {
                elements.mainNav.classList.remove('active');
            }
        });
    });
}

// ==================== РЕШАЛКА УРАВНЕНИЙ ====================

function initializeSolver() {
    elements.solveBtn.addEventListener('click', solveEquation);
    
    // Авто-решение при нажатии Enter
    elements.equationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            solveEquation();
        }
    });
}

function solveEquation() {
    const equation = elements.equationInput.value.trim();
    
    if (!equation) {
        showNotification('Введите уравнение!', 'error');
        return;
    }
    
    // Проверяем доступ к премиум функциям
    if (!isPremiumUser()) {
        showNotification('Требуется активация ключа для полного решения!', 'warning');
        // Показываем только ответ без шагов
        showBasicSolution(equation);
        return;
    }
    
    try {
        // Очищаем предыдущие результаты
        elements.stepsContainer.innerHTML = '';
        elements.resultContainer.innerHTML = '';
        
        // Парсим уравнение
        const parsed = parseEquation(equation);
        
        // Показываем шаги решения
        showSolutionSteps(parsed);
        
        // Решаем и показываем результат
        const solution = solveMathEquation(equation);
        showSolutionResult(solution);
        
        showNotification('Уравнение решено!', 'success');
        
    } catch (error) {
        console.error('Ошибка решения:', error);
        showNotification('Ошибка в уравнении! Проверьте синтаксис.', 'error');
        elements.resultContainer.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
    }
}

function parseEquation(equation) {
    // Разбираем уравнение на части
    const parts = {
        original: equation,
        normalized: equation.replace(/\s/g, '').toLowerCase(),
        variables: [],
        constants: [],
        operators: []
    };
    
    // Ищем переменные (буквы)
    const variableRegex = /[a-z]/gi;
    let match;
    while ((match = variableRegex.exec(equation)) !== null) {
        if (!parts.variables.includes(match[0].toLowerCase())) {
            parts.variables.push(match[0].toLowerCase());
        }
    }
    
    // Ищем операторы
    const operators = equation.match(/[+\-*/=^()]/g) || [];
    parts.operators = [...new Set(operators)];
    
    return parts;
}

function showSolutionSteps(parsed) {
    let stepsHTML = '';
    
    // Шаг 1: Исходное уравнение
    stepsHTML += `
        <div class="step">
            <strong>Шаг 1: Исходное уравнение</strong><br>
            ${parsed.original}
        </div>
    `;
    
    // Шаг 2: Убираем пробелы
    stepsHTML += `
        <div class="step">
            <strong>Шаг 2: Нормализация</strong><br>
            ${parsed.normalized}
        </div>
    `;
    
    // Шаг 3: Переносим константы
    if (parsed.normalized.includes('=')) {
        stepsHTML += `
            <div class="step">
                <strong>Шаг 3: Перенос констант вправо</strong><br>
                ${parsed.normalized.replace(/([+\-]?\d+)(?=[^=]*=)/g, match => {
                    const num = parseInt(match);
                    return num >= 0 ? `-${num}` : `+${Math.abs(num)}`;
                })}
            </div>
        `;
    }
    
    // Шаг 4: Группируем переменные
    if (parsed.variables.length > 0) {
        stepsHTML += `
            <div class="step">
                <strong>Шаг 4: Группировка переменных</strong><br>
                Найдены переменные: ${parsed.variables.join(', ')}
            </div>
        `;
    }
    
    elements.stepsContainer.innerHTML = stepsHTML;
}

function solveMathEquation(equation) {
    try {
        // Используем math.js для решения
        const eq = equation.replace(/=/g, '===');
        
        // Создаем парсер math.js
        const parser = math.parser();
        
        // Пробуем решить алгебраически
        const solutions = {};
        
        // Извлекаем переменные
        const vars = equation.match(/[a-z]/gi) || [];
        const uniqueVars = [...new Set(vars.map(v => v.toLowerCase()))];
        
        // Для простых линейных уравнений
        if (uniqueVars.length === 1) {
            const varName = uniqueVars[0];
            
            // Заменяем переменную на x для math.js
            const normalizedEq = equation.replace(new RegExp(varName, 'gi'), 'x');
            
            try {
                const parsed = math.parse(normalizedEq);
                const solved = math.solve(parsed, 'x');
                
                if (Array.isArray(solved)) {
                    solutions[varName] = solved.map(v => math.round(v, 4));
                } else {
                    solutions[varName] = math.round(solved, 4);
                }
            } catch (e) {
                // Если math.js не справился, используем численное решение
                solutions[varName] = solveNumerically(equation, varName);
            }
        }
        
        return {
            equation: equation,
            variables: uniqueVars,
            solutions: solutions,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        // Простой численный метод для демонстрации
        return {
            equation: equation,
            solution: solveNumerically(equation, 'x'),
            method: 'numerical',
            timestamp: new Date().toISOString()
        };
    }
}

function solveNumerically(equation, variable) {
    // Простой численный метод для демонстрации
    const eq = equation.replace(/=/g, '-(');
    
    // Пробуем значения от -100 до 100
    for (let x = -100; x <= 100; x += 0.1) {
        try {
            const testEq = eq.replace(new RegExp(variable, 'gi'), x.toString());
            const result = eval(testEq + ')');
            
            if (Math.abs(result) < 0.001) {
                return Math.round(x * 100) / 100;
            }
        } catch (e) {
            continue;
        }
    }
    
    return "Не удалось найти точное решение";
}

function showSolutionResult(solution) {
    let resultHTML = '';
    
    if (solution.solutions) {
        resultHTML += `<div class="solution">`;
        
        for (const [variable, value] of Object.entries(solution.solutions)) {
            if (Array.isArray(value)) {
                resultHTML += `<p><strong>${variable}:</strong> ${value.join(', ')}</p>`;
            } else {
                resultHTML += `<p><strong>${variable} = ${value}</strong></p>`;
            }
        }
        
        resultHTML += `</div>`;
    } else if (solution.solution) {
        resultHTML += `<div class="solution"><strong>Ответ: ${solution.solution}</strong></div>`;
    }
    
    resultHTML += `<p class="small"><em>Решено: ${new Date(solution.timestamp).toLocaleTimeString()}</em></p>`;
    
    elements.resultContainer.innerHTML = resultHTML;
}

function showBasicSolution(equation) {
    // Показываем только ответ без деталей для бесплатных пользователей
    elements.resultContainer.innerHTML = `
        <div class="premium-locked">
            <i class="fas fa-lock"></i>
            <h4>Полное решение заблокировано</h4>
            <p>Активируйте ключ для просмотра всех шагов решения</p>
            <button class="btn btn-primary" onclick="document.querySelector('[href=\"#key\"]').click()">
                <i class="fas fa-key"></i> Активировать ключ
            </button>
        </div>
    `;
}

// ==================== МАТЕМАТИКА В СТОЛБИК ====================

function initializeColumnMath() {
    // Переключение операций
    elements.operationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.operationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            elements.opDisplay.textContent = btn.dataset.op;
        });
    });
    
    // Расчет
    elements.calculateColumn.addEventListener('click', calculateColumn);
}

function calculateColumn() {
    const num1 = elements.num1.value;
    const num2 = elements.num2.value;
    const operation = elements.opDisplay.textContent;
    
    if (!num1 || !num2) {
        showNotification('Введите оба числа!', 'error');
        return;
    }
    
    const a = parseInt(num1);
    const b = parseInt(num2);
    
    let result = '';
    
    switch (operation) {
        case '+':
            result = addColumn(a, b);
            break;
        case '-':
            result = subtractColumn(a, b);
            break;
        case '*':
            result = multiplyColumn(a, b);
            break;
        case '/':
            result = divideColumn(a, b);
            break;
    }
    
    elements.columnResult.textContent = result;
}

function addColumn(a, b) {
    const sum = a + b;
    const aStr = a.toString();
    const bStr = b.toString();
    const sumStr = sum.toString();
    
    const maxLength = Math.max(aStr.length, bStr.length, sumStr.length);
    
    let result = '';
    
    // Первое число
    result += ' '.repeat(maxLength - aStr.length + 2) + aStr + '\n';
    
    // Знак плюс и второе число
    result += '+ ' + ' '.repeat(maxLength - bStr.length + 1) + bStr + '\n';
    
    // Черта
    result += '—'.repeat(maxLength + 3) + '\n';
    
    // Результат
    result += ' '.repeat(maxLength - sumStr.length + 2) + sumStr + '\n';
    
    return result;
}

function subtractColumn(a, b) {
    const diff = a - b;
    const aStr = a.toString();
    const bStr = b.toString();
    const diffStr = diff.toString();
    
    const maxLength = Math.max(aStr.length, bStr.length, diffStr.length);
    
    let result = '';
    
    // Первое число
    result += ' '.repeat(maxLength - aStr.length + 2) + aStr + '\n';
    
    // Знак минус и второе число
    result += '- ' + ' '.repeat(maxLength - bStr.length + 1) + bStr + '\n';
    
    // Черта
    result += '—'.repeat(maxLength + 3) + '\n';
    
    // Результат
    result += ' '.repeat(maxLength - diffStr.length + 2) + diffStr + '\n';
    
    return result;
}

function multiplyColumn(a, b) {
    const product = a * b;
    const aStr = a.toString();
    const bStr = b.toString();
    const productStr = product.toString();
    
    const maxLength = Math.max(aStr.length, bStr.length, productStr.length);
    
    let result = '';
    
    // Первое число
    result += ' '.repeat(maxLength - aStr.length + 2) + aStr + '\n';
    
    // Знак умножения и второе число
    result += '× ' + ' '.repeat(maxLength - bStr.length + 1) + bStr + '\n';
    
    // Черта
    result += '—'.repeat(maxLength + 3) + '\n';
    
    // Умножение по шагам
    const bDigits = bStr.split('').reverse();
    
    bDigits.forEach((digit, index) => {
        const partial = a * parseInt(digit);
        const partialStr = partial.toString();
        const indent = ' '.repeat(index);
        
        result += indent + ' '.repeat(maxLength - partialStr.length + 2) + partialStr + '\n';
    });
    
    // Если было умножение на многозначное число
    if (b > 9) {
        result += '—'.repeat(maxLength + 3) + '\n';
        result += ' '.repeat(maxLength - productStr.length + 2) + productStr + '\n';
    }
    
    return result;
}

function divideColumn(a, b) {
    if (b === 0) {
        return 'Ошибка: деление на ноль!';
    }
    
    const quotient = Math.floor(a / b);
    const remainder = a % b;
    
    let result = '';
    result += `   ${a} ÷ ${b}\n`;
    result += '—'.repeat(10) + '\n';
    result += `   Частное: ${quotient}\n`;
    result += `   Остаток: ${remainder}\n`;
    
    return result;
}

// ==================== ФОТО И ПАМЯТКИ ====================

function initializePhotoUpload() {
    // Кнопка загрузки
    elements.uploadBtn.addEventListener('click', () => {
        elements.photoUpload.click();
    });
    
    // Drag and drop область
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = 'var(--primary-color)';
        elements.uploadArea.style.backgroundColor = 'var(--hover-bg)';
    });
    
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.style.borderColor = '';
        elements.photoUpload.click();
    });
    
    // Drag and drop область
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = 'var(--primary-color)';
        elements.uploadArea.style.backgroundColor = 'var(--hover-bg)';
    });
    
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.backgroundColor = '';
    });
    
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        handlePhotoUpload(files);
    });
    
    // Выбор файлов через input
    elements.photoUpload.addEventListener('change', (e) => {
        handlePhotoUpload(e.target.files);
    });
}

function handlePhotoUpload(files) {
    if (!files || files.length === 0) return;
    
    const maxPhotos = isPremiumUser() ? 50 : 10;
    
    if (uploadedPhotos.length + files.length > maxPhotos) {
        showNotification(`Максимум ${maxPhotos} фото! Активируйте ключ для большего количества.`, 'warning');
        return;
    }
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showNotification('Пожалуйста, загружайте только изображения!', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const photoData = {
                id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                data: e.target.result,
                name: file.name,
                size: file.size,
                type: file.type,
                uploaded: new Date().toISOString()
            };
            
            uploadedPhotos.push(photoData);
            savePhotosToStorage();
            renderGallery();
            
            showNotification(`Фото "${file.name}" загружено!`, 'success');
        };
        
        reader.readAsDataURL(file);
    });
    
    // Сбрасываем input
    elements.photoUpload.value = '';
}

function savePhotosToStorage() {
    localStorage.setItem('user_photos', JSON.stringify(uploadedPhotos));
}

function renderGallery() {
    if (uploadedPhotos.length === 0) {
        elements.gallery.innerHTML = `
            <div class="empty-gallery">
                <i class="fas fa-images fa-3x"></i>
                <p>Нет загруженных фото</p>
                <p class="small">Загрузите первое фото, чтобы создать памятку</p>
            </div>
        `;
        return;
    }
    
    let galleryHTML = '';
    
    uploadedPhotos.forEach(photo => {
        galleryHTML += `
            <div class="photo-item" data-id="${photo.id}">
                <img src="${photo.data}" alt="${photo.name}">
                <div class="photo-actions">
                    <button class="btn btn-icon small" onclick="viewPhoto('${photo.id}')" title="Увеличить">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn btn-icon small" onclick="deletePhoto('${photo.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="photo-info">
                    <p class="small">${photo.name}</p>
                    <p class="small">${new Date(photo.uploaded).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    });
    
    elements.gallery.innerHTML = galleryHTML;
}

function viewPhoto(photoId) {
    const photo = uploadedPhotos.find(p => p.id === photoId);
    if (!photo) return;
    
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%;">
            <img src="${photo.data}" 
                 alt="${photo.name}" 
                 style="max-width: 100%; max-height: 90vh;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: -40px; right: 0; 
                           background: none; border: none; color: white; 
                           font-size: 30px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function deletePhoto(photoId) {
    if (!confirm('Удалить это фото?')) return;
    
    uploadedPhotos = uploadedPhotos.filter(p => p.id !== photoId);
    savePhotosToStorage();
    renderGallery();
    showNotification('Фото удалено!', 'success');
}

// ==================== СИСТЕМА КЛЮЧЕЙ ====================

function initializeKeySystem() {
    elements.activateKey.addEventListener('click', activateKey);
    
    elements.keyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            activateKey();
        }
    });
}

// Массив валидных ключей (в реальном приложении это должно быть на сервере)
const VALID_KEYS = [
    'UCH-NA5-SUN-723', 'UCH-NA5-MOON-841', 'UCH-NA5-STAR-309',
    'UCH-NA5-BOOK-456', 'UCH-NA5-PEN-182', 'UCH-NA5-DESK-574',
    'UCH-NA5-LAMP-960', 'UCH-NA5-CODE-235', 'UCH-NA5-LEARN-618',
    'UCH-NA5-BRAIN-777', 'UCH-NA5-EXAM-112', 'UCH-NA5-TEST-889',
    'UCH-NA5-MATH-334', 'UCH-NA5-FIVE-665', 'UCH-NA5-PLUS-492',
    'UCH-NA5-MIND-201', 'UCH-NA5-KNOW-876', 'UCH-NA5-WISE-143',
    'UCH-NA5-PEAK-550', 'UCH-NA5-QUIZ-267', 'UCH-NA5-FACT-718',
    'UCH-NA5-ACE-385', 'UCH-NA5-GOAL-924', 'UCH-NA5-HACK-631',
    'UCH-NA5-JAVA-159', 'UCH-NA5-PYTH-472', 'UCH-NA5-OPEN-806',
    'UCH-NA5-TECH-290', 'UCH-NA5-DATA-537', 'UCH-NA5-USER-764',
    'UCH-NA5-FAST-421', 'UCH-NA5-EASY-658', 'UCH-NA5-HELP-995',
    'UCH-NA5-NEXT-120', 'UCH-NA5-WEST-483', 'UCH-NA5-FIRE-739',
    'UCH-NA5-WAVE-256', 'UCH-NA5-ZONE-874', 'UCH-NA5-EDGE-512',
    'UCH-NA5-ROAD-349'
];

// Использованные ключи (в реальном приложении должно быть на сервере)
const usedKeys = JSON.parse(localStorage.getItem('used_keys') || '[]');

async function activateKey() {
    const key = elements.keyInput.value.trim().toUpperCase();
    
    if (!key) {
        showNotification('Введите ключ!', 'error');
        return;
    }
    
    // Проверяем формат ключа
    const keyRegex = /^UCH-NA5-[A-Z]{3,4}-\d{3}$/;
    if (!keyRegex.test(key)) {
        showNotification('Неверный формат ключа!', 'error');
        return;
    }
    
    // Проверяем, является ли ключ валидным
    if (!VALID_KEYS.includes(key)) {
        showNotification('Недействительный ключ!', 'error');
        return;
    }
    
    // Проверяем, был ли ключ уже использован
    if (usedKeys.includes(key)) {
        showNotification('Этот ключ уже был активирован!', 'warning');
        return;
    }
    
    // В реальном приложении здесь должен быть запрос к серверу
    // Для демонстрации делаем локальную проверку
    
    try {
        // Симулируем проверку на сервере
        const activationResult = await simulateServerActivation(key);
        
        if (activationResult.success) {
            // Сохраняем ключ
            userKey = key;
            keyExpiry = new Date(activationResult.expiry);
            
            // Сохраняем в localStorage
            const keyData = {
                key: key,
                expiry: keyExpiry.toISOString(),
                activated: new Date().toISOString(),
                user: currentUser.id
            };
            
            localStorage.setItem('key_data', JSON.stringify(keyData));
            
            // Добавляем ключ в использованные
            usedKeys.push(key);
            localStorage.setItem('used_keys', JSON.stringify(usedKeys));
            
            // Активируем премиум функции
            activatePremiumFeatures(true);
            updateKeyTimer();
            
            // Очищаем поле ввода
            elements.keyInput.value = '';
            
            showNotification('Ключ успешно активирован! Доступ на 10 дней.', 'success');
            
        } else {
            showNotification('Ошибка активации ключа!', 'error');
        }
        
    } catch (error) {
        console.error('Ошибка активации:', error);
        showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
    }
}

async function simulateServerActivation(key) {
    // В реальном приложении здесь должен быть fetch запрос к серверу
    // Для демонстрации симулируем ответ сервера
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // Создаем дату окончания (10 дней от текущей даты)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 10);
            
            resolve({
                success: true,
                key: key,
                expiry: expiryDate.toISOString(),
                activated: new Date().toISOString(),
                deviceId: currentUser.deviceId,
                message: 'Ключ активирован успешно'
            });
        }, 1000); // Имитация задержки сети
    });
}

function isKeyValid() {
    if (!keyExpiry) return false;
    
    const now = new Date();
    return now < keyExpiry;
}

function isPremiumUser() {
    return isKeyValid();
}

function activatePremiumFeatures(isActive) {
    if (isActive) {
        // Обновляем статус ключа
        elements.keyStatus.className = 'key-status active';
        elements.keyStatus.innerHTML = '<i class="fas fa-key"></i> <span>Ключ активирован</span>';
        
        // Показываем таймер
        elements.keyTimer.style.display = 'block';
        
        // Разблокируем премиум функции
        unlockPremiumFeatures();
        
    } else {
        elements.keyStatus.className = 'key-status inactive';
        elements.keyStatus.innerHTML = '<i class="fas fa-key"></i> <span>Ключ не активирован</span>';
        
        // Скрываем таймер
        elements.keyTimer.style.display = 'none';
        
        // Блокируем премиум функции
        lockPremiumFeatures();
    }
}

function updateKeyTimer() {
    if (!keyExpiry) return;
    
    const now = new Date();
    const timeDiff = keyExpiry - now;
    
    if (timeDiff <= 0) {
        // Время вышло
        activatePremiumFeatures(false);
        return;
    }
    
    // Рассчитываем дни
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    elements.daysLeft.textContent = daysLeft;
    
    // Обновляем прогресс-бар
    const totalDays = 10;
    const progress = ((totalDays - daysLeft) / totalDays) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // Обновляем дату окончания
    elements.expiryDate.textContent = `Дата окончания: ${keyExpiry.toLocaleDateString('ru-RU')}`;
    
    // Меняем цвет прогресс-бара в зависимости от оставшегося времени
    if (daysLeft <= 3) {
        elements.progressFill.style.backgroundColor = '#f44336'; // Красный
    } else if (daysLeft <= 7) {
        elements.progressFill.style.backgroundColor = '#ff9800'; // Оранжевый
    } else {
        elements.progressFill.style.backgroundColor = '#4caf50'; // Зеленый
    }
}

function unlockPremiumFeatures() {
    // В реальном приложении здесь разблокируются все премиум функции
    console.log('Премиум функции разблокированы!');
}

function lockPremiumFeatures() {
    // Блокируем премиум функции
    console.log('Премиум функции заблокированы');
}

// ==================== PWA И OFFLINE ====================

function checkOnlineStatus() {
    isOffline = !navigator.onLine;
    
    if (isOffline) {
        showNotification('Работаем в оффлайн режиме', 'info');
    }
    
    // Слушаем изменения онлайн статуса
    window.addEventListener('online', () => {
        isOffline = false;
        showNotification('Соединение восстановлено', 'success');
    });
    
    window.addEventListener('offline', () => {
        isOffline = true;
        showNotification('Работаем оффлайн', 'warning');
    });
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigatorServiceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('Service Worker зарегистрирован:', registration);
            
            // Проверяем обновления
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('Обновление Service Worker:', newWorker);
            });
            
        } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
        }
    }
}

// ==================== УТИЛИТЫ ====================

function showNotification(message, type = 'info') {
    const notification = elements.notification;
    
    // Устанавливаем сообщение
    notification.textContent = message;
    
    // Устанавливаем цвет в зависимости от типа
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Показываем уведомление
    notification.style.display = 'block';
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Экспортируем функции для использования в HTML
window.viewPhoto = viewPhoto;
window.deletePhoto = deletePhoto;

// Обновляем таймер каждую минуту
setInterval(() => {
    if (isPremiumUser()) {
        updateKeyTimer();
    }
}, 60000);

// Обновляем таймер при загрузке
if (isPremiumUser()) {
    updateKeyTimer();
                  }
