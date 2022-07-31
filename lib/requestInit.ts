export interface ProgressRequestInit extends RequestInit {
  onUploadProgress?(event: ProgressEvent): void;
  onDownloadProgress?(event: ProgressEvent): void;
}

export type RequestInitFunction<R extends ProgressRequestInit> = (init: R) => R;
export type RequestInitParam<R extends ProgressRequestInit> =
  | R
  | RequestInitFunction<R>;

export function headerEntires(
  headersInit?: HeadersInit
): [key: string, value: string][] {
  return headersInit
    ? headersInit instanceof Headers
      ? [...headersInit.entries()]
      : Object.entries(headersInit)
    : [];
}

export function mergeRequestInit<R extends ProgressRequestInit>(
  prevRequestInit: R,
  requestInitParam?: RequestInitParam<R>
): R {
  let requestInit = prevRequestInit;
  if (!requestInitParam) {
    return requestInit;
  }
  if (typeof requestInitParam === "function") {
    return requestInitParam(prevRequestInit);
  } else {
    return {
      ...prevRequestInit,
      ...requestInitParam,
      headers: new Headers([
        ...headerEntires(prevRequestInit.headers),
        ...headerEntires(requestInitParam.headers),
      ]),
    };
  }
}

export function headerStringConvert(headers: string) {
  // Convert the header string into an array
  // of individual headers
  return new Headers(
    headers
      .trim()
      .split(/[\r\n]+/)
      .map((line) => {
        const parts = line.trim().split(": ");
        const header = parts.shift();
        const value = parts.join(": ");
        return [header, value];
      })
      .filter((part): part is [string, string] => !!part[0])
  );
}
