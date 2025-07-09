// Presentation App JavaScript
class PresentationApp {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 15;
        this.trainerMode = false;
        this.sidebarCollapsed = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateSlideCounter();
        this.updateNavButtons();
        this.updateSidebarActive();
        this.handleResponsive();
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousSlide());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-list a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const slideNumber = parseInt(e.target.dataset.slide);
                this.goToSlide(slideNumber);
            });
        });
        
        // Trainer mode toggle
        document.getElementById('trainerMode').addEventListener('click', () => this.toggleTrainerMode());
        
        // PDF download
        document.getElementById('downloadPDF').addEventListener('click', () => this.downloadPDF());
        
        // Window resize handler
        window.addEventListener('resize', () => this.handleResponsive());
        
        // Mobile sidebar overlay
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !document.querySelector('.sidebar').contains(e.target) && !e.target.closest('.sidebar-toggle')) {
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
                if (window.innerWidth <= 768) {
                    this.closeMobileSidebar();
                }
                break;
        }
    }

    previousSlide() {
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    goToSlide(slideNumber) {
        if (slideNumber < 1 || slideNumber > this.totalSlides) return;
        
        // Hide current slide
        const currentSlideElement = document.querySelector('.slide.active');
        if (currentSlideElement) {
            currentSlideElement.classList.remove('active');
        }
        
        // Show new slide
        const newSlideElement = document.querySelector(`[data-slide="${slideNumber}"]`);
        if (newSlideElement) {
            newSlideElement.classList.add('active');
        }
        
        this.currentSlide = slideNumber;
        this.updateSlideCounter();
        this.updateNavButtons();
        this.updateSidebarActive();
        
        // Close mobile sidebar after navigation
        if (window.innerWidth <= 768) {
            this.closeMobileSidebar();
        }
    }

    updateSlideCounter() {
        document.getElementById('currentSlide').textContent = this.currentSlide;
        document.getElementById('totalSlides').textContent = this.totalSlides;
    }

    updateNavButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.disabled = this.currentSlide === 1;
        nextBtn.disabled = this.currentSlide === this.totalSlides;
    }

    updateSidebarActive() {
        // Remove active class from all sidebar links
        document.querySelectorAll('.sidebar-list a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current slide link
        const activeLink = document.querySelector(`[data-slide="${this.currentSlide}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        
        if (window.innerWidth <= 768) {
            // Mobile behavior
            sidebar.classList.toggle('open');
        } else {
            // Desktop behavior
            sidebar.classList.toggle('collapsed');
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('open');
    }

    toggleTrainerMode() {
        this.trainerMode = !this.trainerMode;
        const trainerModeBtn = document.getElementById('trainerMode');
        const trainerModeText = document.getElementById('trainerModeText');
        const trainerNotes = document.querySelectorAll('.trainer-notes');
        
        if (this.trainerMode) {
            trainerModeBtn.classList.add('btn--primary');
            trainerModeBtn.classList.remove('btn--secondary');
            trainerModeText.textContent = 'Desativar Modo Formador';
            trainerNotes.forEach(note => note.classList.add('visible'));
        } else {
            trainerModeBtn.classList.remove('btn--primary');
            trainerModeBtn.classList.add('btn--secondary');
            trainerModeText.textContent = 'Ativar Modo Formador';
            trainerNotes.forEach(note => note.classList.remove('visible'));
        }
    }

    downloadPDF() {
        // Show confirmation
        if (confirm('Pretende descarregar a apresentação em PDF? Esta funcionalidade irá abrir o diálogo de impressão do navegador.')) {
            // Temporarily show all slides and trainer notes for printing
            const originalTrainerMode = this.trainerMode;
            
            // Enable trainer mode for complete PDF
            if (!this.trainerMode) {
                this.toggleTrainerMode();
            }
            
            // Show all slides
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => {
                slide.style.display = 'flex';
                slide.style.opacity = '1';
                slide.style.transform = 'none';
                slide.style.position = 'static';
            });
            
            // Trigger print
            window.print();
            
            // Restore original state after print dialog
            setTimeout(() => {
                slides.forEach((slide, index) => {
                    if (index + 1 !== this.currentSlide) {
                        slide.style.display = 'none';
                        slide.style.opacity = '0';
                        slide.style.transform = 'translateX(100%)';
                        slide.style.position = 'absolute';
                    }
                });
                
                // Restore trainer mode
                if (!originalTrainerMode && this.trainerMode) {
                    this.toggleTrainerMode();
                }
            }, 1000);
        }
    }

    handleResponsive() {
        const sidebar = document.querySelector('.sidebar');
        
        if (window.innerWidth <= 768) {
            // Mobile: sidebar is overlay
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('open');
        } else {
            // Desktop: restore sidebar state
            sidebar.classList.remove('open');
            if (this.sidebarCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }
    }

    // Method to handle touch/swipe gestures for mobile
    initTouchGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        const slidesContainer = document.querySelector('.slides-container');
        
        slidesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        slidesContainer.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Check if horizontal swipe is more significant than vertical
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    // Swipe right - previous slide
                    this.previousSlide();
                } else if (deltaX < -50) {
                    // Swipe left - next slide
                    this.nextSlide();
                }
            }
        });
    }

    // Method to handle fullscreen mode
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Method to handle URL hash navigation
    handleHashNavigation() {
        const hash = window.location.hash;
        if (hash) {
            const slideNumber = parseInt(hash.replace('#slide-', ''));
            if (slideNumber >= 1 && slideNumber <= this.totalSlides) {
                this.goToSlide(slideNumber);
            }
        }
        
        // Update hash when slide changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash) {
                const slideNumber = parseInt(hash.replace('#slide-', ''));
                if (slideNumber >= 1 && slideNumber <= this.totalSlides && slideNumber !== this.currentSlide) {
                    this.goToSlide(slideNumber);
                }
            }
        });
    }

    // Method to update URL hash
    updateHash() {
        history.replaceState(null, null, `#slide-${this.currentSlide}`);
    }

    // Method to add keyboard shortcuts info
    showKeyboardShortcuts() {
        const shortcuts = [
            '← → : Navegar entre slides',
            'Home : Primeiro slide',
            'End : Último slide',
            'Esc : Fechar sidebar (mobile)'
        ];
        
        alert('Atalhos de Teclado:\n\n' + shortcuts.join('\n'));
    }

    // Method to handle presentation timer
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            // Update timer display if element exists
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

    // Method to handle slide auto-advance
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
}

// Initialize the presentation app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PresentationApp();
    
    // Initialize touch gestures for mobile
    app.initTouchGestures();
    
    // Handle hash navigation
    app.handleHashNavigation();
    
    // Make app globally accessible for debugging
    window.presentationApp = app;
    
    // Add some helpful console messages
    console.log('SchoolAI Presentation loaded successfully!');
    console.log('Use arrow keys to navigate, or click sidebar items.');
    console.log('Access presentationApp object for advanced controls.');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden (user switched tabs, etc.)
        console.log('Presentation paused');
    } else {
        // Page is visible again
        console.log('Presentation resumed');
    }
});

// Handle before unload
window.addEventListener('beforeunload', (e) => {
    // Optional: warn user if they're in the middle of presentation
    if (window.presentationApp && window.presentationApp.currentSlide > 1 && window.presentationApp.currentSlide < window.presentationApp.totalSlides) {
        e.preventDefault();
        e.returnValue = 'Tem a certeza que pretende sair da apresentação?';
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationApp;
}