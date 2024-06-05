import { Context, Random, Schema } from "koishi";
import {} from "koishi-plugin-monetary";
import {} from "koishi-plugin-rate-limit";

export const name = "@ibaiyu/checkin";
export const inject = ["monetary"];

export interface Config {
  currency: string;
  reward: Reward;
}

export type Reward = Reward.Uniform;

export namespace Reward {
  export interface Uniform {
    type: "uniform";
    min: number;
    max: number;
  }
}

export const Reward = Schema.intersect([
  Schema.object({
    type: Schema.union([Schema.const("uniform").description("区间均匀分布。")])
      .default("uniform")
      .description("分布方式。"),
  }).description("签到奖励"),
  Schema.union([
    Schema.object({
      type: Schema.const("uniform"),
      min: Schema.number().default(10).description("最小值。"),
      max: Schema.number().default(20).description("最大值。"),
    }),
  ]),
]).default({
  type: "uniform",
  min: 10,
  max: 20,
}) as Schema<Reward>;

export const Config: Schema<Config> = Schema.object({
  currency: Schema.string().default("default"),
  reward: Reward,
});

function getReward(reward: Reward) {
  switch (reward.type) {
    case "uniform":
      return Random.int(reward.min, reward.max + 1);
  }
}

export function apply(ctx: Context, config: Config) {
  // write your plugin here

  ctx
    .command("checkin", "每日签到", {
      maxUsage: 1,
    })
    .alias("签到")
    .alias("打卡")
    .userFields(["id", "authority"])
    .action(({ session }) => {
      const reward = getReward(config.reward);
      const { userId } = session;

      ctx.monetary.gain(Number(userId), reward);
      ctx.logger.info(`${userId} 签到获得 ${reward} 金币`);

      session.send(
        <>
          <at id={userId} /> 签到成功~ 获得{reward}金币。
        </>
      );
    });
}
