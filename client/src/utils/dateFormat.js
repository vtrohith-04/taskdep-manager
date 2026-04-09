function toDate(value) {
    if (!value) return null;

    const date = value instanceof Date ? new Date(value) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value) {
    return String(value).padStart(2, '0');
}

export function formatDateDMY(value, fallback = '') {
    const date = toDate(value);
    if (!date) return fallback;

    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTimeDMY(value, fallback = '') {
    const date = toDate(value);
    if (!date) return fallback;

    return `${formatDateDMY(date)} at ${date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })}`;
}
