// Импорт общих функций
import { checkAuth, logout, authFetch, toggleTheme, loadSavedTheme } from '../app.js';
import { CONFIG } from '../config.js';

let currentUser = null;

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

loadSavedThemeLocal();

// Загрузка данных профиля
async function loadProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser = user;
    
    document.getElementById('displayName').textContent = user.full_name || user.username;
    document.getElementById('displayRole').textContent = 
        user.role === 'admin' ? 'Администратор' : 'Пользователь';
    
    document.getElementById('infoUsername').textContent = user.username;
    document.getElementById('infoFullName').textContent = user.full_name || '-';
    document.getElementById('infoPosition').textContent = user.position || '-';
    document.getElementById('infoDepartment').textContent = user.department || '-';
    document.getElementById('infoEmail').textContent = user.email || '-';
    document.getElementById('infoRole').textContent = 
        user.role === 'admin' ? 'Администратор' : 'Пользователь';
    document.getElementById('infoStatus').textContent = 
        user.is_active ? 'Активен' : 'Заблокирован';
    
    if (user.created_at) {
        document.getElementById('infoCreated').textContent = 
            new Date(user.created_at).toLocaleString();
    }
    
    if (user.last_login) {
        document.getElementById('infoLastLogin').textContent = 
            new Date(user.last_login).toLocaleString();
    }

    renderPermissions(user);
}

function renderPermissions(user) {
    const permissionsSection = document.getElementById('permissionsSection');
    const permissionsGrid = document.getElementById('permissionsGrid');
    
    if (!permissionsSection || !permissionsGrid) return;
    
    if (user.role === 'admin') {
        permissionsSection.style.display = 'block';
        permissionsGrid.innerHTML = `
            <div class="permission-item allowed">
                <div class="permission-icon allowed"><i class="fas fa-check-circle"></i></div>
                <span class="permission-name">Полные права администратора</span>
                <span class="permission-badge allowed">Всё разрешено</span>
            </div>
        `;
        // Показываем секцию очистки для админа
        showAdminClearSection(true);
        return;
    }
    
    showAdminClearSection(false);
      
    const permissions = [
        { key: 'can_create', name: 'Создание записей', icon: 'fa-plus-circle' },
        { key: 'can_edit', name: 'Редактирование', icon: 'fa-edit' },
        { key: 'can_delete', name: 'Удаление', icon: 'fa-trash-alt' },
        { key: 'can_import', name: 'Импорт', icon: 'fa-upload' },
        { key: 'can_export', name: 'Экспорт', icon: 'fa-download' },
        { key: 'can_manage_users', name: 'Управление пользователями', icon: 'fa-users-cog' }
    ];
    
    let html = '';
    permissions.forEach(perm => {
        const allowed = user[perm.key] === true;
        html += `
            <div class="permission-item ${allowed ? 'allowed' : 'denied'}" 
                 title="${allowed ? '✅ У вас есть право на это действие' : '❌ Это действие недоступно'}">
                <div class="permission-icon ${allowed ? 'allowed' : 'denied'}">
                    <i class="fas ${perm.icon}"></i>
                </div>
                <span class="permission-name">${perm.name}</span>
                <span class="permission-badge ${allowed ? 'allowed' : 'denied'}">
                    ${allowed ? 'Разрешено' : 'Запрещено'}
                </span>
            </div>
        `;
    });
    
    permissionsGrid.innerHTML = html;
    permissionsSection.style.display = 'block';
}

