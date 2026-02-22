// ===== SISTEMA DE GRÁFICOS PARA O CHAT =====
// Permite que a IA gere gráficos de linha, barra, pizza, etc.

// Cores padrão para gráficos
const CHART_COLORS = {
    primary: ['#a78bfa', '#818cf8', '#c4b5fd', '#6366f1', '#8b5cf6'],
    vibrant: [
        '#fbbf24', // amarelo
        '#ef4444', // vermelho
        '#22c55e', // verde
        '#3b82f6', // azul
        '#a78bfa', // roxo
        '#f97316'  // laranja
    ],
    gradient: [
        'rgba(167, 139, 250, 0.8)',
        'rgba(129, 140, 248, 0.8)',
        'rgba(244, 114, 182, 0.8)',
        'rgba(251, 113, 133, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(52, 211, 153, 0.8)'
    ],
    borders: [
        'rgba(167, 139, 250, 1)',
        'rgba(129, 140, 248, 1)',
        'rgba(244, 114, 182, 1)',
        'rgba(251, 113, 133, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(52, 211, 153, 1)'
    ]
};

// Armazena instâncias de gráficos para destruir ao atualizar
const chartInstances = {};

/**
 * Processa o texto e extrai blocos de gráficos
 * Formato: ```chart:tipo ou [CHART:tipo]...[/CHART]
 */
function extractChartBlocks(text) {
    if (!text) return { cleanedText: text, charts: [] };

    const charts = [];
    let cleaned = text;

    // Formato 1: ```chart:tipo ... ```
    const codeBlockRegex = /```chart(?::(\w+))?\s*\n([\s\S]*?)```/gi;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        const chartType = match[1] || 'line';
        const chartData = match[2].trim();
        const chartId = 'chart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

        charts.push({
            id: chartId,
            type: chartType.toLowerCase(),
            rawData: chartData
        });

        // Usar marcador único que não será alterado pelo markdown
        cleaned = cleaned.replace(match[0], `\n\n%%%CHART_${chartId}%%%\n\n`);
    }

    // Formato 2: [CHART:tipo]...[/CHART]
    const tagRegex = /\[CHART(?::(\w+))?\]([\s\S]*?)\[\/CHART\]/gi;

    while ((match = tagRegex.exec(text)) !== null) {
        const chartType = match[1] || 'line';
        const chartData = match[2].trim();
        const chartId = 'chart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

        charts.push({
            id: chartId,
            type: chartType.toLowerCase(),
            rawData: chartData
        });

        cleaned = cleaned.replace(match[0], `\n\n%%%CHART_${chartId}%%%\n\n`);
    }

    return { cleanedText: cleaned, charts };
}

/**
 * Parseia os dados do gráfico em formato legível
 * Suporta vários formatos: JSON, CSV-like, ou formato simplificado
 */
