import { afterEach, describe, expect, it, vi } from "vitest";
import { KinEnum } from "../../../creatures/kin";
import logService from "../../services/log.service";
import { CreatureKin } from "./kin";

class TestKin extends CreatureKin {}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CreatureKin", () => {
  it("logs its own section header", () => {
    const header = vi.spyOn(logService, "header").mockImplementation(() => {});
    new TestKin(KinEnum.Fey);
    expect(header).toHaveBeenCalledWith("Creating kin Fey...");
  });

  it("names its resources with scope k and its code", () => {
    const kin = new TestKin(KinEnum.Fey);
    expect(kin.addSpell({}).file).toBe("jask0500");
    expect(kin.addItem({}).file).toBe("jaik0500");
    expect(kin.folder).toBe("lib/pnp-monster/kin/fey");
  });
});
