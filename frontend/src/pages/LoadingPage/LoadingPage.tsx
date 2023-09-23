import React, { FC } from 'react'

export interface LoadingPageProps {
    message: string
}

export const LoadingPage: FC<LoadingPageProps> = ({ message }) => {
    return <>Загрузку: {message}</>
}
