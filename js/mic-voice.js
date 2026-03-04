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

// ===== CONTROLES ANTI-LOOP PARA iOS =====
let _micUserWantsRecording = false;   // Flag explícita: usuário DESEJA continuar gravando
let _micStarting = false;            // Evita chamadas simultâneas a start()
let _micRestartTimer = null;         // Timer para restart
let _micRestartCount = 0;            // Contador de restarts
let _micRestartWindowStart = 0;      // Janela temporal de restarts
let _micLastEndTime = 0;             // Timestamp do último onend

// Limites anti-loop
const MIC_MAX_RESTARTS = 3;          // Máximo 3 restarts em janela de tempo
const MIC_RESTART_WINDOW = 5000;     // Janela de 5s
const MIC_RESTART_DELAY_IOS = 1000;  // 1s delay no iOS (maior para evitar loop)
const MIC_RESTART_DELAY = 300;       // 300ms delay padrão
const MIC_MIN_SESSION_TIME = 500;    // Sessão mínima de 500ms (evita restarts muito rápidos)

function _clearRestartTimer() {
    if (_micRestartTimer) {
        clearTimeout(_micRestartTimer);
        _micRestartTimer = null;
    }
}

function _canRestart() {
    const now = Date.now();
    
    // Resetar contadores se saiu da janela de tempo
    if (now - _micRestartWindowStart > MIC_RESTART_WINDOW) {
        _micRestartCount = 0;
        _micRestartWindowStart = now;
    }
    
    // Incremente contador
    _micRestartCount++;
    
    // Se muitos restarts em pouco tempo, parar completamente
    if (_micRestartCount > MIC_MAX_RESTARTS) {
        console.warn("⚠ Muitos restarts em sequência, parando microfone para evitar loop");
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
    
    // iOS: SEMPRE usar continuous=false (iPhone não suporta bem)
    // Android e Desktop: podem usar continuous=true, mas deixaremos false por compatibilidade
    recognition.continuous = false;
    
    // iOS tem problemas com interimResults
    recognition.interimResults = !isIOSSafari;
    
    // Máx de alternativas para não consumir recursos
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        _micStarting = false;
        isRecording = true;
        micBtn.classList.add("recording");
        micBtn.title = "🎤 Gravando... (clique para parar)";
        console.log("🎤 Gravação iniciada" + (isIOSSafari ? " [iOS]" : ""));
    };

    recognition.onresult = (event) => {
        let finalText = "";

        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalText += event.results[i][0].transcript + " ";
            }
        }

        if (finalText.trim()) {
            const currentValue = input.value.trim();
            const space = currentValue && !currentValue.endsWith(" ") ? " " : "";
            input.value = currentValue + space + finalText.trim();
            console.log("✓ Adicionado:", finalText.trim());
            autoResize();
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    recognition.onerror = (event) => {
        console.error("❌ Erro de reconhecimento:", event.error);
        _micStarting = false;

        // "no-speech" = nenhuma fala detectada, normal em iOS
        if (event.error === "no-speech") {
            console.log("Nenhuma fala detectada, aguardando próxima sessão");
            // NÃO fazer nada aqui, deixar onend cuidar do comportamento
            return;
        }

        // "aborted" = sistema interrompeu (iOS faz isso frequentemente)
        if (event.error === "aborted") {
            console.log("Reconhecimento interrompido pelo sistema");
            // NÃO fazer nada, deixar onend cuidar
            return;
        }

        // Erros reais que devem parar a gravação
        const errorMessages = {
            "audio-capture": "Microfone não detectado",
            "network": "Erro de rede",
            "not-allowed": "Permissão negada"
        };

        if (errorMessages[event.error]) {
            console.warn("Erro real:", errorMessages[event.error]);
            micBtn.title = errorMessages[event.error];
            // Parar completamente neste caso
            stopMicRecording();
        }
    };

    recognition.onend = () => {
        const now = Date.now();
        const sessionDuration = now - _micLastEndTime;
        
        console.log(`⏹ Reconhecimento parou (duração: ${sessionDuration}ms)`);
        _micStarting = false;
        _micLastEndTime = now;

        // IMPORTANTE: Só reiniciar se o USUÁRIO QUER CONTINUAR gravando
        if (_micUserWantsRecording) {
            
            // Proteção: Não reiniciar se a sessão foi muito curta (evita loop de erro)
            if (sessionDuration < MIC_MIN_SESSION_TIME && _micRestartCount > 0) {
                console.warn("⚠ Sessão inusitadamente curta, aguardando antes de reiniciar");
            }
            
            // Verificar se ainda podemos reiniciar
            if (!_canRestart()) {
                console.error("❌ Muito muitos restarts, encerrando microfone");
                stopMicRecording();
                micBtn.title = "Erro: Microfone apresentou problema";
                return;
            }

            // Delay antes de reiniciar (maior no iOS para evitar loop)
            const delay = isIOSSafari ? MIC_RESTART_DELAY_IOS : MIC_RESTART_DELAY;
            console.log(`🔄 Preparando reinício em ${delay}ms...`);

            _clearRestartTimer();
            _micRestartTimer = setTimeout(() => {
                _micRestartTimer = null;
                
                // Double-check: usuário ainda quer gravando E recognition existe?
                if (_micUserWantsRecording && !_micStarting && recognition) {
                    _safeStartRecognition();
                } else {
                    console.log("⏹ Reinício cancelado (usuário parou ou estado inválido)");
                }
            }, delay);
        } else {
            // Usuário não quer mais gravar - parar completamente
            isRecording = false;
            micBtn.classList.remove("recording");
            micBtn.title = "Clique para gravar voz";
            _micRestartCount = 0;
            _micRestartWindowStart = 0;
            console.log("✓ Gravação encerrada pelo usuário");
        }
    };

    micBtn.disabled = false;
    console.log("✓ Microfone pronto" + (isIOSSafari ? " (modo iOS seguro)" : ""));
}

