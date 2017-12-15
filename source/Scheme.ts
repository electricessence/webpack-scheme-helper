import * as Path from 'path';
import * as webpack from 'webpack';
import * as CleanPlugin from 'clean-webpack-plugin';
import * as ExtractTextCssPlugin from 'extract-text-webpack-plugin';
import * as AssetsPlugin from 'assets-webpack-plugin';
import * as Loader from './constants/Loaders';
import * as Pattern from './constants/LoaderPatterns';
import {SOURCE_MAP} from './constants/Devtools';
import {JS, TS, CSS, SCSS, LESS, JSX, TSX, HTM, HTML} from './constants/Extensions';
import {NAME, HASH, CHUNKHASH, EXT} from "./constants/FilePathPattern";
import {IMap} from "./IMap";
import {Roots} from "./Roots";
import merge from "./merge";
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const DEFAULT_FILE_PATTERN = `${NAME}/${CHUNKHASH}`;
const DEFAULT_COMMON_CHUNK_NAME = "common";

export class Scheme
{
	filePattern:string = DEFAULT_FILE_PATTERN;

	javascript:boolean = true;
	typescript:boolean = false;
	html:boolean = false;
	css:boolean = false;
	scss:boolean = false;
	less:boolean = false;
	fonts:boolean = false;
	images:boolean = false;

	cache:boolean = true;
	sourceMaps:boolean = true;

	clean:boolean = true;
	minify:boolean = true;

	commonChunkName:string | null
		= DEFAULT_COMMON_CHUNK_NAME; // If set, will always generate a common chunk.

	modifier():Scheme.Modifier
	{
		return new Scheme.Modifier(this);
	}

	builder(roots:Roots):Scheme.Builder
	{
		return new Scheme.Builder(roots, this);
	}
}

export module Scheme
{

	export function minimal():Scheme
	{
		return new Scheme();
	}

	export function full():Scheme
	{
		return (new Modifier())
			.typescript()
			.css()
			.less()
			.scss()
			.fonts()
			.images()
			.scheme;
	}

	export class Modifier
	{
		readonly scheme:Scheme;

		constructor(baseScheme?:Scheme)
		{
			this.scheme = merge(baseScheme, new Scheme());
		}

		javascript(enabled:boolean = true):this
		{
			this.scheme.javascript = enabled;
			return this;
		}

		typescript(enabled:boolean = true):this
		{
			this.scheme.typescript = enabled;
			return this;
		}

		html(enabled:boolean = true):this
		{
			this.scheme.html = enabled;
			return this;
		}

		css(enabled:boolean = true):this
		{
			this.scheme.css = enabled;
			return this;
		}

		scss(enabled:boolean = true):this
		{
			this.scheme.scss = enabled;
			return this;
		}

		less(enabled:boolean = true):this
		{
			this.scheme.less = enabled;
			return this;
		}

		fonts(enabled:boolean = true):this
		{
			this.scheme.fonts = enabled;
			return this;
		}

		images(enabled:boolean = true):this
		{
			this.scheme.images = enabled;
			return this;
		}

		cache(enabled:boolean = true):this
		{
			this.scheme.cache = enabled;
			return this;
		}

		sourceMaps(enabled:boolean = true):this
		{
			this.scheme.sourceMaps = enabled;
			return this;
		}

		commonChunkName(name:string | null = DEFAULT_COMMON_CHUNK_NAME):this
		{
			this.scheme.commonChunkName = name;
			return this;
		}

		clean(enabled:boolean = true):this
		{
			this.scheme.clean = enabled;
			return this;
		}

		minify(enabled:boolean = true):this
		{
			this.scheme.minify = enabled;
			return this;
		}

		filePattern(pattern:string = DEFAULT_FILE_PATTERN)
		{
			this.scheme.filePattern = pattern;
			return this;
		}

	}

