export interface FetchPasswordsParams {
    callback: (data: any) => void
}

export const fetchPasswords = async ({
    callback,
}: FetchPasswordsParams): Promise<any> => {
    const response = await fetch('/api/passwords', {
        method: 'GET',
    })

    const { data } = await response.json()

    const modifiedData = String(data).replace('"', '')

    callback(modifiedData)

    return modifiedData
}
