import { FC, FormEventHandler } from "react";
import { Password } from "../../types/passwords";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { toStringOrUndefined } from "../../utils/toStringOrUndefined";

export interface PasswordFormProps {
  password: Password;
  onSubmit: (password: Password) => void;
}

export const PasswordForm: FC<PasswordFormProps> = ({ password, onSubmit }) => {
  const { title, password: passwordValue, login } = password;

  const onFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const inputTitle = toStringOrUndefined(formData.get("title"));
    const inputLogin = toStringOrUndefined(formData.get("login"));
    const inputPassword = toStringOrUndefined(formData.get("password"));

    const modifiedPassword: Password = {
      title: inputTitle,
      login: inputLogin,
      password: inputPassword,
    };

    onSubmit(modifiedPassword);
  };

  return (
    <form onSubmit={onFormSubmit}>
      <Input name="title" label="Название" type="text" defaultValue={title} />
      <Input name="login" label="Логин" type="text" defaultValue={login} />
      <Input
        name="password"
        label="Пароль"
        type="text"
        defaultValue={passwordValue}
      />
      <Button type="submit">Сохранить</Button>
    </form>
  );
};
