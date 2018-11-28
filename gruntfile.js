module.exports = function(grunt) {

  grunt.initConfig({
    concurrent: {
      target: {
        options: {logConcurrentOutput: true},
        tasks: ['nodemon']
      }
    },
    nodemon: {
      dev: {
        options: {
          callback (nodemon) {
            nodemon.on('log', function(event) {
              grunt.log.writeln(event.colour);
            });
          }
        },
        script: 'index.js'
      }
    },
    pkg: grunt.file.readJSON('package.json')
  });

  // grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['concurrent:target']);
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
