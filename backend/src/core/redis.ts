import Redis from "ioredis";

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err: Error) => console.error("[REDIS]", err));

export const kv = {
  async get(key: string): Promise<string | null> {
    return redis.get(key);
  },
  async put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number },
  ): Promise<void> {
    if (opts?.expirationTtl) {
      await redis.set(key, value, "EX", opts.expirationTtl);
    } else {
      await redis.set(key, value);
    }
  },
  async delete(key: string): Promise<void> {
    await redis.del(key);
  },
  async list(opts?: {
    prefix?: string;
  }): Promise<{ keys: { name: string }[] }> {
    const pattern = opts?.prefix ? `${opts.prefix}*` : "*";
    const keys = await redis.keys(pattern);
    return { keys: keys.map((name: string) => ({ name })) };
  },
};
