import { useEffect, useState } from "react";

import { fetchPasswords } from "../api/fetchPasswords";
import { postPasswords } from "../api/postPasswords";
import { Password, Passwords } from "../types/passwords";

export function usePasswords(): {
  passwords: Passwords;
  setPasswords: (passwords: Passwords) => void;
  addPassword: (password: Password) => void;
  updatePassword: (id: number, password: Password) => void;
  deletePassword: (id: number) => void;
  selectedPasswordId: number | null;
  isMasterPassword: boolean;
  setMasterPassword: (value: string | null) => void;
  setSelectedPasswordId: (id: number | null) => void;
} {
  const [passwords, setPasswordsState] = useState<Passwords>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [selectedPasswordId, setSelectedPasswordId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!masterPassword) {
      return;
    }

    fetchPasswords({ callback: setPasswordsState });
  }, [masterPassword]);

  const setPasswords = (passwords: Passwords) => {
    postPasswords({
      data: passwords,
      callback: () => setPasswordsState(passwords),
    });
  };

  const addPassword = (password: Password) => {
    const modifiedPasswords = JSON.parse(JSON.stringify(passwords));
    modifiedPasswords.push(password);

    setPasswords(modifiedPasswords);
  };

  const updatePassword = (id: number, password: Password) => {
    const modifiedPasswords = JSON.parse(JSON.stringify(passwords));
    modifiedPasswords[id] = password;

    setPasswords(modifiedPasswords);
  };

  const deletePassword = (id: number) => {
    const modifiedPasswords = JSON.parse(JSON.stringify(passwords));
    modifiedPasswords.splice(id, 1);

    setPasswords(modifiedPasswords);
  };

  return {
    passwords,
    setPasswords,
    addPassword,
    updatePassword,
    deletePassword,
    selectedPasswordId,
    isMasterPassword: Boolean(masterPassword),
    setMasterPassword,
    setSelectedPasswordId,
  };
}
