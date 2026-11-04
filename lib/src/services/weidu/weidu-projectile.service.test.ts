import { describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import {
  AreaExtendedFlagsEnum,
  Projectile,
  ProjectileTypeEnum,
} from "../../model/spell-item/projectile";
import weiduProjectileService from "./weidu-projectile.service";

function fakeProjectile(p: Partial<Projectile> = {}): Projectile {
  return {
    file: "pro01",
    copyFromFile: "SPWAILR",
    name: "Test Projectile",
    ...p,
  };
}

function codes(lines: CodeLine[]): string[] {
  return lines.map((l) => l.code);
}

describe("createProjectile", () => {
  it("skips the BAM-info INSERT_BYTES patch for a NoBAM projectile", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(
      lines,
      fakeProjectile({ type: ProjectileTypeEnum.NoBAM }),
    );
    expect(codes(lines)).not.toContain("INSERT_BYTES 0x100 0x100");
  });

  it("emits the BAM-info INSERT_BYTES patch for a non-NoBAM projectile", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(
      lines,
      fakeProjectile({ type: ProjectileTypeEnum.SingleTarget }),
    );
    expect(codes(lines)).toContain("PATCH_IF (%type% = 1) BEGIN");
    expect(codes(lines)).toContain("INSERT_BYTES 0x100 0x100");
  });

  it("writes projectileInfo fields when set", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(
      lines,
      fakeProjectile({
        projectileInfo: { lightSpotIntensity: 5 },
      }),
    );
    expect(codes(lines)).toContain("WRITE_SHORT 0x116 5");
  });

  it("skips projectileInfo fields when unset", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(lines, fakeProjectile({}));
    expect(codes(lines).some((c) => c.includes("0x116"))).toBe(false);
  });

  it("skips areaEffectInfo fields when unset", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(lines, fakeProjectile({}));
    expect(codes(lines).some((c) => c.includes("0x204"))).toBe(false);
  });

  it("writes areaEffectInfo fields when set", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(
      lines,
      fakeProjectile({
        type: ProjectileTypeEnum.AreaOfEffect,
        areaEffectInfo: { triggerRadius: 30 },
      }),
    );
    expect(codes(lines)).toContain("WRITE_SHORT 0x204 30");
  });

  it("writes the traveling BAM fields when set", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(
      lines,
      fakeProjectile({
        projectileInfo: {
          travelingAnimation: "ABATG1",
          projectileNumber: 2,
          faceTargetGranularity: 5,
        },
      }),
    );
    expect(codes(lines)).toEqual(
      expect.arrayContaining([
        "WRITE_ASCII 0x104 ~ABATG1~ #8",
        "WRITE_BYTE 0x114 2",
        "WRITE_BYTE 0x133 5",
      ]),
    );
  });

  it("writes EE spread animation fields when set", () => {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectile(
      lines,
      fakeProjectile({
        type: ProjectileTypeEnum.AreaOfEffect,
        areaEffectInfo: {
          spreadAnimation: "jabats",
          areaExtendedFlags: [
            AreaExtendedFlagsEnum.RandomSpeed,
            AreaExtendedFlagsEnum.StartScattered,
          ],
          animationGranularity: 4,
          animationGranularityDivider: 1,
        },
      }),
    );
    expect(codes(lines)).toEqual(
      expect.arrayContaining([
        "WRITE_ASCII 0x228 ~jabats~ #8",
        "WRITE_LONG 0x240 6",
        "WRITE_SHORT 0x248 4",
        "WRITE_SHORT 0x24a 1",
      ]),
    );
  });
});
