import { describe, expect, it } from "vitest";
import { parseAi } from "./state-ai.factory";

describe("state-ai.engine", () => {
  it("should create a valid ai", () => {
    const aiFactory = parseAi();

    const ai = aiFactory(() => ({} as any));

    expect(ai).toBeDefined();
  });
});
