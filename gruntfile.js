/*eslint global-require: "off"*/
/*eslint max-params: "off"*/

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	let config = null;
	if (typeof process.env.REWARDS_CONFIG !== 'undefined') {
		config = JSON.parse(process.env.REWARDS_CONFIG);
	} else {
		config = grunt.file.readJSON('config/config.json');
	}
	grunt.initConfig({
		clean: {
			scripts: ['source/js/replace/**']
		},
		concat: {
			lib: {
				dest: 'public/js/lib.min.js',
				src: [
					'bower_components/angular/angular.min.js',
					'bower_components/angular-sanitize/angular-sanitize.js',
					'source/js/lib/emoji.min.js'
				]
			},
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
		config: grunt.file.readJSON('config/config.json'),
		copy: {
			fonts: {
				files: [
					{
						cwd: 'source/fonts',
						dest: 'public/fonts',
						expand: true,
						src: ['**']
					}
				]
			},
			images: {
				files: [
					{
						cwd: 'source/img',
						dest: 'public/img',
						expand: true,
						src: ['**']
					}
				]
			},
			scripts: {
				files: [
					{
						cwd: 'source/js/app',
						dest: 'source/js/replace',
						expand: true,
						src: ['**']
					}
				]
			},
			templates: {
				files: [
					{
						cwd: 'source/js/replace/templates',
						dest: 'public/templates',
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
		eslint: {
			scripts: ['source/js/app/**/*.js']
		},
		nodemon: {
			dev: {
				options: {
					callback: (nodemon) => {
						nodemon.on('log', function(event) {
							grunt.log.writeln(event.colour);
						});
						if (config.open) {
							nodemon.on('config:update', function () {
								setTimeout(function() {
									require('open')(config.https + config.host);
								}, 4000);
							});
						}
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
					},
					{
						from: /\{build\}/g,
						to: "<%= grunt.template.today('dd/mm/yyyy') %>"
					},
					{
						from: /\{config\}/g,
						to: JSON.stringify(config.public)
					},
					{
						from: /\{firebase_config\}/g,
						to: JSON.stringify(config.firebase)
					}
				],
				src: ['source/js/replace/**/**.js']
			},
			templates: {
				overwrite: true,
				replacements: [
					{
						from: /<img\ssrc="([^.]+.svg)">/g,
						to: (matchedWord, index, fullText, regexMatches) => "<%= grunt.file.read('./source/"+regexMatches[0]+"') %>"
					}
				],
				src: ['source/js/replace/templates/*.html']
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
			scripts: {
				files: {
					'public/js/app.min.js': ['public/js/app.js']
				}
			}
		},
		watch: {
			js: {
				files: ['source/js/**/*.js', 'source/js/app/templates/*.html'],
				options: {
					atBegin: true
				},
				tasks: ['copy:scripts', 'replace:scripts', 'replace:templates', 'copy:templates', 'concat:scripts', 'clean:scripts', 'uglify:scripts']
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
	grunt.registerTask('scripts', ['eslint:scripts', 'copy:scripts', 'replace:scripts', 'replace:templates', 'copy:templates', 'concat', 'clean:scripts', 'uglify']);
	grunt.registerTask('build', ['styles', 'scripts', 'copy:images', 'copy:fonts']);

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
