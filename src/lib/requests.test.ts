import { describe, expect, it } from "vitest";
import { demandLabel, validateRequest } from "@/lib/requests";

describe("plant version requests", () => {
  it("needs a device id of 8 to 64 safe characters", () => {
    expect(validateRequest({ deviceId: "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90" })).toEqual({ ok: true, deviceId: "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90" });
    expect(validateRequest({ deviceId: "short" }).ok).toBe(false);
    expect(validateRequest({ deviceId: "bad id; drop table" }).ok).toBe(false);
    expect(validateRequest(null).ok).toBe(false);
  });

  it("labels demand for the kitchen", () => {
    expect(demandLabel(0)).toBeNull();
    expect(demandLabel(1)).toBe("1 student wants a plant version");
    expect(demandLabel(14)).toBe("14 students want a plant version");
  });
});
