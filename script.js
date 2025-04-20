const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');

// Элементы ввода
const itemNameInput = document.getElementById('itemNameInput');
const itemWeightInput = document.getElementById('itemWeightInput');
const addItemBtn = document.getElementById('addItemBtn');
const itemList = document.getElementById('itemList'); // Список для отображения элементов

// Элементы рулетки и управления
const spinBtn = document.getElementById('spinBtn');

// Элементы модального окна
const resultModalOverlay = document.getElementById('resultModalOverlay');
const modalResultText = document.getElementById('modalResult');
const modalCloseButtonSpan = resultModalOverlay.querySelector('.close-button');
const modalCloseButton = resultModalOverlay.querySelector('.modal-close-btn');

const wheelRadius = canvas.width / 2;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

let segments = []; // Массив объектов { item: 'Название', weight: 5 }
let currentRotation = 0; // Текущее вращение в градусах
let isSpinning = false;

// Цвета для секторов (подобранные для темной темы)
const colors = [
    '#f56565', '#f6e0fa', '#c6f6d5', '#a7f3d0', '#90cdf4',
    '#c3dafe', '#faf089', '#fbd38d', '#feb2b2', '#fbcfe8',
    '#b794f4', '#e9d8fd', '#fed7e2', '#c4f1f9', '#d6bcfa'
    // Можно добавить больше
];

// --- Функции для управления элементами списка ---

function renderItemList() {
    itemList.innerHTML = ''; // Очистить текущий список

    if (segments.length === 0) {
        itemList.innerHTML = '<li class="item-list-item" style="justify-content: center; color: #a0aec0;">Список пуст. Добавьте элементы!</li>';
        spinBtn.disabled = true; // Деактивировать кнопку спина, если нет элементов
    } else {
        spinBtn.disabled = isSpinning; // Активровать кнопку, если есть элементы и не крутится
        segments.forEach((segment, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('item-list-item');
            listItem.innerHTML = `
                <span class="item-name">${segment.item}</span>
                <span class="item-weight">(вес: ${segment.weight})</span>
                <button class="remove-item-btn" data-index="${index}">×</button>
            `;
            itemList.appendChild(listItem);
        });
    }
}

function addItem() {
    const item = itemNameInput.value.trim();
    const weight = parseInt(itemWeightInput.value, 10);

    if (!item) {
        alert('Введите название элемента!');
        itemNameInput.focus();
        return;
    }
    if (isNaN(weight) || weight <= 0) {
        alert('Вес должен быть положительным числом!');
        itemWeightInput.focus();
        return;
    }

    segments.push({ item: item, weight: weight });

    itemNameInput.value = ''; // Очистить поля ввода
    itemWeightInput.value = '1'; // Сбросить вес на 1
    itemNameInput.focus(); // Вернуть фокус на название

    renderItemList(); // Перерисовать список
    drawWheel(); // Перерисовать рулетку
    hideModal(); // Скрыть модалку, если была открыта
}

function removeItem(index) {
    if (isSpinning) return; // Не удалять во время вращения
    segments.splice(index, 1); // Удалить 1 элемент по индексу

    renderItemList(); // Перерисовать список
    drawWheel(); // Перерисовать рулетку
    hideModal(); // Скрыть модалку
}


