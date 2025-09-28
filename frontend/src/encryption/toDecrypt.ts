import { AES, PBKDF2, enc, mode, pad } from 'crypto-js'

import config from './config'

export function toDecrypt(data: string, password: string): string {
    let result: string = data

    for (let i = 0; i < config.count; i++) {
        try {
            // Разбираем данные: соль:IV:зашифрованные_данные
            const parts = result.split(':')
            if (parts.length !== 3) {
                throw new Error('Неверный формат зашифрованных данных')
            }

            const [saltStr, ivStr, encryptedStr] = parts
            const salt = enc.Hex.parse(saltStr)
            const iv = enc.Hex.parse(ivStr)

            // Восстановление ключа с теми же параметрами
            const key = PBKDF2(password, salt, {
                keySize: 256 / 32,
                iterations: 10000,
            })

            // AES-CBC расшифрование
            const decrypted = AES.decrypt(encryptedStr, key, {
                iv: iv,
                mode: mode.CBC,
                padding: pad.Pkcs7,
            })

            result = decrypted.toString(enc.Utf8)

            if (!result) {
                throw new Error(
                    'Неудачная расшифровка - неверный пароль или поврежденные данные'
                )
            }
        } catch (error) {
            console.error(`Ошибка расшифровки на итерации ${i + 1}:`, error)
            throw new Error('Не удалось расшифровать данные')
        }
    }

    return result
}
