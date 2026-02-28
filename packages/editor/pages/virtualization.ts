export function shouldVirtualizePages(pageCount: number, threshold = 10) {
  return pageCount > threshold;
}
