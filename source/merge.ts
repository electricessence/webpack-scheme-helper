/**
 * Simple object merge function that overwrites existing values.
 * @param {TSource} source
 * @param {TTarget} target
 * @returns {TSource & TTarget}
 */
export default function<TSource extends any, TTarget extends any>(
	source: TSource,
	target: TTarget = <any>{}): TSource & TTarget
{
	if (source) for (let key of Object.keys(source)) {
		target[key] = source[key];
	}
	return <any>target;
}
