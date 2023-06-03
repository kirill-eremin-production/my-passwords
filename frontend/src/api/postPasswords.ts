export interface PostPasswordsParams {
  data: any;
  callback: (data: any) => void;
}

export const postPasswords = async ({
  data,
  callback,
}: PostPasswordsParams): Promise<any> => {
  const response = await fetch("/api/passwords", {
    method: "POST",
    body: JSON.stringify({ data }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });

  const responseData = await response.text();

  if (responseData === "OK") {
    callback(responseData);
  }

  return responseData;
};
