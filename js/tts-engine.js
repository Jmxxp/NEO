// ===== TTS ENGINE - Sistema Universal de Text-to-Speech =====
// Funciona em iOS Safari, Android Chrome, Desktop e apps híbridos
// Detecta automaticamente o melhor método disponível

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
    
    // Callbacks globais
    let onStartCallback = null;
    let onEndCallback = null;
    let onErrorCallback = null;
    let onProgressCallback = null;
    
    // ===== CONFIGURAÇÃO =====
    const config = {
        // Prioridade de provedores (ordem de tentativa)
        providerPriority: ['native', 'webspeech', 'azure', 'google', 'elevenlabs'],
        // Linguagem padrão
        defaultLang: 'pt-BR',
        // Timeout para fallback (ms)
        timeout: 8000,
        // Velocidade padrão
        defaultRate: 1.0,
        // Pitch padrão
        defaultPitch: 1.0,
        // Volume
        volume: 1.0
    };

    // ===== INICIALIZAÇÃO =====
    function init(options = {}) {
        console.log('🔊 [TTS Engine] Inicializando...');
        console.log('📱 Plataforma:', {
            isIOS, isSafari, isIOSSafari, isAndroid, isCordova, hasNativeTTS, hasWebSpeech
        });
        
        // Aplicar opções customizadas
        Object.assign(config, options);
        
        // Pré-carregar vozes do Web Speech
        if (hasWebSpeech) {
            loadWebSpeechVoices();
            // iOS precisa de evento para carregar vozes
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadWebSpeechVoices;
            }
        }
        
        // Criar AudioContext para análise (se necessário)
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn('⚠️ AudioContext não disponível');
        }
        
        console.log('✅ [TTS Engine] Pronto');
        return true;
    }
    
    // ===== CARREGAR VOZES WEB SPEECH =====
    function loadWebSpeechVoices() {
        if (!hasWebSpeech) return;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            cachedVoices = voices;
            voicesLoaded = true;
            console.log(`📢 [TTS] ${voices.length} vozes carregadas`);
            
            // Log vozes em PT-BR disponíveis
            const ptVoices = voices.filter(v => v.lang.includes('pt'));
            console.log('🇧🇷 Vozes PT:', ptVoices.map(v => `${v.name} (${v.lang})`));
        }
    }
    
    // ===== OBTER MELHOR VOZ PT-BR =====
    function getBestPTBRVoice() {
        if (cachedVoices.length === 0 && hasWebSpeech) {
            cachedVoices = window.speechSynthesis.getVoices();
        }
        
        // Prioridade de vozes
        const priorities = [
            // iOS Premium voices
            v => v.name.includes('Luciana') && v.lang.includes('pt'),
            v => v.name.includes('Felipe') && v.lang.includes('pt'),
            // Google voices
            v => v.name.includes('Google') && v.lang.includes('pt-BR'),
            // Microsoft Neural
            v => v.name.includes('Microsoft') && v.name.includes('Francisca'),
            v => v.name.includes('Microsoft') && v.name.includes('Antonio'),
            v => v.name.includes('Microsoft') && v.lang.includes('pt-BR'),
            // Qualquer pt-BR
            v => v.lang === 'pt-BR',
            v => v.lang.startsWith('pt'),
            // Fallback
            v => v.default
        ];
        
        for (const priority of priorities) {
            const voice = cachedVoices.find(priority);
            if (voice) return voice;
        }
        
        return null;
    }
    
    // ===== FALAR TEXTO - FUNÇÃO PRINCIPAL =====
    async function speak(text, options = {}) {
        if (!text || text.trim().length === 0) {
            console.warn('⚠️ [TTS] Texto vazio');
            return false;
        }
        
        // Resetar estado
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
            onProgress: options.onProgress || onProgressCallback,
            provider: options.provider || 'auto'
        };
        
        console.log(`🔊 [TTS] Falando: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        
        // Notificar início
        if (opts.onStart) opts.onStart();
        
        try {
            // Determinar provedor a usar
            let success = false;
            
            if (opts.provider === 'auto') {
                // Tentar cada provedor em ordem de prioridade
                success = await tryProvidersInOrder(text, opts);
            } else {
                // Usar provedor específico
                success = await speakWithProvider(text, opts, opts.provider);
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ [TTS] Erro:', error);
            isSpeaking = false;
            if (opts.onError) opts.onError(error);
            return false;
        }
    }
    
    // ===== TENTAR PROVEDORES EM ORDEM =====
    async function tryProvidersInOrder(text, opts) {
        // Ajustar prioridade baseado na plataforma
        let providers = [...config.providerPriority];
        
        // iOS Safari: priorizar Google TTS pois Web Speech é problemático
        if (isIOSSafari && !hasNativeTTS) {
            providers = ['webspeech-ios', 'google', 'azure', 'elevenlabs'];
        }
        
        // Android com plugin nativo: usar nativo primeiro
        if (hasNativeTTS) {
            providers = ['native', 'webspeech', 'google'];
        }
        
        console.log(`🔄 [TTS] Ordem de provedores: ${providers.join(' → ')}`);
        
        for (const provider of providers) {
            if (isInterrupted) {
                console.log('⏹️ [TTS] Interrompido');
                return false;
            }
            
            try {
                const success = await speakWithProvider(text, opts, provider);
                if (success) return true;
            } catch (error) {
                console.warn(`⚠️ [TTS] Falha com ${provider}:`, error.message);
                // Continuar para próximo provedor
            }
        }
        
        console.error('❌ [TTS] Todos os provedores falharam');
        isSpeaking = false;
        if (opts.onEnd) opts.onEnd();
        return false;
    }
    
    // ===== FALAR COM PROVEDOR ESPECÍFICO =====
    async function speakWithProvider(text, opts, provider) {
        switch (provider) {
            case 'native':
                return await speakWithNativeTTS(text, opts);
            
            case 'webspeech':
                return await speakWithWebSpeech(text, opts);
            
            case 'webspeech-ios':
                return await speakWithWebSpeechIOS(text, opts);
            
            case 'google':
                return await speakWithGoogleTTS(text, opts);
            
            case 'azure':
                return await speakWithAzureTTS(text, opts);
            
            case 'elevenlabs':
                return await speakWithElevenLabs(text, opts);
            
            default:
                throw new Error(`Provedor desconhecido: ${provider}`);
        }
    }
    
    // ===== PROVEDOR: TTS NATIVO (Cordova) =====
    async function speakWithNativeTTS(text, opts) {
        if (!hasNativeTTS) {
            throw new Error('Plugin TTS nativo não disponível');
        }
        
        console.log('🔊 [TTS] Usando plugin nativo Cordova');
        
        return new Promise((resolve, reject) => {
            const ttsOptions = {
                text: text,
                locale: opts.lang,
                rate: opts.rate,
                pitch: opts.pitch,
                cancel: true
            };
            
            // Se tem voz selecionada, usar identifier
            if (opts.voice && opts.voice.identifier) {
                ttsOptions.identifier = opts.voice.identifier;
            }
            
            TTS.speak(ttsOptions)
                .then(() => {
                    console.log('✅ [TTS] Nativo concluído');
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                })
                .catch(err => {
                    console.error('❌ [TTS] Erro nativo:', err);
                    reject(err);
                });
        });
    }
    
    // ===== PROVEDOR: WEB SPEECH API (Desktop/Android) =====
    async function speakWithWebSpeech(text, opts) {
        if (!hasWebSpeech) {
            throw new Error('Web Speech API não disponível');
        }
        
        console.log('🔊 [TTS] Usando Web Speech API');
        
        return new Promise((resolve, reject) => {
            // Cancelar qualquer fala anterior
            window.speechSynthesis.cancel();
            
            // Aguardar um pouco após cancelar (necessário em alguns browsers)
            setTimeout(() => {
                if (isInterrupted) {
                    resolve(false);
                    return;
                }
                
                currentUtterance = new SpeechSynthesisUtterance(text);
                currentUtterance.lang = opts.lang;
                currentUtterance.rate = opts.rate;
                currentUtterance.pitch = opts.pitch;
                currentUtterance.volume = opts.volume;
                
                // Obter voz
                const voice = opts.voice || getBestPTBRVoice();
                if (voice) {
                    currentUtterance.voice = voice;
                    currentUtterance.lang = voice.lang;
                    console.log(`📢 [TTS] Voz: ${voice.name}`);
                }
                
                let resolved = false;
                
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
                    reject(new Error(event.error || 'Erro Web Speech'));
                };
                
                // Timeout de segurança
                const timeout = setTimeout(() => {
                    if (resolved) return;
                    console.warn('⚠️ [TTS] Timeout Web Speech');
                    window.speechSynthesis.cancel();
                    resolved = true;
                    reject(new Error('Timeout'));
                }, config.timeout + text.length * 100);
                
                currentUtterance.onend = () => {
                    clearTimeout(timeout);
                    if (resolved) return;
                    resolved = true;
                    currentUtterance = null;
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                };
                
                window.speechSynthesis.speak(currentUtterance);
                
                // iOS Safari bug: speechSynthesis pode pausar em background
                // Precisamos fazer "resume" periódicamente
                if (isIOSSafari) {
                    const resumeInterval = setInterval(() => {
                        if (!isSpeaking || resolved) {
                            clearInterval(resumeInterval);
                            return;
                        }
                        window.speechSynthesis.resume();
                    }, 250);
                }
                
            }, 50);
        });
    }
    
    // ===== PROVEDOR: WEB SPEECH iOS (OTIMIZADO) =====
    async function speakWithWebSpeechIOS(text, opts) {
        if (!hasWebSpeech) {
            throw new Error('Web Speech API não disponível');
        }
        
        console.log('🔊 [TTS] Usando Web Speech iOS otimizado');
        
        // iOS tem limite de texto - dividir em chunks menores
        const maxLength = 200;
        const chunks = splitTextIntoChunks(text, maxLength);
        
        console.log(`📝 [TTS] Texto dividido em ${chunks.length} parte(s)`);
        
        return new Promise(async (resolve, reject) => {
            let currentChunk = 0;
            
            async function speakNextChunk() {
                if (isInterrupted || currentChunk >= chunks.length) {
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                    return;
                }
                
                const chunk = chunks[currentChunk];
                
                try {
                    await speakChunkIOS(chunk, opts);
                    currentChunk++;
                    // Pequena pausa entre chunks para naturalidade
                    setTimeout(speakNextChunk, 100);
                } catch (error) {
                    console.error(`❌ [TTS] Erro chunk ${currentChunk}:`, error);
                    reject(error);
                }
            }
            
            speakNextChunk();
        });
    }
    
    // Fala um chunk no iOS
    function speakChunkIOS(text, opts) {
        return new Promise((resolve, reject) => {
            window.speechSynthesis.cancel();
            
            setTimeout(() => {
                if (isInterrupted) {
                    resolve();
                    return;
                }
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = opts.lang;
                utterance.rate = Math.min(opts.rate, 1.5); // iOS não gosta de rates muito altos
                utterance.pitch = opts.pitch;
                utterance.volume = opts.volume;
                
                const voice = opts.voice || getBestPTBRVoice();
                if (voice) {
                    utterance.voice = voice;
                }
                
                let resolved = false;
                
                utterance.onend = () => {
                    if (resolved) return;
                    resolved = true;
                    resolve();
                };
                
                utterance.onerror = (e) => {
                    if (resolved) return;
                    resolved = true;
                    // iOS frequentemente dá erro "interrupted" - ignorar
                    if (e.error === 'interrupted') {
                        resolve();
                    } else {
                        reject(new Error(e.error));
                    }
                };
                
                // Timeout
                const timeout = setTimeout(() => {
                    if (resolved) return;
                    window.speechSynthesis.cancel();
                    resolved = true;
                    resolve(); // Não rejeitar, apenas pular
                }, 5000);
                
                utterance.onend = () => {
                    clearTimeout(timeout);
                    if (resolved) return;
                    resolved = true;
                    resolve();
                };
                
                // iOS Safari bug fix: precisa de interação do usuário
                // Se audioContext existe e está suspenso, resumir
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                window.speechSynthesis.speak(utterance);
                
                // iOS resume hack
                const resumeInterval = setInterval(() => {
                    if (resolved || isInterrupted) {
                        clearInterval(resumeInterval);
                        return;
                    }
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    }
                }, 200);
                
            }, 100);
        });
    }
    
    // ===== PROVEDOR: GOOGLE TRANSLATE TTS (GRATUITO) =====
    async function speakWithGoogleTTS(text, opts) {
        console.log('🔊 [TTS] Usando Google Translate TTS');
        
        // Dividir texto em chunks (limite ~200 chars)
        const maxLength = 190;
        const chunks = splitTextIntoChunks(text, maxLength);
        
        console.log(`📝 [TTS] ${chunks.length} parte(s) para Google TTS`);
        
        return new Promise(async (resolve, reject) => {
            let currentChunk = 0;
            
            async function playNextChunk() {
                if (isInterrupted || currentChunk >= chunks.length) {
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                    return;
                }
                
                const chunk = chunks[currentChunk];
                
                try {
                    await playGoogleTTSChunk(chunk, opts);
                    currentChunk++;
                    playNextChunk();
                } catch (error) {
                    console.error(`❌ [TTS] Erro Google chunk ${currentChunk}:`, error);
                    reject(error);
                }
            }
            
            playNextChunk();
        });
    }
    
    // Reproduz um chunk via Google TTS
    function playGoogleTTSChunk(text, opts) {
        return new Promise((resolve, reject) => {
            if (isInterrupted) {
                resolve();
                return;
            }
            
            const encodedText = encodeURIComponent(text);
            const lang = opts.lang.substring(0, 2); // 'pt-BR' -> 'pt'
            const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;
            
            currentAudio = new Audio();
            currentAudio.crossOrigin = 'anonymous';
            
            // Ajustar velocidade
            currentAudio.playbackRate = Math.min(Math.max(opts.rate, 0.5), 2.0);
            currentAudio.volume = opts.volume;
            
            let resolved = false;
            
            // Timeout
            const timeout = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                reject(new Error('Timeout Google TTS'));
            }, config.timeout);
            
            currentAudio.oncanplaythrough = () => {
                if (resolved || isInterrupted) return;
                
                currentAudio.play()
                    .then(() => {
                        // Progresso
                        if (opts.onProgress) {
                            opts.onProgress({ audio: currentAudio });
                        }
                    })
                    .catch(err => {
                        clearTimeout(timeout);
                        if (!resolved) {
                            resolved = true;
                            reject(err);
                        }
                    });
            };
            
            currentAudio.onended = () => {
                clearTimeout(timeout);
                if (resolved) return;
                resolved = true;
                currentAudio = null;
                resolve();
            };
            
            currentAudio.onerror = (e) => {
                clearTimeout(timeout);
                if (resolved) return;
                resolved = true;
                currentAudio = null;
                reject(new Error('Erro ao carregar áudio Google TTS'));
            };
            
            currentAudio.src = audioUrl;
            currentAudio.load();
        });
    }
    
    // ===== PROVEDOR: AZURE TTS =====
    async function speakWithAzureTTS(text, opts) {
        // Azure TTS requer chave API
        const azureKey = localStorage.getItem('neo_azure_tts_key');
        const azureRegion = localStorage.getItem('neo_azure_tts_region') || 'eastus';
        
        if (!azureKey) {
            throw new Error('Chave Azure TTS não configurada');
        }
        
        console.log('🔊 [TTS] Usando Azure TTS');
        
        return new Promise(async (resolve, reject) => {
            try {
                // Obter token de acesso
                const tokenUrl = `https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
                const tokenResponse = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': azureKey,
                        'Content-Length': '0'
                    }
                });
                
                if (!tokenResponse.ok) {
                    throw new Error('Falha ao obter token Azure');
                }
                
                const accessToken = await tokenResponse.text();
                
                // Sintetizar fala
                const ssml = `
                    <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${opts.lang}'>
                        <voice name='pt-BR-FranciscaNeural'>
                            <prosody rate='${(opts.rate * 100) - 100}%' pitch='${(opts.pitch - 1) * 50}%'>
                                ${escapeXml(text)}
                            </prosody>
                        </voice>
                    </speak>
                `;
                
                const ttsUrl = `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
                const ttsResponse = await fetch(ttsUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                    },
                    body: ssml
                });
                
                if (!ttsResponse.ok) {
                    throw new Error('Falha na síntese Azure');
                }
                
                const audioBlob = await ttsResponse.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                currentAudio = new Audio(audioUrl);
                currentAudio.volume = opts.volume;
                
                currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                };
                
                currentAudio.onerror = (e) => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    reject(new Error('Erro ao reproduzir áudio Azure'));
                };
                
                if (opts.onProgress) {
                    opts.onProgress({ audio: currentAudio });
                }
                
                await currentAudio.play();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // ===== PROVEDOR: ELEVENLABS =====
    async function speakWithElevenLabs(text, opts) {
        // Usa chave ElevenLabs configurada
        const elevenLabsKey = getElevenLabsKey();
        const voiceId = opts.elevenLabsVoiceId || localStorage.getItem('neoElevenLabsVoiceId') || 'ErXwobaYiN019PkySvjV';
        
        if (!elevenLabsKey) {
            throw new Error('Chave ElevenLabs não configurada');
        }
        
        console.log('🔊 [TTS] Usando ElevenLabs');
        
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': elevenLabsKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.8,
                            style: 0.3,
                            use_speaker_boost: true
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`ElevenLabs erro: ${response.status}`);
                }
                
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                currentAudio = new Audio(audioUrl);
                currentAudio.playbackRate = opts.rate > 1 ? 1.05 : 1.0;
                currentAudio.volume = opts.volume;
                
                currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    isSpeaking = false;
                    if (!isInterrupted && opts.onEnd) opts.onEnd();
                    resolve(true);
                };
                
                currentAudio.onerror = (e) => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    reject(new Error('Erro ao reproduzir ElevenLabs'));
                };
                
                if (opts.onProgress) {
                    opts.onProgress({ audio: currentAudio });
                }
                
                await currentAudio.play();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // ===== FUNÇÕES AUXILIARES =====
    
    // Obter chave ElevenLabs (rotação)
    function getElevenLabsKey() {
        // Tentar função global se existir
        if (typeof getAllElevenLabsApiKeys === 'function') {
            const keys = getAllElevenLabsApiKeys();
            if (keys.length > 0) return keys[0];
        }
        
        // Fallback localStorage
        return localStorage.getItem('neoElevenLabsApiKey');
    }
    
    // Dividir texto em chunks respeitando pontuação
    function splitTextIntoChunks(text, maxLength) {
        const chunks = [];
        let remaining = text.trim();
        
        while (remaining.length > 0) {
            if (remaining.length <= maxLength) {
                chunks.push(remaining);
                break;
            }
            
            // Encontrar melhor ponto de divisão
            let splitIndex = -1;
            
            // Prioridade: fim de sentença
            const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
            for (const ender of sentenceEnders) {
                const idx = remaining.lastIndexOf(ender, maxLength);
                if (idx > maxLength * 0.4 && idx > splitIndex) {
                    splitIndex = idx + ender.length - 1;
                }
            }
            
            // Segunda opção: vírgula ou ponto-e-vírgula
            if (splitIndex === -1) {
                const idx = remaining.lastIndexOf(', ', maxLength);
                const idx2 = remaining.lastIndexOf('; ', maxLength);
                splitIndex = Math.max(idx, idx2);
                if (splitIndex > maxLength * 0.3) {
                    splitIndex += 1;
                } else {
                    splitIndex = -1;
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
    
    // Escapar XML para SSML
    function escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    // ===== CONTROLES =====
    
    // Parar fala atual
    function stop() {
        isInterrupted = true;
        isSpeaking = false;
        
        // Parar áudio
        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                if (currentAudio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(currentAudio.src);
                }
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
    
    // Pausar
    function pause() {
        if (currentAudio) {
            currentAudio.pause();
        }
        if (hasWebSpeech) {
            window.speechSynthesis.pause();
        }
    }
    
    // Resumir
    function resume() {
        if (currentAudio) {
            currentAudio.play();
        }
        if (hasWebSpeech) {
            window.speechSynthesis.resume();
        }
    }
    
    // Definir velocidade
    function setRate(rate) {
        speechRate = Math.min(Math.max(rate, 0.5), 2.0);
        localStorage.setItem('ttsEngineRate', speechRate.toString());
        return speechRate;
    }
    
    // Obter velocidade
    function getRate() {
        return speechRate;
    }
    
    // Definir voz
    function setVoice(voice) {
        selectedVoice = voice;
    }
    
    // Obter vozes disponíveis
    function getVoices() {
        if (cachedVoices.length === 0 && hasWebSpeech) {
            cachedVoices = window.speechSynthesis.getVoices();
        }
        return cachedVoices;
    }
    
    // Obter vozes PT-BR
    function getPTBRVoices() {
        return getVoices().filter(v => v.lang.includes('pt'));
    }
    
    // Verificar se está falando
    function getIsSpeaking() {
        return isSpeaking;
    }
    
    // Definir callbacks
    function setCallbacks(callbacks) {
        if (callbacks.onStart) onStartCallback = callbacks.onStart;
        if (callbacks.onEnd) onEndCallback = callbacks.onEnd;
        if (callbacks.onError) onErrorCallback = callbacks.onError;
        if (callbacks.onProgress) onProgressCallback = callbacks.onProgress;
    }
    
    // Obter áudio atual (para análise de volume)
    function getCurrentAudio() {
        return currentAudio;
    }
    
    // Obter info da plataforma
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
            voiceCount: cachedVoices.length
        };
    }
    
    // ===== API PÚBLICA =====
    return {
        // Inicialização
        init,
        
        // Fala principal
        speak,
        stop,
        pause,
        resume,
        
        // Configuração
        setRate,
        getRate,
        setVoice,
        getVoices,
        getPTBRVoices,
        setCallbacks,
        
        // Estado
        isSpeaking: getIsSpeaking,
        getCurrentAudio,
        getPlatformInfo,
        
        // Provedores específicos (para uso direto se necessário)
        providers: {
            native: speakWithNativeTTS,
            webSpeech: speakWithWebSpeech,
            webSpeechIOS: speakWithWebSpeechIOS,
            google: speakWithGoogleTTS,
            azure: speakWithAzureTTS,
            elevenLabs: speakWithElevenLabs
        }
    };
})();

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TTSEngine.init());
} else {
    TTSEngine.init();
}

// Exportar globalmente
window.TTSEngine = TTSEngine;
