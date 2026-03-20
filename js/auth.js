// === АВТОРИЗАЦИЯ ===
class AuthManager {
    constructor() {
        this.currentUser = this.loadSession();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.openModal('loginModal'));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerBtn').addEventListener('click', () => this.openModal('registerModal'));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        document.getElementById('switchToRegister').addEventListener('click', (e) => { e.preventDefault(); this.closeModal('loginModal'); this.openModal('registerModal'); });
        document.getElementById('switchToLogin').addEventListener('click', (e) => { e.preventDefault(); this.closeModal('registerModal'); this.openModal('loginModal'); });

        document.querySelectorAll('.modal-close, .modal').forEach(el => {
            el.addEventListener('click', (e) => { if (e.target === el) el.closest('.modal') ? el.closest('.modal').classList.remove('active') : el.classList.remove('active'); });
        });
    }

    openModal(id) { document.getElementById(id).classList.add('active'); }
    closeModal(id) { document.getElementById(id).classList.remove('active'); }

    handleLogin(e) {
        e.preventDefault();
        const user = db.getUserByEmail(document.getElementById('loginEmail').value);
        if (!user || user.password !== document.getElementById('loginPassword').value) return alert('Неверный email или пароль');
        this.login(user);
        this.closeModal('loginModal');
        e.target.reset();
    }

    handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        if (password !== document.getElementById('regPasswordConfirm').value) return alert('Пароли не совпадают');
        if (db.getUserByEmail(email)) return alert('Email занят');

        db.createUser({
            firstName: document.getElementById('regFirstName').value, lastName: document.getElementById('regLastName').value,
            email, phone: document.getElementById('regPhone').value, address: document.getElementById('regAddress').value, password
        });

        alert('Успешно! Войдите в аккаунт');
        this.closeModal('registerModal');
        e.target.reset();
        this.openModal('loginModal');
    }

    login(user) { this.currentUser = user; this.saveSession(user); this.updateUI(); app.showPage('home'); }
    logout() { this.currentUser = null; localStorage.removeItem('currentUser'); this.updateUI(); app.showPage('home'); alert('Вы вышли'); }
    saveSession(user) { localStorage.setItem('currentUser', JSON.stringify(user)); }
    loadSession() { const u = localStorage.getItem('currentUser'); return u ? JSON.parse(u) : null; }

    updateUI() {
        document.getElementById('loginBtn').style.display = this.currentUser ? 'none' : 'inline-flex';
        document.getElementById('registerBtn').style.display = this.currentUser ? 'none' : 'inline-flex';
        document.getElementById('logoutBtn').style.display = this.currentUser ? 'inline-flex' : 'none';
        document.getElementById('adminBtn').style.display = this.isAdmin() ? 'inline-flex' : 'none';
    }

    isLoggedIn() { return !!this.currentUser; }
    isAdmin() { return this.currentUser?.role === 'admin'; }
    getCurrentUser() { return this.currentUser; }
}
const auth = new AuthManager();