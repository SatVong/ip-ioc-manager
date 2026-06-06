// Импорт общих функций
import { checkAuth, logout, hasPermission, authFetch, toggleTheme, loadSavedTheme } from '../app.js';
import { CONFIG } from '../config.js';

let currentUserId = null;

// Загрузка сохранённой темы
function loadSavedThemeLocal() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            themeToggle.className = 'fas fa-sun';
        }
    } else {
        html.removeAttribute('data-theme');
        if (themeToggle) {
            themeToggle.className = 'fas fa-moon';
        }
    }
}

// Вызываем при загрузке
loadSavedThemeLocal();

// Проверка доступа к странице пользователей
async function checkAccess() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'admin') {
        return true;
    }
    
    if (user.can_manage_users === true) {
        return true;
    }
    
    alert('У вас нет прав для доступа к этой странице');
    window.location.href = '/';
    return false;
}

// Загрузка списка пользователей
async function loadUsers() {
    if (!await checkAccess()) return;
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/users`);
        if (!response) return;
        
        const users = await response.json();
        renderUsersTable(users);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        alert('Не удалось загрузить список пользователей');
    }
}

// Отображение таблицы пользователей
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'admin';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        
        let actionButtons = '';
        
        if (isAdmin) {
            actionButtons = `
                <button class="btn btn-secondary" style="padding: 4px 8px;" onclick="editUser(${user.id})" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.id !== currentUser.id ? `
                    <button class="btn btn-secondary" style="padding: 4px 8px;" onclick="toggleUserStatus(${user.id}, ${user.is_active})" title="${user.is_active ? 'Заблокировать' : 'Разблокировать'}">
                        <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; background-color: #dc3545; color: white;" onclick="deleteUser(${user.id}, '${user.username}')" title="Удалить навсегда">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : ''}
            `;
        } else {
            actionButtons = `
                <button class="btn btn-secondary" style="padding: 4px 8px;" onclick="viewUser(${user.id})" title="Просмотреть">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        }
        
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.full_name || '-'}</td>
            <td>${user.position || '-'}</td>
            <td>${user.department || '-'}</td>
            <td>${user.email || '-'}</td>
            <td>
                <span class="badge-${user.role === 'admin' ? 'admin' : 'user'}">
                    ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </span>
            </td>
            <td>
                <span class="badge-${user.is_active ? 'active' : 'inactive'}">
                    ${user.is_active ? 'Активен' : 'Заблокирован'}
                </span>
            </td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Никогда'}</td>
            <td>${actionButtons}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Просмотр пользователя
async function viewUser(id) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/users/${id}`);
        if (!response) return;
        
        const user = await response.json();
        
        currentUserId = user.id;
        document.getElementById('modalTitle').textContent = 'Просмотр пользователя';
        document.getElementById('userId').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('username').disabled = true;
        document.getElementById('password').required = false;
        document.getElementById('password').placeholder = 'Скрыто';
        document.getElementById('password').disabled = true;
        document.getElementById('fullName').value = user.full_name || '';
        document.getElementById('fullName').disabled = true;
        document.getElementById('position').value = user.position || '';
        document.getElementById('position').disabled = true;
        document.getElementById('department').value = user.department || '';
        document.getElementById('department').disabled = true;
        document.getElementById('email').value = user.email || '';
        document.getElementById('email').disabled = true;
        document.getElementById('role').value = user.role || 'user';
        document.getElementById('role').disabled = true;
        document.getElementById('canCreate').checked = user.can_create;
        document.getElementById('canCreate').disabled = true;
        document.getElementById('canEdit').checked = user.can_edit;
        document.getElementById('canEdit').disabled = true;
        document.getElementById('canDelete').checked = user.can_delete;
        document.getElementById('canDelete').disabled = true;
        document.getElementById('canImport').checked = user.can_import;
        document.getElementById('canImport').disabled = true;
        document.getElementById('canExport').checked = user.can_export;
        document.getElementById('canExport').disabled = true;
        document.getElementById('canManageUsers').checked = user.can_manage_users;
        document.getElementById('canManageUsers').disabled = true;
        document.getElementById('isActive').checked = user.is_active;
        document.getElementById('isActive').disabled = true;
        
        document.querySelector('.modal-footer').style.display = 'none';
        
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        alert('Не удалось загрузить данные пользователя');
    }
}

function openUserModal() {
    currentUserId = null;
    document.getElementById('modalTitle').textContent = 'Новый пользователь';
    document.getElementById('userForm').reset();
    document.getElementById('password').required = true;
    document.getElementById('userModal').style.display = 'block';
}