// --- Функции для отрисовки рулетки ---

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистить канвас
    ctx.save(); // Сохранить текущее состояние контекста

    // Применить текущее вращение рулетки
    ctx.translate(centerX, centerY);
    ctx.rotate((currentRotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);
    let startAngle = 0; // Начальный угол для рисования сектора (в градусах, 0 справа)

    if (segments.length === 0 || totalWeight === 0) {
        // Нарисовать пустой круг или сообщение, если нет элементов
         ctx.beginPath();
         ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI);
         ctx.fillStyle = '#4a5568'; // Темно-серый
         ctx.fill();
         ctx.strokeStyle = '#a0aec0';
         ctx.lineWidth = 3;
         ctx.stroke();

         ctx.fillStyle = '#a0aec0';
         ctx.font = 'bold 20px sans-serif';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText('Добавьте элементы', centerX, centerY);

         ctx.restore();
         return;
    }


    segments.forEach((segment, index) => {
        const segmentAngle = (segment.weight / totalWeight) * 360; // Угол сектора в градусах
        const endAngle = startAngle + segmentAngle;

        // Рисуем сектор
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, wheelRadius,
            (startAngle * Math.PI) / 180, // Начальный угол в радианах
            (endAngle * Math.PI) / 180     // Конечный угол в радианах
        );
        ctx.closePath();

        // Градиент для сектора
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, wheelRadius);
        const baseColor = colors[index % colors.length];
        // Можно сделать градиент от центра к краю
        gradient.addColorStop(0, baseColor + '40'); // Более прозрачный в центре
        gradient.addColorStop(1, baseColor); // Основной цвет на краю
        ctx.fillStyle = gradient;

        ctx.fill();
        ctx.strokeStyle = '#fff'; // Белая граница между секторами
        ctx.lineWidth = 3;
        ctx.stroke();

        // Рисуем текст элемента
        ctx.save(); // Сохранить состояние для текста

        // Перемещаем начало координат в центр рулетки
        ctx.translate(centerX, centerY);

        // Вращаем контекст к середине текущего сектора
        const textMidAngle = startAngle + segmentAngle / 2; // Угол середины сектора в градусах
        // Поворачиваем текст
        ctx.rotate(((textMidAngle + 90) * Math.PI) / 180); // +90 чтобы текст шел от центра вверх

        ctx.fillStyle = '#1a202c'; // Цвет текста (темный, чтобы хорошо видно на светлых/ярких секторах)
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textRadius = wheelRadius * 0.75; // Позиция текста ближе к краю

        // Простое разделение текста на строки
        const text = segment.item;
        const maxTextWidth = wheelRadius * 0.4; // Максимальная ширина линии текста
        const words = text.split(' ');
        let currentLine = '';
        const lines = [];

        for (let j = 0; j < words.length; j++) {
            const testLine = currentLine + (j > 0 ? ' ' : '') + words[j];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxTextWidth && j > 0) {
                lines.push(currentLine);
                currentLine = words[j];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        // Рисуем строки текста
        const lineHeight = 18; // Примерная высота строки
        const totalTextHeight = lines.length * lineHeight;
        let textY = textRadius - totalTextHeight / 2; // Y позиция для центрирования блока текста

        lines.forEach((line, lineIndex) => {
             ctx.fillText(line, 0, -textY + lineIndex * lineHeight);
        });


        ctx.restore(); // Восстановить состояние контекста после текста

        startAngle = endAngle; // Следующий сектор начинается там, где закончился текущий
    });

    ctx.restore(); // Восстановить состояние контекста после вращения рулетки
}


// --- Функции для вращения и выбора ---

function calculateTargetSegmentIndex() {
    const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < segments.length; i++) {
        cumulativeWeight += segments[i].weight;
        if (randomWeight < cumulativeWeight) {
            return i; // Найден сегмент
        }
    }
     return segments.length - 1; // На всякий случай
}

