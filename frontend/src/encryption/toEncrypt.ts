import { AES } from 'crypto-js'

import config from './config'

export function toEncrypt(data: string, password: string): string {
    let result: string = data

    for (let i = 0; i < config.count; i++) {
        result = AES.encrypt(result, password).toString()
    }

    return result
}
