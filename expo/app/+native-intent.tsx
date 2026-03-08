export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  console.log("[ImpactChain] redirectSystemPath:", path, initial);
  if (initial) {
    return "/";
  }
  return path;
}
