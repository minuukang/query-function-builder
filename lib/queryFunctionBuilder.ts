import { HttpMethod } from "./httpMethod";
import { createQueryFunction } from "./queryFunction";
import {
  mergeRequestInit,
  ProgressRequestInit,
  RequestInitParam,
} from "./requestInit";

export interface QueryFunctionBuilderOption<
  R extends ProgressRequestInit = ProgressRequestInit
> {
  requestInit: RequestInitParam<R>;
  onReject(error: unknown): never;
}

export class QueryFunctionBuilder<
  R extends ProgressRequestInit = ProgressRequestInit
> {
  public constructor(
    protected readonly basePath: string,
    protected readonly options?: QueryFunctionBuilderOption<R>
  ) {}

  public get<Res, Req = null>(
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.json<Res, Req>(HttpMethod.GET, path, requestInitParam);
  }

  public post<Res, Req = null>(
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.json<Res, Req>(HttpMethod.POST, path, requestInitParam);
  }

  public put<Res, Req = null>(
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.json<Res, Req>(HttpMethod.PUT, path, requestInitParam);
  }

  public patch<Res, Req = null>(
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.json<Res, Req>(HttpMethod.PATCH, path, requestInitParam);
  }

  public delete<Res, Req = null>(
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.json<Res, Req>(HttpMethod.DELETE, path, requestInitParam);
  }

  public json<Res, Req = null>(
    method: HttpMethod,
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.createQueryFunction<Res, Req>(
      (response) => response.json(),
      method,
      path,
      requestInitParam
    );
  }

  public text<Req = null>(
    method: HttpMethod,
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.createQueryFunction<string, Req>(
      (response) => response.text(),
      method,
      path,
      requestInitParam
    );
  }

  public void<Req = null>(
    method: HttpMethod,
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return this.createQueryFunction<void, Req>(
      async () => {},
      method,
      path,
      requestInitParam
    );
  }

  protected createQueryFunction<Res, Req>(
    fromResponse: (response: Response) => Promise<Res>,
    method: HttpMethod,
    path: string,
    requestInitParam?: RequestInitParam<R>
  ) {
    return createQueryFunction<Res, Req, R>({
      fromResponse,
      method,
      path,
      requestInitParam: requestInitParam
        ? (request) =>
            mergeRequestInit(
              mergeRequestInit(request, requestInitParam),
              this.options?.requestInit
            )
        : this.options?.requestInit,
      basePath: this.basePath,
      onReject: this.options?.onReject,
    });
  }
}
