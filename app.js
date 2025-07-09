// Presentation App JavaScript
class PresentationApp {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 16; // Atualizado para incluir o novo slide de gráficos
        this.trainerMode = false;
        this.sidebarCollapsed = false;
        this.timerInterval = null;
        this.startTime = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateSlideCounter();
        this.updateNavButtons();
        this.updateSidebarActive();
        this.handleResponsive();
        this.handleHashNavigation(); // Lidar com a navegação por hash na inicialização
        this.startTimer(); // Iniciar o temporizador da apresentação
        this.loadAndRenderCharts(); // Carregar e renderizar gráficos na inicialização
    }

    bindEvents() {
        // Botões de navegação
        document.getElementById('prevBtn').addEventListener('click', () => this.previousSlide());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Alternar barra lateral
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        
        // Navegação da barra lateral
        document.querySelectorAll('.sidebar-list a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const slideNumber = parseInt(e.target.dataset.slide);
                this.goToSlide(slideNumber);
            });
        });
        
        // Alternar modo formador
        document.getElementById('trainerMode').addEventListener('click', () => this.toggleTrainerMode());
        
        // Descarregar PDF
        document.getElementById('downloadPDF').addEventListener('click', () => this.downloadPDF());

        // Alternar ecrã completo
        const fullscreenToggleBtn = document.getElementById('fullscreenToggle');
        if (fullscreenToggleBtn) { // Verificar se o botão existe
            fullscreenToggleBtn.addEventListener('click', () => this.toggleFullscreen());
        } else {
            console.warn('Botão de ecrã completo (fullscreenToggle) não encontrado.');
        }

        // Mostrar atalhos de teclado
        const showShortcutsBtn = document.getElementById('showShortcuts');
        if (showShortcutsBtn) { // Verificar se o botão existe
            showShortcutsBtn.addEventListener('click', () => this.showKeyboardShortcuts());
        } else {
            console.warn('Botão de atalhos (showShortcuts) não encontrado.');
        }
        
        // Manipulador de redimensionamento da janela
        window.addEventListener('resize', () => this.handleResponsive());
        
        // Sobreposição da barra lateral móvel
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            // Fechar a barra lateral móvel se o clique for fora da barra lateral e não no botão de alternar
            if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                this.closeMobileSidebar();
            }
        });
    }

    handleKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides);
                break;
            case 'Escape':
                // Fechar a barra lateral móvel com Esc
                if (window.innerWidth <= 768 && document.querySelector('.sidebar').classList.contains('open')) {
                    this.closeMobileSidebar();
                } else if (document.fullscreenElement) {
                    // Sair do modo de ecrã completo com Esc
                    document.exitFullscreen();
                }
                break;
        }
    }

    previousSlide() {
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1, 'prev'); // Adicionar direção para transição
        }
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1, 'next'); // Adicionar direção para transição
        }
    }

    goToSlide(slideNumber, direction = 'none') {
        console.log(`[goToSlide] Attempting to go to slide: ${slideNumber}, direction: ${direction}`);
        if (slideNumber < 1 || slideNumber > this.totalSlides || slideNumber === this.currentSlide) {
            console.log('[goToSlide] Invalid slide number or already on current slide. Aborting.');
            return;
        }

        const currentSlideElement = document.querySelector('.slide.active');
        const newSlideElement = document.querySelector(`[data-slide="${slideNumber}"]`);

        if (!newSlideElement) {
            console.error(`[goToSlide] New slide element with data-slide="${slideNumber}" not found!`);
            return;
        }

        console.log(`[goToSlide] Current slide element:`, currentSlideElement);
        console.log(`[goToSlide] New slide element:`, newSlideElement);

        // Passo 1: Animar o slide atual para fora (se existir)
        if (currentSlideElement) {
            console.log('[goToSlide] Animating current slide out...');
            currentSlideElement.classList.remove('active'); // Remover a classe 'active' para que as transições CSS do estado normal sejam aplicadas
            currentSlideElement.style.pointerEvents = 'none'; // Desativar eventos de clique no slide que sai

            // Definir a posição final e opacidade para o slide que sai
            if (direction === 'next') {
                currentSlideElement.style.transform = 'translateX(-100%)'; // Move para a esquerda
            } else if (direction === 'prev') {
                currentSlideElement.style.transform = 'translateX(100%)'; // Move para a direita
            }
            currentSlideElement.style.opacity = '0'; // Desaparece

            // Ocultar o slide atual completamente após a sua transição
            const hideCurrent = () => {
                console.log('[goToSlide] Transition ended for current slide. Hiding...');
                currentSlideElement.style.visibility = 'hidden'; // Ocultar completamente
                currentSlideElement.style.display = 'none'; // Ocultar do layout
                // Resetar a transformação para a posição padrão (fora do ecrã à direita) para uso futuro
                currentSlideElement.style.transform = 'translateX(100%)'; 
                currentSlideElement.removeEventListener('transitionend', hideCurrent);
            };

            // Adicionar o listener para 'transitionend' apenas se houver uma transição esperada
            // Usar um pequeno timeout como fallback caso a transição não seja detetada (ex: por display:none)
            let transitionTimeout = setTimeout(hideCurrent, 300); // Duração máxima da transição + buffer
            currentSlideElement.addEventListener('transitionend', function handler() {
                clearTimeout(transitionTimeout); // Limpar o timeout de fallback
                hideCurrent();
                currentSlideElement.removeEventListener('transitionend', handler);
            }, { once: true }); // Garantir que o listener é removido após uma execução
        }

        // Passo 2: Preparar o novo slide para a entrada
        console.log('[goToSlide] Preparing new slide for entry...');
        newSlideElement.style.display = 'flex'; // Torná-lo visível no layout
        newSlideElement.style.visibility = 'visible'; // Torná-lo visível
        newSlideElement.style.pointerEvents = 'auto'; // Ativar interação
        newSlideElement.style.opacity = '0'; // Começar transparente

        // Definir a posição inicial fora do ecrã para o slide que entra
        if (direction === 'next') {
            newSlideElement.style.transform = 'translateX(100%)'; // Vem da direita
        } else if (direction === 'prev') {
            newSlideElement.style.transform = 'translateX(-100%)'; // Vem da esquerda
        } else {
            // Se não houver direção específica (ex: salto direto via barra lateral), apenas aparece sem deslize horizontal
            newSlideElement.style.transform = 'translateX(0)'; 
        }

        // Forçar um reflow: CRUCIAL. Garante que o navegador renderiza o estado inicial
        // (display:flex, visibility:visible, opacity:0, transform:X%) ANTES de aplicar a classe 'active'.
        // Sem isto, a transição pode não ocorrer.
        // Usar setTimeout(0) é uma forma mais robusta de forçar o reflow do que offsetWidth.
        setTimeout(() => {
            console.log('[goToSlide] Forcing reflow and animating new slide in...');
            // Passo 3: Animar o novo slide para dentro
            // Aplicar os estilos finais que irão acionar a transição CSS
            newSlideElement.style.opacity = '1';
            newSlideElement.style.transform = 'translateX(0)'; // Move para o centro
            newSlideElement.classList.add('active'); // Adicionar a classe 'active' para que permaneça ativo
        }, 0); // Pequeno atraso para permitir reflow

        // Atualizar o estado interno e os elementos da UI
        this.currentSlide = slideNumber;
        this.updateSlideCounter();
        this.updateNavButtons();
        this.updateSidebarActive();
        this.updateHash(); // Atualizar o hash da URL
        console.log(`[goToSlide] Successfully moved to slide ${this.currentSlide}`);

        // Fechar a barra lateral móvel após a navegação
        if (window.innerWidth <= 768) {
            this.closeMobileSidebar();
        }
    }

    updateSlideCounter() {
        const currentSlideElement = document.getElementById('currentSlide');
        const totalSlidesElement = document.getElementById('totalSlides');
        if (currentSlideElement) currentSlideElement.textContent = this.currentSlide;
        if (totalSlidesElement) totalSlidesElement.textContent = this.totalSlides;
    }

    updateNavButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.disabled = this.currentSlide === 1;
        if (nextBtn) nextBtn.disabled = this.currentSlide === this.totalSlides;
    }

    updateSidebarActive() {
        // Remover a classe ativa de todos os links da barra lateral
        document.querySelectorAll('.sidebar-list a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adicionar a classe ativa ao link do slide atual
        const activeLink = document.querySelector(`.sidebar-list a[data-slide="${this.currentSlide}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        
        if (window.innerWidth <= 768) {
            // Comportamento móvel: a barra lateral é uma sobreposição
            sidebar.classList.toggle('open');
            // Adicionar/remover a classe 'no-scroll' ao body para evitar scroll quando a sidebar está aberta
            document.body.classList.toggle('no-scroll', sidebar.classList.contains('open'));
        } else {
            // Comportamento de desktop
            sidebar.classList.toggle('collapsed');
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('open');
        document.body.classList.remove('no-scroll'); // Remover a classe no-scroll
    }

    toggleTrainerMode() {
        this.trainerMode = !this.trainerMode;
        const trainerModeBtn = document.getElementById('trainerMode');
        const trainerModeText = document.getElementById('trainerModeText');
        const trainerNotes = document.querySelectorAll('.trainer-notes');
        
        if (this.trainerMode) {
            if (trainerModeBtn) {
                trainerModeBtn.classList.add('btn--primary');
                trainerModeBtn.classList.remove('btn--secondary');
            }
            if (trainerModeText) trainerModeText.textContent = 'Desativar Modo Formador';
            trainerNotes.forEach(note => note.classList.add('visible'));
        } else {
            if (trainerModeBtn) {
                trainerModeBtn.classList.remove('btn--primary');
                trainerModeBtn.classList.add('btn--secondary');
            }
            if (trainerModeText) trainerModeText.textContent = 'Ativar Modo Formador';
            trainerNotes.forEach(note => note.classList.remove('visible'));
        }
    }

    downloadPDF() {
        this.showCustomModal('Pretende descarregar a apresentação em PDF? Esta funcionalidade irá abrir o diálogo de impressão do navegador.', true, () => {
            console.log('Initiating PDF download process...');
            const originalTrainerMode = this.trainerMode;
            
            // Enable trainer mode for complete PDF
            if (!this.trainerMode) {
                this.toggleTrainerMode();
            }
            
            // Show all slides for printing
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => {
                slide.style.display = 'flex'; // Ensure it's in layout
                slide.style.opacity = '1'; // Fully visible
                slide.style.transform = 'none'; // No translation
                slide.style.position = 'static'; // Allow normal flow
                slide.style.visibility = 'visible'; // Ensure visibility
                slide.style.pointerEvents = 'auto'; // Enable interaction
                slide.classList.remove('active', 'prev', 'next'); // Remove active/transition classes
            });
            
            // Trigger print
            window.print();
            console.log('Print dialog triggered.');

            // Restore original state after print dialog
            // Use a timeout to ensure print dialog is closed and styles are reset gracefully
            setTimeout(() => {
                console.log('Restoring slide states after PDF download...');
                slides.forEach((slide, index) => {
                    if (index + 1 !== this.currentSlide) {
                        // For inactive slides, hide them
                        slide.style.display = 'none';
                        slide.style.opacity = '0';
                        slide.style.transform = 'translateX(100%)'; // Reset off-screen
                        slide.style.position = 'absolute'; // Back to absolute positioning
                        slide.style.visibility = 'hidden';
                        slide.style.pointerEvents = 'none';
                    } else {
                        // For the current slide, ensure it's active and correctly positioned
                        slide.classList.add('active');
                        slide.style.display = 'flex';
                        slide.style.opacity = '1';
                        slide.style.transform = 'translateX(0)';
                        slide.style.position = 'absolute'; // Keep absolute positioning
                        slide.style.visibility = 'visible';
                        slide.style.pointerEvents = 'auto';
                    }
                });
                
                // Restore trainer mode
                if (!originalTrainerMode && this.trainerMode) {
                    this.toggleTrainerMode();
                }
                console.log('Slide states restored.');
            }, 1000); // Give enough time for print dialog to appear/disappear
        });
    }

    handleResponsive() {
        const sidebar = document.querySelector('.sidebar');
        
        if (window.innerWidth <= 768) {
            // Móvel: a barra lateral é sobreposição
            sidebar.classList.remove('collapsed');
            // Não remover 'open' aqui, pois pode estar aberta intencionalmente
        } else {
            // Desktop: restaurar estado da barra lateral
            sidebar.classList.remove('open');
            document.body.classList.remove('no-scroll'); // Garantir que o scroll é reativado no desktop
            if (this.sidebarCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }
    }

    // Método para lidar com gestos de toque/deslize para telemóvel
    initTouchGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        const slidesContainer = document.querySelector('.slides-container');
        if (!slidesContainer) return;

        slidesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        slidesContainer.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Verificar se o deslize horizontal é mais significativo que o vertical
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    // Deslize para a direita - slide anterior
                    this.previousSlide();
                } else if (deltaX < -50) {
                    // Deslize para a esquerda - slide seguinte
                    this.nextSlide();
                }
            }
        });
    }

    // Método para lidar com o modo de ecrã completo
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Erro ao tentar ativar o ecrã completo: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Método para lidar com a navegação por hash da URL
    handleHashNavigation() {
        const hash = window.location.hash;
        if (hash) {
            const slideNumber = parseInt(hash.replace('#slide-', ''));
            if (!isNaN(slideNumber) && slideNumber >= 1 && slideNumber <= this.totalSlides) {
                this.goToSlide(slideNumber);
            }
        }
        
        // Atualizar hash quando o slide muda
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash) {
                const slideNumber = parseInt(hash.replace('#slide-', ''));
                if (!isNaN(slideNumber) && slideNumber >= 1 && slideNumber <= this.totalSlides && slideNumber !== this.currentSlide) {
                    this.goToSlide(slideNumber);
                }
            }
        });
    }

    // Método para atualizar o hash da URL
    updateHash() {
        history.replaceState(null, null, `#slide-${this.currentSlide}`);
    }

    // Método para mostrar informações de atalhos de teclado
    showKeyboardShortcuts() {
        const shortcuts = [
            '← → : Navegar entre slides',
            'Home : Primeiro slide',
            'End : Último slide',
            'Esc : Fechar barra lateral (móvel) / Sair do ecrã completo'
        ];
        
        this.showCustomModal('Atalhos de Teclado:\n\n' + shortcuts.join('\n'));
    }

    // Método para lidar com o temporizador da apresentação
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            // Atualizar exibição do temporizador se o elemento existir
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Método para lidar com o avanço automático do slide
    startAutoAdvance(intervalMs = 30000) {
        this.autoAdvanceInterval = setInterval(() => {
            if (this.currentSlide < this.totalSlides) {
                this.nextSlide();
            } else {
                this.stopAutoAdvance();
            }
        }, intervalMs);
    }

    stopAutoAdvance() {
        if (this.autoAdvanceInterval) {
            clearInterval(this.autoAdvanceInterval);
            this.autoAdvanceInterval = null;
        }
    }

    // Método para exibir um modal personalizado (substitui alert/confirm)
    showCustomModal(message, isConfirm = false, onConfirm = () => {}, onCancel = () => {}) {
        const modal = document.getElementById('customModal');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirmBtn = document.getElementById('modalConfirmBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');

        if (!modal || !modalMessage || !modalConfirmBtn || !modalCancelBtn) {
            console.error('Elementos do modal não encontrados.');
            return;
        }

        modalMessage.textContent = message;

        if (isConfirm) {
            modalCancelBtn.style.display = 'inline-block';
            modalConfirmBtn.textContent = 'Confirmar';
            modalConfirmBtn.onclick = () => {
                modal.style.display = 'none';
                onConfirm();
            };
            modalCancelBtn.onclick = () => {
                modal.style.display = 'none';
                onCancel();
            };
        } else {
            modalCancelBtn.style.display = 'none';
            modalConfirmBtn.textContent = 'OK';
            modalConfirmBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        modal.style.display = 'flex'; // Usar flex para centralizar
    }

    // --- Métodos de Carregamento e Renderização de Gráficos (integrados do seu código original) ---
    async loadAndRenderCharts() {
        console.log('[Charts] Loading and rendering charts...');
        try {
            // Criar ficheiros CSV virtuais para demonstração
            // No ambiente real, estes seriam carregados de URLs ou ficheiros
            const commonErrorsCSV = `Erro,Frequência
"Vírgula (,)",95
"Acento Grave (`),80
"Ponto e Vírgula (;)",70
"Aspas (""),60
"Hífen (-)",50
"Crase (à)",40`;

            const punctuationCSV = `Sinal,Uso
"Ponto Final (.)",120
"Vírgula (,)",110
"Ponto de Interrogação (?)",90
"Ponto de Exclamação (!)",80
"Dois Pontos (:)",75
"Ponto e Vírgula (;)",65
"Aspas (""),55
"Parênteses ()",45
"Travessão (—)",35`;

            const commonErrorsData = this.parseCSV(commonErrorsCSV);
            console.log('[Charts] Erros Mais Comuns Data Loaded:', commonErrorsData);
            this.renderCommonErrorsChart(commonErrorsData);

            const punctuationData = this.parseCSV(punctuationCSV);
            console.log('[Charts] Sinais de Pontuação Data Loaded:', punctuationData);
            this.renderPunctuationChart(punctuationData);

            console.log('[Charts] All data loaded, rendering charts...');
        } catch (error) {
            console.error('[Charts] Error loading chart data:', error);
        }
    }

    // Método para simular o carregamento de CSV (usando string em vez de fetch)
    // No ambiente real, fetchCSV seria usado para carregar de ficheiros externos
    // async fetchCSV(filename) {
    //     const response = await fetch(filename);
    //     const text = await response.text();
    //     return this.parseCSV(text);
    // }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Expressão regular para dividir por vírgula, mas ignorar vírgulas dentro de aspas
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            // Remover aspas duplas dos valores
            const cleanedValues = values.map(v => v.replace(/"/g, '').trim());

            if (cleanedValues.length !== headers.length) {
                console.warn(`[parseCSV] Skipping line ${i + 1} due to mismatched column count: "${line}" (Expected ${headers.length}, Got ${cleanedValues.length})`);
                continue;
            }

            const row = {};
            headers.forEach((header, index) => {
                row[header] = cleanedValues[index];
            });
            data.push(row);
        }
        return data;
    }

    renderCommonErrorsChart(data) {
        const ctx = document.getElementById('commonErrorsChart');
        if (!ctx) {
            console.warn('[Charts] Common Errors Chart canvas not found.');
            return;
        }
        // Destruir gráfico existente se houver (para evitar sobreposição em atualizações)
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        // Assumindo Chart.js é carregado globalmente
        ctx.chart = new Chart(ctx, { // Armazenar a instância do gráfico no elemento canvas
            type: 'bar',
            data: {
                labels: data.map(row => row['Erro']),
                datasets: [{
                    label: 'Frequência',
                    data: data.map(row => parseInt(row['Frequência'])),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permitir que o gráfico se ajuste ao seu container
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderPunctuationChart(data) {
        const ctx = document.getElementById('punctuationChart');
        if (!ctx) {
            console.warn('[Charts] Punctuation Chart canvas not found.');
            return;
        }
        // Destruir gráfico existente se houver
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        // Assumindo Chart.js é carregado globalmente
        ctx.chart = new Chart(ctx, { // Armazenar a instância do gráfico no elemento canvas
            type: 'pie',
            data: {
                labels: data.map(row => row['Sinal']),
                datasets: [{
                    label: 'Uso',
                    data: data.map(row => parseInt(row['Uso'])),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(199, 199, 199, 0.6)',
                        'rgba(83, 102, 255, 0.6)',
                        'rgba(255, 99, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)',
                        'rgba(255, 99, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permitir que o gráfico se ajuste ao seu container
            }
        });
    }
}

// Inicializar a aplicação de apresentação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const app = new PresentationApp();
    
    // Inicializar gestos de toque para telemóvel
    app.initTouchGestures();
    
    // Tornar a aplicação globalmente acessível para depuração
    window.presentationApp = app;
    
    // Adicionar algumas mensagens úteis na consola
    console.log('SchoolAI Presentation carregada com sucesso!');
    console.log('Use as setas para navegar, ou clique nos itens da barra lateral.');
    console.log('Aceda ao objeto presentationApp para controlos avançados.');
});

// Lidar com mudanças de visibilidade da página
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Página está oculta (o utilizador mudou de separador, etc.)
        console.log('Apresentação pausada');
        if (window.presentationApp) {
            window.presentationApp.stopTimer(); // Pausar o temporizador
        }
    } else {
        // Página está visível novamente
        console.log('Apresentação retomada');
        if (window.presentationApp) {
            window.presentationApp.startTimer(); // Retomar o temporizador
        }
    }
});

// Lidar antes do descarregamento
window.addEventListener('beforeunload', (e) => {
    // Opcional: avisar o utilizador se estiver no meio da apresentação
    if (window.presentationApp && window.presentationApp.currentSlide > 1 && window.presentationApp.currentSlide < window.presentationApp.totalSlides) {
        e.preventDefault();
        e.returnValue = 'Tem a certeza que pretende sair da apresentação?';
    }
});

// Exportar para potencial uso de módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationApp;
}
