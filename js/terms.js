// ===== TERMOS DE USO - VERSÃO SIMPLES =====
// Gera PDF e compartilha via WhatsApp/Email/etc

(function() {
    'use strict';
    
    const TERMS_KEY = 'neo_terms_accepted_v1';
    let canvas, ctx, isDrawing = false, lastX = 0, lastY = 0, hasSignature = false;
    
    // Verificar se já aceitou
    function checkTerms() {
        if (localStorage.getItem(TERMS_KEY)) {
            hideOverlay();
            return true;
        }
        showOverlay();
        return false;
    }
    
    function showOverlay() {
        const el = document.getElementById('termsOverlay');
        if (el) el.style.display = 'flex';
    }
    
    function hideOverlay() {
        const el = document.getElementById('termsOverlay');
        if (el) el.style.display = 'none';
    }
    
    // Canvas de assinatura
    function initCanvas() {
        canvas = document.getElementById('signatureCanvas');
        if (!canvas) return;
        
        ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = 120;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
        
        canvas.ontouchstart = canvas.onmousedown = function(e) {
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;
        };
        
        canvas.ontouchmove = canvas.onmousemove = function(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x;
            lastY = pos.y;
            hasSignature = true;
        };
        
        canvas.ontouchend = canvas.onmouseup = function() {
            isDrawing = false;
            updateBtn();
        };
    }
    
    function clearCanvas() {
        if (!ctx) return;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
        updateBtn();
    }
    
    function updateBtn() {
        const btn = document.getElementById('acceptTermsBtn');
        const name = document.getElementById('termsUserName');
        if (btn && name) {
            const enabled = name.value.trim().length >= 3 && hasSignature;
            btn.disabled = !enabled;
            if (enabled) {
                btn.style.background = '#4CAF50';
                btn.style.cursor = 'pointer';
            } else {
                btn.style.background = '#2d5a30';
                btn.style.cursor = 'not-allowed';
            }
        }
    }
    
    // Gerar PDF e compartilhar
    async function generateAndShare() {
        const userName = document.getElementById('termsUserName').value.trim();
        const date = new Date().toLocaleString('pt-BR');
        
        try {
            // Verificar se jsPDF está disponível
            if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
                alert('Erro: jsPDF não carregado');
                return;
            }
            
            const { jsPDF } = window.jspdf || { jsPDF: window.jsPDF };
            const doc = new jsPDF();
            
            // Título
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('TERMOS DE USO - NEO', 105, 15, { align: 'center' });
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            let y = 25;
            const margin = 15;
            const pageWidth = 180;
            
            // Função para adicionar texto com quebra de linha
            function addText(text, isBold = false) {
                if (isBold) doc.setFont('helvetica', 'bold');
                else doc.setFont('helvetica', 'normal');
                
                const lines = doc.splitTextToSize(text, pageWidth);
                lines.forEach(line => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, margin, y);
                    y += 4.5;
                });
                y += 2;
            }
            
            // TERMOS COMPLETOS
            addText('1. DEFINIÇÃO DO SERVIÇO', true);
            addText('A NEO é um software privado de apoio intelectual executado localmente no dispositivo do usuário, disponibilizado de forma restrita e condicional, mediante aceite expresso destes Termos.');
            addText('A NEO não é um serviço público, não opera como plataforma online centralizada e não mantém servidores próprios de armazenamento de dados de usuários.');
            
            addText('2. FUNCIONAMENTO TÉCNICO E PROCESSAMENTO DE DADOS', true);
            addText('O usuário declara ciência de que:');
            addText('• Todas as informações, históricos, preferências, IDs e configurações da NEO são armazenadas exclusivamente no dispositivo do usuário, por meio de armazenamento local.');
            addText('• O operador da NEO não possui acesso técnico, lógico ou administrativo aos dados armazenados localmente no dispositivo.');
            addText('• A NEO não coleta, não monitora, não registra e não armazena informações pessoais, conversas ou conteúdos gerados pelo usuário.');
            
            addText('3. COMUNICAÇÃO EXTERNA', true);
            addText('O usuário declara estar ciente de que:');
            addText('• A única comunicação externa realizada pela NEO consiste no envio direto de prompts e parâmetros técnicos a provedores externos de inteligência artificial, conforme configuração do próprio usuário.');
            addText('• O operador da NEO não intercepta, não recebe e não armazena tais comunicações.');
            addText('• O tratamento dessas informações é de responsabilidade exclusiva do provedor externo da API, conforme seus próprios termos de uso e políticas de privacidade.');
            
            addText('4. RESPONSABILIDADE SOBRE DADOS E CONTEÚDO', true);
            addText('O usuário assume integral responsabilidade por:');
            addText('• Todo conteúdo inserido na NEO');
            addText('• Informações fornecidas voluntariamente');
            addText('• Prompts enviados a serviços externos');
            addText('• Uso, interpretação, aplicação ou compartilhamento das respostas geradas');
            addText('O operador da NEO não tem conhecimento, acesso ou controle sobre o conteúdo processado.');
            
            addText('5. AUSÊNCIA DE ACONSELHAMENTO PROFISSIONAL', true);
            addText('A NEO pode fornecer orientações gerais, análises, sugestões, simulações e opiniões, inclusive em temas jurídicos, médicos, psicológicos, financeiros, contábeis ou técnicos, exclusivamente como apoio intelectual e informacional.');
            addText('O usuário reconhece que:');
            addText('• As orientações fornecidas não possuem caráter profissional, técnico ou oficial');
            addText('• Não substituem a consulta a profissionais habilitados');
            addText('• Não constituem laudo, parecer, diagnóstico, prescrição ou recomendação obrigatória');
            addText('• São geradas automaticamente, com base nas solicitações do próprio usuário');
            addText('Toda decisão tomada com base nas informações fornecidas pela NEO é de responsabilidade exclusiva do usuário, que assume integralmente os riscos decorrentes.');
            
            addText('6. CONTEÚDO NÃO MODERADO', true);
            addText('O usuário reconhece que a NEO não aplica filtros automáticos de moderação, censura ou julgamento de conteúdo, operando conforme comandos do próprio usuário.');
            addText('O usuário declara:');
            addText('• Ser maior de 18 anos');
            addText('• Possuir plena capacidade civil');
            addText('• Assumir integralmente os riscos decorrentes do uso');
            
            addText('7. LIMITAÇÃO TOTAL DE RESPONSABILIDADE', true);
            addText('O operador da NEO não será responsável, em nenhuma hipótese, por:');
            addText('• Conteúdos gerados');
            addText('• Decisões tomadas com base nas respostas');
            addText('• Danos diretos ou indiretos');
            addText('• Consequências legais, financeiras, pessoais ou profissionais');
            addText('• Uso indevido, interpretativo ou fora de contexto');
            
            addText('8. AUSÊNCIA DE GARANTIAS', true);
            addText('A NEO é fornecida "no estado em que se encontra" (AS IS), sem garantias de funcionamento contínuo, disponibilidade, precisão, adequação ou performance.');
            
            addText('9. SUSPENSÃO E ENCERRAMENTO', true);
            addText('O acesso à NEO é revogável, podendo ser suspenso ou encerrado a qualquer momento, sem aviso prévio, a critério exclusivo do operador.');
            
            addText('10. PRIVACIDADE', true);
            addText('O operador declara expressamente que:');
            addText('• Não coleta dados pessoais');
            addText('• Não mantém base de dados de usuários');
            addText('• Não realiza tratamento de dados pessoais');
            addText('• Não acessa conteúdos armazenados localmente');
            addText('O usuário reconhece que a responsabilidade pela guarda e segurança do dispositivo é exclusivamente sua.');
            
            addText('11. ACEITE EXPRESSO E ASSINATURA', true);
            addText('O uso da NEO está condicionado ao aceite expresso, consciente e inequívoco destes Termos, formalizado por assinatura manuscrita digital no próprio aplicativo.');
            
            // Nova página para assinatura
            doc.addPage();
            y = 30;
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('DECLARAÇÃO DE ACEITE', 105, 20, { align: 'center' });
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Eu, ${userName}, declaro que li e aceito integralmente`, margin, y);
            y += 7;
            doc.text('os Termos de Uso do aplicativo NEO acima descritos.', margin, y);
            y += 20;
            doc.text(`Data: ${date}`, margin, y);
            
            // Assinatura
            y += 20;
            doc.text('Assinatura:', margin, y);
            y += 5;
            
            if (canvas) {
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', margin, y, 80, 30);
            }
            
            // Gerar base64 do PDF
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const fileName = 'Termos_NEO_' + userName.replace(/\s/g, '_') + '.pdf';
            
            // SALVAR PDF ASSINADO NA MEMÓRIA DO APP
            localStorage.setItem('neo_signed_terms_pdf', pdfBase64);
            localStorage.setItem('neo_signed_terms_filename', fileName);
            console.log('✅ PDF assinado salvo na memória do app');
            
            // Abrir app de email com PDF anexado
            if (!window.IS_WEB_VERSION && window.cordova && cordova.plugins && cordova.plugins.email) {
                cordova.plugins.email.open({
                    app: 'gmail',
                    to: ['jmxxp7@gmail.com'],
                    subject: 'Aceite de Termos de Uso - NEO - ' + userName,
                    body: 'Segue em anexo o documento de aceite dos Termos de Uso do aplicativo NEO.\n\nNome: ' + userName + '\nData: ' + date + '\n\nAssinado digitalmente.',
                    attachments: ['base64:' + fileName + '//' + pdfBase64],
                    isHtml: false
                }, function() {
                    console.log('✅ Email aberto!');
                    finishAcceptance();
                });
            } else {
                // Fallback: mailto simples + salvar direto
                window.location.href = 'mailto:jmxxp7@gmail.com?subject=' + encodeURIComponent('Aceite de Termos - NEO - ' + userName) + '&body=' + encodeURIComponent('Nome: ' + userName + '\nData: ' + date);
                finishAcceptance();
            }
            
        } catch (err) {
            console.error('Erro:', err);
            alert('Erro ao gerar PDF: ' + err.message);
        }
    }
    
    function finishAcceptance() {
        // Salvar nome do usuário para uso posterior
        const userName = document.getElementById('termsUserName').value.trim();
        localStorage.setItem('neo_terms_user_name', userName);
        localStorage.setItem(TERMS_KEY, Date.now());
        hideOverlay();
    }
    
    // Inicialização
    function init() {
        try {
            // Data
            const dateEl = document.getElementById('termsDate');
            if (dateEl) dateEl.textContent = new Date().toLocaleDateString('pt-BR');
            
            if (checkTerms()) return;
            
            setTimeout(initCanvas, 100);
            
            const nameInput = document.getElementById('termsUserName');
            if (nameInput) nameInput.oninput = updateBtn;
            
            const clearBtn = document.getElementById('clearSignatureBtn');
            if (clearBtn) clearBtn.onclick = clearCanvas;
            
            const acceptBtn = document.getElementById('acceptTermsBtn');
            if (acceptBtn) {
                acceptBtn.onclick = function() {
                    if (!this.disabled) {
                        this.disabled = true;
                        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando PDF...';
                        generateAndShare();
                    }
                };
            }
        } catch (e) {
            console.error('Terms error:', e);
            hideOverlay();
        }
    }
    
    // Executar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Debug: resetar termos
    window.resetTerms = function() {
        localStorage.removeItem(TERMS_KEY);
        location.reload();
    };
    
    // Função para baixar cópia dos termos assinados (usa o PDF original salvo)
    window.downloadSignedTerms = function() {
        const termsData = localStorage.getItem(TERMS_KEY);
        if (!termsData) {
            alert('Você ainda não assinou os termos.');
            return;
        }
        
        // Verificar se temos o PDF original salvo
        const savedPdfBase64 = localStorage.getItem('neo_signed_terms_pdf');
        const savedFileName = localStorage.getItem('neo_signed_terms_filename') || 'Termos_NEO_Assinados.pdf';
        
        if (!savedPdfBase64) {
            alert('O documento assinado não foi encontrado na memória do app. Isso pode acontecer se você assinou em uma versão anterior.');
            return;
        }
        
        try {
            // CORDOVA - Usar plugin de compartilhamento ou arquivo
            if (!window.IS_WEB_VERSION && window.cordova) {
                // Tentar usar o plugin de email para compartilhar o PDF
                if (cordova.plugins && cordova.plugins.email) {
                    cordova.plugins.email.open({
                        subject: 'Termos de Uso NEO - Cópia Assinada',
                        body: 'Segue anexo sua cópia dos Termos de Uso do NEO.',
                        attachments: ['base64:' + savedFileName + '//' + savedPdfBase64],
                        isHtml: false
                    }, function() {
                        console.log('✅ Email com PDF aberto');
                    });
                    return;
                }
                
                // Alternativa: Salvar no dispositivo usando cordova-plugin-file
                if (window.resolveLocalFileSystemURL) {
                    const folderPath = cordova.file.externalRootDirectory || cordova.file.dataDirectory;
                    
                    window.resolveLocalFileSystemURL(folderPath, function(dirEntry) {
                        dirEntry.getFile(savedFileName, { create: true, exclusive: false }, function(fileEntry) {
                            fileEntry.createWriter(function(fileWriter) {
                                // Converter base64 para blob
                                const byteCharacters = atob(savedPdfBase64);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: 'application/pdf' });
                                
                                fileWriter.onwriteend = function() {
                                    alert('✅ PDF salvo em: ' + fileEntry.nativeURL);
                                    // Tentar abrir o arquivo
                                    if (cordova.plugins && cordova.plugins.fileOpener2) {
                                        cordova.plugins.fileOpener2.open(fileEntry.nativeURL, 'application/pdf');
                                    }
                                };
                                
                                fileWriter.onerror = function(e) {
                                    console.error('Erro ao escrever arquivo:', e);
                                    alert('Erro ao salvar o arquivo.');
                                };
                                
                                fileWriter.write(blob);
                            });
                        }, function(err) {
                            console.error('Erro ao criar arquivo:', err);
                            // Fallback: abrir em nova aba
                            openPdfInNewTab(savedPdfBase64, savedFileName);
                        });
                    }, function(err) {
                        console.error('Erro ao acessar diretório:', err);
                        // Fallback: abrir em nova aba
                        openPdfInNewTab(savedPdfBase64, savedFileName);
                    });
                    return;
                }
                
                // Último fallback para Cordova: abrir em nova aba
                openPdfInNewTab(savedPdfBase64, savedFileName);
                
            } else {
                // NAVEGADOR WEB - Método tradicional de download
                const byteCharacters = atob(savedPdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = savedFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('✅ PDF assinado baixado com sucesso');
            }
        } catch (err) {
            console.error('Erro ao baixar PDF:', err);
            alert('Erro ao baixar o documento: ' + err.message);
        }
    };
    
    // Função auxiliar para abrir PDF em nova aba (fallback)
    function openPdfInNewTab(base64Data, fileName) {
        try {
            const pdfDataUri = 'data:application/pdf;base64,' + base64Data;
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                    <head><title>${fileName}</title></head>
                    <body style="margin:0; padding:0;">
                        <embed src="${pdfDataUri}" type="application/pdf" width="100%" height="100%" />
                    </body>
                    </html>
                `);
            } else {
                // Se não conseguir abrir nova janela, fazer download direto
                const link = document.createElement('a');
                link.href = pdfDataUri;
                link.download = fileName;
                link.click();
            }
        } catch (e) {
            console.error('Erro no fallback:', e);
            alert('Não foi possível abrir o documento.');
        }
    }
})();
