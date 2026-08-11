import { describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import { Projectile, ProjectileTypeEnum } from "../../model/spell-item/projectile";
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
});
