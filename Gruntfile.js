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
					baseUrl: ".",
					// mainConfigFile: "path/to/config.js",
					include: "src/jso.js",
					name: "bower_components/almond/almond.js", // assumes a production build using almond
					out: "build/jso.min.js",
					preserveLicenseComments: false
				}
			}
		}
	});


	// grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	// Default task(s).
	grunt.registerTask('default', ['requirejs']);

};