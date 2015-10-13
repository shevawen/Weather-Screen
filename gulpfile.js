var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();

/**
 * Copy the bower packages
 */
gulp.task('vendor', function() {
    gulp.src(['bower_components/jquery/dist/jquery.js',
            'bower_components/d3/d3.min.js',
            'bower_components/topojson/topojson.js',
            'bower_components/messenger/build/js/messenger.js',
            'bower_components/messenger/build/js/messenger-theme-flat.js',
            'bower_components/textures/textures.min.js'])
            .pipe(concat('lib.js'))
            .pipe(gulp.dest('build'));
    gulp.src(['bower_components/messenger/build/css/messenger.css',
            'bower_components/messenger/build/css/messenger-theme-flat.css'])
            .pipe(concat('lib.css'))
            .pipe(gulp.dest('build'));
});
var scripts = ['src/js/weather-screen.js'];
/**
 * Build src js files
 */
gulp.task('compress', function() {
    gulp.src(['src/js/weather-screen.js'])
        //.pipe(uglify())
        .pipe(gulp.dest('build'));
});
// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('js-watch', ['vendor','compress'], browserSync.reload);

// use default task to launch Browsersync and watch JS files
gulp.task('serve', ['vendor','compress'], function () {

    // Serve files from the root of this project
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    gulp.watch("src/js/*.js", ['js-watch']);
});
