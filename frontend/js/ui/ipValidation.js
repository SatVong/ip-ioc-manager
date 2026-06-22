// ui/ipValidation.js
// Валидация полей при редактировании

import { validateDate } from '../validators/date.js';
import { validateIp } from '../validators/ip.js';
import { validateCountry } from '../validators/country.js';
import { validateMseFormat } from '../validators/mse.js';
import { saveCellEdit } from '../actions/ipActions.js';

export async function validateField(element, columnType, row, index) {
    const newValue = element.textContent.trim();
    const oldValue = Object.values(row)[index];
    if (newValue === oldValue) return;
    
    let isValid = true;
    let errorMessage = '';
    
    switch(columnType) {
        case 'date':
            const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
            if (!dateRegex.test(newValue)) {
                isValid = false;
                errorMessage = 'Неверный формат даты. Используйте ДД.ММ.ГГГГ';
            } else {
                const [dd, mm, yyyy] = newValue.split('.').map(Number);
                const date = new Date(yyyy, mm - 1, dd);
                if (date.getFullYear() !== yyyy || date.getMonth() + 1 !== mm || date.getDate() !== dd) {
                    isValid = false;
                    errorMessage = 'Такой даты не существует';
                }
            }
            break;
        case 'ip':
            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipRegex.test(newValue)) {
                isValid = false;
                errorMessage = 'Неверный формат IP. Используйте xxx.xxx.xxx.xxx';
            } else {
                const octets = newValue.split('.');
                for (let i = 0; i < 4; i++) {
                    const num = parseInt(octets[i]);
                    if (num < 0 || num > 255) {
                        isValid = false;
                        errorMessage = `Октет ${i+1} должен быть от 0 до 255`;
                        break;
                    }
                }
            }
            break;
        case 'mse-format':
            const mseValidation = validateMseFormat(newValue);
            if (!mseValidation.valid) {
                isValid = false;
                errorMessage = mseValidation.error;
            }
            break;
        case 'country':
            const validCountries = new Set([
                'AD','AE','AF','AG','AI','AL','AM','AO','AP','AR','AT','AU','AW','AZ',
                'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BM','BN','BO','BQ','BR',
                'BS','BT','BV','BW','BX','BY','BZ','CA','CD','CF','CG','CH','CI','CK',
                'CL','CM','CN','CO','CR','CU','CV','CW','CY','CZ','DE','DJ','DK','DM',
                'DO','DZ','EA','EC','EE','EG','EH','EM','EP','ER','ES','ET','EU','FI',
                'FJ','FK','FM','FO','FR','GA','GB','GC','GD','GE','GG','GH','GI','GL',
                'GM','GN','GQ','GR','GS','GT','GW','GY','HK','HN','HR','HT','HU','IB',
                'ID','IE','IL','IM','IN','IQ','IR','IS','IT','JE','JM','JO','JP','KE',
                'KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI',
                'LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MG','MH','MK',
                'ML','MM','MN','MO','MP','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
                'NA','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OA','OM','PA','PE',
                'PG','PH','PK','PL','PT','PW','PY','QA','QZ','RO','RS','RU','RW','SA',
                'SB','SC','SD','SE','SG','SH','SI','SK','SL','SM','SN','SO','SR','SS',
                'ST','SV','SX','SY','SZ','TC','TD','TG','TH','TJ','TL','TM','TN','TO',
                'TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VG',
                'VN','VU','WO','WS','XN','XU','XV','XX','YE','ZA','ZM','ZW'
            ]);
            if (!newValue) {
                isValid = false;
                errorMessage = 'Страна не может быть пустой';
            } else {
                const countryUpper = newValue.toUpperCase();
                if (!validCountries.has(countryUpper)) {
                    isValid = false;
                    errorMessage = `Страна "${newValue}" не входит в список допустимых стран. Используйте "XX" если страна неизвестна`;
                } else {
                    element.textContent = countryUpper;
                }
            }
            break;
        case 'text-24':
            if (newValue.length > 24) {
                isValid = false;
                errorMessage = 'Максимум 24 символа';
            }
            break;
        case 'text-64':
            if (newValue.length > 64) {
                isValid = false;
                errorMessage = 'Максимум 64 символа';
            }
            break;
        case 'text-128':
            if (newValue.length > 128) {
                isValid = false;
                errorMessage = 'Максимум 128 символов';
            }
            break;
    }
    
    if (!isValid) {
        alert(`Ошибка: ${errorMessage}`);
        element.textContent = oldValue;
        return;
    }
    await saveCellEdit(row, index, newValue);
}
