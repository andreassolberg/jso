module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bower: grunt.file.readJSON('bower.json'),
		bump: {
			options: {
				files: ['package.json', 'bower.json', 'etc/buildinfo.js'],
				updateConfigs: ['pkg', 'bower'],

				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['package.json', 'bower.json', 'etc/buildinfo.js', 'dist/jso.js', 'dist/jso.min.js'],

				createTag: true,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',

				prereleaseName: 'rc',

				push: false,
				pushTo: 'origin',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
				globalReplace: false,
				regExp: false
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
        },
	    shell: {
	        rjs: {
				command: 'node_modules/requirejs/bin/r.js -o etc/build.js'
	        },
	        rjs_min: {
				command: 'node_modules/requirejs/bin/r.js -o etc/build-min.js'
	        },
	        bower: {
	        	command: "node_modules/bower/bin/bower --allow-root install"
	        }
	    }
	});




	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-shell');

	grunt.registerTask('test', ['jshint', 'qunit', 'requirejs']);
	grunt.registerTask('build', ['shell:bower', 'jshint', /*'qunit',*/ 'shell:rjs', 'shell:rjs_min']);

	grunt.registerTask('default', ['shell:bower', 'jshint', 'qunit']);

	grunt.registerTask('publish-patch', ['jshint', 'qunit', 'requirejs', 'bump:patch']);

};
