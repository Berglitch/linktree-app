document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa os ícones do Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Alternador de Tema (Dark/Light Mode) com Persistência
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Recupera tema do LocalStorage ou define baseado na preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }

    // Event listener do clique no tema
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Efeito de feedback visual rápido no botão (escala)
        themeToggleBtn.style.transform = 'scale(0.85)';
        setTimeout(() => {
            themeToggleBtn.style.transform = '';
        }, 100);
    });

    // 3. Compartilhamento e Cópia do Link da Página
    const shareBtn = document.getElementById('share-btn');
    const toast = document.getElementById('toast');

    shareBtn.addEventListener('click', async () => {
        const pageUrl = window.location.href;

        // Se o navegador suportar o Web Share API, usamos ele (ótimo para celulares)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
                    text: 'Acesse os links oficiais da Rede Amazônica!',
                    url: pageUrl,
                });
                return; // Compartilhado com sucesso via menu do sistema
            } catch (err) {
                console.log('Compartilhamento cancelado ou não suportado:', err);
            }
        }

        // Caso contrário, copia para o clipboard e exibe o Toast personalizado
        try {
            await navigator.clipboard.writeText(pageUrl);
            showToast();
        } catch (err) {
            // Fallback clássico para navegadores antigos
            const tempInput = document.createElement('input');
            tempInput.value = pageUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showToast();
        }
    });

    // Função para mostrar o Toast
    function showToast() {
        toast.classList.add('show');

        // Efeito de pulso no botão share
        shareBtn.style.transform = 'scale(0.85)';
        setTimeout(() => shareBtn.style.transform = '', 100);

        // Oculta após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 4. Efeito de Hover Paralaxe 3D nos Cards (Feedback Premium)
    // Adiciona uma leve rotação 3D acompanhando o mouse nos cards
    const cards = document.querySelectorAll('.link-card');

    // Executa apenas em dispositivos que possuem ponteiro fino (mouse) para não quebrar no mobile
    if (window.matchMedia('(pointer: fine)').matches) {
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // coordenada x dentro do elemento
                const y = e.clientY - rect.top;  // coordenada y dentro do elemento

                // Calcula a inclinação (máximo de 3 graus para sutileza)
                const rotateX = -((y / rect.height) - 0.5) * 6;
                const rotateY = ((x / rect.width) - 0.5) * 6;

                card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // 5. Barra de busca com atalho de teclado '/'
    const searchInput = document.getElementById('search-input');
    const searchWrapper = document.querySelector('.search-wrapper');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const linksContainer = document.querySelector('.links-container');
    const linkCards = document.querySelectorAll('.link-card');
    const noResultsMsg = document.getElementById('no-results');
    const toggleListBtn = document.getElementById('toggle-list-btn');
    const toggleLabel = toggleListBtn ? toggleListBtn.querySelector('.toggle-list-label') : null;

    // Aplica filtro atual da busca aos cards
    function applyFilter(query) {
        let visibleCount = 0;
        linkCards.forEach(card => {
            const title = card.querySelector('.link-title').textContent.toLowerCase();
            const description = card.querySelector('.link-description').textContent.toLowerCase();
            if (title.includes(query) || description.includes(query)) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });
        if (noResultsMsg) noResultsMsg.classList.toggle('visible', visibleCount === 0);
    }

    // Revela lista (com ou sem filtro)
    function revealList() {
        linksContainer.classList.add('revealed');
        if (toggleListBtn) toggleListBtn.classList.add('open');
        if (toggleLabel) toggleLabel.textContent = 'Ocultar';
    }

    // Oculta lista — comportamento depende se há texto na busca
    function hideList() {
        linksContainer.classList.remove('revealed');
        if (toggleListBtn) toggleListBtn.classList.remove('open');

        const hasQuery = searchInput && searchInput.value.trim() !== '';
        if (hasQuery) {
            // Mantém texto na busca, label vira "Mostrar"
            if (toggleLabel) toggleLabel.textContent = 'Mostrar';
        } else {
            // Sem texto: reset completo
            if (toggleLabel) toggleLabel.textContent = 'Ver todos';
            linkCards.forEach(card => card.classList.remove('hidden'));
            if (noResultsMsg) noResultsMsg.classList.remove('visible');
        }
    }

    // 6. Botão toggle revelar/ocultar lista inteira
    if (toggleListBtn) {
        toggleListBtn.addEventListener('click', () => {
            if (linksContainer.classList.contains('revealed')) {
                hideList();
            } else {
                // Se há query ativa, mostra resultados filtrados
                const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
                if (query !== '') {
                    revealList();
                    applyFilter(query);
                } else {
                    revealList();
                    linkCards.forEach(card => card.classList.remove('hidden'));
                    if (noResultsMsg) noResultsMsg.classList.remove('visible');
                }
            }
        });
    }

    if (searchInput) {
        // Evento de digitação para filtrar e revelar os links
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            // Controla classe has-value para mostrar/ocultar o botão X
            if (searchWrapper) searchWrapper.classList.toggle('has-value', e.target.value !== '');

            if (query === '') {
                // Campo vazio → oculta lista e reset completo
                linksContainer.classList.remove('revealed');
                if (toggleListBtn) toggleListBtn.classList.remove('open');
                if (toggleLabel) toggleLabel.textContent = 'Ver todos';
                // Deferimos a exibição de todos os cards para depois que a transição de fechamento terminar
                setTimeout(() => {
                    if (!linksContainer.classList.contains('revealed')) {
                        linkCards.forEach(card => card.classList.remove('hidden'));
                    }
                }, 400);
                if (noResultsMsg) noResultsMsg.classList.remove('visible');
                return;
            }

            // Há texto → revela lista filtrada, botão = "Ocultar"
            revealList();
            applyFilter(query);
        });

        // Botão X: limpa busca e reseta tudo
        if (clearSearchBtn) {
            // Impede que o clique no X tire o foco do input (elimina o "piscar")
            clearSearchBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });

            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                if (searchWrapper) searchWrapper.classList.remove('has-value');
                linksContainer.classList.remove('revealed');
                if (toggleListBtn) toggleListBtn.classList.remove('open');
                if (toggleLabel) toggleLabel.textContent = 'Ver todos';
                // Deferimos a exibição de todos os cards para depois que a transição de fechamento terminar
                setTimeout(() => {
                    if (!linksContainer.classList.contains('revealed')) {
                        linkCards.forEach(card => card.classList.remove('hidden'));
                    }
                }, 400);
                if (noResultsMsg) noResultsMsg.classList.remove('visible');
            });
        }
        // Atalho '/' para focar no campo
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchInput &&
                document.activeElement.tagName !== 'INPUT' &&
                document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // 7. Remove as animações de entrada após a conclusão para evitar que elas reiniciem em mudanças de layout/redimensionamentos
    function removeEntranceAnimations() {
        const animatedElements = document.querySelectorAll(
            '.action-bar, .profile-card, .search-container, .link-card, .footer'
        );
        animatedElements.forEach(el => {
            el.style.animation = 'none';
        });
    }

    // Remove as animações após 2.5 segundos (tempo suficiente para todas terminarem)
    setTimeout(removeEntranceAnimations, 2500);

    // Remove imediatamente ao focar no campo de busca para evitar flicker em interações rápidas
    if (searchInput) {
        searchInput.addEventListener('focus', removeEntranceAnimations, { once: true });
    }
});

