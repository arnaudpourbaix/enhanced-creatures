import { CodeLine } from "../../model/misc";
import { Projectile, ProjectileTypeEnum } from "../../model/spell-item/projectile";
import { AbstractWeiduService } from "./abstract-weidu.service";

class WeiduProjectileService extends AbstractWeiduService {
  createProjectiles(lines: CodeLine[], projectiles: Projectile[]) {
    for (const projectile of projectiles) {
      this.createProjectile(lines, projectile);
    }
  }

  createProjectile(lines: CodeLine[], projectile: Projectile) {
    if (!projectile.copyFromFile)
      throw new Error(`copyFromFile is required for projectile ${projectile.file}`);
    this.add(
      lines,
      `COPY_EXISTING "${projectile.copyFromFile}.pro" ~override/${projectile.file}.pro~`,
      0,
    );
    this.add(lines, `READ_SHORT 0x08 type`, 1);
    if (projectile.type !== ProjectileTypeEnum.NoBAM) {
      this.add(lines, `PATCH_IF (%type% = 1) BEGIN`, 1);
      this.add(lines, `INSERT_BYTES 0x100 0x100`, 2);
      this.add(lines, `END`, 1);
    }
    if (projectile.type === ProjectileTypeEnum.AreaOfEffect) {
      this.add(lines, `PATCH_IF (%type% != 3) BEGIN`, 1);
      this.add(lines, `INSERT_BYTES 0x200 0x100`, 2);
      this.add(lines, `END`, 1);
    }
    this.write(lines, 0x08, 2, projectile.type, 1);
    this.write(lines, 0x0a, 2, projectile.speed, 1);
    this.writeFlag(lines, 0x0c, 4, projectile.behaviorFlags, 1);
    this.write(lines, 0x10, 8, projectile.fireSound, 1);
    this.write(lines, 0x18, 8, projectile.impactSound, 1);
    this.write(lines, 0x20, 8, projectile.sourceAnimation, 1);
    this.write(lines, 0x28, 2, projectile.particleColor, 1);
    this.write(lines, 0x2a, 2, projectile.projectileWidth, 1);
    this.writeFlag(lines, 0x2c, 4, projectile.extendedFlags, 1);
    this.writeStringRef(lines, 0x30, projectile.stringRef, 1);
    this.write(lines, 0x34, 4, projectile.color, 1);
    this.write(lines, 0x38, 2, projectile.colorSpeed, 1);
    this.write(lines, 0x3a, 2, projectile.screenShakeAmount, 1);
    this.write(lines, 0x3e, 2, projectile.idsTarget1, 1);
    this.write(lines, 0x42, 2, projectile.idsTarget2, 1);
    this.write(lines, 0x44, 8, projectile.defaultSpell, 1);
    this.write(lines, 0x4c, 8, projectile.successSpell, 1);
    if (projectile.projectileInfo) {
      const info = projectile.projectileInfo;
      this.writeFlag(lines, 0x100, 4, info.bamProjectileFlags, 1);
      this.write(lines, 0x116, 2, info.lightSpotIntensity, 1);
      this.write(lines, 0x118, 2, info.lightSpotWidth, 1);
      this.write(lines, 0x11a, 2, info.lightSpotHeight, 1);
      this.write(lines, 0x134, 2, info.projectileSmokeAnimation, 1);
    }
    if (projectile.areaEffectInfo) {
      const info = projectile.areaEffectInfo;
      this.writeFlag(lines, 0x200, 2, info.areaProjectileFlags, 1);
      this.write(lines, 0x202, 2, info.rayCount, 1);
      this.write(lines, 0x204, 2, info.triggerRadius, 1);
      this.write(lines, 0x206, 2, info.areaOfEffect, 1);
      this.write(lines, 0x208, 8, info.explosionSound, 1);
      this.write(lines, 0x210, 2, info.explosionDelay, 1);
      this.write(lines, 0x212, 2, info.fragmentAnimation, 1);
      this.write(lines, 0x214, 2, info.secondaryProjectile, 1);
      this.write(lines, 0x216, 1, info.triggerCount, 1);
      this.write(lines, 0x217, 1, info.explosionEffect, 1);
      this.write(lines, 0x218, 1, info.explosionColor, 1);
      this.write(lines, 0x224, 2, info.coneWidth, 1);
    }
    this.add(lines, `ADD_PROJECTILE ~override/${projectile.file}.pro~ ~${projectile.name}~`, 0);
    this.add(lines, "", 0);
  }
}

const weiduProjectileService = new WeiduProjectileService();
export default weiduProjectileService;
