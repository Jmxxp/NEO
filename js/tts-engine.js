// ===== TTS ENGINE v2 - Sistema Ultra-Robusto de Text-to-Speech =====
// Solução definitiva para iOS Safari, Android Chrome, Desktop e apps híbridos
// Múltiplos fallbacks com unlock de áudio automático

const TTSEngine = (function() {
    'use strict';

    // ===== DETECÇÃO DE PLATAFORMA =====
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOSSafari = isIOS || isSafari;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isCordova = typeof cordova !== 'undefined';
    const hasNativeTTS = typeof TTS !== 'undefined';
    const hasWebSpeech = 'speechSynthesis' in window;
    
    // ===== ESTADO DO ENGINE =====
    let currentAudio = null;
    let currentUtterance = null;
    let isSpeaking = false;
    let isInterrupted = false;
    let audioContext = null;
    let speechRate = 1.0;
    let selectedVoice = null;
    let cachedVoices = [];
    let voicesLoaded = false;
    let audioUnlocked = false;
    let silentAudio = null;
    
    // Pool de elementos de áudio pré-criados (iOS precisa disso)
    let audioPool = [];
    const AUDIO_POOL_SIZE = 3;
    
    // Callbacks globais
    let onStartCallback = null;
    let onEndCallback = null;
    let onErrorCallback = null;
    let onProgressCallback = null;
    
    // ===== CONFIGURAÇÃO =====
    const config = {
        defaultLang: 'pt-BR',
        timeout: 12000,
        defaultRate: 1.0,
        defaultPitch: 1.0,
        volume: 1.0,
        // Para iOS, usar chunks menores
        maxChunkLength: isIOSSafari ? 150 : 200
    };

    // ===== INICIALIZAÇÃO =====
    function init(options = {}) {
        console.log('🔊 [TTS Engine v2] Inicializando...');
        console.log('📱 Plataforma:', {
            isIOS, isSafari, isIOSSafari, isAndroid, isCordova, hasNativeTTS, hasWebSpeech
        });
        
        Object.assign(config, options);
        
        // Criar pool de áudio para iOS
        createAudioPool();
        
        // Pré-carregar vozes
        if (hasWebSpeech) {
            loadWebSpeechVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadWebSpeechVoices;
            }
        }
        
        // Criar AudioContext
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn('⚠️ AudioContext não disponível');
        }
        
        // Setup de eventos para unlock automático
        setupAutoUnlock();
        
        console.log('✅ [TTS Engine v2] Pronto');
        return true;
    }
    
    // ===== CRIAR POOL DE ÁUDIO (CRÍTICO PARA iOS) =====
    function createAudioPool() {
        audioPool = [];
        for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
            const audio = document.createElement('audio');
            audio.setAttribute('playsinline', '');
            audio.setAttribute('webkit-playsinline', '');
            audio.preload = 'auto';
            audio.volume = 1.0;
            audio._inUse = false;
            audioPool.push(audio);
        }
        console.log(`🎵 [TTS] Pool de ${AUDIO_POOL_SIZE} elementos de áudio criado`);
    }
    
    // Obter áudio disponível do pool
    function getAudioFromPool() {
        // Procurar um disponível
        for (const audio of audioPool) {
            if (!audio._inUse) {
                audio._inUse = true;
                return audio;
            }
        }
        // Se todos ocupados, criar novo
        const audio = document.createElement('audio');
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio._inUse = true;
        return audio;
    }
    
    // Liberar áudio de volta ao pool
    function releaseAudioToPool(audio) {
        if (!audio) return;
        try {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            audio._inUse = false;
        } catch(e) {}
    }
    
    // ===== SETUP DE UNLOCK AUTOMÁTICO =====
    function setupAutoUnlock() {
        const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
        
        const unlockHandler = async () => {
            if (audioUnlocked) return;
            
            console.log('🔓 [TTS] Tentando desbloquear áudio...');
            
            try {
                // Desbloquear AudioContext
                if (audioContext && audioContext.state === 'suspended') {
                    await audioContext.resume();
                    console.log('✅ [TTS] AudioContext desbloqueado');
                }
                
                // Tocar som silencioso para desbloquear HTML5 Audio
                await playSilentAudio();
                
                // Desbloquear Web Speech synthesis
                if (hasWebSpeech) {
                    const utterance = new SpeechSynthesisUtterance('');
                    utterance.volume = 0;
                    window.speechSynthesis.speak(utterance);
                    window.speechSynthesis.cancel();
                }
                
                audioUnlocked = true;
                console.log('✅ [TTS] Áudio completamente desbloqueado!');
                
                // Remover listeners após unlock
                unlockEvents.forEach(event => {
                    document.removeEventListener(event, unlockHandler, true);
                });
                
            } catch(e) {
                console.warn('⚠️ [TTS] Erro no unlock:', e);
            }
        };
        
        // Adicionar listeners
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockHandler, { capture: true, passive: true });
        });
        
        // Também tentar unlock no início da chamada de voz
        window._ttsUnlock = unlockHandler;
    }
    
    // Tocar áudio silencioso para desbloquear iOS
    function playSilentAudio() {
        return new Promise((resolve) => {
            try {
                // Data URL de um MP3 silencioso de 0.1 segundo
                const silentMp3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAGRAFttBEAI6IKrc80kBFFFFBQUFBQ//tQxA4AAADSAAAAAFBQUFBQUFBQUFAAAAAAAAlBQUFBQ';
                
                silentAudio = new Audio(silentMp3);
                silentAudio.setAttribute('playsinline', '');
                silentAudio.volume = 0.01;
                
                silentAudio.play()
                    .then(() => {
                        console.log('✅ [TTS] Áudio silencioso reproduzido');
                        resolve(true);
                    })
                    .catch(e => {
                        console.warn('⚠️ [TTS] Falha no áudio silencioso:', e.message);
                        resolve(false);
                    });
                    
            } catch(e) {
                resolve(false);
            }
        });
    }
    
    // ===== CARREGAR VOZES =====
    function loadWebSpeechVoices() {
        if (!hasWebSpeech) return;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            cachedVoices = voices;
            voicesLoaded = true;
            console.log(`📢 [TTS] ${voices.length} vozes carregadas`);
            
            const ptVoices = voices.filter(v => v.lang.includes('pt'));
            if (ptVoices.length > 0) {
                console.log('🇧🇷 Vozes PT:', ptVoices.map(v => v.name).join(', '));
            }
        }
    }
    
    function getBestPTBRVoice() {
        if (cachedVoices.length === 0 && hasWebSpeech) {
            cachedVoices = window.speechSynthesis.getVoices();
        }
        
        const priorities = [
            v => v.name.includes('Luciana') && v.lang.includes('pt'),
            v => v.name.includes('Felipe') && v.lang.includes('pt'),
            v => v.name.includes('Google') && v.lang.includes('pt-BR'),
            v => v.name.includes('Microsoft') && v.name.includes('Francisca'),
            v => v.name.includes('Microsoft') && v.lang.includes('pt-BR'),
            v => v.lang === 'pt-BR',
            v => v.lang.startsWith('pt'),
            v => v.default
        ];
        
        for (const priority of priorities) {
            const voice = cachedVoices.find(priority);
            if (voice) return voice;
        }
        
        return null;
    }
    
    // ===== FUNÇÃO PRINCIPAL DE FALA =====
    async function speak(text, options = {}) {
        if (!text || text.trim().length === 0) {
            console.warn('⚠️ [TTS] Texto vazio');
            return false;
        }
        
        // Tentar unlock se ainda não desbloqueado
        if (!audioUnlocked && window._ttsUnlock) {
            await window._ttsUnlock();
        }
        
        stop();
        isInterrupted = false;
        isSpeaking = true;
        
        const opts = {
            rate: options.rate || speechRate || config.defaultRate,
            pitch: options.pitch || config.defaultPitch,
            volume: options.volume || config.volume,
            lang: options.lang || config.defaultLang,
            voice: options.voice || selectedVoice,
            onStart: options.onStart || onStartCallback,
            onEnd: options.onEnd || onEndCallback,
            onError: options.onError || onErrorCallback,
            onProgress: options.onProgress || onProgressCallback
        };
        
        console.log(`🔊 [TTS] Falando: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`);
        
        if (opts.onStart) opts.onStart();
        
        try {
            // Estratégia baseada na plataforma
            let success = false;
            
            if (hasNativeTTS) {
                // Cordova com plugin TTS nativo
                console.log('📱 [TTS] Tentando TTS nativo Cordova...');
                success = await speakWithNativeTTS(text, opts);
            }
            
            if (!success && isIOSSafari) {
                // iOS Safari: priorizar Google TTS via Audio
                console.log('🍎 [TTS] iOS Safari - usando Google TTS...');
                success = await speakWithGoogleTTS(text, opts);
                
                if (!success) {
                    console.log('🍎 [TTS] Google TTS falhou, tentando Web Speech...');
                    success = await speakWithWebSpeechIOS(text, opts);
                }
            }
            
            if (!success && hasWebSpeech && !isIOSSafari) {
                // Desktop/Android: Web Speech primeiro
                console.log('💻 [TTS] Tentando Web Speech...');
                success = await speakWithWebSpeech(text, opts);
            }
            
            if (!success) {
                // Fallback final: Google TTS
                console.log('🔄 [TTS] Fallback: Google TTS...');
                success = await speakWithGoogleTTS(text, opts);
            }
            
            if (!success) {
                console.error('❌ [TTS] Todos os métodos falharam');
                isSpeaking = false;
                if (opts.onError) opts.onError(new Error('TTS não disponível'));
                if (opts.onEnd) opts.onEnd();
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ [TTS] Erro:', error);
            isSpeaking = false;
            if (opts.onError) opts.onError(error);
            return false;
        }
    }
    
    // ===== TTS NATIVO (CORDOVA) =====
    async function speakWithNativeTTS(text, opts) {
        if (!hasNativeTTS) return false;
        
        return new Promise((resolve) => {
            const ttsOptions = {
                text: text,
                locale: opts.lang,
                rate: opts.rate,
                pitch: opts.pitch,
                cancel: true
            };
            
            TTS.speak(ttsOptions)
                .then(() => {
                    console.log('✅ [TTS] Nativo concluído');
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                })
                .catch(err => {
                    console.error('❌ [TTS] Erro nativo:', err);
                    resolve(false);
                });
        });
    }
    
    // ===== WEB SPEECH (DESKTOP/ANDROID) =====
    async function speakWithWebSpeech(text, opts) {
        if (!hasWebSpeech) return false;
        
        return new Promise((resolve) => {
            window.speechSynthesis.cancel();
            
            setTimeout(() => {
                if (isInterrupted) {
                    resolve(false);
                    return;
                }
                
                currentUtterance = new SpeechSynthesisUtterance(text);
                currentUtterance.lang = opts.lang;
                currentUtterance.rate = Math.min(opts.rate, 2.0);
                currentUtterance.pitch = opts.pitch;
                currentUtterance.volume = opts.volume;
                
                const voice = opts.voice || getBestPTBRVoice();
                if (voice) {
                    currentUtterance.voice = voice;
                    currentUtterance.lang = voice.lang;
                }
                
                let resolved = false;
                let startedSpeaking = false;
                
                currentUtterance.onstart = () => {
                    startedSpeaking = true;
                    console.log('▶️ [TTS] Web Speech iniciado');
                };
                
                currentUtterance.onend = () => {
                    if (resolved) return;
                    resolved = true;
                    console.log('✅ [TTS] Web Speech concluído');
                    currentUtterance = null;
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                };
                
                currentUtterance.onerror = (event) => {
                    if (resolved) return;
                    resolved = true;
                    console.error('❌ [TTS] Erro Web Speech:', event.error);
                    currentUtterance = null;
                    resolve(false);
                };
                
                // Timeout de segurança
                const timeout = setTimeout(() => {
                    if (resolved) return;
                    
                    // Se não começou a falar, falhou
                    if (!startedSpeaking) {
                        console.warn('⚠️ [TTS] Web Speech timeout (não iniciou)');
                        window.speechSynthesis.cancel();
                        resolved = true;
                        resolve(false);
                    }
                }, 5000);
                
                // Limpar timeout quando terminar
                const originalOnEnd = currentUtterance.onend;
                currentUtterance.onend = () => {
                    clearTimeout(timeout);
                    originalOnEnd();
                };
                
                window.speechSynthesis.speak(currentUtterance);
                
            }, 100);
        });
    }
    
    // ===== WEB SPEECH iOS (COM WORKAROUNDS) =====
    async function speakWithWebSpeechIOS(text, opts) {
        if (!hasWebSpeech) return false;
        
        // iOS: dividir em chunks pequenos
        const chunks = splitTextIntoChunks(text, config.maxChunkLength);
        console.log(`📝 [TTS] iOS: ${chunks.length} chunk(s)`);
        
        let success = true;
        
        for (let i = 0; i < chunks.length; i++) {
            if (isInterrupted) {
                success = false;
                break;
            }
            
            const chunk = chunks[i];
            const chunkSuccess = await speakChunkIOS(chunk, opts, i === 0);
            
            if (!chunkSuccess) {
                success = false;
                break;
            }
            
            // Pausa entre chunks
            if (i < chunks.length - 1) {
                await sleep(150);
            }
        }
        
        isSpeaking = false;
        if (success && !isInterrupted && opts.onEnd) {
            opts.onEnd();
        }
        
        return success;
    }
    
    function speakChunkIOS(text, opts, isFirst) {
        return new Promise((resolve) => {
            window.speechSynthesis.cancel();
            
            setTimeout(() => {
                if (isInterrupted) {
                    resolve(false);
                    return;
                }
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = opts.lang;
                utterance.rate = Math.min(opts.rate, 1.3); // iOS não gosta de rates altos
                utterance.pitch = opts.pitch;
                utterance.volume = opts.volume;
                
                const voice = opts.voice || getBestPTBRVoice();
                if (voice) {
                    utterance.voice = voice;
                }
                
                let resolved = false;
                let hasStarted = false;
                
                utterance.onstart = () => {
                    hasStarted = true;
                };
                
                utterance.onend = () => {
                    if (resolved) return;
                    resolved = true;
                    resolve(true);
                };
                
                utterance.onerror = (e) => {
                    if (resolved) return;
                    resolved = true;
                    // iOS frequentemente dá erro "interrupted" - considerar sucesso parcial
                    if (e.error === 'interrupted' && hasStarted) {
                        resolve(true);
                    } else {
                        console.warn('⚠️ [TTS] iOS chunk error:', e.error);
                        resolve(false);
                    }
                };
                
                // Timeout curto para iOS
                const timeout = setTimeout(() => {
                    if (resolved) return;
                    
                    if (!hasStarted) {
                        // Não iniciou - falha
                        window.speechSynthesis.cancel();
                        resolved = true;
                        resolve(false);
                    }
                }, 3000);
                
                utterance.onend = () => {
                    clearTimeout(timeout);
                    if (resolved) return;
                    resolved = true;
                    resolve(true);
                };
                
                window.speechSynthesis.speak(utterance);
                
                // iOS resume hack - necessário!
                const resumeInterval = setInterval(() => {
                    if (resolved || isInterrupted) {
                        clearInterval(resumeInterval);
                        return;
                    }
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    }
                }, 250);
                
            }, isFirst ? 200 : 100);
        });
    }
    
    // ===== GOOGLE TTS (MAIS CONFIÁVEL PARA iOS) =====
    async function speakWithGoogleTTS(text, opts) {
        const chunks = splitTextIntoChunks(text, config.maxChunkLength);
        console.log(`🔊 [TTS] Google TTS: ${chunks.length} parte(s)`);
        
        let success = true;
        
        for (let i = 0; i < chunks.length; i++) {
            if (isInterrupted) {
                success = false;
                break;
            }
            
            const chunk = chunks[i];
            const chunkSuccess = await playGoogleTTSChunk(chunk, opts);
            
            if (!chunkSuccess) {
                success = false;
                break;
            }
        }
        
        isSpeaking = false;
        if (success && !isInterrupted && opts.onEnd) {
            opts.onEnd();
        }
        
        return success;
    }
    
    function playGoogleTTSChunk(text, opts) {
        return new Promise((resolve) => {
            if (isInterrupted) {
                resolve(false);
                return;
            }
            
            const encodedText = encodeURIComponent(text);
            const lang = opts.lang.substring(0, 2);
            
            // Tentar múltiplos endpoints do Google TTS
            const endpoints = [
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`,
                `https://translate.google.com.br/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`,
                `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx`
            ];
            
            let currentEndpoint = 0;
            
            function tryNextEndpoint() {
                if (currentEndpoint >= endpoints.length || isInterrupted) {
                    resolve(false);
                    return;
                }
                
                const audioUrl = endpoints[currentEndpoint];
                currentEndpoint++;
                
                // Usar elemento do pool
                currentAudio = getAudioFromPool();
                
                // Configurar
                currentAudio.playbackRate = Math.min(Math.max(opts.rate, 0.5), 2.0);
                currentAudio.volume = opts.volume;
                
                let resolved = false;
                
                const cleanup = () => {
                    if (currentAudio) {
                        releaseAudioToPool(currentAudio);
                        currentAudio = null;
                    }
                };
                
                // Timeout
                const timeout = setTimeout(() => {
                    if (resolved) return;
                    console.warn('⚠️ [TTS] Google TTS timeout, tentando próximo endpoint...');
                    cleanup();
                    tryNextEndpoint();
                }, config.timeout);
                
                currentAudio.oncanplaythrough = () => {
                    if (resolved || isInterrupted) return;
                    
                    currentAudio.play()
                        .then(() => {
                            console.log('▶️ [TTS] Google TTS reproduzindo');
                            if (opts.onProgress) {
                                opts.onProgress({ audio: currentAudio });
                            }
                        })
                        .catch(err => {
                            console.warn('⚠️ [TTS] Erro ao reproduzir:', err.message);
                            clearTimeout(timeout);
                            if (!resolved) {
                                cleanup();
                                tryNextEndpoint();
                            }
                        });
                };
                
                currentAudio.onended = () => {
                    clearTimeout(timeout);
                    if (resolved) return;
                    resolved = true;
                    console.log('✅ [TTS] Google TTS chunk concluído');
                    cleanup();
                    resolve(true);
                };
                
                currentAudio.onerror = (e) => {
                    clearTimeout(timeout);
                    if (resolved) return;
                    console.warn('⚠️ [TTS] Erro Google TTS, tentando próximo...');
                    cleanup();
                    tryNextEndpoint();
                };
                
                // Importante para iOS
                currentAudio.src = audioUrl;
                currentAudio.load();
            }
            
            tryNextEndpoint();
        });
    }
    
    // ===== UTILITÁRIOS =====
    
    function splitTextIntoChunks(text, maxLength) {
        const chunks = [];
        let remaining = text.trim();
        
        while (remaining.length > 0) {
            if (remaining.length <= maxLength) {
                chunks.push(remaining);
                break;
            }
            
            let splitIndex = -1;
            
            // Prioridade: fim de sentença
            const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
            for (const ender of sentenceEnders) {
                const idx = remaining.lastIndexOf(ender, maxLength);
                if (idx > maxLength * 0.3 && idx > splitIndex) {
                    splitIndex = idx + ender.length - 1;
                }
            }
            
            // Segunda opção: vírgula
            if (splitIndex === -1) {
                const idx = remaining.lastIndexOf(', ', maxLength);
                if (idx > maxLength * 0.3) {
                    splitIndex = idx + 1;
                }
            }
            
            // Terceira opção: espaço
            if (splitIndex === -1) {
                splitIndex = remaining.lastIndexOf(' ', maxLength);
            }
            
            // Última opção: cortar no limite
            if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
                splitIndex = maxLength;
            }
            
            chunks.push(remaining.substring(0, splitIndex).trim());
            remaining = remaining.substring(splitIndex).trim();
        }
        
        return chunks;
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ===== CONTROLES =====
    
    function stop() {
        isInterrupted = true;
        isSpeaking = false;
        
        // Parar áudio atual
        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                releaseAudioToPool(currentAudio);
                currentAudio = null;
            } catch(e) {}
        }
        
        // Parar Web Speech
        if (hasWebSpeech) {
            try {
                window.speechSynthesis.cancel();
            } catch(e) {}
        }
        currentUtterance = null;
        
        // Parar TTS nativo
        if (hasNativeTTS) {
            try {
                TTS.speak({ text: '', cancel: true }).catch(() => {});
            } catch(e) {}
        }
        
        console.log('⏹️ [TTS] Parado');
    }
    
    function pause() {
        if (currentAudio) {
            currentAudio.pause();
        }
        if (hasWebSpeech) {
            window.speechSynthesis.pause();
        }
    }
    
    function resume() {
        if (currentAudio) {
            currentAudio.play();
        }
        if (hasWebSpeech) {
            window.speechSynthesis.resume();
        }
    }
    
    function setRate(rate) {
        speechRate = Math.min(Math.max(rate, 0.5), 2.0);
        return speechRate;
    }
    
    function getRate() {
        return speechRate;
    }
    
    function setVoice(voice) {
        selectedVoice = voice;
    }
    
    function getVoices() {
        if (cachedVoices.length === 0 && hasWebSpeech) {
            cachedVoices = window.speechSynthesis.getVoices();
        }
        return cachedVoices;
    }
    
    function getPTBRVoices() {
        return getVoices().filter(v => v.lang.includes('pt'));
    }
    
    function getIsSpeaking() {
        return isSpeaking;
    }
    
    function isAudioUnlocked() {
        return audioUnlocked;
    }
    
    function setCallbacks(callbacks) {
        if (callbacks.onStart) onStartCallback = callbacks.onStart;
        if (callbacks.onEnd) onEndCallback = callbacks.onEnd;
        if (callbacks.onError) onErrorCallback = callbacks.onError;
        if (callbacks.onProgress) onProgressCallback = callbacks.onProgress;
    }
    
    function getCurrentAudio() {
        return currentAudio;
    }
    
    function getPlatformInfo() {
        return {
            isIOS,
            isSafari,
            isIOSSafari,
            isAndroid,
            isCordova,
            hasNativeTTS,
            hasWebSpeech,
            voicesLoaded,
            audioUnlocked,
            voiceCount: cachedVoices.length
        };
    }
    
    // Forçar unlock (chamar em interação do usuário)
    async function forceUnlock() {
        if (window._ttsUnlock) {
            await window._ttsUnlock();
        }
        return audioUnlocked;
    }
    
    // ===== API PÚBLICA =====
    return {
        init,
        speak,
        stop,
        pause,
        resume,
        setRate,
        getRate,
        setVoice,
        getVoices,
        getPTBRVoices,
        setCallbacks,
        isSpeaking: getIsSpeaking,
        isUnlocked: isAudioUnlocked,
        forceUnlock,
        getCurrentAudio,
        getPlatformInfo
    };
})();

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TTSEngine.init());
} else {
    TTSEngine.init();
}

window.TTSEngine = TTSEngine;
