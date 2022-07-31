import {
  mergeRequestInit,
  headerEntires,
  headerStringConvert,
} from "../requestInit";

describe("requestInit helpers", () => {
  describe("headerStringConvert()", () => {
    const headerString = `date: Fri, 08 Dec 2017 21:04:30 GMT\r\n
 content-encoding: gzip\r\n
 x-content-type-options: nosniff\r\n
 server: meinheld/0.6.1\r\n
 x-frame-options: DENY\r\n
 content-type: text/html; charset=utf-8\r\n
 connection: keep-alive\r\n
 strict-transport-security: max-age=63072000\r\n
 vary: Cookie, Accept-Encoding\r\n
 content-length: 6502\r\n
 x-xss-protection: 1; mode=block\r\n`;
    it("Should convert to headers constructor", () => {
      expect(headerStringConvert(headerString)).toBeInstanceOf(Headers);
    });

    it("Should get header key from string", () => {
      const headers = headerStringConvert(headerString);
      expect(headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    });
  });

  describe("headerEntires()", () => {
    describe("When headerInit is undefined", () => {
      it("Should return empty array", () => {
        expect(headerEntires()).toEqual([]);
      });
    });

    describe("When headerInit is object", () => {
      it("Should return object entires", () => {
        expect(headerEntires({ foo: "bar" })).toEqual([["foo", "bar"]]);
      });
    });

    describe("When headerInit is Header constructor", () => {
      it("Should return Header.prototype.entiries", () => {
        expect(headerEntires(new Headers({ foo: "bar" }))).toEqual([
          ["foo", "bar"],
        ]);
      });
    });
  });

  describe("mergeRequestInit()", () => {
    describe("When requestInitParam is undefined", () => {
      it("Should return prevRequestInit", () => {
        expect(mergeRequestInit({ method: "get" })).toEqual({ method: "get" });
      });
    });

    describe("When requestInitParam is RequestInit object", () => {
      it("Should merge two object", () => {
        const result = mergeRequestInit(
          { method: "get", headers: new Headers([["foo", "bar"]]) },
          { headers: new Headers([["bar", "foo"]]) }
        );
        expect(result.method).toEqual("get");
        expect(result.headers.get("foo")).toEqual("bar");
        expect(result.headers.get("bar")).toEqual("foo");
      });
    });

    describe("When requestInitParam is RequestInit deferred handler", () => {
      it("Should merge two object", () => {
        const result = mergeRequestInit(
          {
            method: "get",
            headers: new Headers([["foo", "bar"]]),
          } as RequestInit,
          (init) => {
            const headers = new Headers(init.headers);
            headers.set("bar", "foo");
            return {
              ...init,
              headers,
            };
          }
        );
        expect(result.method).toEqual("get");
        expect((result.headers as Headers).get("foo")).toEqual("bar");
        expect((result.headers as Headers).get("bar")).toEqual("foo");
      });
    });
  });
});
