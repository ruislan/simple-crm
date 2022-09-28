import gulp from 'gulp';
import zip from 'gulp-vinyl-zip';
import uglify from 'gulp-uglify';
import cleanCss from 'gulp-clean-css';
import fs from 'fs';
import dayjs from 'dayjs';

function clean(cb) {
    fs.rmSync('./build', { recursive: true, force: true });
    cb();
};

function prepare() {
    gulp.src(['package.json', '.env', 'server.js']).pipe(gulp.dest('build'));
    gulp.src(['src/**/*', '!**/.DS_Store']).pipe(gulp.dest('build/src'));
    gulp.src(['prisma/**/*', '!**/.DS_Store', '!**/*.db']).pipe(gulp.dest('build/prisma'));
    gulp.src(['views/**/*', '!**/.DS_Store']).pipe(gulp.dest('build/views'));
    return gulp.src(['public/**/*', '!public/**/*.js', '!public/**/*.css', '!**/.DS_Store']).pipe(gulp.dest('build/public'));
};

function compress() {
    gulp.src('public/**/*.css').pipe(cleanCss()).pipe(gulp.dest('build/public'));
    return gulp.src('public/**/*.js').pipe(uglify()).pipe(gulp.dest('build/public'));
};

function archive(cb) {
    return setTimeout(() => {
        const filename = dayjs().format('[dist-]YYYYMMDD[.zip]');
        // XXX 这里很奇怪，如果直接执行流管道操作，打包的内容不全，所以我们等待1秒，等src读完所有的内容就可以了。
        gulp.src('build/**/*').pipe(zip.zip(filename)).pipe(gulp.dest('./'));
        cb();
    }, 1000);
};

export default gulp.series(clean, prepare, compress, archive);
