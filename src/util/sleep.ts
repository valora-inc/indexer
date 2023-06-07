export function sleep(ms: number): Promise<undefined> {
  // https://stackoverflow.com/a/39914235/5807149
  return new Promise((resolve) => setTimeout(resolve, ms))
}
