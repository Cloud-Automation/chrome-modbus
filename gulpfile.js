var gulp            = require('gulp'),
    include         = require('gulp-include'),
    uglify          = require('gulp-uglifyjs'),
    sass            = require('gulp-sass'),
    rename          = require('gulp-rename'),
    clean           = require('gulp-clean'),
    removelogs      = require('gulp-removelogs'),
    stripDebug      = require('gulp-strip-debug'),
    mocha           = require('gulp-mocha'),
    uglify_config   = {
        'enclose'       : true,
        'mangle'        : false
    };

gulp.task('test', function () {

    return gulp.src('test/range-list.test.js')
        .pipe( mocha() );

});

gulp.task('min', ['test'],  function () {

    return gulp.src( 'src/modbus.js' )
        .pipe( include() )
        .pipe( stripDebug())
        .pipe( uglify('modbus.min.js', uglify_config ))
        .pipe( gulp.dest('dist/') );

});

gulp.task('dev', ['test'],  function () {

    return gulp.src( 'src/modbus.js' )
        .pipe( include() )
        .pipe( gulp.dest('dist/') );

});


gulp.task('default', [ 'min', 'dev' ]);


