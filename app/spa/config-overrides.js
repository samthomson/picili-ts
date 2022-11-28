// part of a solution to allow importing enums from a shared file. separately there is a solution to import types from @shared/whatever.
// this file's part of a solution just to import enums, which didn't work from @shared via paths. I kept that separate solution however so that I could keep referencing @shared/whatever for types where imported to avoid annoying relative import paths.
// https://stackoverflow.com/a/61043925/686490

const {
	removeModuleScopePlugin,
	override,
	babelInclude,
} = require('customize-cra')
const path = require('path')

module.exports = override(
	removeModuleScopePlugin(), // (1)
	babelInclude([
		path.resolve('src'),
		path.resolve('../shared'), // (2)
	]),
)