function _safeStartRecognition() {
    if (_micStarting || !recognition) {
        console.log("⚠ Reconhecimento já iniciando ou não disponível");
        return;
    }
    
    _micStarting = true;

    try {
        recognition.start();
        console.log("▶ Chamando recognition.start()");
    } catch (e) {
        _micStarting = false;
        
        // InvalidStateError = já está rodando, ignorar
        if (e.name === 'InvalidStateError') {
            console.log("⚠ Recognition já ativo, ignorando chamada start()");
            return;
        }
        
        console.error("❌ Erro ao iniciar recognition:", e.message);
        stopMicRecording();
    }
}

function stopMicRecording() {
    console.log("⏹ Parando gravação...");
    
    // Flag primária: NÃO queremos mais gravar
    _micUserWantsRecording = false;
    
    // Limpar timer de restart pendente
    _clearRestartTimer();
    
    // Resetar contadores
    _micRestartCount = 0;
    _micRestartWindowStart = 0;

    if (!recognition) return;

    isRecording = false;

    try {
        recognition.stop();
        console.log("▶ Chamando recognition.stop()");
    } catch (e) {
        console.log("⚠ Erro ao parar (pode já estar parado):", e.message);
    }

    micBtn.classList.remove("recording");
    micBtn.title = "Clique para gravar voz";
}

function startMicRecording() {
    console.log("▶ Iniciando microfone...");
    
    if (!recognition) {
        initMic();
    }

    if (!recognition) {
        console.error("❌ Reconhecimento não disponível");
        micBtn.title = "Microfone não disponível";
        return;
    }

    // IMPORTANTE: Indicar que usuário DESEJA gravar
    _micUserWantsRecording = true;
    
    // Resetar contadores anti-loop
    _micRestartCount = 0;
    _micRestartWindowStart = Date.now();
    _micLastEndTime = Date.now();

    try {
        // Para versão Cordova
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
            console.log("Solicitando permissão via Cordova...");
            cordova.plugins.permissions.requestPermission(
                cordova.plugins.permissions.RECORD_AUDIO,
                function (status) {
                    if (status.hasPermission) {
                        console.log("✓ Permissão concedida (Cordova)");
                        _safeStartRecognition();
                    } else {
                        console.warn("⚠ Permissão negada pelo usuário");
                        _micUserWantsRecording = false;
                        micBtn.title = "Permissão negada";
                    }
                },
                function () {
                    console.error("❌ Erro ao solicitar permissão");
                    _micUserWantsRecording = false;
                }
            );
        } else {
            // Versão Web - iniciar direto
            console.log("Modo Web: iniciando recognition...");
            _safeStartRecognition();
        }
    } catch (err) {
        console.error("❌ Erro ao iniciar:", err.message);
        _micUserWantsRecording = false;
        micBtn.title = "Erro ao acessar microfone";
    }
}

// Listener do botão de microfone
if (micBtn) {
    micBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isRecording || _micUserWantsRecording) {
            console.log("Usuário clicou para PARAR");
            stopMicRecording();
        } else {
            console.log("Usuário clicou para COMEÇAR");
            startMicRecording();
        }
    });
}
