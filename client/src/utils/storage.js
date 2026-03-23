export function getStoredUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        // Corrupted session payload should not break app initialization.
        localStorage.removeItem('user');
        return null;
    }
}
