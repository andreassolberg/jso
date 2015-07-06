module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bump: {
			options: {
				files: ['package.json', 'bower.json'],
				updateConfigs: ['pkg', 'bower'],

				commit: false,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['package.json', 'bower.json'],

				createTag: false,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',

				push: false,
				pushTo: 'origin',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
				globalReplace: false,
				prereleaseName: false,
				regExp: false
			}
		},
		requirejs: {
			compile: {
				options: {
					almond: true,
					dir: 'build',
					appDir: 'src',
					baseUrl: '.',
					modules: [{name: 'jso'}],
					optimize: "none",
					paths: {
						underscore: '../vendor/underscore',
						jquery    : '../vendor/jquery',
						backbone  : '../vendor/backbone'
					},
					wrap: {
						startFile: 'tools/wrap.start',
						endFile: 'tools/wrap.end'
					},
					preserveLicenseComments: false
				}
			}
		},
		jshint: {
			// define the files to lint
			files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
			// configure JSHint (documented at http://www.jshint.com/docs/)
			options: {
				// more options here if you want to override JSHint defaults
				globals: {
					jQuery: true,
					console: true,
					module: true
				}
			}
		},
        qunit: {
            files: ['test/index.html']
        }
	});




	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.registerTask('test', ['requirejs', 'jshint', 'qunit']);
	grunt.registerTask('publish', ['requirejs', 'jshint', 'qunit']);
	grunt.registerTask('default', ['requirejs', 'jshint']);


};