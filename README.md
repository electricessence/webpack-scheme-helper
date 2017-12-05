# webpack-scheme-helper
Minimized the amount of configuration necessary for webpack build 'schemes'.  Source is in TypeScript.

## Schemes
Schemes are a typical way that files are deployed.  This utility simplifies the construction of a config that follows a typical scheme.

### Example

The following example takes all the dependencies defined in the package.json along with any manually specified entries.

```ts
import Scheme from 'webpack-scheme-helper';
import { PROJECT, BUILD, WEB, PACKAGE } from '../constants'; // Your own set of constants

const modules = Object.keys(PACKAGE.JSON.dependencies);
export const entry = {
	"main": "./Client/src/main.ts"
};
for (var e of modules)
	if (!entry[e]) entry[e] = e;

const builder = new Scheme.Builder();

export default builder
	.typescript() // Enables .ts and .tsx files. (on by default)
	.minify(false) // Disables minification.
	.render(
		entry, // Standard webpack entry map.
		PROJECT.ROOT, // The file system root for the project.
		BUILD.DIRECTORY // The sub folder to build to.
	);
```

or

```ts
export default Scheme
	.defaults
	.render(
		entry,
		PROJECT.ROOT,
		BUILD.DIRECTORY
	);
```

More schemes can be added over time.

## Assumptions / Opinions

In the current version:

* Clean/clearing a build folder happens by default.
* All files are minified with source maps.
* webpack-asset.json is created by default.
* chunk IDs are hashed.

## Why?

Webpack configs are detailed and highly configurable, but settings must be configured in multiple places for one specific file type or option to work properly.
This utility procedurally configures all necessary options based upon desired features.