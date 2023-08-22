export interface FetchPasswordsParams {
    callback: (data: boolean) => void
}

// true - все ОК
// false - Не ОК
export const checkAuthorization = async ({
    callback,
}: FetchPasswordsParams): Promise<boolean> => {
    const response = await fetch('/api/auth', {
        method: 'GET',
    })

    const result = response.status === 200

    callback(result)

    return result
}
