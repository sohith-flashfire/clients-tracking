export function parseFlexibleDate(input) {
    if (!input) return null;

    const m = String(input).trim().match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
    );

    if (m) {
        let [, d, mo, y, h = "0", mi = "0", s = "0", ap] = m;
        d = +d; mo = +mo - 1; y = +y; h = +h; mi = +mi; s = +s;
        if (ap) {
            const isPM = ap.toLowerCase() === "pm";
            if (h === 12) h = isPM ? 12 : 0;
            else if (isPM) h += 12;
        }
        return new Date(y, mo, d, h, mi, s);
    }

    const native = new Date(input);
    return isNaN(native.getTime()) ? null : native;
}

export function formatDate(dt) {
    if (!dt) return "—";
    return dt.toLocaleDateString("en-GB");
}

export function formatDateTime(dt) {
    if (!dt) return "—";
    return dt.toLocaleString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

export function sameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function getLastTimelineStatus(timeline = []) {
    if (!timeline.length) return null;
    const last = timeline[timeline.length - 1];
    if (typeof last === "string") return last.toLowerCase();
    if (last && typeof last === "object" && last.status)
        return String(last.status).toLowerCase();
    return null;
}

export function isAppliedNow(job) {
    const current = String(job.currentStatus || "").toLowerCase();
    const last = getLastTimelineStatus(job.timeline);
    return current.includes("applied") && last && last.includes("applied");
}

export function sortByUpdatedDesc(a, b) {
    const da = parseFlexibleDate(a.updatedAt || a.dateAdded);
    const db = parseFlexibleDate(b.updatedAt || b.dateAdded);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta;
}

export function safeDate(job) {
    return parseFlexibleDate(job.appliedDate || job.updatedAt || job.dateAdded);
}

export function mapStatusToStandard(status) {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus.includes('applied')) return 'applied';
    if (normalizedStatus.includes('saved')) return 'saved';
    if (normalizedStatus.includes('interviewing')) return 'interviewing';
    if (normalizedStatus.includes('rejected')) return 'rejected';
    if (normalizedStatus.includes('deleted')) return 'removed';
    if (normalizedStatus.includes('offer') || normalizedStatus.includes('hired')) return 'offers';
    if (normalizedStatus.includes('on-hold')) return 'interviewing';

    const statusMap = {
        'offer': 'offers',
        'hired': 'offers',
        'on-hold': 'interviewing',
        'deleted': 'removed',
        'saved': 'saved',
        'applied': 'applied',
        'interviewing': 'interviewing',
        'rejected': 'rejected'
    };

    return statusMap[normalizedStatus] || normalizedStatus;
}