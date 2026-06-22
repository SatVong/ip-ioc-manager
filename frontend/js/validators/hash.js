// validators/hash.js
// Валидация и автоопределение хешей (MD5/SHA1/SHA256/SHA512)

export function autoDetectEncoding(hash) {
    if (!hash) return { valid: false, error: 'Хеш не может быть пустым' };
    
    const length = hash.length;
    const hexRegex = /^[a-fA-F0-9]+$/;
    
    if (!hexRegex.test(hash)) {
        const invalidChar = hash.match(/[^a-fA-F0-9]/)?.[0] || 'неизвестный символ';
        const position = hash.search(/[^a-fA-F0-9]/) + 1;
        return { 
            valid: false, 
            error: `неверный формат: найден недопустимый символ "${invalidChar}" на позиции ${position}. Допустимы только hex-символы (0-9, a-f)`
        };
    }
    
    if (length === 32) return { valid: true, encoding: 'md5' };
    if (length === 40) return { valid: true, encoding: 'sha1' };
    if (length === 64) return { valid: true, encoding: 'sha256' };
    if (length === 128) return { valid: true, encoding: 'sha512' };
    
    return { 
        valid: false, 
        error: `неверная длина хеша: ${length} символов. Допустимые длины: 32 (MD5), 40 (SHA1), 64 (SHA256), 128 (SHA512)`
    };
}

export function validateHashOnInput(input) {
    if (!input) return;
    
    const hash = input.value.trim();
    const result = autoDetectEncoding(hash);
    const hintDiv = document.getElementById('iocEncodingHint');
    const errorDiv = document.getElementById('iocHashError');
    
    const radios = document.querySelectorAll('input[name="encoding"]');
    radios.forEach(radio => {
        radio.checked = false;
        radio.disabled = true;
    });
    
    if (result.valid && hash.length > 0) {
        const radio = document.getElementById(`enc_${result.encoding}`);
        if (radio) {
            radio.checked = true;
            radio.disabled = false;
        }
        if (hintDiv) {
            hintDiv.innerHTML = `✓ Определена кодировка: ${result.encoding.toUpperCase()}`;
            hintDiv.style.color = '#28a745';
        }
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error');
        input.classList.add('valid');
        return true;
    } else if (hash.length > 0) {
        if (hintDiv) {
            hintDiv.innerHTML = `✗ ${result.error}`;
            hintDiv.style.color = '#dc3545';
        }
        if (errorDiv) {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
        input.classList.add('error');
        input.classList.remove('valid');
        return false;
    } else {
        if (hintDiv) hintDiv.innerHTML = '';
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error', 'valid');
        return true;
    }
}