export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  PATCH: "PATCH",
  CONNECT: "CONNECT",
  TRACE: "TRACE",
} as const;

export type HttpMethod =
  | Uppercase<typeof HttpMethod[keyof typeof HttpMethod]>
  | Lowercase<typeof HttpMethod[keyof typeof HttpMethod]>;
