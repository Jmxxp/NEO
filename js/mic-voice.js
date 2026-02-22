// Microfone / reconhecimento de voz
// Compatível com iPhone/Safari — evita loop de ligar/desligar

// O botão micBtn já foi definido em elements.js
let isRecording = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

// Detectar iOS/Safari para tratamento especial
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOSSafari = isIOS || isSafari;

// Controle anti-loop para iOS
let _micRestartTimer = null;
let _micRestartCount = 0;
let _micRestartWindowStart = 0;
const MIC_MAX_RESTARTS = 3;          // máx restarts em janela de tempo
const MIC_RESTART_WINDOW = 5000;     // janela de 5s
const MIC_RESTART_DELAY_IOS = 800;   // delay maior no iOS
const MIC_RESTART_DELAY = 300;       // delay padrão
let _micUserWantsRecording = false;   // flag explícita de intenção do usuário
let _micStarting = false;            // evita chamadas simultâneas a start()

function _clearRestartTimer() {
    if (_micRestartTimer) {
        clearTimeout(_micRestartTimer);
        _micRestartTimer = null;
    }
}

function _canRestart() {
    const now = Date.now();
    if (now - _micRestartWindowStart > MIC_RESTART_WINDOW) {
        _micRestartCount = 0;
        _micRestartWindowStart = now;
    }
    _micRestartCount++;
    if (_micRestartCount > MIC_MAX_RESTARTS) {
        console.warn("⚠ Muitos restarts seguidos, parando microfone");
        return false;
    }
    return true;
}

function initMic() {
    console.log('Inicializando microfone...');

    if (!SpeechRecognition) {
        micBtn.disabled = true;
        micBtn.title = "Reconhecimento de voz não suportado";
        console.warn("❌ Web Speech Recognition não disponível");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    // iOS não suporta continuous bem — usar false sempre
    recognition.continuous = false;
    recognition.interimResults = !isIOSSafari; // iOS tem problemas com interimResults

    recognition.onstart = () => {
        _micStarting = false;
        isRecording = true;
        micBtn.classList.add("recording");
        micBtn.title = "🎤 Gravando... (clique para parar)";
        console.log("🎤 Gravação iniciada");
    };

    recognition.onresult = (event) => {
        let finalText = "";

        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalText += event.results[i][0].transcript + " ";
            }
        }

        if (finalText) {
            const currentValue = input.value.trim();
            const space = currentValue && !currentValue.endsWith(" ") ? " " : "";
            input.value = currentValue + space + finalText.trim();
            console.log("✓ Adicionado:", finalText.trim());
            autoResize();
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    recognition.onerror = (event) => {
        console.error("❌ Erro:", event.error);
        _micStarting = false;

        // no-speech: tentar reiniciar com controle anti-loop
        if (event.error === "no-speech") {
            console.log("Sem fala detectada");
            // Não reiniciar aqui — deixar o onend cuidar disso
            return;
        }

        // aborted no iOS acontece quando o sistema interrompe — não é erro real
        if (event.error === "aborted" && isIOSSafari && _micUserWantsRecording) {
            console.log("iOS abortou reconhecimento, será reiniciado via onend");
            return;
        }

        const errorMessages = {
            "audio-capture": "Microfone não detectado",
            "network": "Erro de rede",
            "not-allowed": "Permissão negada",
            "aborted": "Gravação cancelada"
        };

        if (errorMessages[event.error]) {
            micBtn.title = errorMessages[event.error];
        }

        stopMicRecording();
    };

    recognition.onend = () => {
        console.log("⏹ Reconhecimento parou");
        _micStarting = false;

        // Só reiniciar se o USUÁRIO quer continuar gravando
        if (_micUserWantsRecording) {
            if (!_canRestart()) {
                // Muitos restarts — parar de vez
                stopMicRecording();
                return;
            }

            const delay = isIOSSafari ? MIC_RESTART_DELAY_IOS : MIC_RESTART_DELAY;
            console.log(`🔄 Reiniciando em ${delay}ms...`);

            _clearRestartTimer();
            _micRestartTimer = setTimeout(() => {
                _micRestartTimer = null;
                if (_micUserWantsRecording && !_micStarting) {
                    _safeStartRecognition();
                }
            }, delay);
        } else {
            isRecording = false;
            micBtn.classList.remove("recording");
            micBtn.title = "Clique para gravar voz";
        }
    };

    micBtn.disabled = false;
    console.log("✓ Microfone pronto" + (isIOSSafari ? " (modo iOS)" : ""));
}

function _safeStartRecognition() {
    if (_micStarting || !recognition) return;
    _micStarting = true;

    try {
        recognition.start();
    } catch (e) {
        _micStarting = false;
        // InvalidStateError = já está rodando, ignorar
        if (e.name === 'InvalidStateError') {
            console.log("Recognition já ativo");
            return;
        }
        console.warn("Erro ao iniciar recognition:", e);
        stopMicRecording();
    }
}

function stopMicRecording() {
    _micUserWantsRecording = false;
    _clearRestartTimer();
    _micRestartCount = 0;

    if (!recognition) return;

    isRecording = false;

    try {
        recognition.stop();
    } catch (e) {
        // Ignorar — pode já estar parado
    }

    micBtn.classList.remove("recording");
    micBtn.title = "Clique para gravar voz";
    console.log("⏹ Gravação encerrada");
}

function startMicRecording() {
    if (!recognition) {
        initMic();
    }

    if (!recognition) {
        console.error("Microfone não disponível");
        return;
    }

    // Resetar controles anti-loop
    _micRestartCount = 0;
    _micRestartWindowStart = Date.now();
    _micUserWantsRecording = true;

    try {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
            cordova.plugins.permissions.requestPermission(
                cordova.plugins.permissions.RECORD_AUDIO,
                function (status) {
                    if (status.hasPermission) {
                        console.log("✓ Permissão concedida");
                        _safeStartRecognition();
                    } else {
                        console.warn("⚠ Permissão negada");
                        _micUserWantsRecording = false;
                        micBtn.title = "Permissão negada";
                    }
                },
                function () {
                    console.error("Erro ao solicitar permissão");
                    _micUserWantsRecording = false;
                }
            );
        } else {
            _safeStartRecognition();
        }
    } catch (err) {
        console.error("❌ Erro:", err.message);
        _micUserWantsRecording = false;
        micBtn.title = "Erro ao acessar microfone";
    }
}

if (micBtn) {
    micBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isRecording || _micUserWantsRecording) {
            stopMicRecording();
        } else {
            startMicRecording();
        }
    });
}
