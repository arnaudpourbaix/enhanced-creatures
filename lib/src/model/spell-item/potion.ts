import { Actions } from "../script/actions";
import { Triggers } from "../script/triggers";

export interface PotionConfig {
  name: string;
  files: string[];
  triggers?: Triggers.Trigger[];
  actions?: Actions.Action[];
  /**
   * Probability (0-100)
   */
  probability?: number;
}
