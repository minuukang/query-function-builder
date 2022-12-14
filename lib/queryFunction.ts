import { HttpMethod } from "./httpMethod";
import { createQueryResponse, QueryResponseArguments } from "./queryResponse";
import { mergeRequestInit, RequestInitParam } from "./requestInit";

export type QueryFunctionContext = {
  signal?: AbortSignal;
  pageParam?: any;
};

export type QueryGeneratorResult<Res> = {
  queryKey: unknown[];
  queryFn(context: QueryFunctionContext): Promise<Res>;
};

export type QueryFunction<Res, Req, Init extends RequestInit> = {
  (..._: QueryResponseArguments<Req, Init>): Promise<Res>;
  queryKey: string;
  getQueryKeyWithRequest(
    ...[data]: QueryResponseArguments<Req, Init>
  ): unknown[];
  generateQuery(
    withContext: (
      context: QueryFunctionContext
    ) => QueryResponseArguments<Req, Init>[0],
    requestInit?: RequestInitParam<Init>
  ): QueryGeneratorResult<Res>;
  generateQuery(
    ..._: QueryResponseArguments<Req, Init>
  ): QueryGeneratorResult<Res>;
};

export function createQueryFunction<Res, Req, Init extends RequestInit>({
  method,
  path,
  requestInitParam,
  fromResponse,
  basePath,
  onReject,
}: {
  fromResponse: (response: Response) => Promise<Res>;
  onReject?(error: unknown): never;
  basePath?: string;
  method: HttpMethod;
  path: string;
  requestInitParam?: RequestInitParam<Init>;
}): QueryFunction<Res, Req, Init> {
  const fn = createQueryResponse<Req, Init>({
    method,
    path,
    requestInitParam,
    basePath,
  });
  const caller = async (...args: Parameters<typeof fn>) => {
    try {
      return await fromResponse(await fn(...args));
    } catch (error) {
      throw onReject?.(error) ?? error;
    }
  };
  // Bind with query generator
  const queryKey = `${method}:${path}`;
  function getQueryKeyWithRequest(
    ...[data]: Parameters<typeof caller>
  ): unknown[] {
    return [queryKey, data || null];
  }

  function generateQuery(
    withContext: (
      context: QueryFunctionContext
    ) => Parameters<typeof caller>[0],
    requestInit?: Parameters<typeof caller>[1]
  ): QueryGeneratorResult<Res>;
  function generateQuery(
    ...args: Parameters<typeof caller>
  ): QueryGeneratorResult<Res>;

  function generateQuery(...args: unknown[]): QueryGeneratorResult<Res> {
    const createArgs = (
      typeof args[0] === "function"
        ? (context: QueryFunctionContext) => [
            (
              args[0] as (
                context: QueryFunctionContext
              ) => Parameters<typeof caller>[0]
            )(context),
            args[1],
          ]
        : () => args
    ) as (context: QueryFunctionContext) => Parameters<typeof caller>;

    const result = {
      queryKey: getQueryKeyWithRequest(
        ...createArgs({} as QueryFunctionContext)
      ),
      queryFn: (context: QueryFunctionContext) => {
        const [data, requestInit] = createArgs(context);
        return caller(
          ...([
            data,
            mergeRequestInit(
              {
                signal: context.signal,
              } as Init,
              requestInit
            ) as typeof requestInit,
          ] as Parameters<typeof caller>)
        );
      },
    } as const;
    return result;
  }
  const queryResult = {
    queryKey,
    getQueryKeyWithRequest,
    generateQuery,
  };

  return Object.assign(caller, fn, queryResult);
}