function parseChartData(rawData, chartType) {
    // Tentar JSON primeiro
    try {
        const jsonData = JSON.parse(rawData);
        return normalizeChartData(jsonData, chartType);
    } catch (e) {
        // Não é JSON, tentar outros formatos
    }

    // Formato simplificado linha por linha
    // titulo: Meu Gráfico
    // labels: Jan, Fev, Mar, Abr
    // dados: 10, 20, 15, 30
    // dados2: 5, 15, 10, 25
    // cores: #a78bfa, #f472b6

    const lines = rawData.split('\n').filter(l => l.trim());
    const parsed = {
        title: '',
        labels: [],
        datasets: [],
        colors: null
    };

    let currentDatasetIndex = 0;
    let pendingSeriesName = null; // Nome da série definido antes dos dados

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();

        if (key === 'titulo' || key === 'title') {
            parsed.title = value;
        } else if (key === 'labels' || key === 'rotulos' || key === 'categorias') {
            parsed.labels = value.split(',').map(v => v.trim());
        } else if (key === 'serie' || key === 'nome' || key === 'series' || key === 'name') {
            // Nome para o PRÓXIMO dataset (antes dos dados)
            pendingSeriesName = value;
        } else if (key.startsWith('dados') || key.startsWith('data') || key.startsWith('valores')) {
            const numbers = value.split(',').map(v => parseFloat(v.trim())).filter(n => !isNaN(n));

            // Usar nome pendente ou gerar genérico
            let finalLabel;
            if (pendingSeriesName) {
                finalLabel = pendingSeriesName;
                pendingSeriesName = null; // Consumir o nome
            } else {
                const labelMatch = key.match(/\d+/);
                finalLabel = labelMatch ? `Série ${labelMatch[0]}` : `Série ${currentDatasetIndex + 1}`;

                // Verificar se há um nome após os dados (formato: dados1 Vendas: 10, 20, 30)
                const nameMatch = key.match(/\d*\s*(.+)/);
                if (nameMatch && nameMatch[1].trim()) {
                    finalLabel = nameMatch[1].trim();
                }
            }

            parsed.datasets.push({
                label: finalLabel,
                data: numbers
            });
            currentDatasetIndex++;
        } else if (key === 'cores' || key === 'colors') {
            parsed.colors = value.split(',').map(v => v.trim());
        }
    }

    // Se não tem datasets mas tem dados diretos, criar um
    if (parsed.datasets.length === 0) {
        // Tentar extrair números diretamente
        const allNumbers = rawData.match(/[\d.]+/g);
        if (allNumbers) {
            parsed.datasets.push({
                label: parsed.title || 'Dados',
                data: allNumbers.map(n => parseFloat(n)).filter(n => !isNaN(n))
            });
        }
    }

    // Se só tem 1 dataset com label genérico, usar o título como label
    if (parsed.datasets.length === 1 && parsed.title) {
        const genericLabels = ['Dados', 'Série 1', 'Data', 'Series 1'];
        if (genericLabels.includes(parsed.datasets[0].label)) {
            // Extrair nome do título sem a unidade entre parênteses
            const titleWithoutUnit = parsed.title.replace(/\s*\([^)]+\)\s*$/, '').trim();
            if (titleWithoutUnit) {
                parsed.datasets[0].label = titleWithoutUnit;
            }
        }
    }

    // Se não tem labels, criar genéricos
    if (parsed.labels.length === 0 && parsed.datasets.length > 0) {
        const maxLen = Math.max(...parsed.datasets.map(d => d.data.length));
        parsed.labels = Array.from({ length: maxLen }, (_, i) => `Item ${i + 1}`);
    }

    return normalizeChartData(parsed, chartType);
}

/**
 * Normaliza dados para formato Chart.js
 */
function normalizeChartData(data, chartType) {
    const isPie = chartType === 'pie' || chartType === 'pizza' || chartType === 'doughnut' || chartType === 'rosca';

    // Só mostra legenda se tiver 2+ datasets (séries) ou for pizza/rosca
    const hasMultipleDatasets = data.datasets && data.datasets.length > 1;
    const showLegend = isPie || hasMultipleDatasets;

    const config = {
        type: mapChartType(chartType),
        data: {
            labels: data.labels || [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: showLegend,
                    position: 'bottom',
                    align: 'start',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: { family: 'Questrial', size: 11 },
                        padding: 8,
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: false
                    }
                },
                title: {
                    display: !!data.title,
                    text: data.title || '',
                    color: 'rgba(255, 255, 255, 0.95)',
                    font: { family: 'Questrial', size: 14, weight: 'bold' },
                    padding: { bottom: 15 }
                }
            }
        }
    };

    // Configurar datasets
    if (data.datasets && data.datasets.length > 0) {
        data.datasets.forEach((ds, index) => {
            const colors = data.colors || CHART_COLORS.vibrant;
            const borderColors = data.borderColors || CHART_COLORS.vibrant;

            const dataset = {
                label: ds.label || `Série ${index + 1}`,
                data: ds.data || []
            };

            if (isPie) {
                dataset.backgroundColor = colors.slice(0, ds.data.length);
                dataset.borderColor = colors.slice(0, ds.data.length);
                dataset.borderWidth = 2;
            } else {
                dataset.backgroundColor = colors[index % colors.length];
                dataset.borderColor = borderColors[index % borderColors.length];
                dataset.borderWidth = 2;

                if (chartType === 'line' || chartType === 'linha') {
                    dataset.tension = 0.3;
                    dataset.fill = false;
                    dataset.pointBackgroundColor = borderColors[index % borderColors.length];
                    dataset.pointBorderColor = '#fff';
                    dataset.pointBorderWidth = 1;
                    dataset.pointRadius = 4;
                    dataset.borderWidth = 3;
                }
            }

            config.data.datasets.push(dataset);
        });
    }

    // Configurações específicas por tipo
    if (!isPie) {
        // Calcular valor máximo para dar espaço no topo (10-15% extra)
        let maxValue = 0;
        if (config.data.datasets) {
            config.data.datasets.forEach(ds => {
                if (ds.data) {
                    const dsMax = Math.max(...ds.data.filter(v => typeof v === 'number'));
                    if (dsMax > maxValue) maxValue = dsMax;
                }
            });
        }
        const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : undefined;

        config.options.scales = {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 11 }
                }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 11 },
                    padding: 8
                },
                beginAtZero: true,
                suggestedMax: suggestedMax
            }
        };
    }

    return config;
}

