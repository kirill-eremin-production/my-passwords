import { useMutation } from 'react-query'

import { sendAuthCode } from '../api/sendAuthCode'

export const useSendAuthCode = () => useMutation(() => sendAuthCode(), {})
