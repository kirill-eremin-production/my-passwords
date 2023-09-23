export const fetchPasswords = async (): Promise<string | number> => {
    const response = await fetch('/api/passwords', {
        method: 'GET',
    })

    if (response.status === 200) {
        const { data } = await response.json()

        return String(data).replace('"', '')
    }

    return response.status
}
