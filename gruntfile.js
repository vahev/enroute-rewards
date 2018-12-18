/*eslint global-require: "off"*/

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	let config = null;
	if (typeof process.env.REWARDS_CONFIG !== 'undefined') {
		config = JSON.parse(process.env.REWARDS_CONFIG);
	} else {
		config = grunt.file.readJSON('config/config.json');
	}
	grunt.initConfig({
		concat: {
			scripts: {
				dest: 'public/js/app.js',
				src: ['source/js/replace/*.js', 'source/js/replace/components/**/*.js']
			}
		},
		concurrent: {
			dev: {
				options: {logConcurrentOutput: true},
				tasks: ['nodemon', 'watch']
			}
		},
		copy: {
			scripts: {
				files: [
					{
						cwd: 'source/js/app',
						dest: 'source/js/replace',
						expand: true,
						src: ['**']
					}
				]
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
						nodemon.on('config:update', function () {
						// Delay before server listens on port
							setTimeout(function() {
								require('open')(config.https + config.host);
							}, 1000);
						});
					},
					cwd: __dirname,
					ignore: ['gruntfile.js', 'source/**', 'public/**']
				},
				script: 'index.js'
			}
		},
		pkg: grunt.file.readJSON('package.json'),
		replace: {
			scripts: {
				overwrite: true,
				replacements: [
					{
						from: /\{host\}/g,
						to: config.host
						// to: "<%= grunt.template.today('dd/mm/yyyy') %>"
					}
				],
				src: ['source/js/replace/**/**.js']
			}
		},
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
					'public/js/app.min.js': ['public/js/app.js']
					// ,
					// 'public/js/main.min.js': ['source/js/lib/*.js']
				}
			}
		},
		watch: {
			js: {
				files: 'source/js/**/*.js',
				options: {
					atBegin: true
				},
				tasks: ['copy:scripts', 'replace:scripts', 'concat:scripts', 'uglify']
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
	grunt.registerTask('scripts', ['copy:scripts', 'replace:scripts', 'concat:scripts', 'uglify']);

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
