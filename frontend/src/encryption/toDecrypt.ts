import { AES, enc } from 'crypto-js'

import config from './config'

export function toDecrypt(data: string, password: string): string {
    let result: string = data

    for (let i = 0; i < config.count; i++) {
        const bytes = AES.decrypt(result, password)
        result = bytes.toString(enc.Utf8)
    }

    return result
}
