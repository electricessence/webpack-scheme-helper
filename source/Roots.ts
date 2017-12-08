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