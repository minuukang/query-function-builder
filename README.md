# Introduce

Create rest api fetch function with generate automatic query key using with [@tanstack/react-query](https://github.com/TanStack/query)!

# Example

## 1. Create QueryFunctionBuilder

```ts
// ./apiFnBuilder.ts
import { QueryFunctionBuilder } from "query-function-builder";

export const apiFnBuilder = new QueryFunctionBuilder('https://your.api.endpoint');
```

## 2. Create api endpoint function (aka QueryFunction)

```ts
// ./api/example.ts
import { HttpMethod } from "query-function-builder";
import { apiFnBuilder } from "../apiFnBuilder";

export type ExampleData = { id: string; name: string };
export type ExamplePagination = {
  data: ExampleData[];
  next?: string;
};

/* or shortcut: apiFnBuilder.get("/api/example/:id") */
export const getExampleDetail = apiFnBuilder.json<ExampleData, { id: string }>(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/example/:id"
);

/* or shortcut: apiFnBuilder.get("/api/example") */
export const getExampleList = apiFnBuilder.json<ExamplePagination, { next?: string }>(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/example"
);
```

## 3. Call!

### Case of immediate call

```ts
import { getExampleDetail } from "./api/example";

getExampleDetail({ id: "1" }).then(response => console.log(response.name));
```

### Case of `useQuery`

```ts
import { useQuery } from "@tanstack/react-query";
import { getExampleDetail } from "./api/example";

export function useExampleDetail(id: string) {
  return useQuery(getExampleDetail.generateQuery({ id }));
}
```

### Case of `useInfiniteQuery`

```ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { getExampleList } from "./api/example";

export function useExampleList() {
  return useInfiniteQuery({
    ...getExampleList.generateQuery((context) => ({
      next: context.pageParam,
    })),
    getNextPageParam: response => response.next
  });
}
```

### Case of using query key

```ts
import { QueryClient } from "@tanstack/react-query";
import { getExampleDetail, ExampleData } from "./api/example";

export function updateExampleDetailName(queryClient: QueryClient, id: string, changeName: string) {
  queryClient.setQueryData<ExampleData>(
    getExampleDetail.getQueryKeyWithRequest({ id }),
    (response) =>
      response && {
        ...response,
        name: changeName,
      }
  );
}
```

> The query key is created by http method, path ("`${method}:${path}`")

# Document

## QueryFunction

QueryFunction is result of `QueryFunctionBuilder`. You can create 3 type of QueryFunction; **json, text, void**. They required `HttpMethod` and endpoint path. Optionally you can set `RequestInitParam` at third parameter.

```ts
import { HttpMethod } from "query-function-builder";
import { apiFnBuilder } from "../apiFnBuilder";

export type ExampleSearch = { keyword?: string };
export type ExampleData = { id: string; name: string };
export type ExamplePagination = {
  data: ExampleData[];
  next?: string;
};

export const getExampleList = apiFnBuilder.json<ExamplePagination, { next?: string }>(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/example"
);

export const getExampleDetail = apiFnBuilder.json<ExampleData, { id: string }>(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/example/:id"
);

getExampleList({ next: "next" });
getExampleList(); // 🆗 correct!

getExampleDetail({ id: "1" });
getExampleDetail(); // ❌ request data cannot be empty
```

When request type is every partial, the request data can be optional (or null, undefined).

### 📤 Request data and Path param

```ts
export const getExampleDetail = apiFnBuilder.json<ExampleData, { id: string }>(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/example/:id"
);
```

When endpoint path have path param (start of `:`, at example `:id`), pick from request data of same name of path param.

Then rest request data be query string (http method GET, DELETE), or body data (http method POST, PUT, PATCH)

```ts
export const uploadImage = apiFnBuilder.json<
  { uploadPath: string },
  { file: File }
>(
  HttpMethod.POST /* or string "POST", "post" */,
  "/api/upload-image",
  {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }
);
```

When requestInit header is setted `{ "Content-Type": "multipart/form-data" }`, the body data will set `FormData`, other is converted `JSON.stringify`.

### ⏳ Using progress (download, upload)

This package using specify requestInit, called `ProgressRequestInit`. We can use progress event for download and upload.

```ts
export interface ProgressRequestInit extends RequestInit {
  onUploadProgress?(event: ProgressEvent): void;
  onDownloadProgress?(event: ProgressEvent): void;
}
```

If using `onUploadProgress`, should using `XMLHttpRequest` upload object event.

```ts
export const uploadImage = apiFnBuilder.json<
  { uploadPath: string },
  { file: File }
>(
  HttpMethod.POST /* or string "POST", "post" */,
  "/api/upload-image",
  {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }
);

// This call `XMLHttpRequest`, not `fetch`.
uploadImage({ file }, {
  onUploadProgress(event) {
    console.log(`Upload progress: ${event.loaded / event.total * 100}%`);
  }
});
```

### 📄 QueryFunction.generateQuery(data: Req)

We can use generate query key, query fn by using `react-query`.

```ts
import { useQuery } from "@tanstack/react-query";
import { getExampleDetail } from "./api/example";

export function useExampleDetail(id: string) {
  return useQuery(getExampleDetail.generateQuery({ id }));
}
```

If you want to use `QueryFunctionContext` object(using pageParam), pass the callback at data parameter.

The context signal(`AbortSignal`) object is automatic merged at this package.

```ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { getExampleList } from "./api/example";

export function useExampleList() {
  return useInfiniteQuery({
    ...getExampleList.generateQuery((context) => ({
      next: context.pageParam,
    })),
    getNextPageParam: response => response.next
  });
}
```

### 📄 QueryFunction.getQueryKeyWithRequest(data: Req)

We can create only query key with request data by `getQueryKeyWithRequest`

```ts
import { QueryClient } from "@tanstack/react-query";
import { getExampleDetail, ExampleData } from "./api/example";

export function updateExampleDetailName(queryClient: QueryClient, id: string, changeName: string) {
  queryClient.setQueryData<ExampleData>(
    getExampleDetail.getQueryKeyWithRequest({ id }),
    (response) =>
      response && {
        ...response,
        name: changeName,
      }
  );
}
```

## RequestInitParam

QueryFunction can take RequestInit from builder or caller.

```ts
// Set RequestInit from builder
export const withHeader = apiFnBuilder.json(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/withHeader",
  {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-Header-Name": "foo"
    }
  }
);

// Or set from caller
// The header will be merge from builder requestInit
withHeader(null, {
  headers: {
    "X-Header-Name": "bar"
  }
})
```

or you can deferred by passing callback of return RequestInit. We call this name `RequestInitParam`.

```ts
type RequestInitParam<R extends RequestInit> = R | ((requestInit: R) => R);
```


```ts
export const withHeader = apiFnBuilder.json(
  HttpMethod.GET /* or string "GET", "get" */,
  "/api/withHeader",
  init => ({
    ...init,
    headers: new Headers([
      ...Object.entires(init.headers),
      ["X-Header-Name", "foo"]
    ])
  })
);

withHeader(null, init => {
  init.headers = new Headers([
    ["X-Header-Name", "bar"]
  ]);
  return init;
})
```

Order of RequestInit merged by

1. `QueryFunctionBuilder` options.requestInit
2. builder third argument
3. caller second argument

## 🚨 ResponseError

When response http response is error(4xx, 5xx), this package should throw `ResponseError` object. This error object extends `Response` object properties (headers, ok, status, etc...), and when response header content-type is "application/json", set json response to `.json` property.

If your service have common error interface, you can make error type guard handler.

```ts
import { ResponseError } from "@minukang/query-function-builder";

export type MyServiceErrorResponse = {
  message: string;
  code: number;
}

export function isMyServiceErrorResponse(error: unknown): error is ResponseError<MyServiceErrorResponse> {
  if (error instanceof ResponseError) {
    const props = Object.getOwnPropertyNames(error.json);
    return props.includes('message') && props.includes('code');
  }
  return false;
}
```

and use that at try-catch, error property or onError at `react-query`!

```ts
try {
  await getExampleDetail({ id });
} catch (err) {
  if (isMyServiceErrorResponse(err)) {
    switch (err.json.code) {
      case -5555: {
        // Case of specify error code
        break;
      }
      default: {
        alert(err.json.message);
      }
    }
  }
}
// or
const { error } = useQuery({
  ...getExampleDetail.generateQuery({ id }),
  onError(err) {
    if (isMyServiceErrorResponse(err)) {
      switch (err.json.code) {
        case -5555: {
          // Case of specify error code
          break;
        }
        default: {
          alert(err.json.message);
        }
      }
    }
  }
})
```

## QueryFunctionBuilder

```ts
interface QueryFunctionBuilder<R extends ProgressRequestInit = ProgressRequestInit> {
  json<Response, Request>(httpMethod: HttpMethod, path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<Response, Request, R>;
  text<Request>(httpMethod: HttpMethod, path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<string, Request, R>;
  void<Request>(httpMethod: HttpMethod, path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<void, Request, R>;
  // Shortcut of httpMethod with json
  get<Response, Request>(path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<Response, Request, R>;
  post<Response, Request>(path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<Response, Request, R>;
  put<Response, Request>(path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<Response, Request, R>;
  patch<Response, Request>(path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<Response, Request, R>;
  delete<Response, Request>(path: string, requestInitParam?: RequestInitParam<R>): QueryFunction<Response, Request, R>;
}

type RequestInitParam<R extends RequestInit> = R | ((requestInit: R) => R);

interface QueryFunctionBuilderConstructor<R extends RequestInit = RequestInit> {
  new (
    basePath: string,
    options?: {
      requestInit?: RequestInitParam<R>;
      onReject?(error: unknown): never;
    }
  ): QueryFunctionBuilder<R>;
}

declare const QueryFunctionBuilder: QueryFunctionBuilderConstructor;
```
