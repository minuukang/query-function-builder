import nock from "nock";

import { HttpMethod } from "../httpMethod";
import { createQueryResponse } from "../queryResponse";

describe("createQueryResponse() spec", () => {
  const MOCK_HOST = "https://api.mock.minuukang.io";
  const MOCK_RESPONSE = { message: "hello world" };

  let response: Response;
  let scope: nock.Scope;

  function setup(
    method: HttpMethod,
    path: string,
    options: {
      request?: (init: RequestInit) => RequestInit;
      data?: unknown;
      nockPath?: string | RegExp | { (uri: string): boolean };
      requestBody?: nock.RequestBodyMatcher;
      mockResponse?: (
        this: nock.ReplyFnContext,
        uri: string,
        body: Body
      ) => nock.ReplyBody | Promise<nock.ReplyBody>;
    } = {}
  ) {
    beforeEach(async () => {
      scope = nock(MOCK_HOST)
        [method.toLowerCase() as "get"](
          options.nockPath || path,
          options.requestBody
        )
        .reply(200, options.mockResponse || MOCK_RESPONSE);
      response = await createQueryResponse({
        path,
        method,
        basePath: MOCK_HOST,
        requestInitParam: options.request,
      })(options.data as never);
      scope.done();
      expect(scope.isDone()).toBe(true);
    });
  }

  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.enableNetConnect();
  });

  describe("Test createBaseFetch host parameter", () => {
    setup(HttpMethod.GET, "/api");
    it("Should url merge path with host", async () => {
      expect(response.url).toBe(`${MOCK_HOST}/api`);
    });
  });

  describe("Test createBaseFetch options.request parameter", () => {
    setup(HttpMethod.GET, "/api", {
      request(init) {
        const headers = new Headers(init.headers);
        headers.set("X-Message-Header", "foobar");
        return {
          ...init,
          headers,
        };
      },
      mockResponse() {
        return {
          message: new Headers(this.req.headers).get("X-Message-Header"),
        };
      },
    });

    it("Should request header is set from option.request", async () => {
      expect(await response.json()).toMatchObject({
        message: "foobar",
      });
    });
  });

  describe("Test path & query param", () => {
    setup(HttpMethod.GET, "/:foo/:bar", {
      nockPath: "/hello/world?q=query&zeroNumber=0",
      data: {
        foo: "hello",
        bar: "world",
        q: "query",
        zeroNumber: 0,
      },
    });

    it("Should response url path is complile with request param", () => {
      expect(response.url).toBe(
        `${MOCK_HOST}/hello/world?q=query&zeroNumber=0`
      );
    });
  });

  describe("Test when http method is post", () => {
    describe('Test when request header content-type is "multipart/form-data"', () => {
      setup(HttpMethod.POST, "/api", {
        data: {
          input1: "1",
          input2: "2",
          input3: "3",
        },
        request(init) {
          return {
            ...init,
            headers: {
              ...init.headers,
              "Content-Type": "multipart/form-data",
            },
          };
        },
        requestBody(body) {
          return body === "[object FormData]";
        },
      });
    });

    describe("Test other request header", () => {
      setup(HttpMethod.POST, "/api", {
        data: {
          input1: "1",
          input2: "2",
          input3: "3",
        },
        requestBody(body) {
          return (
            body.input1 === "1" && body.input2 === "2" && body.input3 === "3"
          );
        },
      });
    });
  });
});
