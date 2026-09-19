/**
 * Where the admin panel lives.
 *
 * It used to be bundled into this app under /admin. It is now a separate
 * application and repository, so the storefront links out to it rather than
 * routing to it. Unset means no link is shown at all — which is the right
 * default for a deployment that has no admin to point at.
 */
export const ADMIN_URL = import.meta.env.VITE_ADMIN_URL?.trim() || null
