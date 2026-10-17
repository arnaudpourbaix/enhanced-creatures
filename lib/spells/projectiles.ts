import { Projectile } from "../src/model/spell-item/projectile";

export enum CommonProjectileFiles {
  AreaOfSightNonParty = "japc0000",
}

export const COMMON_PROJECTILES: Projectile[] = [
  {
    file: CommonProjectileFiles.AreaOfSightNonParty,
    copyFromFile: "INAREANP",
    name: "Area of Sight Non-party",
    speed: 60,
    areaEffectInfo: {
      triggerRadius: 470,
      areaOfEffect: 470,
    },
  },
];
