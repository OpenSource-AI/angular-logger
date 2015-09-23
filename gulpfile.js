'use strict';

var config = require('./config');
var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var del = require('del');
var karma = require('gulp-karma');
var coverageEnforcer = require('gulp-istanbul-enforcer');
var jshint = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var jscsStylish = require('gulp-jscs-stylish');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('clean', function(deleteDone) {
    del.sync([
        'dist',
        'temp'
    ]);
    deleteDone();
});

gulp.task('karma', function() {
    return gulp.src([])
        .pipe(karma({configFile: 'karma.conf.js', action: 'run'}))
        .on('error', function(err) {
          // Make sure failed tests cause gulp to exit non-zero
          throw err;
        })
        .pipe(coverageEnforcer({
            thresholds : {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100
            },
            coverageDirectory : 'coverage',
            rootDirectory : 'temp'
        }));
});

gulp.task('compile', ['clean', 'karma'], function() {
    return gulp.src('source/**/*.js')
       .pipe(jshint())
       .pipe(jscs())
       .on('error', function() {
           // do not stop on error, jshint reporter will abort the build
       })
       .pipe(jscsStylish.combineWithHintResults())
       .pipe(jshint.reporter(jshintStylish))
       .pipe(config.build.failOnStyleErrors ?  jshint.reporter('fail') : gulpUtil.noop())
       .pipe(gulp.dest('dist'))
       .pipe(ngAnnotate())
       .pipe(uglify())
       .pipe(rename('ai-logger.min.js'))
       .pipe(gulp.dest('dist'));
});

gulp.task('build', ['clean'], function() {
    config.build.minifyCode = true;
    config.build.failOnStyleErrors = true;
    config.karma.browsers = ['PhantomJs'];
    config.karma.reporters = ['progress', 'coverage'];
    config.karma.captureTimeout = 60000;
    gulp.run('compile');
});

gulp.task('default', ['build']);
