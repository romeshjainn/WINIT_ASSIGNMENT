export type ServerError = {
  status?: number;
  errors: {
    message: string;
    data: any;
  };
};

export type SuccessResult<T> = {
  remote: Extract<RemoteDataStatus, "success">;
  data: T;
};

export type ErrorResult = {
  remote: Extract<RemoteDataStatus, "failure">;
  error: ServerError;
};
export interface ListResult<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}

export type RemoteDataStatus = "success" | "failure";
