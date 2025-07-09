// Presentation App JavaScript
class PresentationApp {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 15; // Certifique-se de que este número corresponde ao total de slides no HTML
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
        console.log(`Attempting to go to slide: ${slideNumber}, direction: ${direction}`);
        if (slideNumber < 1 || slideNumber > this.totalSlides || slideNumber === this.currentSlide) {
            console.log('Invalid slide number or already on current slide. Aborting.');
            return;
        }

        const currentSlideElement = document.querySelector('.slide.active');
        const newSlideElement = document.querySelector(`[data-slide="${slideNumber}"]`);

        if (!newSlideElement) {
            console.error(`New slide element with data-slide="${slideNumber}" not found!`);
            return;
        }

        console.log(`Current slide element:`, currentSlideElement);
        console.log(`New slide element:`, newSlideElement);

        // Passo 1: Animar o slide atual para fora (se existir)
        if (currentSlideElement) {
            console.log('Animating current slide out...');
            currentSlideElement.classList.remove('active'); // Remove active class to trigger transition
            currentSlideElement.style.pointerEvents = 'none'; // Disable interactions

            // Set the final position and opacity for the outgoing slide
            if (direction === 'next') {
                currentSlideElement.style.transform = 'translateX(-100%)'; // Move left
            } else if (direction === 'prev') {
                currentSlideElement.style.transform = 'translateX(100%)'; // Move right
            }
            currentSlideElement.style.opacity = '0'; // Fade out

            const hideCurrent = () => {
                console.log('Transition ended for current slide. Hiding...');
                currentSlideElement.style.display = 'none'; // Hide from layout
                currentSlideElement.style.visibility = 'hidden'; // Make invisible
                // Reset transform for future use (off-screen right, default for new slides)
                currentSlideElement.style.transform = 'translateX(100%)'; 
                currentSlideElement.removeEventListener('transitionend', hideCurrent);
            };

            // Attach transitionend listener. Use a fallback setTimeout in case transitionend doesn't fire
            let transitionTimeout = setTimeout(hideCurrent, 300); // Max duration of transition + buffer
            currentSlideElement.addEventListener('transitionend', function handler() {
                clearTimeout(transitionTimeout); // Clear the fallback timeout
                hideCurrent();
                currentSlideElement.removeEventListener('transitionend', handler);
            }, { once: true }); // Ensure listener is removed after one execution

        }

        // Passo 2: Preparar o novo slide para a entrada
        console.log('Preparing new slide for entry...');
        newSlideElement.style.display = 'flex'; // Make it part of the layout
        newSlideElement.style.visibility = 'visible'; // Make it visible
        newSlideElement.style.pointerEvents = 'auto'; // Enable interaction
        newSlideElement.style.opacity = '0'; // Start transparent

        // Set initial off-screen position for the incoming slide
        if (direction === 'next') {
            newSlideElement.style.transform = 'translateX(100%)'; // Comes from right
        } else if (direction === 'prev') {
            newSlideElement.style.transform = 'translateX(-100%)'; // Comes from left
        } else {
            // If no specific direction (e.g., direct jump via sidebar), just appear without horizontal slide
            newSlideElement.style.transform = 'translateX(0)'; 
        }

        // Force a reflow: CRUCIAL. Ensures browser renders initial state
        // (display:flex, visibility:visible, opacity:0, transform:X%) BEFORE applying final state.
        // Without this, the transition may not occur as the browser might optimize away the intermediate state.
        void newSlideElement.offsetWidth; 
        console.log('Reflow forced for new slide.');

        // Passo 3: Animar o novo slide para dentro
        console.log('Animating new slide in...');
        newSlideElement.style.opacity = '1';
        newSlideElement.style.transform = 'translateX(0)'; // Move to center
        newSlideElement.classList.add('active'); // Add active class to keep it active

        // Update internal state and UI elements
        this.currentSlide = slideNumber;
        this.updateSlideCounter();
        this.updateNavButtons();
        this.updateSidebarActive();
        this.updateHash(); // Update URL hash
        console.log(`Successfully moved to slide ${this.currentSlide}`);

        // Close mobile sidebar after navigation
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
