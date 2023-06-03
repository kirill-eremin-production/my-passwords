export interface FetchPasswordsParams {
  callback: (data: any) => void;
}

export const fetchPasswords = async ({
  callback,
}: FetchPasswordsParams): Promise<any> => {
  const response = await fetch("/api/passwords", {
    method: "GET",
  });

  const { data } = await response.json();

  callback(JSON.parse(data));

  return data;
};
