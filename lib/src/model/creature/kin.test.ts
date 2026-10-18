import { afterEach, describe, expect, it, vi } from "vitest";
import { KinEnum } from "../../../creatures/kin";
import logService from "../../services/log.service";
import { CreatureKin, kinOf } from "./kin";

class TestKin extends CreatureKin {}
class OtherKin extends CreatureKin {}

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

describe("kinOf", () => {
  it("returns the kin when it is registered with the expected class", () => {
    const fey = new TestKin(KinEnum.Fey);
    expect(kinOf(new Map([[KinEnum.Fey, fey]]), KinEnum.Fey, TestKin)).toBe(fey);
  });

  it("throws when the kin is missing", () => {
    expect(() => kinOf(new Map(), KinEnum.Fey, TestKin)).toThrow("Kin Fey is not built");
  });

  it("throws when the kin is of another class", () => {
    const kins = new Map<KinEnum, CreatureKin>([[KinEnum.Fey, new OtherKin(KinEnum.Fey)]]);
    expect(() => kinOf(kins, KinEnum.Fey, TestKin)).toThrow("Kin Fey is not a TestKin");
  });
});