async function editUser(id) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/users/${id}`);
        if (!response) return;
        
        const user = await response.json();
        
        currentUserId = user.id;
        document.getElementById('modalTitle').textContent = 'Редактирование пользователя';
        document.getElementById('userId').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('username').disabled = true;
        document.getElementById('password').required = false;
        document.getElementById('fullName').value = user.full_name || '';
        document.getElementById('position').value = user.position || '';
        document.getElementById('department').value = user.department || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('role').value = user.role || 'user';
        document.getElementById('canCreate').checked = user.can_create;
        document.getElementById('canEdit').checked = user.can_edit;
        document.getElementById('canDelete').checked = user.can_delete;
        document.getElementById('canImport').checked = user.can_import;
        document.getElementById('canExport').checked = user.can_export;
        document.getElementById('canManageUsers').checked = user.can_manage_users;
        document.getElementById('isActive').checked = user.is_active;
        
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        alert('Не удалось загрузить данные пользователя');
    }
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('username').disabled = false;
    document.getElementById('password').disabled = false;
    document.getElementById('password').placeholder = '';
    document.getElementById('fullName').disabled = false;
    document.getElementById('position').disabled = false;
    document.getElementById('department').disabled = false;
    document.getElementById('email').disabled = false;
    document.getElementById('role').disabled = false;
    document.getElementById('canCreate').disabled = false;
    document.getElementById('canEdit').disabled = false;
    document.getElementById('canDelete').disabled = false;
    document.getElementById('canImport').disabled = false;
    document.getElementById('canExport').disabled = false;
    document.getElementById('canManageUsers').disabled = false;
    document.getElementById('isActive').disabled = false;
    document.querySelector('.modal-footer').style.display = 'flex';

    // Очищаем значения
    document.getElementById('fullName').value = '';
    document.getElementById('position').value = '';
    document.getElementById('department').value = '';
    document.getElementById('email').value = '';
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        username: document.getElementById('username').value,
        full_name: document.getElementById('fullName').value,
        position: document.getElementById('position').value,
        department: document.getElementById('department').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        can_create: document.getElementById('canCreate').checked,
        can_edit: document.getElementById('canEdit').checked,
        can_delete: document.getElementById('canDelete').checked,
        can_import: document.getElementById('canImport').checked,
        can_export: document.getElementById('canExport').checked,
        can_manage_users: document.getElementById('canManageUsers').checked,
        is_active: document.getElementById('isActive').checked
    };
    
    const password = document.getElementById('password').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        let response;
        if (currentUserId) {
            response = await authFetch(`${CONFIG.API_URL}/users/${currentUserId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            if (!password) {
                alert('Пароль обязателен для нового пользователя');
                return;
            }
            response = await authFetch(`${CONFIG.API_URL}/users`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }
        
        if (!response) return;
        
        if (response.ok) {
            alert(currentUserId ? 'Пользователь обновлён' : 'Пользователь создан');
            closeUserModal();
            loadUsers();
        } else {
            const error = await response.json();
            alert(error.error || 'Ошибка при сохранении');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при сохранении пользователя');
    }
});

async function toggleUserStatus(id, currentStatus) {
    if (!confirm(`Вы уверены, что хотите ${currentStatus ? 'заблокировать' : 'разблокировать'} пользователя?`)) {
        return;
    }
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/users/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active: !currentStatus })
        });
        
        if (!response) return;
        
        if (response.ok) {
            alert(`✅ Пользователь ${!currentStatus ? 'разблокирован' : 'заблокирован'}`);
            loadUsers();
        } else {
            const error = await response.json();
            alert(error.error || 'Ошибка при изменении статуса');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при изменении статуса');
    }
}

async function deleteUser(id, username) {
    if (!confirm(`⚠️ Вы уверены, что хотите полностью удалить пользователя "${username}"?`)) {
        return;
    }
    
    if (!confirm('Это окончательное удаление. Продолжить?')) {
        return;
    }
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/users/${id}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        if (response.ok) {
            alert(`✅ Пользователь "${username}" полностью удалён`);
            loadUsers();
        } else {
            const error = await response.json();
            alert(error.error || 'Ошибка при удалении пользователя');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении пользователя');
    }
}

// Инициализация
window.onload = async () => {
    loadSavedThemeLocal();
    if (!checkAuth()) return;
    await loadUsers();
};

// Экспорт в глобальную область
window.editUser = editUser;
window.viewUser = viewUser;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.toggleTheme = toggleTheme;
window.logout = logout;