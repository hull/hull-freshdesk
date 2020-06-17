import { ServiceClient } from "../../src/core/service-client";

describe("ServiceClient", () => {
  describe("constructor", () => {
    it("should initialize the API Key", () => {
      const client = new ServiceClient({ apiKey: "1234" });
      expect(client.apiKey).toEqual("1234");
    });
  });
});
