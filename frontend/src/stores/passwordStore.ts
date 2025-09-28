import { create } from 'zustand'
import { fetchPasswords } from '../api/fetchPasswords'
import { postPasswords } from '../api/postPasswords'
import { Password, Passwords } from '../types/passwords'
import { toEncrypt } from '../encryption/toEncrypt'
import { toDecrypt } from '../encryption/toDecrypt'

interface PasswordState {
  passwords: Passwords
  masterPassword: string | null
  isMasterPasswordSet: boolean
  
  // Actions
  setMasterPassword: (password: string) => void
  clearMasterPassword: () => void
  loadPasswords: () => Promise<void>
  savePasswords: (passwords: Passwords) => Promise<void>
  addPassword: (password: Password) => Promise<void>
  updatePassword: (index: number, password: Password) => Promise<void>
  deletePassword: (index: number) => Promise<void>
}

export const usePasswordStore = create<PasswordState>((set, get) => ({
      passwords: [],
      masterPassword: null,
      isMasterPasswordSet: false,
      
      setMasterPassword: (password: string) => {
        set({ 
          masterPassword: password, 
          isMasterPasswordSet: true 
        })
        // Автоматически загружаем пароли после установки мастер-пароля
        get().loadPasswords()
      },
      
      clearMasterPassword: () => {
        set({ 
          masterPassword: null, 
          isMasterPasswordSet: false, 
          passwords: [] 
        })
      },
      
      loadPasswords: async () => {
        const { masterPassword } = get()
        if (!masterPassword) return
        
        try {
          const result = await fetchPasswords()
          
          if (typeof result === 'string') {
            if (result === '') {
              set({ passwords: [] })
            } else {
              const decryptedData = toDecrypt(result, masterPassword)
              const passwords = JSON.parse(decryptedData)
              set({ passwords })
            }
          }
        } catch (error) {
          console.error('Failed to load passwords:', error)
          set({ passwords: [] })
        }
      },
      
      savePasswords: async (passwords: Passwords) => {
        const { masterPassword } = get()
        if (!masterPassword) return
        
        try {
          const encryptedData = toEncrypt(JSON.stringify(passwords), masterPassword)
          await postPasswords({
            data: encryptedData,
            callback: () => set({ passwords })
          })
        } catch (error) {
          console.error('Failed to save passwords:', error)
          throw error
        }
      },
      
      addPassword: async (password: Password) => {
        const { passwords, savePasswords } = get()
        const newPasswords = [...passwords, password]
        await savePasswords(newPasswords)
      },
      
      updatePassword: async (index: number, password: Password) => {
        const { passwords, savePasswords } = get()
        const newPasswords = [...passwords]
        newPasswords[index] = password
        await savePasswords(newPasswords)
      },
      
      deletePassword: async (index: number) => {
        const { passwords, savePasswords } = get()
        const newPasswords = passwords.filter((_, i) => i !== index)
        await savePasswords(newPasswords)
      }
}))