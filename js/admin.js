// === ПАНЕЛЬ АДМИНИСТРАТОРА ===
class AdminManager {
    constructor() { this.setupEventListeners(); }

    setupEventListeners() {
        document.getElementById('adminBtn').addEventListener('click', () => {
            if (!auth.isAdmin()) return alert('Доступ запрещен');
            document.getElementById('adminModal').classList.add('active');
            this.renderList();
        });
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-tab, .admin-tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(e.target.dataset.tab).classList.add('active');
            e.target.classList.add('active');
        }));
        document.getElementById('createServiceForm').addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('editServiceForm').addEventListener('submit', (e) => this.handleEdit(e));
    }

    renderList() {
        const s = db.getServices();
        document.getElementById('adminServicesList').innerHTML = s.length ? s.map(service => `
            <div class="admin-service-row">
                <div><h4>${service.name}</h4><p>Мастер: ${service.master}</p></div>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-outline btn-edit" data-id="${service.id}">Редакт.</button>
                    <button class="btn btn-primary btn-delete" data-id="${service.id}">Удалить</button>
                </div>
            </div>
        `).join('') : '<p>Нет услуг</p>';

        document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', e => this.openEdit(parseInt(e.target.dataset.id))));
        document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', e => {
            if (confirm('Удалить?')) { db.deleteService(parseInt(e.target.dataset.id)); this.renderList(); services.renderServices(); }
        }));
    }

    handleCreate(e) {
        e.preventDefault();
        db.createService({
            name: document.getElementById('serviceName').value, description: document.getElementById('serviceDescription').value,
            category: document.getElementById('serviceCategory').value, master: document.getElementById('serviceMaster').value, address: document.getElementById('serviceAddress').value
        });
        alert('Услуга создана'); e.target.reset(); this.renderList(); services.renderServices();
    }

    openEdit(id) {
        const s = db.getServiceById(id);
        if (!s) return;
        document.getElementById('editServiceId').value = s.id;
        document.getElementById('editServiceName').value = s.name;
        document.getElementById('editServiceDescription').value = s.description;
        document.getElementById('editServiceCategory').value = s.category;
        document.getElementById('editServiceMaster').value = s.master;
        document.getElementById('editServiceAddress').value = s.address;
        document.getElementById('editServiceModal').classList.add('active');
    }

    handleEdit(e) {
        e.preventDefault();
        db.updateService(parseInt(document.getElementById('editServiceId').value), {
            name: document.getElementById('editServiceName').value, description: document.getElementById('editServiceDescription').value,
            category: document.getElementById('editServiceCategory').value, master: document.getElementById('editServiceMaster').value, address: document.getElementById('editServiceAddress').value
        });
        alert('Обновлено'); document.getElementById('editServiceModal').classList.remove('active');
        this.renderList(); services.renderServices();
    }
}
const admin = new AdminManager();