function togglePasswordSection() {
    const section = document.getElementById('passwordSection');
    if (section) {
        section.classList.toggle('show');
    }
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('passwordSuccess').textContent = '';
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
    const successDiv = document.getElementById('passwordSuccess');
    const btn = document.getElementById('changePasswordBtn');

    if (!currentPassword || !newPassword || !confirmPassword) {
        errorDiv.textContent = 'Заполните все поля';
        return;
    }

    if (newPassword.length < 12) {
        errorDiv.textContent = 'Пароль должен быть не менее 12 символов';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Пароли не совпадают';
        return;
    }

    errorDiv.textContent = '';
    successDiv.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

    try {
        const response = await authFetch(`${CONFIG.API_URL}/users/${currentUser.id}/password`, {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        if (!response) return;

        if (response.ok) {
            successDiv.textContent = 'Пароль успешно изменён';
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            setTimeout(() => {
                togglePasswordSection();
                successDiv.textContent = '';
            }, 2000);
        } else {
            const error = await response.json();
            errorDiv.textContent = error.error || 'Ошибка при смене пароля';
        }
    } catch (error) {
        console.error('Ошибка:', error);
        errorDiv.textContent = 'Ошибка при смене пароля';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Сохранить новый пароль';
    }
}

// ==================== ОЧИСТКА ТАБЛИЦ ====================

async function clearTable(tableName, apiEndpoint, displayName) {
    // Запрашиваем подтверждение
    const confirmation = prompt(
        `⚠️ ВНИМАНИЕ! Вы собираетесь полностью очистить таблицу "${displayName}".\n\n` +
        `Это действие удалит ВСЕ записи без возможности восстановления.\n\n` +
        `Для подтверждения введите: "Я хочу полностью очистить базу и понимаю последствия"\n\n` +
        `(Введите точную фразу в кавычках)`
    );
    
    const requiredPhrase = "Я хочу полностью очистить базу и понимаю последствия";
    
    if (confirmation !== requiredPhrase) {
        alert('❌ Очистка отменена. Введена неверная фраза подтверждения.');
        return;
    }
    
    // Дополнительное подтверждение
    if (!confirm(`Последний вопрос: Вы уверены, что хотите полностью очистить таблицу "${displayName}"?`)) {
        alert('❌ Очистка отменена.');
        return;
    }
    
    try {
        // Показываем индикатор загрузки
        const btn = document.getElementById(tableName === 'ip' ? 'clearIpBtn' : 'clearIocBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Очистка...';
        
        const response = await authFetch(`${CONFIG.API_URL}/admin/${apiEndpoint}`, {
            method: 'DELETE'
        });
        
        btn.disabled = false;
        btn.innerHTML = originalText;
        
        if (!response) return;
        
        if (response.ok) {
            const result = await response.json();
            alert(`✅ ${result.message || `Таблица "${displayName}" успешно очищена`}`);
            
            // Если мы на главной странице, обновляем таблицу
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                // Обновляем глобальные переменные и перерисовываем таблицу
                if (typeof loadDataFromAPI === 'function') {
                    await loadDataFromAPI();
                    if (typeof renderTable === 'function') renderTable();
                    if (typeof updateStats === 'function') updateStats();
                }
            }
        } else {
            const error = await response.json();
            alert(`❌ Ошибка: ${error.error || 'Не удалось очистить таблицу'}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка при очистке таблицы');
    }
}

// ==================== ОЧИСТКА ПОЛЬЗОВАТЕЛЕЙ ====================
async function clearUsers() {
    // Запрашиваем подтверждение
    const confirmation = prompt(
        `⚠️ ВНИМАНИЕ! Вы собираетесь полностью очистить список пользователей.\n\n` +
        `Это действие удалит ВСЕХ пользователей, КРОМЕ ВАС (текущего администратора).\n\n` +
        `Для подтверждения введите: "Я хочу полностью очистить список пользователей и понимаю последствия"\n\n` +
        `(Введите точную фразу в кавычках)`
    );
    
    const requiredPhrase = "Я хочу полностью очистить список пользователей и понимаю последствия";
    
    if (confirmation !== requiredPhrase) {
        alert('❌ Очистка отменена. Введена неверная фраза подтверждения.');
        return;
    }
    
    // Дополнительное подтверждение
    if (!confirm(`Последний вопрос: Вы уверены, что хотите полностью очистить список пользователей?\nБудут удалены ВСЕ пользователи, КРОМЕ ВАС.`)) {
        alert('❌ Очистка отменена.');
        return;
    }
    
    try {
        const btn = document.getElementById('clearUsersBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Очистка...';
        
        const response = await authFetch(`${CONFIG.API_URL}/admin/clear-users`, {
            method: 'DELETE'
        });
        
        btn.disabled = false;
        btn.innerHTML = originalText;
        
        if (!response) return;
        
        if (response.ok) {
            const result = await response.json();
            alert(`✅ ${result.message || 'Пользователи успешно очищены'}`);
            
            // Если мы на странице пользователей, обновляем таблицу
            if (window.location.pathname.includes('users.html')) {
                if (typeof loadUsers === 'function') {
                    await loadUsers();
                }
            }
        } else {
            const error = await response.json();
            alert(`❌ Ошибка: ${error.error || 'Не удалось очистить пользователей'}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка при очистке пользователей');
    }
}

// Функция для показа/скрытия админ-секции
function showAdminClearSection(isAdmin) {
    const adminSection = document.getElementById('adminClearSection');
    if (adminSection) {
        adminSection.style.display = isAdmin ? 'block' : 'none';
    }
}

// В функции renderPermissions добавьте вызов showAdminClearSection
// Найдите в renderPermissions блок с админом и добавьте вызов

// Инициализация
window.onload = async () => {
    loadSavedThemeLocal();
    if (!checkAuth()) return;
    await loadProfile();
    
    // Добавляем обработчики для кнопок очистки
    const clearIpBtn = document.getElementById('clearIpBtn');
    const clearIocBtn = document.getElementById('clearIocBtn');
    const clearUsersBtn = document.getElementById('clearUsersBtn');
    
    if (clearIpBtn) {
        clearIpBtn.onclick = () => clearTable('ip', 'clear-ip-records', 'IP источники');
    }
    if (clearIocBtn) {
        clearIocBtn.onclick = () => clearTable('ioc', 'clear-ioc-records', 'IOC Хеши');
    }
    if (clearUsersBtn) {
        clearUsersBtn.onclick = () => clearUsers();
    }
};

// Экспорт в глобальную область
window.togglePasswordSection = togglePasswordSection;
window.changePassword = changePassword;
window.toggleTheme = toggleTheme;
window.logout = logout;