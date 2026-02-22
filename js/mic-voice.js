// Microfone / reconhecimento de voz

// O botão micBtn já foi definido em elements.js
// Usamos a referência global existente
let isRecording = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

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
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
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
            // Disparar evento input para atualizar botão enviar
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    // Controle de reinício para evitar loop no iOS
    var restartCount = 0;
    var restartLimit = 3;
    var lastRestartTime = 0;

    recognition.onerror = (event) => {
        console.error("❌ Erro:", event.error);

        if (event.error === "no-speech") {
            console.log("Sem fala detectada");
            // No iOS, não reiniciar automaticamente - causa loop
            stopMicRecording();
            return;
        }

        if (event.error === "aborted") {
            // Aborted é normal no iOS quando para - não tentar reiniciar
            console.log("Reconhecimento abortado (normal)");
            return;
        }

        const errorMessages = {
            "audio-capture": "Microfone não detectado",
            "network": "Erro de rede",
            "not-allowed": "Permissão negada"
        };

        if (errorMessages[event.error]) {
            micBtn.title = errorMessages[event.error];
        }

        stopMicRecording();
    };

    recognition.onend = () => {
        console.log("⏹ Reconhecimento parou");

        if (isRecording) {
            // Limitar reinícios para evitar loop no iOS
            var now = Date.now();
            if (now - lastRestartTime > 5000) {
                restartCount = 0; // Reset counter after 5 seconds
            }
            
            if (restartCount >= restartLimit) {
                console.warn("⚠ Limite de reinícios atingido, parando");
                stopMicRecording();
                return;
            }

            restartCount++;
            lastRestartTime = now;
            console.log("🔄 Reiniciando... (" + restartCount + "/" + restartLimit + ")");
            setTimeout(() => {
                if (isRecording) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.warn("Erro ao reiniciar:", e);
                        stopMicRecording();
                    }
                }
            }, 500);
        } else {
            micBtn.classList.remove("recording");
            micBtn.title = "Clique para gravar voz";
        }
    };

    micBtn.disabled = false;
    console.log("✓ Microfone pronto");
}

function stopMicRecording() {
    if (!recognition) return;

    isRecording = false;

    try {
        recognition.stop();
    } catch (e) {
        console.warn("Erro ao parar:", e);
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

    try {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
            cordova.plugins.permissions.requestPermission(
                cordova.plugins.permissions.RECORD_AUDIO,
                function (status) {
                    if (status.hasPermission) {
                        console.log("✓ Permissão concedida");
                        recognition.start();
                    } else {
                        console.warn("⚠ Permissão negada");
                        micBtn.title = "Permissão negada";
                    }
                },
                function () {
                    console.error("Erro ao solicitar permissão");
                }
            );
        } else {
            recognition.start();
        }
    } catch (err) {
        console.error("❌ Erro:", err.message);
        micBtn.title = "Erro ao acessar microfone";
    }
}

if (micBtn) {
    micBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isRecording) {
            stopMicRecording();
        } else {
            startMicRecording();
        }
    });
}
