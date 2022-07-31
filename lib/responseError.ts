export class ResponseError<T = unknown> extends Error {
  public readonly headers: Headers;
  public readonly ok: boolean;
  public readonly redirected: boolean;
  public readonly status: number;
  public readonly statusText: string;
  public readonly type: ResponseType;
  public readonly url: string;

  public readonly json: T;

  public constructor(response: Response, json: T) {
    super();
    this.headers = response.headers;
    this.ok = response.ok;
    this.redirected = response.redirected;
    this.status = response.status;
    this.statusText = response.statusText;
    this.type = response.type;
    this.url = response.url;
    this.json = json;
  }
}
