import * as Webpack from 'webpack';

export const EVAL:Webpack.Options.Devtool
	= "eval";
export const CHEAP_EVAL_SOURCE_MAP:Webpack.Options.Devtool
	= "cheap-eval-source-map";
export const CHEAP_MODULE_EVAL_SOURCE_MAP:Webpack.Options.Devtool
	= "cheap-module-eval-source-map";
export const EVAL_SOURCE_MAP:Webpack.Options.Devtool
	= "eval-source-map";
export const CHEAP_SOURCE_MAP:Webpack.Options.Devtool
	= "cheap-source-map";
export const CHEAP_MODULE_SOURCE_MAP:Webpack.Options.Devtool
	= "cheap-module-source-map";
export const SOURCE_MAP:Webpack.Options.Devtool
	= "source-map";
export const INLINE_SOURCE_MAP:Webpack.Options.Devtool
	= "inline-source-map";
export const HIDDEN_SOURCE_MAP:Webpack.Options.Devtool
	= "hidden-source-map";
export const NOSOURCES_SOURCE_MAP:Webpack.Options.Devtool
	= "nosources-source-map";

Object.freeze(exports);