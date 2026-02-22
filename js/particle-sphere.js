/**
 * Particle Sphere - Audio-Reactive Wave Animation
 * Sistema de monitoramento de áudio TTS
 * Partículas reagem APENAS ao áudio da IA, não ao microfone
 */

class ParticleSphere {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('ParticleSphere: Canvas não encontrado');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;
        this.animationId = null;
        this.initialized = false;
        
        // State
        this.state = 'idle'; // idle, listening, processing, speaking
        this.audioLevel = 0;
        this.targetAudioLevel = 0;
        this.smoothAudioLevel = 0;
        this.time = 0;
        
        // Audio context para elementos HTML (ElevenLabs, Google TTS)
        this.audioContext = null;
        this.analyser = null;
        this.audioSource = null;
        this.frequencyData = null;
        this.connectedElements = new WeakSet();
        
        // Simulação de áudio para TTS nativo (quando Web Audio não disponível)
        this.simulatedAudio = 0;
        this.simulationActive = false;
        this.simulationInterval = null;
        this.currentText = '';
        this.textPosition = 0;
        
        // Size
        this.size = 420;
        this.centerX = 210;
        this.centerY = 210;
        
        // Config
        this.config = {
            particleCount: 5000,
            baseRadius: 130,
            
            // Particle sizes
            minSize: 0.6,
            maxSize: 1.4,
            
            // Base movement (sempre sutil)
            baseWaveSpeed: 0.0008,
            baseWaveAmount: 1.5,
            
            // Audio-reactive waves
            audioWaveStrength: 30,
            audioSmoothing: 0.25,
            audioDecay: 0.08,
            
            // Rotation speed
            rotationSpeed: 0.0008,
        };
        