/**
 * Mapeia tipos de gráfico em português para Chart.js
 */
function mapChartType(type) {
    const typeMap = {
        'linha': 'line',
        'line': 'line',
        'barra': 'bar',
        'barras': 'bar',
        'bar': 'bar',
        'pizza': 'pie',
        'pie': 'pie',
        'rosca': 'doughnut',
        'doughnut': 'doughnut',
        'area': 'line',
        'radar': 'radar',
        'polar': 'polarArea',
        'volume': 'bar'
    };
    return typeMap[type.toLowerCase()] || 'bar';
}

/**
 * Renderiza um gráfico no placeholder
 */
function renderChart(chartId, chartType, rawData) {
    const placeholder = document.querySelector(`[data-chart-id="${chartId}"]`);
    if (!placeholder) {
        console.warn('Placeholder não encontrado para:', chartId);
        return;
    }

    // Destruir instância anterior se existir
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }

    // Criar container do gráfico
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = `
        <canvas id="${chartId}"></canvas>
        <div class="chart-actions">
            <button type="button" class="chart-action-btn" onclick="downloadChart('${chartId}')" title="Baixar imagem">
                <i class="fa-solid fa-download"></i>
            </button>
            <button type="button" class="chart-action-btn" onclick="toggleChartFullscreen('${chartId}')" title="Tela cheia">
                <i class="fa-solid fa-expand"></i>
            </button>
        </div>
    `;

    placeholder.replaceWith(container);

    // Parsear e criar gráfico
    const config = parseChartData(rawData, chartType);
    const canvas = document.getElementById(chartId);

    if (canvas) {
        const ctx = canvas.getContext('2d');
        chartInstances[chartId] = new Chart(ctx, config);
    }
}

/**
 * Renderiza todos os gráficos pendentes
 */
function renderPendingCharts(charts) {
    if (!charts || charts.length === 0) return;

    // Pequeno delay para garantir que o DOM está pronto
    setTimeout(() => {
        charts.forEach(chart => {
            renderChart(chart.id, chart.type, chart.rawData);
        });
    }, 100);
}

/**
 * Baixar gráfico como imagem
 */
window.downloadChart = function (chartId) {
    const chart = chartInstances[chartId];
    if (!chart) return;

    const link = document.createElement('a');
    link.download = `grafico-${chartId}.png`;
    link.href = chart.toBase64Image();
    link.click();
};

/**
 * Toggle fullscreen do gráfico
 */
window.toggleChartFullscreen = function (chartId) {
    const container = document.getElementById(chartId)?.closest('.chart-container');
    if (!container) return;

    container.classList.toggle('fullscreen');

    // Redimensionar gráfico
    const chart = chartInstances[chartId];
    if (chart) {
        setTimeout(() => chart.resize(), 100);
    }
};

// CSS movido para messages.css

// Expor funções globalmente
window.extractChartBlocks = extractChartBlocks;
window.renderPendingCharts = renderPendingCharts;
window.renderChart = renderChart;
