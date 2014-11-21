var gulp            = require('gulp'),
    include         = require('gulp-include'),
    uglify          = require('gulp-uglifyjs'),
    sass            = require('gulp-sass'),
    rename          = require('gulp-rename'),
    clean           = require('gulp-clean'),
    removelogs      = require('gulp-removelogs'),
    stripDebug      = require('gulp-strip-debug'),
    uglify_config   = {
        'enclose'       : true,
        'mangle'        : false
    };

gulp.task('main', function () {

    return gulp.src( 'src/modbus.js' )
        .pipe( include() )
        .pipe( stripDebug())
        .pipe( uglify('modbus.min.js', uglify_config ))
        .pipe( gulp.dest('bin/') );

});

gulp.task('default', [ 'main' ]);