function spin() {
    if (isSpinning || segments.length === 0) {
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    hideModal();

    const winningSegmentIndex = calculateTargetSegmentIndex();
    const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);

    // Рассчитываем угол, необходимый для остановки на выигрышном сегменте
    let cumulativeAngleBeforeWinning = 0;
    for (let i = 0; i < winningSegmentIndex; i++) {
        cumulativeAngleBeforeWinning += (segments[i].weight / totalWeight) * 360;
    }

    const winningSegmentAngle = (segments[winningSegmentIndex].weight / totalWeight) * 360;
    const targetSegmentMidAngle = cumulativeAngleBeforeWinning + winningSegmentAngle / 2;

    // Угол, на который должна повернуться рулетка, чтобы середина выигрышного сегмента оказалась под стрелкой (на 270 градусах)
    // Учитываем текущее вращение (остаток от 360)
    const currentVisualRotation = currentRotation % 360;
    // Находим минимальный положительный сдвиг от текущего положения до целевого угла остановки (270 градусов)
    // Целевой угол рулетки = 270 - targetSegmentMidAngle
    let neededRotation = (270 - targetSegmentMidAngle - currentVisualRotation + 360) % 360;


    // Добавляем несколько полных оборотов для драматизма (например, 5-10)
    const minFullSpins = 8; // Увеличим
    const extraRotation = minFullSpins * 360;

    const totalRotationNeeded = extraRotation + neededRotation;

    // Финальный угол вращения (накопительный)
    const finalRotation = currentRotation + totalRotationNeeded;

    // Применяем CSS transform для анимации
    canvas.style.transition = 'transform 6s cubic-bezier(0.1, 0.7, 0.2, 1)'; // Увеличим время анимации
    canvas.style.transform = `rotate(${finalRotation}deg)`;

    // Обновляем текущее состояние вращения ПОСЛЕ завершения анимации
    currentRotation = finalRotation;

    // Ждем завершения анимации и показываем результат
    setTimeout(() => {
        onSpinComplete(winningSegmentIndex);

        // Сброс CSS transform после завершения анимации для подготовки к следующему вращению
        // Устанавливаем transform без анимации на остаточный угол (0-360)
        canvas.style.transition = 'none';
        canvas.style.transform = `rotate(${currentRotation % 360}deg)`;
         // Небольшая задержка, чтобы браузер успел применить 'none', прежде чем снова включить transition
         setTimeout(() => {
             canvas.style.transition = 'transform 6s cubic-bezier(0.1, 0.7, 0.2, 1)'; // Снова включаем анимацию для будущего спина
         }, 50);


    }, 6000); // Время должно совпадать с длительностью CSS transition + запас
}

function onSpinComplete(winningSegmentIndex) {
     isSpinning = false;
     spinBtn.disabled = false;

     const winningItem = segments[winningSegmentIndex].item;
     modalResultText.textContent = winningItem;
     showModal();
}

// --- Функции для модального окна ---

function showModal() {
    resultModalOverlay.classList.add('visible');
}

function hideModal() {
    resultModalOverlay.classList.remove('visible');
}

// --- Инициализация и обработчики событий ---

// Обработчик кнопки "Добавить"
addItemBtn.addEventListener('click', addItem);

// Добавление по нажатию Enter в полях ввода
itemNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Отменить действие по умолчанию (например, отправку формы)
        itemWeightInput.focus(); // Переместить фокус на поле веса
    }
});

itemWeightInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addItem(); // Вызвать добавление элемента
    }
});


// Обработчик кликов по списку (для кнопок "Удалить")
itemList.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-item-btn')) {
        const index = parseInt(event.target.dataset.index, 10);
        if (!isNaN(index)) {
            removeItem(index);
        }
    }
});


// Обработчик кнопки "Крутить"
spinBtn.addEventListener('click', spin);


// Обработчики закрытия модального окна
modalCloseButtonSpan.addEventListener('click', hideModal);
modalCloseButton.addEventListener('click', hideModal);
resultModalOverlay.addEventListener('click', (event) => {
    if (event.target === resultModalOverlay) {
        hideModal();
    }
});


// Начальная инициализация при загрузке страницы
window.onload = () => {
    // Добавляем несколько дефолтных элементов при загрузке
    segments.push({ item: 'Большой Куш', weight: 1 });
    segments.push({ item: 'Неплохой Приз', weight: 3 });
    segments.push({ item: 'Просто Проигрыш', weight: 10 });
    segments.push({ item: 'Ещё Шанс', weight: 5 });

    renderItemList(); // Отображаем их в списке
    drawWheel(); // Рисуем рулетку
    spinBtn.disabled = false; // Активируем кнопку спина
};