module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    concat:{
      popup:{
        src:[
          'src/scripts/popup/app.js',
          'src/scripts/popup/controllers/**/*.js',
          'src/scripts/popup/directives/**/*.js',
          'src/scripts/popup/services/**/*.js',
        ],
        dest:'build/scripts/popup.js'
      },
      popup_libs:{
        src:[
          'src/scripts/popup/lib/jquery.min.js',
          'src/scripts/popup/lib/bootstrap.min.js',
          'src/scripts/popup/lib/angular.min.js',
        ],
        dest:'build/scripts/popup-libs.js'
      },
      content:{
        src:[
          'src/scripts/content/classes/*.js',
          'src/scripts/content/contentscript.js',
        ],
        dest:'build/scripts/contentscript.js'
      },
      content_libs:{
        src:[
          'src/scripts/content/libs/jquery.min.js',
          'src/scripts/content/libs/jquery.cookie.js',
          'src/scripts/content/libs/klass.min.js'
        ],
        dest:'build/scripts/contentscript-libs.js'
      }
    },
    
    uglify: {
      options: {
        mangle: false
      },
      popup: {
        files:{
          'build/scripts/popup.min.js':['build/scripts/popup.js'],
          'build/scripts/contentscript.min.js':['build/scripts/contentscript.js'],
          'build/scripts/background.min.js':['src/scripts/content/background.js']
        }
      }
    },
    copy:{
      main:{
        files:[
          {
            src:['assets/**', 'tpl/**', 'scripts/page/*', 'manifest.json', 'index.html'],
            dest:'build/',
            cwd:'src/',
            expand:true
          }
        ]
      }
    },
    watch:{
      scripts:{
        files:['src/**/*'],
        tasks:['default']
      }
    }
    
  });
  
  // Load Grunt contrib plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  // Default task(s).
  grunt.registerTask('default', ['concat','uglify','copy']);

};