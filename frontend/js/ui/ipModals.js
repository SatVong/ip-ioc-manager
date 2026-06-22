// ui/ipModals.js
// Модальные окна для добавления IP записи

import { validateDate } from '../validators/date.js';
import { validateIp } from '../validators/ip.js';
import { validateCountry } from '../validators/country.js';
import { createRecord } from '../api/records.js';
import { setSort, setCurrentPage } from '../serverPagination.js';
import { reloadDataAndRender } from '../actions/ipActions.js';
import { CONFIG } from '../config.js';

// ==================== ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ====================

export function openAddModal() {
    const modal = document.getElementById('addRecordModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    document.getElementById('addWhoIn').value = user.full_name || user.username || 'Неизвестно';
    
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentDate = `${dd}.${mm}.${yyyy}`;
    
    document.getElementById('addDate').value = currentDate;
    document.getElementById('addDateIn').value = currentDate;
    
    modal.style.display = 'block';
}

export function closeAddModal() {
    const modal = document.getElementById('addRecordModal');
    modal.style.display = 'none';
    document.getElementById('addRecordForm').reset();
}

// ==================== ВАЛИДАЦИЯ ПОЛЕЙ ФОРМЫ ====================

function collectFormFields() {
    return {
        date: document.getElementById('addDate'),
        from: document.getElementById('addFrom'),
        letter: document.getElementById('addLetter'),
        domain: document.getElementById('addDomain'),
        ip: document.getElementById('addIp'),
        country: document.getElementById('addCountry'),
        owner: document.getElementById('addOwner'),
        noteIn: document.getElementById('addNoteIn'),
        soibInfr: document.getElementById('addSoibInfr') || { value: '' },
        dateIn: document.getElementById('addDateIn')
    };
}

function validateAddForm(fields) {
    const errors = [];

    // Дата получения
    if (!fields.date.value) {
        errors.push('Дата получения обязательна для заполнения');
        fields.date.classList.add('error');
    } else {
        const dateValid = validateDate(fields.date);
        if (dateValid && dateValid.valid === false) {
            errors.push(`Дата получения: ${dateValid.error || 'Неверный формат'}`);
        }
    }

    // Откуда получено
    if (!fields.from.value) {
        errors.push('Поле "Откуда получено" обязательно для заполнения');
        fields.from.classList.add('error');
    } else if (fields.from.value.length > 64) {
        errors.push('Поле "Откуда получено" не может быть длиннее 64 символов');
        fields.from.classList.add('error');
    } else {
        fields.from.classList.remove('error');
    }

    // Дата внесения
    if (!fields.dateIn.value) {
        errors.push('Дата внесения обязательна для заполнения');
        fields.dateIn.classList.add('error');
    } else {
        const dateInValid = validateDate(fields.dateIn);
        if (dateInValid && dateInValid.valid === false) {
            errors.push(`Дата внесения: ${dateInValid.error || 'Неверный формат'}`);
        }
    }

    // Необязательные поля
    if (fields.letter.value && fields.letter.value.length > 24) {
        errors.push('Поле "Раздел письма" не может быть длиннее 24 символов');
        fields.letter.classList.add('error');
    }

    if (fields.domain.value && fields.domain.value.length > 64) {
        errors.push('Поле "Домен" не может быть длиннее 64 символов');
        fields.domain.classList.add('error');
    }

    if (fields.ip.value) {
        const ipValid = validateIp(fields.ip);
        if (ipValid && ipValid.valid === false) {
            errors.push(`IP-адрес: ${ipValid.error || 'Неверный формат'}`);
        }
    }

    if (fields.country.value) {
        const countryValid = validateCountry(fields.country);
        if (!countryValid.valid) errors.push(`Страна: ${countryValid.error}`);
    }

    if (fields.owner.value && fields.owner.value.length > 64) {
        errors.push('Поле "Владелец" не может быть длиннее 64 символов');
        fields.owner.classList.add('error');
    }

    if (fields.noteIn.value && fields.noteIn.value.length > 128) {
        errors.push('Поле "Примечание к внесению" не может быть длиннее 128 символов');
        fields.noteIn.classList.add('error');
    }

    return errors;
}

// ==================== ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ ====================

export async function handleAddFormSubmit(e) {
    e.preventDefault();
    
    const fields = collectFormFields();
    const errors = validateAddForm(fields);
    const formErrorsDiv = document.getElementById('formErrors');

    if (errors.length > 0) {
        formErrorsDiv.innerHTML = '<strong>Пожалуйста, исправьте следующие ошибки:</strong><ul>' + 
            errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        formErrorsDiv.style.display = 'block';
        formErrorsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    } else {
        formErrorsDiv.style.display = 'none';
    }

    // Добавляем время к дате внесения
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fullDateIn = `${fields.dateIn.value} ${timeStr}`;

    const newRow = {
        mses: [],
        date: fields.date.value,
        from_source: fields.from.value,
        letter: fields.letter.value || '-',
        domain: fields.domain.value || '-',
        ip: fields.ip.value || '-',
        country: fields.country.value ? fields.country.value.toUpperCase() : 'XX',
        owner: fields.owner.value || '-',
        mse_method: '-',
        note_in: fields.noteIn.value || '-',
        soib_infr: fields.soibInfr.value || '-',
        date_in: fullDateIn,
        who_in: document.getElementById('addWhoIn').value,
        note_out: '-',
        date_out: '-',
        who_out: '-'
    };
    
    try {
        const createdRecord = await createRecord(newRow);

        if (createdRecord) {
            setSort('id', 'desc');
            setCurrentPage(1);
            await reloadDataAndRender();
            closeAddModal();
            alert('✅ Новая запись добавлена в начало таблицы');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ ' + error.message);
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ МОДАЛЬНЫХ ОКОН ====================

export function initModals() {
    const addModal = document.getElementById('addRecordModal');
    if (addModal) {
        addModal.onclick = function(event) {
            if (event.target === addModal) return;
        };
    }
    
    const exceptionModal = document.getElementById('exceptionModal');
    if (exceptionModal) {
        exceptionModal.onclick = function(event) {
            if (event.target === exceptionModal) return;
        };
    }

    // Навешиваем обработчик на форму добавления
    const addRecordForm = document.getElementById('addRecordForm');
    if (addRecordForm) {
        addRecordForm.addEventListener('submit', handleAddFormSubmit);
    }

    // Валидация при потере фокуса для полей даты
    const dateInputs = ['addDate', 'addDateIn'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function() { validateDate(this); });
        }
    });
    
    // Автоматический uppercase для страны
    const countryInput = document.getElementById('addCountry');
    if (countryInput) {
        countryInput.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
        countryInput.addEventListener('blur', function() { validateCountry(this); });
    }
}

// Прогресс-бар для импорта (общий, используется в ipImportExport.js)
export function showImportProgress(percent, message) {
    let progressDiv = document.getElementById('importProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'importProgress';
        progressDiv.style.cssText = `
            position:fixed;
            bottom:20px;
            right:20px;
            background:var(--bg-secondary);
            border:1px solid var(--border-color);
            border-radius:8px;
            padding:15px;
            box-shadow:var(--shadow);
            z-index:1001;
            min-width:250px;
        `;
        progressDiv.innerHTML = `
            <div style="margin-bottom:10px;font-weight:bold;">Импорт данных</div>
            <div class="progress-bar" style="background-color:var(--bg-tertiary);border-radius:4px;height:20px;overflow:hidden;">
                <div id="progressFill" style="width:0%;background-color:#015240;height:100%;transition:width 0.3s;"></div>
            </div>
            <div id="progressMessage" style="margin-top:8px;font-size:12px;">Подготовка...</div>
        `;
        document.body.appendChild(progressDiv);
    }
    const fill = document.getElementById('progressFill');
    const msgDiv = document.getElementById('progressMessage');
    if (fill) fill.style.width = `${percent}%`;
    if (msgDiv) msgDiv.textContent = message;
}

export function hideImportProgress() {
    const progressDiv = document.getElementById('importProgress');
    if (progressDiv) progressDiv.remove();
}
