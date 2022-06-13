type RequestError = {
  message: string;
};
export type ResTemplate<T> =
  | {
      content: T;
      status: true;
    }
  | {
      status: false;
      content: RequestError | null;
    };
