# Webpack Scheme Helper

Minimize the amount of configuration and code necessary for webpack by using **_'schemes'_**.  
Otherwise known as 'scenarios'.

*Source code is in TypeScript.*

## Schemes

Schemes are a typical way that files are deployed.  
This utility simplifies the construction of a config that follows a typical scheme.

Certain settings are enabled by default:

* JavaScript (and .jsx files)
* Builds are cleaned by default.
* All files are hashed.
* All files are minified and source-mapped by default.
* Proper long term hashing is retained using the hash plugin.
* webpack-assets.json is generated by default. 

Other file types are managed by including their loader as part of your ```package.json``` and enabling them in your scheme.

* TypeScript (and .tsx files)
* CSS, SaSS, and LeSS
* Fonts and Images.

**After which, _all you have to do is provide the project path and build paths._**

### Example

The following example takes all the dependencies defined in the ```package.json``` along with any manually specified entries.  
It will successfully compile and bundle all TypeScript, CSS, LeSS files (and SaSS if desired) into a web folder structure like so:

(An underscore prefix is used so as not to be confused with a route or to designate a category.)

```
wwwroot
|- /_client
  |- /vendor
    |- /_fonts
      ... (fonts from bootstrap)
    |- jquery
    |- bootstrap
    ... (and more modules)
  |- /local
    |- main
    (will include a common chunk if more entries specified)
```

##### vendor.ts

```ts
import WebpackScheme from 'webpack-scheme-helper';
import { PROJECT, WEB, BUILD, PACKAGE } from '../constants';

export default
WebpackScheme

	// Use the 'full' scheme as a starting point.
	// This enables all features by default.
	.full()

	// Define the build paths for this config.
	.builder({
		project: PROJECT.ROOT,
		web: WEB.ROOT, // wwwroot
		build: `${BUILD.PATH}/vendor` // _client/vendor
	})

	// Calling .full() will look for .scss files
	// But SaSS is not used in this project.
	// Ommiting this will have no effect if there are no .scss files in your project.
	.scss(false)

	// Compile all the modules individually.
	.addModules(Object.keys(PACKAGE.JSON.dependencies))

	// Expose jQuery to Bootstrap.
	.provide({
		"$":"jquery",
		"jQuery":"jquery"
	})

	// Define bootstrap's css as its own entry
	// so if by chance the next version only has JavaScript changes.
	// This also include fonts since .full() was used.
	.addEntry(
		"bootstrap.css",
		"./node_modules/bootstrap/dist/css/bootstrap.css")

	.render();
```

##### local.ts

```ts
import WebpackScheme from 'webpack-scheme-helper';
import { PROJECT, WEB, BUILD } from '../constants';

export default
WebpackScheme

	// Use the 'minimal' scheme as a starting point.
	// This starts with JavaScript enabled only.
	.minimal()

	// Define the build paths for this config.
	.builder({
		project: PROJECT.ROOT,
		web: WEB.ROOT, // wwwroot
		build: `${BUILD.PATH}/local` // _client/local
	})

	// Enable LeSS processing.
	.less()

	// Enable TypeScript.
	.typescript()

	// Reference the main.ts file as the local entry.
	.addEntry("main", "./Client/src/main.ts")

	.render();
```

##### config.ts

Combine the two configs together.

```js
import vendor from "./vendor";
import local from "./local";

export default
[
	vendor,
	local
]
```

##### webpack.config.js

Demonstrates how to use TypeScript for configs instead of just JavaScript.

```js
'use strict';
// Interpret TypeScript.
require('ts-node').register({ compilerOptions:{ target: "ES2016" } });
module.exports = require('./Webpack/config.ts');
```

## Why?

Webpack configs are detailed and highly configurable, but settings must be configured in multiple places for one specific file type or option to work properly.
This utility procedurally configures all necessary options based upon desired features and the source code for the procedure is easily readable.

A lot of time and care has gone into getting this utility to follow Webpack best practices.  Comments and feedback are encouraged.

## Installation

```
npm install webpack webpack-scheme-helper --save-dev
```

Currently, schemes work with your existing Webpack installation as a peer dependency.
If you're only packing JavaScript, then no additional installation is necessary.
But if you are planning to use features beyond just JavaScript you will need include the modules and loaders necessary.

The following are the modules necessary if you are going to use a specific loader.

#### TypeScript

```
npm install ts-loader --save-dev
```

Also recommended:

```
npm install ts-node --save-dev
npm install tslib --save
```

#### HTML

https://webpack.js.org/loaders/html-loader/

```
npm install html-loader --save-dev
```

#### CSS

https://webpack.js.org/loaders/css-loader/

```
npm install css-loader style-loader --save-dev
```

#### SaSS

https://webpack.js.org/loaders/sass-loader/

```
npm install node-sass style-loader less-loader --save-dev
```

#### LeSS

https://webpack.js.org/loaders/less-loader/

```
npm install less style-loader less-loader --save-dev
```

#### Fonts or Images

https://webpack.js.org/loaders/file-loader/

```
npm install file-loader --save-dev
```


## Working Cross-Platform Sample

https://github.com/electricessence/aspnet-core2-starter
