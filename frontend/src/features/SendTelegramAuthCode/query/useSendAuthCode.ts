import { useMutation } from '@tanstack/react-query'

import { sendAuthCode } from '../api/sendAuthCode'

export const useSendAuthCode = () =>
    useMutation({
        mutationFn: () => sendAuthCode(),
    })
