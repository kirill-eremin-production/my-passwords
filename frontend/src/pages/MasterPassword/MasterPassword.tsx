import { FC, FormEventHandler } from "react";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Logo } from "../../components/Logo/Logo";

export interface MasterPasswordProps {
  setMasterPassword: (value: string | null) => void;
}

export const MasterPassword: FC<MasterPasswordProps> = ({
  setMasterPassword,
}) => {
  const onFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const inputMasterPassword = formData.get("masterPassword");

    if (typeof inputMasterPassword === "string") {
      setMasterPassword(inputMasterPassword);
      return;
    }

    alert("Не удалось применить Мастер-пароль");
  };

  return (
    <form onSubmit={onFormSubmit}>
      <Logo />
      <Input label="Мастер-пароль" name="masterPassword" type="password" />
      <Button>Использовать</Button>
    </form>
  );
};
