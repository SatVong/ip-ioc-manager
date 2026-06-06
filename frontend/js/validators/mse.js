// validators/mse.js
// Валидация формата "Как внесено на МСЭ" (IP с маской)

export function validateMseFormat(value) {
    const mseRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    
    if (!mseRegex.test(value)) {
        return { 
            valid: false, 
            error: 'Неверный формат. Используйте: xxx.xxx.xxx.xxx/xx (например 192.168.1.1/24)' 
        };
    }
    
    const [ipPart, maskPart] = value.split('/');
    const octets = ipPart.split('.');
    const mask = parseInt(maskPart, 10);
    
    for (let i = 0; i < 4; i++) {
        const num = parseInt(octets[i], 10);
        if (num < 0 || num > 255) {
            return { 
                valid: false, 
                error: `Октет ${i+1} должен быть от 0 до 255 (сейчас ${num})` 
            };
        }
        
        if (octets[i].length > 1 && octets[i][0] === '0') {
            return { 
                valid: false, 
                error: `Октет ${i+1} не должен начинаться с 0 (используйте ${num})` 
            };
        }
    }
    
    if (mask < 0 || mask > 32) {
        return { 
            valid: false, 
            error: 'Маска должна быть от 0 до 32' 
        };
    }
    
    return { valid: true };
}