var gulp = require('gulp'),
    plugins = require("gulp-load-plugins")();

gulp.task("ts", function () {
    return gulp.src('*.ts')
        .pipe(plugins.tsc({
            "module": "umd",
            target: "ES5",
            noImplicitAny: true,
            experimentalDecorators: true,
            sourceMap: true
        }))
        .pipe(gulp.dest("dest/"));
});

gulp.task("default", ["ts"]);