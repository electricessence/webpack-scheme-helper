import * as Path from 'path';
import * as Webpack from 'webpack';
import * as CleanPlugin from 'clean-webpack-plugin';
import * as AssetsPlugin from 'assets-webpack-plugin';
import { SOURCE_MAP } from './constants/Devtools';
import { JS, TS, CSS, SCSS, LESS } from './constants/Extensions';
import Loader from './constants/Loaders';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

export class Settings
{
	/**
	 * File system path where build is deployed.
	 */
	buildPath:string;

	/**
	 * Files can other sub-files like maps, etc.
	 */
	filePattern:string = '[name]/[chunkhash]';

	javascript:boolean = true;
	typescript:boolean = false;
	css:boolean = false;
	scss:boolean = false;
	less:boolean = false;
	fonts:boolean = false;
	images:boolean = false;

	cache:boolean = true;
	sourceMaps:boolean = true;

	clean:boolean = true;
	minify:boolean = true;


}

export class Builder
{
	readonly settings: Settings;

	constructor()
	{
		this.settings = new Settings();
	}

	javascript(enabled:boolean = true):this {
		this.settings.javascript = enabled;
		return this;
	}

	typescript(enabled:boolean = true):this {
		this.settings.typescript = enabled;
		return this;
	}

	css(enabled:boolean = true):this {
		this.settings.css = enabled;
		return this;
	}

	scss(enabled:boolean = true):this {
		this.settings.scss = enabled;
		return this;
	}

	less(enabled:boolean = true):this {
		this.settings.less = enabled;
		return this;
	}

	fonts(enabled:boolean = true):this {
		this.settings.fonts = enabled;
		return this;
	}

	images(enabled:boolean = true):this {
		this.settings.images = enabled;
		return this;
	}

	cache(enabled:boolean = true):this
	{
		this.settings.cache = enabled;
		return this;
	}

	sourceMaps(enabled:boolean = true):this
	{
		this.settings.sourceMaps = enabled;
		return this;
	}

	clean(enabled:boolean = true):this
	{
		this.settings.clean = enabled;
		return this;
	}

	minify(enabled:boolean = true):this
	{
		this.settings.minify = enabled;
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
		buildDirectory:string):Webpack.Configuration
	{
		const buildPath = Path.resolve(projectFileRoot, buildDirectory);
		if(!buildPath)
			throw "No buildPath specified";

		const settings = this.settings;
		let filePattern = settings.filePattern;
		if(settings.minify) filePattern += ".min";

		const config:Webpack.Configuration = {
			entry: entry,
			output: {
				filename: filePattern + JS,
				chunkFilename: filePattern + JS,
				path: buildPath
			},
			resolve: { extensions: [] },
			cache: settings.cache,
			module: { rules: [] },
			plugins: []
		};
		const rules = (<Webpack.NewModule>config.module).rules;
		const plugins = config.plugins;

		if(settings.javascript)
		{
			config.resolve.extensions.push(JS);
		}

		if(settings.typescript)
		{
			config.resolve.extensions.push(TS);
			rules.push({
				test: /.+\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			});
		}

		if(settings.css)
		{
			config.resolve.extensions.push(CSS);
			rules.push({
				test: /\.scss$/,
				use: [{
					loader: Loader.STYLE
				}, {
					loader: Loader.CSS,
					options: { sourceMap: settings.sourceMaps }
				}, {
					loader: Loader.SCSS,
					options: { sourceMap: settings.sourceMaps }
				}]
			});
		}

		if(settings.scss)
		{
			config.resolve.extensions.push(SCSS);
			rules.push({
				test: /\.scss$/,
				use: [{
					loader: Loader.STYLE
				}, {
					loader: Loader.CSS,
					options: { sourceMap: settings.sourceMaps }
				}, {
					loader: Loader.SCSS,
					options: { sourceMap: settings.sourceMaps }
				}]
			});
		}

		if(settings.less)
		{
			config.resolve.extensions.push(LESS);
			rules.push({
				test: /\.less$/,
				use: [{
					loader: Loader.STYLE
				}, {
					loader: Loader.CSS,
					options: { sourceMap: settings.sourceMaps }
				}, {
					loader: Loader.LESS,
					options: { sourceMap: settings.sourceMaps }
				}]
			});
		}

		if(settings.sourceMaps)
			config.devtool = SOURCE_MAP;

		if(settings.clean) plugins.push(
			new CleanPlugin(buildPath,{root:projectFileRoot}));

		plugins.push(
			new Webpack.HashedModuleIdsPlugin());

		const names = Object.keys(entry);
		names.push("common");

		plugins.push(
			new Webpack.optimize.CommonsChunkPlugin({ names: names }));
	
		plugins.push(
			new AssetsPlugin({ path:buildPath }));

		if(settings.minify) plugins.push(
			new UglifyJsPlugin({sourceMap:settings.sourceMaps}));
		
		return config;
	}
}

export default Builder;