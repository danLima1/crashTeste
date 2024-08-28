// Cria o Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let speedX = 3;
let speedY = 1;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let x = 0;
let y = canvas.height;

let animationId = requestAnimationFrame(draw);

let dotPath = [];
let counter = 1.0;
let multiplier = 0;
let counterDepo = [1.01, 18.45, 2.02, 5.21, 1.22, 1.25, 2.03];
let cashedOut = false;
let placedBet = false;
let isFlying = true;
let betAmount = 0;

let oddsDistribution = [
    [27, 1.00, 1.03, 'red'],
    [33, 1.03, 2.00, 'purple'],
    [20, 2.01, 4.00, 'blue'],
    [18, 6.01, 11.00, 'yellow'],
    [1, 11.01, 20.00, 'green'],
    [1, 20.01, 70.00, 'gray'],
];

function generateRandomStop() {
    const randomPercentage = Math.random() * 100;
    let accumulatedPercentage = 0;

    for (const [percentage, minMultiplier, maxMultiplier] of oddsDistribution) {
        accumulatedPercentage += percentage;

        if (randomPercentage <= accumulatedPercentage) {
            return (Math.random() * (maxMultiplier - minMultiplier) + minMultiplier);
        }
    }
    return 1.0;
}

let randomStop = generateRandomStop();

const image = new Image();
image.src = './img/aviator_jogo.png';
image.style.minWidth = '100%';
image.style.width = '100%';

let balanceAmount = document.getElementById('balance-amount');
let calculatedBalanceAmount = 3000;
balanceAmount.textContent = calculatedBalanceAmount.toString() + '€';
let betButton = document.getElementById('bet-button');
betButton.textContent = 'Bet';

let lastCounters = document.getElementById('last-counters');
let classNameForCounter = '';

function updateCounterDepo() {
    lastCounters.innerHTML = counterDepo.map(function (i) {
        if ((i < 2.00)) {
            classNameForCounter = 'blueBorder';
        } else if ((i >= 2) && (i < 10)) {
            classNameForCounter = 'purpleBorder';
        } else classNameForCounter = 'burgundyBorder';

        return '<p' + ' class=' + classNameForCounter + '>' + i + '</p>';
    }).join('');
}

let inputBox = document.getElementById("bet-input");

// Permitir a edição do valor da aposta
inputBox.readOnly = false;

// Configurações de caracteres inválidos
let invalidChars = ["-", "+", "e"];

inputBox.addEventListener("keydown", function (e) {
    if (invalidChars.includes(e.key)) {
        e.preventDefault();
    }
});

let messageField = document.getElementById('message');
messageField.textContent = 'Wait for the next round';

function displayCanvasMessage(message) {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.restore();
}

