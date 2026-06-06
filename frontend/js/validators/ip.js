// validators/ip.js
// Валидация IP-адресов

export function validateIp(input) {
    // Защита от undefined
    if (!input || !input.value) {
        return { valid: true };
    }
    
    const ip = input.value.trim();
    
    // Пустой IP - валидно (поле необязательное)
    if (!ip) {
        input.classList.remove('error', 'valid');
        return { valid: true };
    }
    
    // Проверяем формат: цифры и точки
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        input.classList.add('error');
        input.classList.remove('valid');
        return { valid: false, error: 'Неверный формат IP. Используйте xxx.xxx.xxx.xxx' };
    }
    
    const octets = ip.split('.');
    
    // Проверяем каждый октет
    for (let i = 0; i < 4; i++) {
        const octet = octets[i];
        const num = parseInt(octet, 10);
        
        if (num < 0 || num > 255) {
            input.classList.add('error');
            input.classList.remove('valid');
            return { valid: false, error: `Октет ${i+1} должен быть от 0 до 255 (сейчас ${num})` };
        }
        
        if (octet.length > 1 && octet[0] === '0') {
            input.classList.add('error');
            input.classList.remove('valid');
            return { valid: false, error: `Октет ${i+1} не должен начинаться с 0 (используйте ${num})` };
        }
    }
    
    input.classList.remove('error');
    input.classList.add('valid');
    return { valid: true };
}

export function validateIpOnInput(input) {
    if (!input) return;
    
    const validation = validateIp(input);
    const errorDiv = document.getElementById('ipError');
    
    if (errorDiv) {
        if (validation && !validation.valid) {
            errorDiv.textContent = validation.error || 'Неверный формат IP';
            errorDiv.style.display = 'block';
        } else {
            errorDiv.style.display = 'none';
        }
    }
    
    if (validation && !validation.valid) {
        input.classList.add('error');
    } else {
        input.classList.remove('error');
    }
}