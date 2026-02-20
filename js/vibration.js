// Módulo de vibração: funções isoladas para reuso
// NOTA: `isCordovaReady` é definido em `config.js`

let vibrationInterval = null;

function startStreamVibration() {
    if (!isCordovaReady || !navigator.vibrate) {
        console.log("Vibração não disponível");
        return;
    }

    stopStreamVibration();

    vibrationInterval = setInterval(() => {
        try {
            navigator.vibrate(5);
        } catch (e) {
            console.warn("Erro ao vibrar:", e);
        }
    }, 100);
}

function stopStreamVibration() {
    if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
    }

    if (isCordovaReady && navigator.vibrate) {
        try {
            navigator.vibrate(0);
        } catch (e) {
            // ignora erro
        }
    }
}

function vibrateOnChar() {
    if (!isCordovaReady || !navigator.vibrate) return;

    try {
        navigator.vibrate(8);
    } catch (e) {
        // ignora erro
    }
}

function vibrateOnComplete() {
    if (!isCordovaReady || !navigator.vibrate) return;

    try {
        navigator.vibrate(50);
    } catch (e) {
        // ignora erro
    }
}

function vibrateOnClick() {
    if (!isCordovaReady || !navigator.vibrate) return;

    try {
        navigator.vibrate(20);
    } catch (e) {
        // ignora erro
    }
}
