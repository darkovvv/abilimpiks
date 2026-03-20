
// === УПРАВЛЕНИЕ УСЛУГАМИ ===
class ServicesManager {
    constructor() {
        this.services = [];
        this.filters = {
            categories: [],
            priceRange: [0, 10000],
            master: '',
            search: ''
        };
        
        this.init();
    }

    // Инициализация
    async init() {
        await this.loadServices();
        this.setupEventListeners();
        this.renderAll();
    }

    // Загрузка данных
    async loadServices() {
        try {
            this.services = db.getServices() || [];
            this.masters = db.getMasters() || [];
        } catch (error) {
            console.error('Ошибка загрузки услуг:', error);
            this.showError('Не удалось загрузить услуги');
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Фильтры
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('filter-category')) {
                this.handleCategoryFilter(e.target);
            }
            if (e.target.classList.contains('filter-master')) {
                this.handleMasterFilter(e.target);
            }
        });

        // Поиск
        const searchInput = document.getElementById('searchServices');
        if (searchInput) {
            searchInput.addEventListener('input', 
                debounce(() => this.handleSearch(searchInput.value), 300)
            );
        }

        // Кнопки добавления в корзину
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-cart')) {
                this.handleAddToCart(e.target.dataset.serviceId);
            }
            if (e.target.classList.contains('cart-item-remove')) {
                this.handleRemoveFromCart(e.target.dataset.id);
            }
        });

        // Маркер на карте
        this.setupMapMarker();
    }

    // === ОСНОВНЫЕ МЕТОДЫ ===

    getFilteredServices() {
        return this.services.filter(service => {
            // Фильтр по категориям
            if (this.filters.categories.length > 0 && 
                !this.filters.categories.includes(service.category)) {
                return false;
            }

            // Фильтр по мастеру
            if (this.filters.master && 
                service.master !== this.filters.master) {
                return false;
            }

            // ИСПРАВЛЕНО: фильтр по цене
            if (service.price !== undefined) {
                const price = Number(service.price);
                // Проверяем, что цена входит в диапазон
                if (price < this.filters.priceRange[0] || 
                    price > this.filters.priceRange[1]) {
                    return false;
                }
            }

            // Фильтр по поиску
            if (this.filters.search && 
                !this.matchesSearch(service, this.filters.search)) {
                return false;
            }

            return true;
        });
    }

    matchesSearch(service, query) {
        const searchTerm = query.toLowerCase();
        return service.name?.toLowerCase().includes(searchTerm) ||
               service.description?.toLowerCase().includes(searchTerm) ||
               service.master?.toLowerCase().includes(searchTerm);
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===

    handleCategoryFilter(checkbox) {
        if (checkbox.checked) {
            this.filters.categories.push(checkbox.value);
        } else {
            this.filters.categories = this.filters.categories.filter(
                c => c !== checkbox.value
            );
        }
        this.renderServices();
    }

    handleMasterFilter(select) {
        this.filters.master = select.value;
        this.renderServices();
    }

    handleSearch(query) {
        this.filters.search = query;
        this.renderServices();
    }

    // ИСПРАВЛЕНО: обработчик ползунка цены
    handlePriceFilter(value) {
        // Преобразуем значение в число и обновляем фильтр
        const priceValue = parseInt(value, 10);
        this.filters.priceRange[1] = priceValue;
        
        // Обновляем отображение цены
        const priceDisplay = document.querySelector('.price-current');
        if (priceDisplay) {
            priceDisplay.textContent = `${priceValue} ₽`;
        }
        
        // Обновляем фон ползунка (красный цвет)
        this.updatePriceSliderBackground(priceValue);
        
        // Применяем фильтр
        this.renderServices();
    }
    
    // ИСПРАВЛЕНО: обновление фона ползунка
    updatePriceSliderBackground(value) {
        const slider = document.querySelector('.price-slider');
        if (!slider) return;
        
        const min = slider.min || 0;
        const max = slider.max || 10000;
        const percentage = ((value - min) / (max - min)) * 100;
        
        // Устанавливаем градиент для красного цвета #d62839
        slider.style.background = `linear-gradient(to right, #d62839 0%, #d62839 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
    }

    async handleAddToCart(serviceId) {
        if (!auth.isLoggedIn()) {
            this.showNotification('Войдите в аккаунт', 'warning');
            auth.openModal('loginModal');
            return;
        }

        try {
            const service = this.services.find(s => s.id === parseInt(serviceId));
            if (!service) throw new Error('Услуга не найдена');

            await db.addToCart(auth.getCurrentUser().id, serviceId);
            this.showNotification('Услуга добавлена в корзину', 'success');
            this.updateCartCounter();
            this.renderCart();
        } catch (error) {
            console.error('Ошибка добавления в корзину:', error);
            this.showNotification('Не удалось добавить услугу', 'error');
        }
    }

    handleRemoveFromCart(serviceId) {
        try {
            db.removeFromCart(auth.getCurrentUser().id, parseInt(serviceId));
            this.showNotification('Услуга удалена из корзины', 'info');
            this.updateCartCounter();
            this.renderCart();
        } catch (error) {
            console.error('Ошибка удаления из корзины:', error);
        }
    }

    // === НАСТРОЙКА МАРКЕРА ===

    setupMapMarker() {
        const marker = document.getElementById('mapMarker');
        if (!marker) return;

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const onMouseDown = (e) => {
            isDragging = true;
            const rect = marker.parentElement.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseFloat(marker.style.left) || 50;
            startTop = parseFloat(marker.style.top) || 50;
            
            marker.classList.add('dragging');
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const rect = marker.parentElement.getBoundingClientRect();
            const deltaX = ((e.clientX - startX) / rect.width) * 100;
            const deltaY = ((e.clientY - startY) / rect.height) * 100;
            
            const newLeft = Math.max(0, Math.min(100, startLeft + deltaX));
            const newTop = Math.max(0, Math.min(100, startTop + deltaY));
            
            marker.style.left = `${newLeft}%`;
            marker.style.top = `${newTop}%`;
            
            this.markerPosition = { x: newLeft, y: newTop };
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            marker.classList.remove('dragging');
            
            this.onMarkerPositionChange?.(this.markerPosition);
        };

        marker.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        this.cleanup = () => {
            marker.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }

    // === МЕТОДЫ ОТОБРАЖЕНИЯ ===

    renderAll() {
        this.renderServices();
        this.renderFilterOptions();
        this.renderMasters();
        this.renderMastersDetail();
        this.renderCart();
    }

    renderServices(services = null) {
        const list = document.getElementById('servicesList');
        if (!list) return;

        const servicesToRender = services || this.getFilteredServices();

        if (!servicesToRender.length) {
            list.innerHTML = this.getEmptyStateHTML('Услуги не найдены', 'Попробуйте изменить параметры фильтрации');
            return;
        }

        list.innerHTML = servicesToRender.map(service => this.getServiceCardHTML(service)).join('');
    }

    // ИСПРАВЛЕНО: убраны картинки
    getServiceCardHTML(service) {
        return `
            <div class="service-card" data-service-id="${service.id}">
                <div class="service-content">
                    <h3>${this.escapeHTML(service.name)}</h3>
                    <span class="service-category">${this.getCategoryLabel(service.category)}</span>
                    <p class="service-description">${this.escapeHTML(service.description)}</p>
                    <div class="service-meta">
                        <p class="service-master">
                            <i class="icon-master"></i> ${this.escapeHTML(service.master)}
                        </p>
                        <p class="service-address">
                            <i class="icon-location"></i> ${this.escapeHTML(service.address)}
                        </p>
                        ${service.price ? `<p class="service-price">${service.price} ₽</p>` : ''}
                    </div>
                    <div class="service-buttons">
                        <button class="btn btn-primary btn-add-cart" 
                                data-service-id="${service.id}">
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ИСПРАВЛЕНО: renderFilterOptions с правильным ползунком
    renderFilterOptions() {
        const container = document.getElementById('filterOptions');
        if (!container) return;

        const categories = [
            { value: 'repair', label: 'Ремонт' },
            { value: 'education', label: 'Обучение' },
            { value: 'design', label: 'Дизайн' },
            { value: 'consultation', label: 'Консультация' },
            { value: 'help', label: 'Помощь' }
        ];

        container.innerHTML = `
            <div class="filter-group">
                <h4>Категории</h4>
                ${categories.map(cat => `
                    <label class="filter-checkbox">
                        <span class="filter-label">${cat.label}</span>
                        <input type="checkbox" 
                               value="${cat.value}" 
                               class="filter-category"
                               ${this.filters.categories.includes(cat.value) ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                `).join('')}
            </div>

            <div class="filter-group">
                <h4>Мастер</h4>
                <select class="filter-master">
                    <option value="">Все мастера</option>
                    ${this.masters.map(m => `
                        <option value="${m.name}" 
                                ${this.filters.master === m.name ? 'selected' : ''}>
                            ${m.name}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="filter-group">
                <h4>Максимальная цена</h4>
                <div class="price-range">
                    <input type="range" 
                           id="priceSlider"
                           class="price-slider" 
                           min="0" 
                           max="10000" 
                           value="${this.filters.priceRange[1]}" 
                           step="100">
                    <div class="price-value">
                        <span class="price-current">${this.filters.priceRange[1]} ₽</span>
                    </div>
                </div>
            </div>

            <button class="btn btn-outline btn-reset-filters">Сбросить фильтры</button>
        `;

        // ИСПРАВЛЕНО: добавляем обработчик для ползунка
        const priceSlider = document.getElementById('priceSlider');
        if (priceSlider) {
            // Устанавливаем начальный фон
            this.updatePriceSliderBackground(this.filters.priceRange[1]);
            
            // Обработчик движения ползунка
            priceSlider.addEventListener('input', (e) => {
                this.handlePriceFilter(e.target.value);
            });
        }

        // Добавляем обработчик для сброса
        container.querySelector('.btn-reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    renderMasters() {
        const list = document.getElementById('mastersList');
        if (!list) return;

        list.innerHTML = this.masters.map(master => `
            <div class="master-card" data-master="${master.name}">
                <h3>${this.escapeHTML(master.name)}</h3>
                <p class="master-motto">"${this.escapeHTML(master.motto)}"</p>
                <p>${this.escapeHTML(master.description)}</p>
                <p class="master-experience">${this.escapeHTML(master.experience)}</p>
            </div>
        `).join('');
    }

    renderMastersDetail() {
        const detail = document.getElementById('mastersDetail');
        if (!detail) return;

        detail.innerHTML = this.masters.map(master => `
            <div class="master-card detailed">
                <h3>${this.escapeHTML(master.name)}</h3>
                <p class="master-motto">"${this.escapeHTML(master.motto)}"</p>
                <p>${this.escapeHTML(master.description)}</p>
                <p class="master-experience">${this.escapeHTML(master.experience)}</p>
                <div class="mt-md">
                    ${master.skills?.map(skill => 
                        `<span class="skill-tag">${this.escapeHTML(skill)}</span>`
                    ).join('') || ''}
                </div>
            </div>
        `).join('');
    }

    renderCart() {
        const items = document.getElementById('cartItems');
        const total = document.getElementById('cartTotal');
        
        if (!items) return;

        if (!auth.isLoggedIn()) {
            items.innerHTML = '<p class="cart-empty">Войдите в аккаунт, чтобы увидеть корзину</p>';
            if (total) total.textContent = '0';
            return;
        }

        const cart = db.getCart(auth.getCurrentUser().id) || [];
        
        if (total) {
            total.textContent = cart.length;
        }

        if (!cart.length) {
            items.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
            return;
        }

        items.innerHTML = cart.map(service => `
            <div class="cart-item" data-service-id="${service.id}">
                <div class="cart-item-info">
                    <h4>${this.escapeHTML(service.name)}</h4>
                    <p class="cart-item-master">${this.escapeHTML(service.master)}</p>
                    ${service.price ? `<p class="cart-item-price">${service.price} ₽</p>` : ''}
                </div>
                <button class="btn btn-outline btn-sm cart-item-remove" 
                        data-id="${service.id}">
                    ✕
                </button>
            </div>
        `).join('');
    }

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

    updateCartCounter() {
        if (!auth.isLoggedIn()) return;
        
        const cart = db.getCart(auth.getCurrentUser().id) || [];
        const counter = document.getElementById('cartCounter');
        if (counter) {
            counter.textContent = cart.length;
            counter.style.display = cart.length ? 'flex' : 'none';
        }
    }

    resetFilters() {
        this.filters = {
            categories: [],
            priceRange: [0, 10000],
            master: '',
            search: ''
        };

        // Сбрасываем UI
        document.querySelectorAll('.filter-category').forEach(cb => {
            cb.checked = false;
        });

        const searchInput = document.getElementById('searchServices');
        if (searchInput) searchInput.value = '';

        this.renderServices();
        this.renderFilterOptions();
    }

    getCategoryLabel(category) {
        const labels = {
            repair: 'Ремонт',
            education: 'Обучение',
            design: 'Дизайн',
            consultation: 'Консультация',
            help: 'Помощь'
        };
        return labels[category] || category;
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getEmptyStateHTML(title, message) {
        return `
            <div class="empty-state">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    destroy() {
        if (this.cleanup) {
            this.cleanup();
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Инициализация
const services = new ServicesManager();