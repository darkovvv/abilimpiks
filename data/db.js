// === БАЗА ДАННЫХ (LocalStorage) ===
class Database {
    constructor() {
        this.initDB();
    }

    initDB() {
        // Пользователи
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                { id: 1, firstName: 'Иван', lastName: 'Петров', email: 'admin@example.com', password: 'admin123', phone: '+79991234567', address: 'Москва, ул. Примерная, 1', role: 'admin', cart: [], orders: [] },
                { id: 2, firstName: 'Мария', lastName: 'Сидорова', email: 'user@example.com', password: 'user123', phone: '+79997654321', address: 'Санкт-Петербург, ул. Новая, 5', role: 'user', cart: [], orders: [] }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }

        // Услуги
        if (!localStorage.getItem('services')) {
            const defaultServices = [
                { id: 1, name: 'Ремонт смартфонов', description: 'Профессиональный ремонт любых моделей смартфонов', category: 'repair', master: 'Алексей Петров', address: 'Москва, ул. Ленина, 10' },
                { id: 2, name: 'Обучение JavaScript', description: 'Полный курс JavaScript для начинающих', category: 'education', master: 'Сергей Иванов', address: 'Онлайн' },
                { id: 3, name: 'Веб-дизайн', description: 'Создание современного дизайна для вашего сайта', category: 'design', master: 'Елена Смирнова', address: 'Санкт-Петербург, ул. Дизайнеров, 3' },
                { id: 4, name: 'Консультация по SEO', description: 'Профессиональная консультация по оптимизации сайта', category: 'consultation', master: 'Владимир Козлов', address: 'Москва, ул. Интернет, 25' },
                { id: 5, name: 'Помощь с ДЗ', description: 'Помощь в выполнении домашних заданий по различным предметам', category: 'help', master: 'Ольга Новикова', address: 'Казань, ул. Учебная, 7' },
                { id: 6, name: 'Ремонт ноутбуков', description: 'Быстрый и качественный ремонт ноутбуков', category: 'repair', master: 'Дмитрий Федоров', address: 'Москва, ул. Техническая, 15' }
            ];
            localStorage.setItem('services', JSON.stringify(defaultServices));
        }

        // Мастера
        if (!localStorage.getItem('masters')) {
            const defaultMasters = [
                { id: 1, name: 'Алексей Петров', description: 'Специалист по ремонту электроники', experience: '10 лет опыта', motto: 'Качество - наш приоритет', skills: ['Ремонт смартфонов', 'Ремонт планшетов', 'Диагностика'] },
                { id: 2, name: 'Сергей Иванов', description: 'Опытный преподаватель программирования', experience: '8 лет опыта', motto: 'Знание - сила', skills: ['JavaScript', 'Python', 'Web Development'] },
                { id: 3, name: 'Елена Смирнова', description: 'Креативный веб-дизайнер с портфолио', experience: '7 лет опыта', motto: 'Красота в деталях', skills: ['UI/UX Design', 'Figma', 'Web Design'] }
            ];
            localStorage.setItem('masters', JSON.stringify(defaultMasters));
        }
    }

    // Методы пользователей
    getUsers() { return JSON.parse(localStorage.getItem('users')) || []; }
    getUserById(id) { return this.getUsers().find(u => u.id === id); }
    getUserByEmail(email) { return this.getUsers().find(u => u.email === email); }
    createUser(userData) {
        const users = this.getUsers();
        const newUser = { id: Math.max(...users.map(u => u.id), 0) + 1, ...userData, role: 'user', cart: [], orders: [] };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
    }
    updateUser(id, userData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            localStorage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    // Методы услуг
    getServices() { return JSON.parse(localStorage.getItem('services')) || []; }
    getServiceById(id) { return this.getServices().find(s => s.id === id); }
    createService(serviceData) {
        const services = this.getServices();
        const newService = { id: Math.max(...services.map(s => s.id), 0) + 1, ...serviceData };
        services.push(newService);
        localStorage.setItem('services', JSON.stringify(services));
        return newService;
    }
    updateService(id, serviceData) {
        const services = this.getServices();
        const index = services.findIndex(s => s.id === id);
        if (index !== -1) {
            services[index] = { ...services[index], ...serviceData };
            localStorage.setItem('services', JSON.stringify(services));
            return services[index];
        }
        return null;
    }
    deleteService(id) {
        const services = this.getServices();
        localStorage.setItem('services', JSON.stringify(services.filter(s => s.id !== id)));
        return true;
    }

    // Методы мастеров
    getMasters() { return JSON.parse(localStorage.getItem('masters')) || []; }

    // Методы корзины
    addToCart(userId, serviceId) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user && !user.cart.includes(serviceId)) {
            user.cart.push(serviceId);
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    removeFromCart(userId, serviceId) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.cart = user.cart.filter(id => id !== serviceId);
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    getCart(userId) {
        const user = this.getUserById(userId);
        return user ? user.cart.map(id => this.getServiceById(id)).filter(s => s) : [];
    }
}
const db = new Database();