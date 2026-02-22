/**
 * NEO Web Version - Browser Compatibility Layer
 * This file stubs out Cordova-dependent features and provides browser alternatives.
 * Must be loaded BEFORE all other scripts.
 */

(function() {
    'use strict';

    // ====== Global flags ======
    window.IS_WEB_VERSION = true;
    window.isCordovaReady = false; // stays false - no Cordova

    // ====== Stub Cordova plugins that might be referenced ======
    
    // Background mode (no-op)
    if (!window.cordova) window.cordova = {};
    if (!window.cordova.plugins) window.cordova.plugins = {};
    window.cordova.plugins.backgroundMode = {
        enable: function() {},
        disable: function() {},
        isActive: function() { return false; },
        configure: function() {},
        disableBatteryOptimizations: function() {},
        disableWebViewOptimizations: function() {},
        on: function() {},
        setDefaults: function() {},
        overrideBackButton: function() {},
        moveToBackground: function() {},
        moveToForeground: function() {},
        isEnabled: function() { return false; },
        setEnabled: function() {}
    };

    // Fingerprint/biometric (no-op)
    window.Fingerprint = {
        isAvailable: function(success, error) { 
            if (error) error({ message: 'Not available in browser' }); 
        },
        show: function(opts, success, error) { 
            if (error) error({ message: 'Not available in browser' }); 
        }
    };

    // Theme detection (use matchMedia)
    window.cordova.plugins.ThemeDetection = {
        isDarkModeEnabled: function(success, error) {
            var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (success) success({ value: isDark });
        }
    };

    // Android permissions (auto-grant in browser)
    window.cordova.plugins.permissions = {
        RECORD_AUDIO: 'RECORD_AUDIO',
        CAMERA: 'CAMERA',
        checkPermission: function(perm, success) { 
            if (success) success({ hasPermission: true }); 
        },
        requestPermission: function(perm, success) { 
            if (success) success({ hasPermission: true }); 
        }
    };

    // TTS plugin stub REMOVED - let voice-call.js use Web Speech API directly
    // The callback-based stub was breaking await/Promise patterns in voice-call.js,
    // causing particle sphere animation to stop immediately.
    // All TTS references are guarded with typeof TTS !== 'undefined' and have
    // proper Web Speech API fallbacks.

    // File system stubs
    if (!window.cordova.file) {
        window.cordova.file = {
            externalRootDirectory: '',
            dataDirectory: '',
            applicationDirectory: ''
        };
    }

    // resolveLocalFileSystemURL stub
    if (!window.resolveLocalFileSystemURL) {
        window.resolveLocalFileSystemURL = function(path, success, error) {
            if (error) error({ code: 1, message: 'Not available in browser' });
        };
    }

    // File opener stub (use browser download)
    if (!window.cordova.plugins.fileOpener2) {
        window.cordova.plugins.fileOpener2 = {
            open: function(path, mime, opts) {
                console.log('[WEB] fileOpener2 not available, path:', path);
            }
        };
    }

    // InAppBrowser stub (use window.open)
    if (!window.cordova.InAppBrowser) {
        window.cordova.InAppBrowser = {
            open: function(url, target) {
                window.open(url, target || '_blank');
            }
        };
    }

    // Email plugin stub (use mailto:)
    if (!window.cordova.plugins.email) {
        window.cordova.plugins.email = {
            open: function(opts, callback) {
                var mailto = 'mailto:' + (opts.to || '');
                if (opts.subject) mailto += '?subject=' + encodeURIComponent(opts.subject);
                if (opts.body) mailto += (mailto.includes('?') ? '&' : '?') + 'body=' + encodeURIComponent(opts.body);
                window.open(mailto, '_self');
                if (typeof callback === 'function') callback();
            },
            isAvailable: function(cb) { if (cb) cb(true); }
        };
    }

    // Social sharing stub (use Web Share API)
    if (!window.plugins) window.plugins = {};
    if (!window.plugins.socialsharing) {
        window.plugins.socialsharing = {
            shareWithOptions: function(opts, success, error) {
                if (navigator.share) {
                    navigator.share({
                        title: opts.subject || '',
                        text: opts.message || '',
                        url: opts.url || ''
                    }).then(function() {
                        if (success) success();
                    }).catch(function(err) {
                        if (error) error(err);
                    });
                } else {
                    // Fallback to clipboard
                    var text = opts.message || '';
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(text);
                    }
                    if (success) success();
                }
            }
        };
    }

    // Speech recognition plugin stub
    if (!window.plugins.speechRecognition) {
        window.plugins.speechRecognition = {
            isRecognitionAvailable: function(success) {
                var available = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
                if (success) success(available);
            },
            hasPermission: function(success) {
                if (success) success(true);
            },
            requestPermission: function(success) {
                if (success) success();
            }
        };
    }

    // AndroidFullScreen stub
    window.AndroidFullScreen = {
        immersiveMode: function(success) { if (success) success(); },
        showSystemUI: function(success) { if (success) success(); }
    };

    // Shortcuts stub
    if (!window.plugins.Shortcuts) {
        window.plugins.Shortcuts = {
            setDynamic: function() {},
            supportsPinned: function(cb) { if (cb) cb(false); },
            addPinned: function() {}
        };
    }

    // BuildApk stub
    window.BuildApk = null;

    // Navigator connection stub
    if (!navigator.connection) {
        Object.defineProperty(navigator, 'connection', {
            get: function() {
                return {
                    type: navigator.onLine ? 'wifi' : 'none'
                };
            }
        });
    }

    // ====== Browser camera handler ======
    // Replace native camera with file input
    window.handleAttachCamera = function() {
        var cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.click();
        }
    };

    // ====== Converter stubs ======
    window.openConverter = function() {
        if (window.showToast) {
            window.showToast('Conversor não disponível na versão web', 'warning');
        }
    };

    // ====== Local LLM stubs ======
    // openLocalLlmModal and localLlmState now provided by ia-config.js

    window.generateLocalResponse = function() {
        return Promise.reject(new Error('Local LLM not available in web version'));
    };

    window.isLocalMode = function() { return false; };
    window.setOnlineMode = function() {};

    // LlamaNativeAsync stub
    window.LlamaNativeAsync = null;

    // ====== Vibration - allow in browsers that support it ======
    // Override the isCordovaReady check for vibration
    window.vibrate = function(ms) {
        try {
            if (navigator.vibrate) {
                navigator.vibrate(ms || 10);
            }
        } catch(e) {}
    };

    // ====== PWA iOS safe area handling ======
    document.addEventListener('DOMContentLoaded', function() {
        // Apply safe area padding for iOS notch
        var style = document.createElement('style');
        style.textContent = 
            'body { ' +
            '  padding-top: env(safe-area-inset-top); ' +
            '  padding-bottom: env(safe-area-inset-bottom); ' +
            '  padding-left: env(safe-area-inset-left); ' +
            '  padding-right: env(safe-area-inset-right); ' +
            '}' +
            '.input-bar { ' +
            '  padding-bottom: env(safe-area-inset-bottom); ' +
            '}' +
            '.settings-header { ' +
            '  padding-top: env(safe-area-inset-top); ' +
            '}' +
            '.notes-header { ' +
            '  padding-top: env(safe-area-inset-top); ' +
            '}' +
            // Standalone mode (added to home screen)
            '@media (display-mode: standalone) { ' +
            '  body { -webkit-user-select: none; user-select: none; } ' +
            '}' +
            // Lock to portrait orientation
            '@media screen and (orientation: landscape) { ' +
            '  html { transform: rotate(-90deg); transform-origin: left top; ' +
            '    width: 100vh; height: 100vw; overflow-x: hidden; position: absolute; top: 100%; left: 0; } ' +
            '}';
        document.head.appendChild(style);

        // ====== Virtual Keyboard Resize Handler ======
        // Only repositions input bar - does NOT move the top bar or body
        if (window.visualViewport) {
            var inputBar = null;
            var appEl = null;
            var topBar = null;
            
            function handleViewportResize() {
                if (!inputBar) inputBar = document.querySelector('.input-bar');
                if (!appEl) appEl = document.querySelector('.app');
                if (!topBar) topBar = document.querySelector('.top-bar');
                if (!inputBar) return;

                var viewport = window.visualViewport;
                var keyboardHeight = window.innerHeight - viewport.height;
                
                if (keyboardHeight > 100) {
                    // Keyboard is open - only move input bar up
                    inputBar.style.bottom = keyboardHeight + 'px';
                    if (appEl) appEl.style.paddingBottom = (keyboardHeight + 80) + 'px';
                    
                    // Keep top bar fixed at its position (prevent scroll pushing it off)
                    if (topBar) topBar.style.transform = 'translateY(' + viewport.offsetTop + 'px)';
                    
                    // Scroll chat area to bottom
                    setTimeout(function() {
                        var msgs = document.getElementById('messages');
                        if (msgs) msgs.scrollTop = msgs.scrollHeight;
                    }, 150);
                } else {
                    // Keyboard is closed - reset everything
                    inputBar.style.bottom = '';
                    if (appEl) appEl.style.paddingBottom = '';
                    if (topBar) topBar.style.transform = '';
                }
            }

            window.visualViewport.addEventListener('resize', handleViewportResize);
            window.visualViewport.addEventListener('scroll', handleViewportResize);
        }

        // Lock screen orientation if API available
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(function() {
                console.log('[WEB] Orientation lock not supported');
            });
        }

        // Simulate deviceready event for initialization
        setTimeout(function() {
            console.log('[WEB] Simulating deviceready for web version');
            var event = new Event('deviceready');
            document.dispatchEvent(event);
        }, 100);
    });

    console.log('[WEB] Browser compatibility layer loaded');
})();
