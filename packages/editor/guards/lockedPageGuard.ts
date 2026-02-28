type LockablePage = {
  is_locked?: boolean;
};

export function isPageLocked(page: LockablePage | null | undefined) {
  return Boolean(page?.is_locked);
}

export function assertPageUnlocked(page: LockablePage | null | undefined) {
  return !isPageLocked(page);
}
