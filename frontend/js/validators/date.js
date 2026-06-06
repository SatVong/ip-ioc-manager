// validators/date.js
// Валидация дат

export function validateDate(input) {
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    const value = input.value;
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('valid');
        return { valid: false, error: 'Поле обязательно для заполнения' };
    }
    
    if (!dateRegex.test(value)) {
        input.classList.add('error');
        input.classList.remove('valid');
        return { valid: false, error: 'Неверный формат даты. Используйте ДД.ММ.ГГГГ' };
    }
    
    const [dd, mm, yyyy] = value.split('.').map(Number);
    
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 2000 || yyyy > 2100) {
        input.classList.add('error');
        input.classList.remove('valid');
        return { valid: false, error: 'Некорректная дата' };
    }
    
    const date = new Date(yyyy, mm - 1, dd);
    if (date.getFullYear() !== yyyy || date.getMonth() + 1 !== mm || date.getDate() !== dd) {
        input.classList.add('error');
        input.classList.remove('valid');
        return { valid: false, error: 'Такой даты не существует' };
    }
    
    input.classList.remove('error');
    input.classList.add('valid');
    return { valid: true };
}