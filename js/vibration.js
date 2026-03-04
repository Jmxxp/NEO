// Módulo de vibração: funções isoladas para reuso
// Versão web: usa navigator.vibrate diretamente (sem Cordova check)

let vibrationInterval = null;

function startStreamVibration() {
    if (!navigator.vibrate) return;

    stopStreamVibration();

    vibrationInterval = setInterval(() => {
        try {
            navigator.vibrate(5);
        } catch (e) {}
    }, 100);
}

function stopStreamVibration() {
    if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
    }

    if (navigator.vibrate) {
        try {
            navigator.vibrate(0);
        } catch (e) {}
    }
}

function vibrateOnChar() {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(8); } catch (e) {}
}

function vibrateOnComplete() {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(50); } catch (e) {}
}

function vibrateOnClick() {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(20); } catch (e) {}
}
