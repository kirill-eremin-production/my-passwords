export interface PostPasswordsParams {
    data: any
    callback: (data: any) => void
}

export const sendAuthCode = async ({
    data,
    callback,
}: PostPasswordsParams): Promise<any> => {
    const response = await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ data }),
        headers: new Headers({
            'Content-Type': 'application/json',
        }),
    })

    const result = response.status === 200

    callback(result)

    return result
}
