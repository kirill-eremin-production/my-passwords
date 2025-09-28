import { AES, PBKDF2, lib, mode, pad } from 'crypto-js'

import config from './config'

export function toEncrypt(data: string, password: string): string {
    let result: string = data

    for (let i = 0; i < config.count; i++) {
        // Генерация случайной соли для каждой итерации (256 бит)
        const salt = lib.WordArray.random(256 / 8)

        // Деривация ключа с PBKDF2 (10,000 итераций)
        const key = PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 10000,
        })

        // Генерация случайного IV для AES-CBC (128 бит)
        const iv = lib.WordArray.random(128 / 8)

        // AES-CBC шифрование с IV
        const encrypted = AES.encrypt(result, key, {
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7,
        })

        // Объединение соли, IV и зашифрованных данных
        result =
            salt.toString() + ':' + iv.toString() + ':' + encrypted.toString()
    }

    return result
}
