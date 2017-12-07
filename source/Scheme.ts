import * as Path from 'path';
import * as webpack from 'webpack';
import * as CleanPlugin from 'clean-webpack-plugin';
import * as AssetsPlugin from 'assets-webpack-plugin';
import {SOURCE_MAP} from './constants/Devtools';
import {JS, TS, CSS, SCSS, LESS, JSX, TSX} from './constants/Extensions';
import {NAME, HASH, CHUNKHASH, EXT} from "./constants/FilePathPattern";
import * as Loader from './constants/Loaders';
import * as Pattern from './constants/LoaderPatterns';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

export interface IMap<T>
{
	[key:string]:T
}

function merge<T>(source:IMap<T>, target:IMap<T> = {}):IMap<T>
{
	if(source) for(let key of Object.keys(source))
	{
		target[key] = source[key];
	}
	return target;
}

export class Scheme
{

	/**
	 * File system path of the project root.
	 */
	entries:IMap<any> = {};

	/**
	 * File system path of the project root.
	 */
	projectFileRoot:string;

	/**
	 * Relative path from the project root where files ar built..
	 */
	buildDirectory:string;

	/**
	 * Files can other sub-files like maps, etc.
	 */
	filePattern:string = `${NAME}/${NAME}-${CHUNKHASH}`;

	javascript:boolean = true;
	typescript:boolean = true;
	css:boolean = true;
	scss:boolean = true;
	less:boolean = true;
	fonts:boolean = true;
	images:boolean = true;

	cache:boolean = true;
	sourceMaps:boolean = true;

	/**
	 * What modules do you want exposed to the global scope.
	 */
	provide:IMap<any>;

	/**
	 * What modules do you want 'made common'.
	 */
	common:string[];

	clean:boolean = true;
	minify:boolean = true;

	/**
	 * The step by step method by which the config is built.
	 * @param entries Standard webpack entry map.
	 * @param projectFileRoot File system path to the project root.
	 * @param buildDirectory Sub-path to the build folder.
	 * @returns {webpack.Configuration}
	 */
	render(
		entries?:webpack.Entry,
		projectFileRoot:string = this.projectFileRoot,
		buildDirectory:string  = this.buildDirectory):webpack.Configuration
	{
		if(!projectFileRoot)
			throw "No projectFileRoot specified";
		if(!buildDirectory)
			throw "No buildDirectory specified";

		const buildPath = Path.resolve(projectFileRoot, buildDirectory);

		// Shallow merge a copy of the entries.
		entries = merge(
			entries || {},
			merge(this.entries)
		);

		const _ = this;
		let filePattern = _.filePattern;
		if(_.minify) filePattern += ".min";

		const config:webpack.Configuration = {
			entry: entries,
			output: {
				filename: filePattern + JS,
				chunkFilename: filePattern + JS,
				path: buildPath
			},
			resolve: {extensions: []},
			cache: _.cache,
			module: {rules: []},
			plugins: []
		};
		const rules = (<webpack.NewModule>config.module).rules;
		const plugins = config.plugins;
		const extensions = config.resolve.extensions;

		if(_.javascript)
		{
			extensions.push(JS);
			extensions.push(JSX);
		}

		if(_.typescript)
		{
			extensions.push(TS);
			extensions.push(TSX);
			rules.push({
				test: Pattern.TS,
				use: Loader.TS,
				exclude: '/node_modules/'
			});
		}

		if(_.css)
		{
			extensions.push(CSS);
			rules.push({
				test: Pattern.CSS,
				use: [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: _.sourceMaps}
					}
				]
			});
		}

		if(_.scss)
		{
			extensions.push(SCSS);
			rules.push({
				test: Pattern.SCSS,
				use: [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: _.sourceMaps}
					}, {
						loader: Loader.SCSS,
						options: {sourceMap: _.sourceMaps}
					}
				]
			});
		}

		if(_.less)
		{
			extensions.push(LESS);
			rules.push({
				test: Pattern.LESS,
				use: [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: _.sourceMaps}
					}, {
						loader: Loader.LESS,
						options: {sourceMap: _.sourceMaps}
					}
				]
			});
		}

		const ASSET_NAME = `${NAME}/${HASH}${EXT}`;

		if(_.fonts)
		{
			rules.push({
				test: Pattern.FONT,
				use: {
					loader: Loader.FILE,
					options: { name: `${ASSET_NAME}` }
				}
			});
		}

		if(_.images)
		{
			rules.push(
				{
					test: Pattern.IMAGE,
					use: {
						loader: Loader.FILE,
						options: { name: `${ASSET_NAME}` }
					}
				});
		}

		if(_.sourceMaps)
			config.devtool = SOURCE_MAP;

		if(_.clean) plugins.push(
			new CleanPlugin(buildPath, {root: projectFileRoot}));

		plugins.push(
			new webpack.HashedModuleIdsPlugin());

		const common = _.common || [];
		if(common.indexOf(("common"))== -1)
			common.push("common");

		plugins.push(
			new webpack.optimize.CommonsChunkPlugin({names: common}));

		if(_.provide) plugins.push(
			new webpack.ProvidePlugin(_.provide));

		plugins.push(
			new AssetsPlugin({path: buildPath}));

		if(_.minify) plugins.push(
			new UglifyJsPlugin({sourceMap: _.sourceMaps}));

		return config;
	}

}

export module Scheme
{
	export const defaults:Scheme = Object.freeze(new Scheme());

	export class Builder
	{
		readonly scheme:Scheme;

		constructor(projectFileRoot?:string, buildDirectory?:string)
		{
			this.scheme = new Scheme();
			this.scheme.projectFileRoot = projectFileRoot;
			this.scheme.buildDirectory = buildDirectory;
		}

		addEntry(key:string, value:any = null):this
		{
			let entries = this.scheme.entries || (this.scheme.entries = {});
			entries[key] = value || key;
			return this;
		}

		projectRoot(filePath:string):this
		{
			this.scheme.projectFileRoot = filePath;
			return this;
		}

		buildDirectory(path:string):this
		{
			this.scheme.buildDirectory = path;
			return this;
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

		provide(config:{ [key:string]:any } = null):this
		{
			this.scheme.provide = config;
			return this;
		}

		common(config:string[] = null):this
		{
			this.scheme.common = config;
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

	}
}

export default Scheme;