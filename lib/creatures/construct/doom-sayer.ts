import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { builtBefore, CreatureKin, kinOf } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Construct, ConstructKin } from "./kin";

class DoomSayerEntry extends CreatureEntry<Construct> {
  constructor(private readonly constructKin?: ConstructKin) {
    super(EntryEnum.DoomSayer, constructKin);
    this.addCreature(() => this.doomSayer());
  }

  createCreature(id: MonsterEnum): Construct {
    return new Construct(id);
  }

  /**
   * Doom Sayer
   */
  private doomSayer() {
    const doomSayer = this.createFrom({
      name: "monster.construct.name.doomSayer",
      monster: MonsterEnum.DoomSayer,
      from: builtBefore(this.constructKin?.battleHorror, "Battle Horror"),
      files: [],
    });
    doomSayer.setData({
      immunities: ["incorporeal"],
    });
    doomSayer.setBehavior({ dialog: ["DOOMSAYER"] });
    return doomSayer;
  }
}

export const createDoomSayerEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DoomSayerEntry(kinOf(kins, KinEnum.Construct, ConstructKin)).requires(EntryEnum.BattleHorror);
