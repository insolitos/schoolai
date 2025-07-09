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
        document.getElementById('fullscreenToggle').addEventListener('click', () => this.toggleFullscreen());

        // Mostrar atalhos de teclado
        document.getElementById('showShortcuts').addEventListener('click', () => this.showKeyboardShortcuts());
        
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
        if (slideNumber < 1 || slideNumber > this.totalSlides || slideNumber === this.currentSlide) return;

        const currentSlideElement = document.querySelector('.slide.active');
        const newSlideElement = document.querySelector(`[data-slide="${slideNumber}"]`);

        if (newSlideElement) {
            // Passo 1: Animar o slide atual para fora (se existir)
            if (currentSlideElement) {
                // Remover a classe 'active' para que as transições CSS do estado normal sejam aplicadas
                currentSlideElement.classList.remove('active');

                // Definir a posição final e opacidade para o slide que sai
                if (direction === 'next') {
                    currentSlideElement.style.transform = 'translateX(-100%)'; // Move para a esquerda
                } else if (direction === 'prev') {
                    currentSlideElement.style.transform = 'translateX(100%)'; // Move para a direita
                }
                currentSlideElement.style.opacity = '0'; // Desaparece

                // Ocultar o slide atual completamente após a sua transição
                const hideCurrent = () => {
                    currentSlideElement.style.display = 'none';
                    // Resetar a transformação para a posição padrão (fora do ecrã à direita) para uso futuro
                    currentSlideElement.style.transform = 'translateX(100%)'; 
                    currentSlideElement.removeEventListener('transitionend', hideCurrent);
                };

                // Adicionar o listener para 'transitionend' apenas se houver uma transição esperada
                if (direction !== 'none') {
                    currentSlideElement.addEventListener('transitionend', hideCurrent, { once: true });
                } else {
                    // Se não houver transição (ex: salto direto), ocultar imediatamente
                    hideCurrent();
                }
            }

            // Passo 2: Preparar o novo slide para a entrada
            newSlideElement.style.display = 'flex'; // Torná-lo visível (mas ainda fora do ecrã)
            newSlideElement.style.opacity = '0'; // Começar transparente

            // Definir a posição inicial fora do ecrã para o slide que entra
            if (direction === 'next') {
                newSlideElement.style.transform = 'translateX(100%)'; // Vem da direita
            } else if (direction === 'prev') {
                newSlideElement.style.transform = 'translateX(-100%)'; // Vem da esquerda
            } else {
                newSlideElement.style.transform = 'translateX(0)'; // Sem direção específica, apenas aparece
            }

            // Forçar um reflow: Isto é CRUCIAL. Garante que o navegador renderiza o estado inicial
            // (display:flex, opacity:0, transform:X%) ANTES de aplicar a classe 'active'.
            void newSlideElement.offsetWidth; 

            // Passo 3: Animar o novo slide para dentro
            // Aplicar os estilos finais que irão acionar a transição CSS
            newSlideElement.style.opacity = '1';
            newSlideElement.style.transform = 'translateX(0)'; // Move para o centro
            newSlideElement.classList.add('active'); // Adicionar a classe 'active' para que permaneça ativo

            // Atualizar o estado interno e os elementos da UI
            this.currentSlide = slideNumber;
            this.updateSlideCounter();
            this.updateNavButtons();
            this.updateSidebarActive();
            this.updateHash(); // Atualizar o hash da URL

            // Fechar a barra lateral móvel após a navegação
            if (window.innerWidth <= 768) {
                this.closeMobileSidebar();
            }
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
            // Temporariamente mostrar todos os slides e notas do formador para impressão
            const originalTrainerMode = this.trainerMode;
            
            // Ativar modo formador para PDF completo
            if (!this.trainerMode) {
                this.toggleTrainerMode();
            }
            
            // Mostrar todos os slides
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => {
                slide.style.display = 'flex';
                slide.style.opacity = '1';
                slide.style.transform = 'none';
                slide.style.position = 'static';
            });
            
            // Acionar impressão
            window.print();
            
            // Restaurar o estado original após o diálogo de impressão
            setTimeout(() => {
                slides.forEach((slide, index) => {
                    if (index + 1 !== this.currentSlide) {
                        slide.style.display = 'none';
                        slide.style.opacity = '0';
                        slide.style.transform = 'translateX(100%)';
                        slide.style.position = 'absolute';
                    }
                });
                
                // Restaurar modo formador
                if (!originalTrainerMode && this.trainerMode) {
                    this.toggleTrainerMode();
                }
            }, 1000);
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
