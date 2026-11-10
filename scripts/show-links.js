import { formatAccessLinks } from '../src/adapters/inbound/http/access-links.js';
import { env } from '../src/config/env.js';

console.log(formatAccessLinks(env.APP_URL));
