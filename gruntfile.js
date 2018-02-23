module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
      target: {
        tasks: ['nodemon'],
        options: {logConcurrentOutput: true}
      }
    },
    nodemon: {
      dev: {
        script: 'index.js',
        options: {
          callback: function (nodemon) {
            nodemon.on('log', function(event) {console.log(event.colour);});
          }
        }
      }
    }
  });

  // grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['concurrent:target']);
};
