import * as Path from 'path';
import * as webpack from 'webpack';
import * as CleanPlugin from 'clean-webpack-plugin';
import * as AssetsPlugin from 'assets-webpack-plugin';
import {SOURCE_MAP} from './constants/Devtools';
import {JS, TS, CSS, SCSS, LESS, JSX, TSX} from './constants/Extensions';
import {NAME, HASH, EXT} from "./constants/FilePathPattern";
import * as Loader from './constants/Loaders';
import * as Pattern from './constants/LoaderPatterns';
import Scheme from "./Scheme";
import {IMap} from "./IMap";
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

export interface Roots {
	/**
	 * The file system path where the project is rooted. (required)
	 */
	project: string;

	/**
	 * The relative project sub-path of the web-root (optional, defaults to project root)
	 */
	web?: string | null;

	/**
	 * The sub-path of the web-root where the webpack files are built to.
	 */
	build?: string | null;
}

export class ConfigBuilder extends Scheme.Builder {

	constructor(public readonly roots: Roots,
	            baseScheme?: Scheme) {
		super(baseScheme);
		if (!roots)
			throw "No root configuration provided.";
		if (!roots.project)
			throw "No project root specified.";
	}

	/**
	 * The webpack entry configuration.
	 */
	entries: webpack.Entry = {};

	/**
	 * Adds an entry to the entries collection.
	 * @param {string} key
	 * @param value
	 * @returns {this}
	 */
	addEntry(key: string, value: any = key): this {
		let entries = this.entries || (this.entries = {});
		entries[key] = value;
		return this;
	}

	/**
	 * Adds any set of module names to the list of entries.
	 * @param {string[]} modules
	 * @returns {this}
	 */
	addModules(modules:string[]): this
	{
		for(var m of modules)
			this.addEntry(m);
		return this;
	}

	/**
	 * The values exposed globally. [key = entry, value = variable].
	 */
	provided: IMap<any> | null;

	/**
	 * Sets the provided values.
	 * @param config
	 * @returns {this}
	 */
	provide(config: IMap<any> | null = null): this {
		this.provided = config;
		return this;
	}

	/**
	 * The entries to be processed by the CommonsChunkPlugin
	 * @type {string[]}
	 */
	common: string[] | null = null;

	/**
	 * Sets the entries to be made common.
	 * @param {string[]} config
	 * @returns {this}
	 */
	commons(config: string[] | null = null): this {
		this.common = config;
		return this;
	}

	/**
	 * The step by step method by which the config is built.
	 * @returns {webpack.Configuration}
	 */
	render(): webpack.Configuration {
		const _ = this;
		const S = _.scheme;
		const roots = _.roots;

		if (!roots)
			throw "No root configuration provided.";
		if (!roots.project)
			throw "No project root specified.";

		let subPath = [];
		if (roots.web) subPath.push(roots.web);
		if (roots.build) subPath.push(roots.build);

		const buildPath = subPath.length ? Path.resolve(roots.project, subPath.join("/")) : roots.project;
		const entries = _.entries;

		let filePattern = S.filePattern;
		if (S.minify) filePattern += ".min";

		const extensions: string[] = [];
		const plugins: any[] = [];
		const rules: webpack.Rule[] = [];
		const config: webpack.Configuration = {
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

		if (S.javascript) {
			extensions.push(JS);
			extensions.push(JSX);
		}

		if (S.typescript) {
			extensions!.push(TS);
			extensions!.push(TSX);
			rules.push({
				test: Pattern.TS,
				use: Loader.TS,
				exclude: '/node_modules/'
			});
		}

		if (S.css) {
			extensions.push(CSS);
			rules.push({
				test: Pattern.CSS,
				use: [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: S.sourceMaps}
					}
				]
			});
		}

		if (S.scss) {
			extensions.push(SCSS);
			rules.push({
				test: Pattern.SCSS,
				use: [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: S.sourceMaps}
					}, {
						loader: Loader.SCSS,
						options: {sourceMap: S.sourceMaps}
					}
				]
			});
		}

		if (S.less) {
			extensions.push(LESS);
			rules.push({
				test: Pattern.LESS,
				use: [
					{
						loader: Loader.STYLE
					}, {
						loader: Loader.CSS,
						options: {sourceMap: S.sourceMaps}
					}, {
						loader: Loader.LESS,
						options: {sourceMap: S.sourceMaps}
					}
				]
			});
		}

		const ASSET_NAME = `${NAME}/${HASH}${EXT}`;

		if (S.fonts) {
			rules.push({
				test: Pattern.FONT,
				use: {
					loader: Loader.FILE,
					options: {
						name: `_fonts/${ASSET_NAME}`,
						publicPath: `${roots.build}/`
					}
				}
			});
		}

		if (S.images) {
			rules.push({
				test: Pattern.IMAGE,
				use: {
					loader: Loader.FILE,
					options: {
						name: `_images/${ASSET_NAME}`,
						publicPath: `${roots.build}/`
					}
				}
			});
		}

		if (S.sourceMaps)
			config.devtool = SOURCE_MAP;

		if (S.clean) plugins.push(
			new CleanPlugin(buildPath, {root: roots.project}));

		plugins.push(
			new webpack.HashedModuleIdsPlugin());

		const common = _.common || [];
		if (S.commonChunkName && common.indexOf(S.commonChunkName) == -1)
			common.push(S.commonChunkName);

		if(common.length) plugins.push(
			new webpack.optimize.CommonsChunkPlugin({names: common}));

		if (_.provided) plugins.push(
			new webpack.ProvidePlugin(_.provided));

		plugins.push(
			new AssetsPlugin({path: buildPath}));

		if (S.minify) plugins.push(
			new UglifyJsPlugin({sourceMap: S.sourceMaps}));

		return config;
	}

}

export default ConfigBuilder;