	export class Builder
		extends Modifier
	{

		constructor(
			public readonly roots:Roots,
			baseScheme?:Scheme)
		{
			super(baseScheme);
			if(!roots)
				throw "No root configuration provided.";
			if(!roots.project)
				throw "No project root specified.";
		}

		/**
		 * The webpack entry configuration.
		 */
		entries:webpack.Entry = {};

		plugins:webpack.Plugin[] = [];

		/**
		 * Adds an entry to the entries collection.
		 * @param {string} key
		 * @param value
		 * @returns {this}
		 */
		addEntry(key:string, value:any = key):this
		{
			let entries = this.entries || (this.entries = {});
			entries[key] = value;
			return this;
		}

		/**
		 * Inserts additional plugs before the ones used to finalize the pack.
		 * @param plugin
		 */
		addPlugin(plugin:webpack.Plugin):this
		{
			const plugins = this.plugins || (this.plugins = []);
			plugins.push(plugin);
			return this;
		}

		addPlugins(...plugins:webpack.Plugin[]):this
		{
			for(let p of plugins)
				this.addPlugin(p);
			return this;
		}

		/**
		 * Adds any set of module names to the list of entries.
		 * @param {string[]} modules
		 * @returns {this}
		 */
		addModules(modules:string[]):this
		{
			for(let m of modules)
			{
				this.addEntry(m);
			}
			return this;
		}

		cssFile?:string | null;

		extractCssTo(cssFile?:string | null):this
		{
			this.cssFile = cssFile;
			return this;
		}

		/**
		 * The values exposed globally. [key = entry, value = variable].
		 */
		provided:IMap<any> | null;

		/**
		 * Sets the provided values.
		 * @param config
		 * @returns {this}
		 */
		provide(config:IMap<any> | null = null):this
		{
			this.provided = config;
			return this;
		}

		/**
		 * The entries to be processed by the CommonsChunkPlugin
		 * @type {string[]}
		 */
		common:string[] | null = null;

		/**
		 * Sets the entries to be made common.
		 * @param {string[]} config
		 * @returns {this}
		 */
		commons(config:string[] | null = null):this
		{
			this.common = config;
			return this;
		}

		/**
		 * The step by step method by which the config is built.
		 * @returns {webpack.Configuration}
		 */
		render():webpack.Configuration
		{
			const _ = this;
			const S = _.scheme;
			const roots = _.roots;

			if(!roots)
				throw "No root configuration provided.";
			if(!roots.project)
				throw "No project root specified.";

			let subPath = [];
			if(roots.web) subPath.push(roots.web);
			if(roots.build) subPath.push(roots.build);

			const buildPath = subPath.length
				? Path.resolve(roots.project, subPath.join("/"))
				: roots.project;
			const entries = _.entries;
			const entryCount = Object.keys(entries).length;

			let filePattern = S.filePattern || DEFAULT_FILE_PATTERN;
			if(S.minify) filePattern += ".min";

			const extensions:string[] = [];
			const plugins:any[] = [];
			const rules:webpack.Rule[] = [];
			const config:webpack.Configuration = {
				entry: entries,
				output: {
					filename: filePattern + JS,
					chunkFilename: filePattern + JS,
					path: buildPath
				},
				resolve: {extensions: extensions},
				cache: S.cache,
				module: {rules: rules},
				plugins: plugins
			};

			if(S.javascript)
			{
				extensions.push(JS);
				extensions.push(JSX);
			}

			if(S.typescript)
			{
				extensions!.push(TS);
				extensions!.push(TSX);
				rules.push({
					test: Pattern.TS,
					use: Loader.TS,
					exclude: '/node_modules/'
				});
			}

			if(S.html)
			{
				extensions.push(HTM);
				extensions.push(HTML);
				rules.push({
					test: Pattern.HTML,
					use: [{
						loader: Loader.HTML,
						options: {
							minimize: S.minify,
							sourceMap: S.sourceMaps
						}
					}]
				});
			}

			const extractCSS:ExtractTextCssPlugin | null
				      = this.cssFile ? new ExtractTextCssPlugin(this.cssFile) : null;

			if(S.css)
			{
				const use = [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: S.sourceMaps}
					}
				];

				extensions.push(CSS);
				rules.push({
					test: Pattern.CSS,
					use: extractCSS ? extractCSS.extract(use) : use
				});
			}

			if(S.scss)
			{
				const use = [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: S.sourceMaps}
					}, {
						loader: Loader.SCSS,
						options: {sourceMap: S.sourceMaps}
					}
				];

				extensions.push(SCSS);
				rules.push({
					test: Pattern.SCSS,
					use: extractCSS ? extractCSS.extract(use) : use
				});
			}

			if(S.less)
			{
				const use = [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: S.sourceMaps}
					}, {
						loader: Loader.LESS,
						options: {sourceMap: S.sourceMaps}
					}
				];

				extensions.push(LESS);
				rules.push({
					test: Pattern.LESS,
					use: extractCSS ? extractCSS.extract(use) : use
				});
			}

			if(S.fonts || S.images)
			{
				rules.push({
					test: S.fonts && S.images ? Pattern.ASSETS : (S.fonts ? Pattern.FONTS : Pattern.IMAGES ),
					use: {
						loader: Loader.FILE,
						options: {
							name: `_assets/${NAME}/${HASH}${EXT}`,
							publicPath: `${roots.build}/`
						}
					}
				});
			}

			if(S.sourceMaps)
				config.devtool = SOURCE_MAP;

			if(S.clean) plugins.push(
				new CleanPlugin(buildPath, {root: roots.project}));

			plugins.push(
				new webpack.HashedModuleIdsPlugin());

			if(extractCSS)
				plugins.push(extractCSS);

			if(entryCount>1)
			{
				const common = _.common || [];
				if(S.commonChunkName && common.indexOf(S.commonChunkName)== -1)
					common.push(S.commonChunkName);

				if(common.length) plugins.push(
					new webpack.optimize.CommonsChunkPlugin({names: common}));
			}

			if(_.provided) plugins.push(
				new webpack.ProvidePlugin(_.provided));

			if(this.plugins) for(let p of this.plugins)
				plugins.push(p);

			plugins.push(
				new AssetsPlugin({path: buildPath}));

			if(S.minify) plugins.push(
				new UglifyJsPlugin({sourceMap: S.sourceMaps}));

			return config;
		}

	}
}


export default Scheme;