# Release management


Ensure environment is updated.

	npm update


Test code changes using AMD dynamic loading. To make a new build:

	grunt build

Then publish

	grunt bump:patch
	grunt bump:minor
	grunt bump:patch

Release a new major prerelease

	grunt bump:premajor

Update prerelease:

	grunt bump:prerelease



# Branches


Currently `master` is the 2.x branch. and `version3` is the 3.0 prerelease.


## Development

Run

	watchify --debug -t [ babelify --presets [ es2015 ] ] src/JSO.js -o dist/bundle.js
