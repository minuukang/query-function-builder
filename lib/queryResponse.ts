import asFormData from "json-form-data";
import { parse, Key as TokenKey, compile } from "path-to-regexp";
import {
  headerEntires,
  headerStringConvert,
  mergeRequestInit,
  ProgressRequestInit,
  RequestInitParam,
} from "./requestInit";
import { HttpMethod } from "./httpMethod";
import { ResponseError } from "./responseError";

export type Nullish = null | undefined;
type CanNullish<T> = T extends Nullish
  ? true
  : Partial<T> extends T
  ? true
  : false;

export type QueryResponseArguments<
  QueryResponseRequestParam,
  QueryResponseRequestInit extends ProgressRequestInit = ProgressRequestInit
> = CanNullish<QueryResponseRequestParam> extends true
  ? [
      data?: QueryResponseRequestParam | Nullish,
      requestInit?: RequestInitParam<QueryResponseRequestInit>
    ]
  : [
      data: QueryResponseRequestParam,
      requestInit?: RequestInitParam<QueryResponseRequestInit>
    ];

export type QueryResponse<
  QueryResponseRequestParam,
  QueryResponseRequestInit extends ProgressRequestInit = ProgressRequestInit
> = (
  ..._: QueryResponseArguments<
    QueryResponseRequestParam,
    QueryResponseRequestInit
  >
) => Promise<Response>;

export type QueryResponseWithInformation<
  QueryResponseRequestParam,
  QueryResponseRequestInit extends ProgressRequestInit = ProgressRequestInit
> = QueryResponse<QueryResponseRequestParam, QueryResponseRequestInit> & {
  method: HttpMethod;
  path: string;
};

export function createQueryResponse<
  QueryResponseRequestParam = Nullish,
  QueryResponseRequestInit extends ProgressRequestInit = ProgressRequestInit
>({
  method,
  path,
  requestInitParam,
  basePath,
}: {
  method: HttpMethod;
  path: string;
  requestInitParam?: RequestInitParam<QueryResponseRequestInit>;
  basePath?: string;
}) {
  const pathParamTokens = parse(path).filter(
    (token): token is TokenKey => typeof token !== "string"
  );
  const pathCompiler = compile(path);
  const fetcher: QueryResponse<
    QueryResponseRequestParam,
    QueryResponseRequestInit
  > = async (...[data, requestInit]) => {
    let init = mergeRequestInit({} as QueryResponseRequestInit, requestInit);
    init = mergeRequestInit(init, requestInitParam);
    init.method = method;
    init.headers = new Headers(init.headers);

    const url = data ? pathCompiler(data as unknown as object) : path;
    const dataExcludePathParam =
      pathParamTokens.length && data
        ? pathParamTokens.reduce(
            (newData, token) => {
              delete newData[token.name];
              return newData;
            },
            { ...data } as Record<string, unknown>
          )
        : data || {};
    const queryParams = new URLSearchParams();
    if (
      init.headers.get("Content-Type")?.toLowerCase() === "multipart/form-data"
    ) {
      init.body = asFormData(dataExcludePathParam as never);
    } else {
      if (
        method === HttpMethod.POST ||
        method === HttpMethod.PUT ||
        method === HttpMethod.PATCH
      ) {
        init.headers.set("Content-Type", "application/json");
        init.body = JSON.stringify(dataExcludePathParam);
      } else {
        for (const [key, value] of Object.entries(dataExcludePathParam)) {
          if (value != null) {
            queryParams.set(key, value as string);
          }
        }
      }
    }

    const urlManager = new URL(`.${url}`, basePath);
    urlManager.search = queryParams.toString();

    const response = await (init.onUploadProgress
      ? createXhrResponse(urlManager.toString(), init)
      : createFetchResponse(urlManager.toString(), init));

    if (!response.ok) {
      throw new ResponseError(
        response,
        response.headers.get("Content-Type")?.toLowerCase() ===
        "application/json"
          ? await response.json()
          : await response.text()
      );
    }

    return response;
  };

  Object.assign(fetcher, {
    path,
    method,
  });

  return fetcher as QueryResponseWithInformation<
    QueryResponseRequestParam,
    QueryResponseRequestInit
  >;
}

async function createFetchResponse<R extends ProgressRequestInit>(
  url: string,
  requestInit: R
) {
  const response = await fetch(url, requestInit);
  const contentLength = Number(response.headers.get("Content-Length"));
  if (
    requestInit.onDownloadProgress &&
    response.body &&
    !Number.isNaN(contentLength)
  ) {
    const reader = response.body.getReader();

    let receivedLength = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      receivedLength += value.length;
      requestInit.onDownloadProgress(
        new ProgressEvent("progress", {
          lengthComputable: true,
          loaded: receivedLength,
          total: contentLength,
        })
      );
    }

    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (let chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }

    return new Response(chunksAll, response);
  }
  return response;
}

function createXhrResponse<R extends ProgressRequestInit>(
  url: string,
  requestInit: R
) {
  return new Promise<Response>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(requestInit.method as HttpMethod, url);
    request.withCredentials = !!requestInit.credentials || true;
    headerEntires(requestInit.headers).forEach(([key, value]) => {
      // Doing so will prevent the browser from being able to set the Content-Type header
      // with the boundary expression it will use to delimit form fields in the request body.
      if (
        key.toLowerCase() === "content-type" &&
        value.toLowerCase() === "multipart/form-data"
      ) {
        return;
      }
      request.setRequestHeader(key, value);
    });
    requestInit.signal?.addEventListener("abort", () => request.abort());
    requestInit.onDownloadProgress &&
      request.addEventListener("progress", requestInit.onDownloadProgress);
    requestInit.onUploadProgress &&
      request.upload.addEventListener("progress", requestInit.onUploadProgress);
    function requestEvent() {
      try {
        resolve(
          new Response(request.responseText, {
            headers: headerStringConvert(request.getAllResponseHeaders()),
            status: request.status,
            statusText: request.statusText,
          })
        );
      } catch (err) {
        reject(err);
      }
    }
    request.addEventListener("load", requestEvent);
    request.addEventListener("error", requestEvent);
    request.send((requestInit.body as XMLHttpRequestBodyInit) || null);
  });
}
