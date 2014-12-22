module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		// uglify: {
		// 	options: {
		// 		banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
		// 	},
		// 	build: {
		// 		src: 'src/<%= pkg.name %>.js',
		// 		dest: 'build/<%= pkg.name %>.min.js'
		// 	}
		// },
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
		}
	});


	// grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('test', ['requirejs', 'jshint']);
	grunt.registerTask('default', ['requirejs', 'jshint']);


};