function draw() {
    counter += 0.001;
    document.getElementById('counter').textContent = counter.toFixed(2) + 'x';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    x += speedX;
    if (counter < randomStop) {
        y -= speedY;
        y = canvas.height / 2 + 50 * Math.cos(x / 100);
        isFlying = true;
    } else {
        x = 0;
        y = 0;
        isFlying = false;
    }

    if (counter >= randomStop) {
        displayCanvasMessage(`Voou para longe ${counter.toFixed(2)}x`);
        cancelAnimationFrame(animationId);
        counterDepo.unshift(counter.toFixed(2));
        updateCounterDepo();

        // Resetar o estado após a explosão do avião
        resetBet();

        setTimeout(() => {
            displayCanvasMessage('Esperando a próxima rodada...');

            setTimeout(() => {
                randomStop = generateRandomStop();
                counter = 1.0;
                x = canvas.width / 2;
                y = canvas.height / 2;
                dotPath = [];
                cashedOut = false;
                isFlying = true;
                messageField.textContent = '';

                animationId = requestAnimationFrame(draw);

            }, 6000);

        }, 2000);

        return;
    }

    dotPath.push({ x: x, y: y });

    const canvasOffsetX = canvas.width / 2 - x;
    const canvasOffsetY = canvas.height / 2 - y;

    ctx.save();
    ctx.translate(canvasOffsetX, canvasOffsetY);

    for (let i = 1; i < dotPath.length; i++) {
        ctx.beginPath();
        ctx.strokeStyle = '#dc3545';
        ctx.moveTo(dotPath[i - 1].x, dotPath[i - 1].y);
        ctx.lineTo(dotPath[i].x, dotPath[i].y);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = '#dc3545';
    ctx.lineWidth = 5;
    ctx.arc(x, y, 1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.drawImage(image, x - 28, y - 78, 185, 85);

    ctx.restore();

    if (placedBet && !cashedOut && isFlying) {
        const potentialCashout = betAmount * counter;
        betButton.textContent = `Sacar: ${potentialCashout.toFixed(2)}€`;
    }

    animationId = requestAnimationFrame(draw);
}

draw();

betButton.addEventListener('click', () => {
    if (placedBet) {
        cashOut();
    } else {
        placeBet();
    }
    if (!placedBet && !isFlying) {
        messageField.textContent = 'Place your bet';
    }
});

function placeBet() {
    betAmount = parseFloat(inputBox.value);

    if (placedBet || betAmount <= 0 || isNaN(betAmount) || isFlying || betAmount > calculatedBalanceAmount) {
        messageField.textContent = 'Wait for the next round';
        return;
    }

    if (!isFlying && (betAmount <= calculatedBalanceAmount)) {
        if (betAmount && (betAmount <= calculatedBalanceAmount)) {
            calculatedBalanceAmount -= betAmount;
            balanceAmount.textContent = calculatedBalanceAmount.toFixed(2).toString() + '€';
            placedBet = true;
            messageField.textContent = 'Placed Bet';
            betButton.textContent = `Sacar: ${(betAmount * counter).toFixed(2)}€`;
        } else {
            messageField.textContent = 'Insufficient balance to place bet';
        }
    } else {
        if (isFlying) {
            messageField.textContent = 'Wait for the next round';
        }
    }
}

function cashOut() {
    if (cashedOut || (betAmount === 0)) {
        messageField.textContent = 'Wait for the next round';
        return;
    }

    if ((counter < randomStop)) {
        const winnings = betAmount * counter;
        calculatedBalanceAmount += winnings;
        balanceAmount.textContent = calculatedBalanceAmount.toFixed(2).toString() + '€';

        cashedOut = true;
        placedBet = false;
        betButton.textContent = 'Bet';
        messageField.textContent = `Bet cashed out: ${winnings.toFixed(2)}€`;
    } else {
        messageField.textContent = "Can't cash out now";
    }
}

// Função para ajustar o valor da aposta
function updateBetAmount(amount) {
    betAmount = amount;
    inputBox.value = betAmount.toFixed(2);
}

// Função para incrementar ou decrementar a aposta
function adjustBetAmount(change) {
    let currentBet = parseFloat(inputBox.value);
    if (!isNaN(currentBet)) {
        currentBet += change;
        if (currentBet < 0) currentBet = 0;
        inputBox.value = currentBet.toFixed(2);
    }
}

// Evento para botões de número de aposta
document.querySelectorAll('.bet-option').forEach(button => {
    button.addEventListener('click', (e) => {
        const amount = parseFloat(e.target.textContent);
        updateBetAmount(amount);
    });
});

// Eventos para botões de incrementar/decrementar aposta
document.querySelector('.bet-plus').addEventListener('click', () => {
    adjustBetAmount(1);
});

document.querySelector('.bet-minus').addEventListener('click', () => {
    adjustBetAmount(-1);
});

// Função para resetar o estado da aposta
function resetBet() {
    placedBet = false;  // Resetar a flag de aposta
    betButton.textContent = 'Bet';  // Resetar o texto do botão
    // Não resetar o valor do inputBox para manter o valor inserido pelo usuário
}
