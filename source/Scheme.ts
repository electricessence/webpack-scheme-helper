import {NAME, CHUNKHASH} from "./constants/FilePathPattern";
import merge from "./merge";

const DEFAULT_COMMON_CHUNK_NAME = "common";

export class Scheme {

	filePattern: string = `${NAME}/${NAME}-${CHUNKHASH}`;

	javascript: boolean = true;
	typescript: boolean = true;
	css: boolean = true;
	scss: boolean = true;
	less: boolean = true;
	fonts: boolean = true;
	images: boolean = true;

	cache: boolean = true;
	sourceMaps: boolean = true;

	clean: boolean = true;
	minify: boolean = true;

	commonChunkName: string | null = DEFAULT_COMMON_CHUNK_NAME; // If set, will always generate a common chunk.
}

export module Scheme {

	export const defaults: Scheme = Object.freeze(new Scheme());

	export class Builder {
		readonly scheme: Scheme;

		constructor(baseScheme?: Scheme) {
			this.scheme = merge(baseScheme, new Scheme());
		}

		javascript(enabled: boolean = true): this {
			this.scheme.javascript = enabled;
			return this;
		}

		typescript(enabled: boolean = true): this {
			this.scheme.typescript = enabled;
			return this;
		}

		css(enabled: boolean = true): this {
			this.scheme.css = enabled;
			return this;
		}

		scss(enabled: boolean = true): this {
			this.scheme.scss = enabled;
			return this;
		}

		less(enabled: boolean = true): this {
			this.scheme.less = enabled;
			return this;
		}

		fonts(enabled: boolean = true): this {
			this.scheme.fonts = enabled;
			return this;
		}

		images(enabled: boolean = true): this {
			this.scheme.images = enabled;
			return this;
		}

		cache(enabled: boolean = true): this {
			this.scheme.cache = enabled;
			return this;
		}

		sourceMaps(enabled: boolean = true): this {
			this.scheme.sourceMaps = enabled;
			return this;
		}

		commonChunkName(name: string | null = DEFAULT_COMMON_CHUNK_NAME): this {
			this.scheme.commonChunkName = name;
			return this;
		}

		clean(enabled: boolean = true): this {
			this.scheme.clean = enabled;
			return this;
		}

		minify(enabled: boolean = true): this {
			this.scheme.minify = enabled;
			return this;
		}

	}
}

export default Scheme;