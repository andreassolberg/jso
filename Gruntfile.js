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
		}
	});


	// grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-requirejs');

	// Default task(s).
	grunt.registerTask('default', ['requirejs']);

};