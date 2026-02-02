import { createNavigation } from 'next-intl/navigation';
import { routing, locales } from './routing';

export { locales };
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
