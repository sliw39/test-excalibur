export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function nap(
  ms: number,
  interrupionCallback: () => boolean,
  interval = 20
) {
  const time = Date.now();
  while (!interrupionCallback() && Date.now() - time < ms) {
    await sleep(interval);
  }
}
