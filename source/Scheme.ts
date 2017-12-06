import * as Path from 'path';
import * as Webpack from 'webpack';
import * as CleanPlugin from 'clean-webpack-plugin';
import * as AssetsPlugin from 'assets-webpack-plugin';
import { SOURCE_MAP } from './constants/Devtools';
import {JS, TS, CSS, SCSS, LESS, JSX, TSX} from './constants/Extensions';
import Loader from './constants/Loaders';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const NAME:string = "[name]";
const CHUNKHASH:string = "[chunkhash]";
const EXT:string = "[ext]";


export module FilePattern
{
	export const NAME:string = NAME;
	export const CHUNKHASH:string = CHUNKHASH;
	export const EXT:string = EXT;
}
Object.freeze(FilePattern);


export class Scheme
{
	/**
	 * File system path where build is deployed.
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
	fonts:boolean = false;
	images:boolean = false;

	cache:boolean = true;
	sourceMaps:boolean = true;

	clean:boolean = true;
	minify:boolean = true;

	/**
	 * The step by step method by which the config is built.
	 * @param entry Standard Webpack entry map.
	 * @param projectFileRoot File system path to the project root.
	 * @param buildDirectory Sub-path to the build folder.
	 * @returns {Webpack.Configuration}
	 */
	render(
		entry: Webpack.Entry,
		projectFileRoot:string,
		buildDirectory:string = this.scheme.buildDirectory):Webpack.Configuration
	{
		const buildPath = Path.resolve(projectFileRoot, buildDirectory);
		if(!buildPath)
			throw "No buildPath specified";

		const _ = this;
		let filePattern = _.filePattern;
		if(_.minify) filePattern += ".min";

		const config:Webpack.Configuration = {
			entry: entry,
			output: {
				filename: filePattern + EXT,
				chunkFilename: filePattern + EXT,
				path: buildPath
			},
			resolve: { extensions: [] },
			cache: _.cache,
			module: { rules: [] },
			plugins: []
		};
		const rules = (<Webpack.NewModule>config.module).rules;
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
				test: /.+\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			});
		}

		if(_.css)
		{
			extensions.push(CSS);
			rules.push({
				test: /\.css$/,
				use: [{
					loader: Loader.STYLE
				}, {
					loader: Loader.CSS,
					options: {sourceMap: _.sourceMaps}
				}]
			});
		}

		if(_.scss)
		{
			extensions.push(SCSS);
			rules.push({
				test: /\.scss$/,
				use: [{
					loader: Loader.STYLE
				}, {
					loader: Loader.CSS,
					options: { sourceMap: _.sourceMaps }
				}, {
					loader: Loader.SCSS,
					options: { sourceMap: _.sourceMaps }
				}]
			});
		}

		if(_.less)
		{
			extensions.push(LESS);
			rules.push({
				test: /\.less$/,
				use: [{
					loader: Loader.STYLE
				}, {
					loader: Loader.CSS,
					options: { sourceMap: _.sourceMaps }
				}, {
					loader: Loader.LESS,
					options: { sourceMap: _.sourceMaps }
				}]
			});
		}

		if(_.fonts)
		{
			const addFont = function(pattern:RegExp, type:string)
			{
				rules.push({
					test: pattern,
					use: `url?limit=65000&mimetype=${type}&name=${buildDirectory}/fonts/[name]-[hash].[ext]`
				});
			};
			addFont(/\.svg$/,"image/svg+xml");
			addFont(/\.woff$/,"application/font-woff");
			addFont(/\.woff2$/,"application/font-woff2");
			addFont(/\.[ot]tf$/,"application/octet-stream");
			addFont(/\.eot$/,"application/vnd.ms-fontobject");
		}

		if(_.sourceMaps)
			config.devtool = SOURCE_MAP;

		if(_.clean) plugins.push(
			new CleanPlugin(buildPath,{root:projectFileRoot}));

		plugins.push(
			new Webpack.HashedModuleIdsPlugin());

		const names = Object.keys(entry);
		names.push("common");

		plugins.push(
			new Webpack.optimize.CommonsChunkPlugin({ names: names }));

		plugins.push(
			new AssetsPlugin({ path:buildPath }));

		if(_.minify) plugins.push(
			new UglifyJsPlugin({sourceMap:_.sourceMaps}));

		return config;
	}

}

export module Scheme
{
	export const defaults:Scheme = Object.freeze(new Scheme());

	export class Builder
	{
		readonly scheme: Scheme;

		constructor()
		{
			this.scheme = new Scheme();
		}

		javascript(enabled:boolean = true):this {
			this.scheme.javascript = enabled;
			return this;
		}

		typescript(enabled:boolean = true):this {
			this.scheme.typescript = enabled;
			return this;
		}

		css(enabled:boolean = true):this {
			this.scheme.css = enabled;
			return this;
		}

		scss(enabled:boolean = true):this {
			this.scheme.scss = enabled;
			return this;
		}

		less(enabled:boolean = true):this {
			this.scheme.less = enabled;
			return this;
		}

		fonts(enabled:boolean = true):this {
			this.scheme.fonts = enabled;
			return this;
		}

		images(enabled:boolean = true):this {
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

		/**
		 * The step by step method by which the config is built.
		 * @param entry Standard Webpack entry map.
		 * @param projectFileRoot File system path to the project root.
		 * @param buildDirectory Sub-path to the build folder.
		 * @returns {Webpack.Configuration}
		 */

		render(
			entry: Webpack.Entry,
			projectFileRoot:string,
			buildDirectory:string = this.scheme.buildDirectory):Webpack.Configuration
		{
			return this.scheme.render(entry, projectFileRoot, buildDirectory);
		}
	}
}

export default Scheme;



