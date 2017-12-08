export * from './constants';

import Scheme from './Scheme';
import {ConfigBuilder, Roots} from './ConfigBuilder';

export { Scheme, ConfigBuilder }; // Make webpack available here to simplify dependencies and use/implementation.
//noinspection JSUnusedGlobalSymbols
export default function(roots:Roots):ConfigBuilder {
	return new ConfigBuilder(roots);
};