import { env } from '../../env'

export async function sendTelegramMessage(text: string) {
    return await fetch(
        `https://api.telegram.org/bot${env.telegramBotSecret}/sendMessage`,
        {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
                chat_id: env.telegramUserId,
                parse_mode: 'Markdown',
                text,
            }),
        }
    )
}