        console.log('ParticleSphere: Instância criada');
    }
    
    init() {
        if (this.initialized || !this.canvas) return;
        
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.size * dpr;
        this.canvas.height = this.size * dpr;
        this.canvas.style.width = this.size + 'px';
        this.canvas.style.height = this.size + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        this.createParticles();
        this.initialized = true;
        console.log('ParticleSphere: Inicializado com', this.config.particleCount, 'partículas');
    }
    
    createParticles() {
        this.particles = [];
        const count = this.config.particleCount;
        
        // Fibonacci sphere distribution
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);
            
            // Front-facing factor (z > 0 = facing user)
            const frontFacing = Math.max(0, z);
            
            this.particles.push({
                baseX: x, baseY: y, baseZ: z,
                x: x, y: y, z: z,
                frontFacing: frontFacing,
                wavePhase: Math.random() * Math.PI * 2,
                waveSpeed: 0.8 + Math.random() * 0.4,
                size: this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize),
                baseOpacity: 0.35 + Math.random() * 0.65,
                opacity: 0.5,
            });
        }
    }
    
    /**
     * Conecta um elemento de áudio HTML para análise
     * Usado para ElevenLabs e Google TTS
     */
    connectAudio(audioElement) {
        if (!audioElement) return;
        
        try {
            if (this.connectedElements.has(audioElement)) {
                console.log('ParticleSphere: Áudio já conectado');
                return;
            }
            
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.3;
            
            try {
                this.audioSource = this.audioContext.createMediaElementSource(audioElement);
                this.audioSource.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                this.connectedElements.add(audioElement);
                console.log('ParticleSphere: Áudio conectado com sucesso');
            } catch (e) {
                console.log('ParticleSphere: Source já conectado');
            }
            
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        } catch (e) {
            console.warn('ParticleSphere: Erro ao conectar áudio:', e);
        }
    }
    
    /**
     * Analisa o áudio em tempo real
     */
    analyzeAudio() {
        if (!this.analyser || !this.frequencyData) return 0;
        
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        let sum = 0;
        let weight = 0;
        const len = this.frequencyData.length;
        
        // Enfatiza frequências de voz humana (100-3000Hz)
        for (let i = 0; i < len; i++) {
            const freq = (i / len) * (this.audioContext?.sampleRate || 44100) / 2;
            let w = 1;
            if (freq > 100 && freq < 3000) w = 3; // Voz principal
            else if (freq > 80 && freq < 5000) w = 2; // Voz estendida
            sum += this.frequencyData[i] * w;
            weight += w;
        }
        
        return Math.min(1, ((sum / weight) / 255) * 2.5);
    }
    
    /**
     * Inicia simulação de áudio para TTS nativo
     * Cria ondas baseadas no texto sendo falado
     */
    startAudioSimulation(text) {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        
        this.currentText = text || '';
        this.textPosition = 0;
        this.simulationActive = true;
        
        console.log('ParticleSphere: Iniciando simulação de áudio');
        
        // Simula variação natural da voz
        this.simulationInterval = setInterval(() => {
            if (!this.simulationActive || this.state !== 'speaking') {
                this.stopAudioSimulation();
                return;
            }
            
            // Gera padrão de onda baseado na posição do texto
            const charIndex = Math.floor(this.textPosition);
            const char = this.currentText[charIndex % this.currentText.length] || 'a';
            
            // Caracteres diferentes criam amplitudes diferentes
            let baseAmplitude = 0.5;
            
            // Vogais = mais energia
            if ('aeiouáéíóúâêîôû'.includes(char.toLowerCase())) {
                baseAmplitude = 0.7 + Math.random() * 0.3;
            }
            // Consoantes fortes
            else if ('ptckbdgfvsz'.includes(char.toLowerCase())) {
                baseAmplitude = 0.5 + Math.random() * 0.4;
            }
            // Pausas (pontuação)
            else if ('.,!?;:'.includes(char)) {
                baseAmplitude = 0.1 + Math.random() * 0.2;
            }
            // Espaços = pausa curta
            else if (char === ' ') {
                baseAmplitude = 0.2 + Math.random() * 0.2;
            }
            // Outras
            else {
                baseAmplitude = 0.4 + Math.random() * 0.3;
            }
            
            // Adiciona variação natural
            const wave = Math.sin(Date.now() * 0.01) * 0.2;
            this.simulatedAudio = Math.max(0, Math.min(1, baseAmplitude + wave));
            
            // Avança no texto
            this.textPosition += 0.3; // Velocidade de "leitura"
            
        }, 50); // 20fps para simulação
    }
    
    /**
     * Para simulação de áudio
     */
    stopAudioSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.simulationActive = false;
        this.simulatedAudio = 0;
        console.log('ParticleSphere: Simulação parada');
    }
    
    /**
     * Define o estado atual
     */
    setState(newState) {
        const prevState = this.state;
        this.state = newState;
        
        console.log('ParticleSphere: Estado alterado de', prevState, 'para', newState);
        
        // Se parou de falar, resetar simulação
        if (prevState === 'speaking' && newState !== 'speaking') {
            this.stopAudioSimulation();
        }
    }
    
    /**
     * Define nível de áudio manualmente
     */
    setAudioLevel(level) {
        this.targetAudioLevel = Math.max(0, Math.min(1, level));
    }
    
    /**
     * Atualiza partículas
     */
    update() {
        this.time++;
        
        // Determina nível de áudio baseado no estado
        if (this.state === 'speaking') {
            // Tenta usar análise real de áudio primeiro
            if (this.analyser && this.frequencyData) {
                const realLevel = this.analyzeAudio();
                if (realLevel > 0.01) {
                    this.targetAudioLevel = realLevel;
                } else if (this.simulationActive) {
                    // Fallback para simulação
                    this.targetAudioLevel = this.simulatedAudio;
                } else {
                    this.targetAudioLevel = 0.3; // Fallback mínimo
                }
            } else if (this.simulationActive) {
                // Usa simulação quando não há Web Audio
                this.targetAudioLevel = this.simulatedAudio;
            } else {
                // Fallback: pulso suave quando falando sem dados
                this.targetAudioLevel = 0.3 + Math.sin(this.time * 0.05) * 0.2;
            }
        } else {
            // Não falando = sem ondas de áudio
            this.targetAudioLevel = 0;
        }
        
        // Transições suaves
        if (this.targetAudioLevel > this.audioLevel) {
            this.audioLevel += (this.targetAudioLevel - this.audioLevel) * this.config.audioSmoothing;
        } else {
            this.audioLevel += (this.targetAudioLevel - this.audioLevel) * this.config.audioDecay;
        }
        
        // Suavização extra
        this.smoothAudioLevel += (this.audioLevel - this.smoothAudioLevel) * 0.05;
        
        const t = this.time * this.config.baseWaveSpeed;
        const radius = this.config.baseRadius;
        const audio = this.audioLevel;
        
        for (const p of this.particles) {
            // BASE WAVE - sempre ativo (movimento sutil orgânico)
            const baseWave1 = Math.sin(t * p.waveSpeed + p.wavePhase);
            const baseWave2 = Math.sin(t * 1.3 * p.waveSpeed + p.wavePhase * 1.5);
            const baseDisplacement = (baseWave1 + baseWave2 * 0.5) * this.config.baseWaveAmount;
            
            // AUDIO WAVE - apenas quando há áudio
            let audioDisplacement = 0;
            let opacityBoost = 0;
            
            if (audio > 0.02) {
                // Múltiplas ondas viajando pela superfície da esfera
                const theta = Math.atan2(p.baseY, p.baseX); // Ângulo horizontal
                const phi = Math.acos(p.baseZ); // Ângulo vertical
                
                // Onda 1 - horizontal
                const wave1 = Math.sin(theta * 3 + t * 4);
                // Onda 2 - vertical
                const wave2 = Math.sin(phi * 4 + t * 3);
                // Onda 3 - diagonal
                const wave3 = Math.sin((theta + phi) * 2 + t * 5);
                // Onda 4 - espiral
                const wave4 = Math.sin(theta * 2 - phi * 2 + t * 3.5);
                
                // Combina as ondas
                const combinedWave = (wave1 + wave2 + wave3 + wave4) / 4;
                
                // QUEBRA ALEATÓRIA - cada partícula tem seu próprio caos
                const chaos = Math.sin(p.wavePhase * 17 + t * 2) * 0.7;
                const randomBurst = Math.sin(p.wavePhase * 31 + t * 8) > 0.6 ? 1.5 : 1.0;
                const particleNoise = (Math.sin(p.wavePhase * 47 + t * 1.5) * 0.5 + 0.5);
                
                // Aplica ao áudio com quebra individual
                const baseExpansion = (combinedWave * 0.5 + 0.5) * audio * this.config.audioWaveStrength;
                audioDisplacement = baseExpansion * randomBurst + chaos * audio * 8 * particleNoise;
                
                // Boost de opacidade baseado na expansão
                opacityBoost = (audioDisplacement / this.config.audioWaveStrength) * 0.6;
            }
            
            // Displacement total
            const totalDisplacement = baseDisplacement + audioDisplacement;
            
            // Aplica displacement radial
            p.x = p.baseX * (radius + totalDisplacement);
            p.y = p.baseY * (radius + totalDisplacement);
            p.z = p.baseZ * (radius + totalDisplacement);
            
            // Opacidade
            p.opacity = p.baseOpacity + opacityBoost;
        }
    }
    
    /**
     * Renderiza partículas
     */
    render() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.size, this.size);
        
        // Rotação
        const rotY = this.time * this.config.rotationSpeed;
        const rotX = Math.sin(this.time * 0.0004) * 0.15;
        
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        
        const projected = [];
        const radius = this.config.baseRadius;
        
        for (const p of this.particles) {
            // Rotação Y
            let x = p.x * cosY - p.z * sinY;
            let z = p.x * sinY + p.z * cosY;
            let y = p.y;
            
            // Rotação X
            const tempY = y;
            y = tempY * cosX - z * sinX;
            z = tempY * sinX + z * cosX;
            
            projected.push({ 
                x, y, z, 
                size: p.size, 
                opacity: Math.min(1, p.opacity)
            });
        }
        
        // Ordena por profundidade
        projected.sort((a, b) => a.z - b.z);
        
        const perspective = 500;
        
        for (const p of projected) {
            const scale = perspective / (perspective - p.z);
            const screenX = this.centerX + p.x * scale;
            const screenY = this.centerY + p.y * scale;
            
            const depthNorm = (p.z + radius * 1.5) / (radius * 3);
            const opacity = p.opacity * (0.15 + depthNorm * 0.85);
            const size = Math.max(0.5, p.size * scale * 0.65);
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            // Usa preto no modo claro, branco no modo escuro
            const isLightTheme = document.body.classList.contains('theme-light');
            const colorValue = isLightTheme ? '0,0,0' : '255,255,255';
            ctx.fillStyle = `rgba(${colorValue},${opacity.toFixed(3)})`;
            ctx.fill();
        }
    }
    
    /**
     * Loop de animação
     */
    animate() {
        if (!this.isRunning) return;
        this.update();
        this.render();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Inicia animação
     */
    start() {
        if (this.isRunning) return;
        this.init();
        this.isRunning = true;
        this.animate();
        console.log('ParticleSphere: Animação iniciada');
    }
    
    /**
     * Para animação
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.stopAudioSimulation();
        this.audioLevel = 0;
        this.targetAudioLevel = 0;
        console.log('ParticleSphere: Animação parada');
    }
}

// ===== FUNÇÕES GLOBAIS =====

let particleSphereInstance = null;

function initParticleSphere() {
    const canvas = document.getElementById('particleSphereCanvas');
    if (canvas && !particleSphereInstance) {
        particleSphereInstance = new ParticleSphere('particleSphereCanvas');
        window.particleSphere = particleSphereInstance;
        console.log('ParticleSphere: Instância global criada');
    }
}

function startParticleSphere() {
    if (!particleSphereInstance) initParticleSphere();
    if (particleSphereInstance) particleSphereInstance.start();
}

function stopParticleSphere() {
    if (particleSphereInstance) particleSphereInstance.stop();
}

function setParticleSphereState(state) {
    if (particleSphereInstance) particleSphereInstance.setState(state);
}

function setParticleSphereAudioLevel(level) {
    if (particleSphereInstance) particleSphereInstance.setAudioLevel(level);
}

/**
 * Conecta elemento de áudio HTML para análise
 */
function connectParticleSphereAudio(audioElement) {
    if (particleSphereInstance) particleSphereInstance.connectAudio(audioElement);
}

/**
 * Inicia simulação de áudio para TTS nativo
 * Chamado quando usar plugin TTS Cordova
 */
function startParticleSphereSimulation(text) {
    if (particleSphereInstance) particleSphereInstance.startAudioSimulation(text);
}

/**
 * Para simulação de áudio
 */
function stopParticleSphereSimulation() {
    if (particleSphereInstance) particleSphereInstance.stopAudioSimulation();
}

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleSphere);
} else {
    setTimeout(initParticleSphere, 50);
}
