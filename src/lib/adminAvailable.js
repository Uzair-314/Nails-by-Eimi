/**
 * Whether the admin panel is part of this build.
 *
 * The admin folder is kept out of the repository for now, so a deployed build
 * may not contain it. `import.meta.glob` resolves to an empty object when the
 * files are absent rather than failing, which lets the UI hide the link instead
 * of offering one that leads nowhere.
 */
export const ADMIN_AVAILABLE = Object.keys(import.meta.glob('../pages/admin/index.jsx')).length > 0
