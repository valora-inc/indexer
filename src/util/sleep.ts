export function sleep(ms: number): Promise<undefined> {
  // https://stackoverflow.com/a/39914235/5807149
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sleep for up to maxSleepMs milliseconds
 *
 * Useful for adding jitter to polling intervals, which can help us avoid rate limits
 *
 * @param maxSleepMs
 */
export function sleepRandom(maxSleepMs: number = 1000): Promise<undefined> {
  return sleep(Math.random() * maxSleepMs)
}
