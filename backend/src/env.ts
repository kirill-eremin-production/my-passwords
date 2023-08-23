function required(value: any): any {
  if (!value) {
    throw new Error("Не все требуемые переменные окружения были указаны!");
  }

  return value;
}

export const env = {
  telegramBotSecret: required(process.env.TELEGRAM_BOT_SECRET),
  telegramUserId: required(process.env.TELEGRAM_USER_ID),
};
