// === ОСНОВНОЕ ПРИЛОЖЕНИЕ ===
class App {
    constructor() {
        this.setupTheme();
        this.setupAccessibility();
        this.setupNavigation();
        this.setupSlider();
        this.initializeApp();
    }

    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
        });
    }

    setupAccessibility() {
        const accessToggle = document.getElementById('accessibilityToggle');
        if (localStorage.getItem('largeText') === 'true') document.body.classList.add('large-text');
        
        accessToggle.addEventListener('click', () => {
            document.body.classList.toggle('large-text');
            localStorage.setItem('largeText', document.body.classList.contains('large-text'));
        });
    }



    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(link.dataset.page);
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    showPage(pageName) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(pageName);
        if (page) {
            page.classList.add('active');
            if (pageName === 'cart') services.renderCart();
            else if (pageName === 'services') services.renderServices();
            else if (pageName === 'masters') services.renderMastersDetail();
        }
    }

    setupSlider() {
        const container = document.querySelector('.slider-container');
        const slides = document.querySelectorAll('.slide');
        let current = 0;

        // Очищаем точки (на случай повторного вызова)
        const dotsContainer = document.getElementById('sliderDots');
        dotsContainer.innerHTML = '';

        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(i));
            dotsContainer.appendChild(dot);
        });

        this.goToSlide = (i) => {
            // Динамический просчет (Фикс адаптивности для ПК и телефонов)
            const slideWidth = slides[0].getBoundingClientRect().width;
            const containerWidth = container.parentElement.getBoundingClientRect().width;
            
            // Считаем сколько слайдов помещается на экране
            const visibleSlides = Math.round(containerWidth / slideWidth);
            
            // Вычисляем максимум, чтобы не листать в пустое пространство
            const maxIndex = Math.max(0, slides.length - visibleSlides);

            // Обработка границ для зацикливания
            if (i < 0) current = maxIndex;
            else if (i > maxIndex) current = 0;
            else current = i;

            // Сдвигаем на нужное кол-во пикселей
            container.style.transform = `translateX(-${current * slideWidth}px)`;
            
            document.querySelectorAll('.slider-dot').forEach((d, index) => {
                d.classList.toggle('active', index === current);
            });
        };

        document.getElementById('sliderPrev').addEventListener('click', () => this.goToSlide(current - 1));
        document.getElementById('sliderNext').addEventListener('click', () => this.goToSlide(current + 1));
        
        // Автопрокрутка
        let autoSlide = setInterval(() => this.goToSlide(current + 1), 5000);

        // Чтобы адаптивность не ломалась при повороте экрана смартфона или ресайзе окна ПК
        window.addEventListener('resize', () => {
            this.goToSlide(current);
        });

        // Останавливаем автопрокрутку при наведении мыши
        container.addEventListener('mouseenter', () => clearInterval(autoSlide));
        container.addEventListener('mouseleave', () => autoSlide = setInterval(() => this.goToSlide(current + 1), 5000));
    }

    initializeApp() {
        auth.updateUI();
        services.init();
        this.showPage('home');
    }
}
document.addEventListener('DOMContentLoaded', () => window.app = new App());