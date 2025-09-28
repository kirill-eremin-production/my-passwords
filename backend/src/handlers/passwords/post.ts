import { Request, Response } from 'express'

import { sendTelegramFile } from '../../api/telegram/sendFile.js'

import { passwordsFilePath, writeStore } from '../../store.js'

export function postPasswords(req: Request, res: Response) {
    const requestData = req.body.data
    const data = JSON.stringify(requestData, null, 4)

    // Сохраняем данные локально
    writeStore(data)

    // БЕЗОПАСНОСТЬ: Отправка в Telegram только в dev режиме и при явном разрешении
    const isTelegramEnabled = process.env.ENABLE_TELEGRAM_BACKUP === 'true'
    const isDevelopment = process.env.NODE_ENV !== 'production'

    if (isTelegramEnabled && isDevelopment) {
        console.log('📱 Отправка backup в Telegram (dev режим)')
        try {
            sendTelegramFile(data)
        } catch (error) {
            console.error('⚠️ Ошибка отправки в Telegram:', error)
            // Не прерываем выполнение - backup опциональный
        }
    } else {
        if (!isDevelopment) {
            console.log(
                '🔒 Telegram backup отключен в production для безопасности'
            )
        } else {
            console.log(
                '🔒 Telegram backup отключен (ENABLE_TELEGRAM_BACKUP=false)'
            )
        }
    }

    res.sendStatus(200)
}
