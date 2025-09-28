import { FC, useCallback, useEffect, useState } from 'react'

import { Button } from '../../../../components/Button/Button'
import { Text } from '../../../../components/Text/Text'

import { useSendAuthCode } from '../../query/useSendAuthCode'

export const SendTelegramAuthCodeButton: FC = () => {
    const {
        mutate: sendAuthCode,
        isLoading,
        isSuccess,
        isError,
    } = useSendAuthCode()
    const [isVisibleResult, setIsVisibleResult] = useState(false)

    const onButtonClick = useCallback(() => sendAuthCode(), [sendAuthCode])

    useEffect(() => {
        setIsVisibleResult(true)
    }, [isSuccess, isError])

    return (
        <div>
            <Button fullWidth isLoading={isLoading} onClick={onButtonClick}>
                Получить код
            </Button>
            {isSuccess ? (
                <Text size="regular">🟢 Код успешно отправлен</Text>
            ) : null}
            {isError ? (
                <Text size="regular">🔴 Не удалось отправить код</Text>
            ) : null}
        </div>
    )
}
