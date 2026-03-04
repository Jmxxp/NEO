/**
 * Diff Engine v2.0 - Sistema de Diff Eficiente para Code Studio
 * Usa algoritmo LCS (Longest Common Subsequence) para calcular diferenças precisas
 * Aplica patches incrementais em vez de substituir código inteiro
 */

(function() {
    'use strict';
    
    // ==================== ALGORITMO LCS ====================
    
    /**
     * Calcula a matriz LCS (Longest Common Subsequence)
     * Complexidade: O(n*m) onde n e m são os tamanhos dos arrays
     */
    function computeLCS(oldLines, newLines) {
        var m = oldLines.length;
        var n = newLines.length;
        
        // Matriz de programação dinâmica
        var dp = new Array(m + 1);
        for (var i = 0; i <= m; i++) {
            dp[i] = new Array(n + 1).fill(0);
        }
        
        // Preencher matriz LCS
        for (var i = 1; i <= m; i++) {
            for (var j = 1; j <= n; j++) {
                if (oldLines[i - 1] === newLines[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        return dp;
    }
    
    /**
     * Backtrack para gerar as operações de diff
     * Retorna array de operações: {type: 'keep'|'add'|'remove', line, oldIndex, newIndex}
     */
    function generateDiffOps(oldLines, newLines, dp) {
        var ops = [];
        var i = oldLines.length;
        var j = newLines.length;
        
        // Backtrack da matriz LCS
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
                // Linha igual - manter
                ops.unshift({
                    type: 'keep',
                    line: oldLines[i - 1],
                    oldIndex: i - 1,
                    newIndex: j - 1
                });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                // Linha adicionada no novo
                ops.unshift({
                    type: 'add',
                    line: newLines[j - 1],
                    oldIndex: -1,
                    newIndex: j - 1
                });
                j--;
            } else if (i > 0) {
                // Linha removida do antigo
                ops.unshift({
                    type: 'remove',
                    line: oldLines[i - 1],
                    oldIndex: i - 1,
                    newIndex: -1
                });
                i--;
            }
        }
        
        return ops;
    }
    
    /**
     * Detecta linhas modificadas (quando uma remoção é seguida de adição na mesma posição lógica)
     */
    function detectModifications(ops) {
        var result = [];
        var i = 0;
        
        while (i < ops.length) {
            var op = ops[i];
            
            // Verificar se é uma modificação (remove seguido de add adjacente)
            if (op.type === 'remove' && i + 1 < ops.length && ops[i + 1].type === 'add') {
                // Calcular similaridade entre as linhas
                var similarity = calculateSimilarity(op.line, ops[i + 1].line);
                
                if (similarity > 0.4) {
                    // É uma modificação
                    result.push({
                        type: 'modify',
                        oldLine: op.line,
                        newLine: ops[i + 1].line,
                        oldIndex: op.oldIndex,
                        newIndex: ops[i + 1].newIndex,
                        similarity: similarity
                    });
                    i += 2;
                    continue;
                }
            }
            
            result.push(op);
            i++;
        }
        
        return result;
    }
    
    /**
     * Calcula similaridade entre duas strings (0 a 1)
     * Usa Levenshtein distance normalizado
     */
    function calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1;
        if (!str1 || !str2) return 0;
        
        var len1 = str1.length;
        var len2 = str2.length;
        var maxLen = Math.max(len1, len2);
        
        if (maxLen === 0) return 1;
        
        // Algoritmo de Levenshtein otimizado
        var matrix = [];
        for (var i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (var j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (var i = 1; i <= len1; i++) {
            for (var j = 1; j <= len2; j++) {
                var cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        
        var distance = matrix[len1][len2];
        return 1 - (distance / maxLen);
    }
    
    // ==================== API PRINCIPAL ====================
    
    /**
     * Calcula diff completo entre dois textos
     * @param {string} oldText - Texto original
     * @param {string} newText - Texto novo
     * @returns {Object} Resultado do diff com operações e estatísticas
     */
    window.DiffEngine = {
        
        /**
         * Calcula diferenças entre dois códigos
         */
        diff: function(oldText, newText) {
            var oldLines = (oldText || '').split('\n');
            var newLines = (newText || '').split('\n');
            
            // Calcular LCS
            var dp = computeLCS(oldLines, newLines);
            
            // Gerar operações de diff
            var ops = generateDiffOps(oldLines, newLines, dp);
            
            // Detectar modificações (transformar remove+add em modify)
            ops = detectModifications(ops);
            
            // Calcular estatísticas
            var stats = {
                added: 0,
                removed: 0,
                modified: 0,
                unchanged: 0,
                totalOps: ops.length
            };
            
            ops.forEach(function(op) {
                switch(op.type) {
                    case 'add': stats.added++; break;
                    case 'remove': stats.removed++; break;
                    case 'modify': stats.modified++; break;
                    case 'keep': stats.unchanged++; break;
                }
            });
            
            return {
                operations: ops,
                stats: stats,
                oldLines: oldLines,
                newLines: newLines
            };
        },
        
        /**
         * Gera HTML de visualização do diff
         * @param {Object} diffResult - Resultado do método diff()
         * @param {string} mode - 'unified' ou 'split'
         */
        toHTML: function(diffResult, mode) {
            mode = mode || 'unified';
            
            if (mode === 'split') {
                return this._toSplitHTML(diffResult);
            }
            return this._toUnifiedHTML(diffResult);
        },
        
        /**
         * Gera HTML no modo unified (mais compacto)
         */
        _toUnifiedHTML: function(diffResult) {
            var html = [];
            var ops = diffResult.operations;
            var lineNumOld = 0;
            var lineNumNew = 0;
            
            ops.forEach(function(op) {
                var escapedLine = escapeHTML(op.line || op.newLine || '');
                var oldNum = '', newNum = '';
                
                switch(op.type) {
                    case 'keep':
                        lineNumOld++;
                        lineNumNew++;
                        oldNum = lineNumOld;
                        newNum = lineNumNew;
                        html.push('<div class="diff-line diff-unchanged">' +
                            '<span class="diff-line-num old">' + oldNum + '</span>' +
                            '<span class="diff-line-num new">' + newNum + '</span>' +
                            '<span class="diff-marker"> </span>' +
                            '<span class="diff-content">' + escapedLine + '</span>' +
                            '</div>');
                        break;
                        
                    case 'add':
                        lineNumNew++;
                        newNum = lineNumNew;
                        html.push('<div class="diff-line diff-added">' +
                            '<span class="diff-line-num old"></span>' +
                            '<span class="diff-line-num new">' + newNum + '</span>' +
                            '<span class="diff-marker">+</span>' +
                            '<span class="diff-content">' + escapedLine + '</span>' +
                            '</div>');
                        break;
                        
                    case 'remove':
                        lineNumOld++;
                        oldNum = lineNumOld;
                        html.push('<div class="diff-line diff-removed">' +
                            '<span class="diff-line-num old">' + oldNum + '</span>' +
                            '<span class="diff-line-num new"></span>' +
                            '<span class="diff-marker">-</span>' +
                            '<span class="diff-content">' + escapedLine + '</span>' +
                            '</div>');
                        break;
                        
                    case 'modify':
                        lineNumOld++;
                        lineNumNew++;
                        // Mostrar linha antiga removida
                        html.push('<div class="diff-line diff-removed">' +
                            '<span class="diff-line-num old">' + lineNumOld + '</span>' +
                            '<span class="diff-line-num new"></span>' +
                            '<span class="diff-marker">-</span>' +
                            '<span class="diff-content">' + escapeHTML(op.oldLine) + '</span>' +
                            '</div>');
                        // Mostrar linha nova adicionada
                        html.push('<div class="diff-line diff-added">' +
                            '<span class="diff-line-num old"></span>' +
                            '<span class="diff-line-num new">' + lineNumNew + '</span>' +
                            '<span class="diff-marker">+</span>' +
                            '<span class="diff-content">' + escapeHTML(op.newLine) + '</span>' +
                            '</div>');
                        break;
                }
            });
            
            return '<div class="diff-view unified">' + html.join('') + '</div>';
        },
        
        /**
         * Gera HTML no modo split (lado a lado)
         */
        _toSplitHTML: function(diffResult) {
            var leftHtml = [];
            var rightHtml = [];
            var ops = diffResult.operations;
            var lineNumOld = 0;
            var lineNumNew = 0;
            
            ops.forEach(function(op) {
                switch(op.type) {
                    case 'keep':
                        lineNumOld++;
                        lineNumNew++;
                        leftHtml.push('<div class="diff-line diff-unchanged">' +
                            '<span class="diff-line-num">' + lineNumOld + '</span>' +
                            '<span class="diff-content">' + escapeHTML(op.line) + '</span></div>');
                        rightHtml.push('<div class="diff-line diff-unchanged">' +
                            '<span class="diff-line-num">' + lineNumNew + '</span>' +
                            '<span class="diff-content">' + escapeHTML(op.line) + '</span></div>');
                        break;
                        
                    case 'add':
                        lineNumNew++;
                        leftHtml.push('<div class="diff-line diff-empty"><span class="diff-line-num"></span><span class="diff-content"></span></div>');
                        rightHtml.push('<div class="diff-line diff-added">' +
                            '<span class="diff-line-num">' + lineNumNew + '</span>' +
                            '<span class="diff-content">' + escapeHTML(op.line) + '</span></div>');
                        break;
                        
                    case 'remove':
                        lineNumOld++;
                        leftHtml.push('<div class="diff-line diff-removed">' +
                            '<span class="diff-line-num">' + lineNumOld + '</span>' +
                            '<span class="diff-content">' + escapeHTML(op.line) + '</span></div>');
                        rightHtml.push('<div class="diff-line diff-empty"><span class="diff-line-num"></span><span class="diff-content"></span></div>');
                        break;
                        
                    case 'modify':
                        lineNumOld++;
                        lineNumNew++;
                        leftHtml.push('<div class="diff-line diff-modified-old">' +
                            '<span class="diff-line-num">' + lineNumOld + '</span>' +
                            '<span class="diff-content">' + escapeHTML(op.oldLine) + '</span></div>');
                        rightHtml.push('<div class="diff-line diff-modified-new">' +
                            '<span class="diff-line-num">' + lineNumNew + '</span>' +
                            '<span class="diff-content">' + escapeHTML(op.newLine) + '</span></div>');
                        break;
                }
            });
            
            return '<div class="diff-view split">' +
                '<div class="diff-pane left"><div class="diff-header">Original</div>' + leftHtml.join('') + '</div>' +
                '<div class="diff-pane right"><div class="diff-header">Modificado</div>' + rightHtml.join('') + '</div>' +
                '</div>';
        },
        
        /**
         * Aplica um patch ao código existente
         * Aplica apenas as mudanças necessárias, preservando o resto
         * @param {string} originalCode - Código original
         * @param {Array} operations - Operações de diff
         * @returns {string} Código com patch aplicado
         */
        applyPatch: function(originalCode, operations) {
            var result = [];
            
            operations.forEach(function(op) {
                switch(op.type) {
                    case 'keep':
                        result.push(op.line);
                        break;
                    case 'add':
                        result.push(op.line);
                        break;
                    case 'modify':
                        result.push(op.newLine);
                        break;
                    // 'remove' - não adicionamos nada
                }
            });
            
            return result.join('\n');
        },
        
        /**
         * Gera um patch em formato texto (similar ao git diff)
         */
        toPatchText: function(diffResult, filename) {
            filename = filename || 'file';
            var lines = [];
            var ops = diffResult.operations;
            
            lines.push('--- a/' + filename);
            lines.push('+++ b/' + filename);
            
            // Agrupar em hunks
            var hunks = this._groupIntoHunks(ops);
            
            hunks.forEach(function(hunk) {
                lines.push('@@ -' + hunk.oldStart + ',' + hunk.oldCount + 
                          ' +' + hunk.newStart + ',' + hunk.newCount + ' @@');
                
                hunk.ops.forEach(function(op) {
                    switch(op.type) {
                        case 'keep':
                            lines.push(' ' + op.line);
                            break;
                        case 'add':
                            lines.push('+' + op.line);
                            break;
                        case 'remove':
                            lines.push('-' + op.line);
                            break;
                        case 'modify':
                            lines.push('-' + op.oldLine);
                            lines.push('+' + op.newLine);
                            break;
                    }
                });
            });
            
            return lines.join('\n');
        },
        
        /**
         * Agrupa operações em hunks (blocos de mudança)
         */
        _groupIntoHunks: function(ops, contextLines) {
            contextLines = contextLines || 3;
            var hunks = [];
            var currentHunk = null;
            var unchangedCount = 0;
            var lineNumOld = 0;
            var lineNumNew = 0;
            
            ops.forEach(function(op, idx) {
                var isChange = op.type !== 'keep';
                
                if (op.type === 'keep' || op.type === 'modify') {
                    lineNumOld++;
                    lineNumNew++;
                } else if (op.type === 'add') {
                    lineNumNew++;
                } else if (op.type === 'remove') {
                    lineNumOld++;
                }
                
                if (isChange) {
                    if (!currentHunk) {
                        // Iniciar novo hunk com contexto anterior
                        var startIdx = Math.max(0, idx - contextLines);
                        currentHunk = {
                            oldStart: lineNumOld - (idx - startIdx),
                            newStart: lineNumNew - (idx - startIdx),
                            oldCount: 0,
                            newCount: 0,
                            ops: ops.slice(startIdx, idx)
                        };
                        // Contar linhas do contexto
                        currentHunk.ops.forEach(function(ctxOp) {
                            currentHunk.oldCount++;
                            currentHunk.newCount++;
                        });
                    }
                    
                    currentHunk.ops.push(op);
                    
                    if (op.type === 'add') {
                        currentHunk.newCount++;
                    } else if (op.type === 'remove') {
                        currentHunk.oldCount++;
                    } else if (op.type === 'modify') {
                        currentHunk.oldCount++;
                        currentHunk.newCount++;
                    }
                    
                    unchangedCount = 0;
                } else if (currentHunk) {
                    unchangedCount++;
                    
                    if (unchangedCount <= contextLines * 2) {
                        currentHunk.ops.push(op);
                        currentHunk.oldCount++;
                        currentHunk.newCount++;
                    }
                    
                    if (unchangedCount > contextLines * 2) {
                        // Finalizar hunk atual
                        hunks.push(currentHunk);
                        currentHunk = null;
                        unchangedCount = 0;
                    }
                }
            });
            
            if (currentHunk) {
                hunks.push(currentHunk);
            }
            
            return hunks;
        },
        
        /**
         * Gera resumo das mudanças para UI
         */
        getSummary: function(diffResult) {
            var stats = diffResult.stats;
            var parts = [];
            
            if (stats.added > 0) {
                parts.push('+' + stats.added + ' linha' + (stats.added > 1 ? 's' : ''));
            }
            if (stats.removed > 0) {
                parts.push('-' + stats.removed + ' linha' + (stats.removed > 1 ? 's' : ''));
            }
            if (stats.modified > 0) {
                parts.push('~' + stats.modified + ' modificada' + (stats.modified > 1 ? 's' : ''));
            }
            
            return parts.join(', ') || 'Sem alterações';
        },
        
        /**
         * Verifica se há mudanças significativas
         */
        hasChanges: function(diffResult) {
            var stats = diffResult.stats;
            return stats.added > 0 || stats.removed > 0 || stats.modified > 0;
        },
        
        /**
         * Obtém chunks de mudança (para aplicação seletiva)
         */
        getChangeChunks: function(diffResult) {
            var chunks = [];
            var currentChunk = null;
            var ops = diffResult.operations;
            
            ops.forEach(function(op, idx) {
                var isChange = op.type !== 'keep';
                
                if (isChange) {
                    if (!currentChunk) {
                        currentChunk = {
                            startIndex: idx,
                            operations: []
                        };
                    }
                    currentChunk.operations.push(op);
                } else if (currentChunk) {
                    currentChunk.endIndex = idx - 1;
                    chunks.push(currentChunk);
                    currentChunk = null;
                }
            });
            
            if (currentChunk) {
                currentChunk.endIndex = ops.length - 1;
                chunks.push(currentChunk);
            }
            
            return chunks;
        }
    };
    
    // Helper para escape HTML
    function escapeHTML(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    console.log('[DiffEngine] v2.0 carregado - Sistema de diff eficiente com LCS');
    
})();
