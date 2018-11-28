/*eslint global-require: "off"*/

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		concurrent: {
			dev: {
				options: {logConcurrentOutput: true},
				tasks: ['nodemon', 'watch']
			}
		},
		cssmin: {
			dist: {
				files: [
					{
						cwd: 'public/css',
						dest: 'public/css',
						expand: true,
						ext: '.min.css',
						src: ['*.css', '!*.min.css']
					}
				]
			}
		},
		nodemon: {
			dev: {
				options: {
					callback: (nodemon) => {
						nodemon.on('log', function(event) {
							grunt.log.writeln(event.colour);
						});
					},
					cwd: __dirname,
					ignore: ['gruntfile.js', 'source/**', 'public/**']
				},
				script: 'index.js'
			}
		},
		pkg: grunt.file.readJSON('package.json'),
		sass: {
			dist: {
				files: [
					{
						cwd: 'source/sass',
						dest: 'public/css',
						expand: true,
						ext: '.css',
						src: ['*.scss']
					}
				]
			}
		},
		uglify: {
			main: {
				files: {
					'public/js/main.min.js': ['source/js/**/*.js']
				}
			}
		},
		watch: {
			js: {
				files: 'source/js/**/*.js',
				options: {
					atBegin: true
				},
				tasks: ['uglify']
			},
			sass: {
				files: ['source/sass/**/*.scss'],
				options: {
					atBegin: true
				},
				tasks: ['sass', 'cssmin']
			},
			ui: {
				files: ['views/**/*.pug','public/**/*.min.css','public/**/*.min.js'],
				options: {
					livereload: 4201
				}
			}
		}
	});

	grunt.registerTask('default', ['concurrent:dev']);
	grunt.registerTask('styles', ['sass']);

	grunt.registerTask('help', function() {
		grunt.log.subhead('$ grunt');
		grunt.log.writeln('Run rewards in a local environment.'.blue);

		grunt.log.subhead('$ npm run server:start');
		grunt.log.writeln('Run rewards in a production environment.'.green);

		grunt.log.subhead('$ npm run server:stop');
		grunt.log.writeln('Stop rewards in a production environment.'.green);

		grunt.log.subhead('$ npm run server:production');
		grunt.log.writeln('Start the long-running process in production.'.green);

		grunt.log.subhead('$ npm run server:restart');
		grunt.log.writeln('Restart the long-running process.'.green);

	});
};
