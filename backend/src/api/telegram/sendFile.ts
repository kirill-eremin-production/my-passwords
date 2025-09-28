import { env } from '../../env.js'

export async function sendTelegramFile(fileData: string) {
    const data = new FormData()
    data.append('chat_id', env.telegramUserId)
    data.append('document', new Blob([fileData]), 'backup')

    const result = await fetch(
        `https://api.telegram.org/bot${env.telegramBotSecret}/sendDocument`,
        {
            method: 'POST',
            body: data,
        }
    )

    return result
}
