"use strict";
var path = require("path");
var pkg = require("./package.json");

var TEST_PATH = path.join("./test/Test.mpr");
var TEST_WIDGETS_FOLDER = path.join("./test/widgets");
var TEST_WIDGETS_DEPLOYMENT_FOLDER = path.join("./test/deployment/web/widgets");

/**
 * If you want to use a custom folder for the test project, make sure these are added to package.json:
 * "paths": {
 *      "testProjectFolder": "./test/",
 *      "testProjectFileName": "Test.mpr"
 * },
 * You can test it by running: `grunt folders`
 **/

if (pkg.paths && pkg.paths.testProjectFolder && pkg.paths.testProjectFileName) {
    var folder = pkg.paths.testProjectFolder;
    if (folder.indexOf(".") === 0) {
        folder = path.join(folder);
    }
    TEST_PATH = path.join(folder, pkg.paths.testProjectFileName);
    TEST_WIDGETS_FOLDER = path.join(folder, "/widgets");
    TEST_WIDGETS_DEPLOYMENT_FOLDER = path.join(folder, "/deployment/web/widgets");
}

module.exports = function (grunt) {
    grunt.initConfig({
        watch: {
            autoDeployUpdate: {
                "files": [ "./src/**/*" ],
                "tasks": [ "compress", "newer:copy" ],
                options: {
                    debounceDelay: 250,
                    livereload: true
                }
            }
        },
        compress: {
            makezip: {
                options: {
                    archive: "./dist/" + pkg.name + ".mpk",
                    mode: "zip"
                },
            files: [{
                expand: true,
                date: new Date(),
                store: false,
                cwd: "./src",
                src: ["**/*"]
              }]
            }
        },
        copy: {
            deployment: {
                files: [
                    { dest: TEST_WIDGETS_DEPLOYMENT_FOLDER, cwd: "./src/", src: ["**/*"], expand: true }
                ]
            },
            mpks: {
                files: [
                    { dest: TEST_WIDGETS_FOLDER, cwd: "./dist/", src: [ pkg.name + ".mpk"], expand: true }
                ]
            }
        },
        clean: {
            build: [
                path.join("./dist", pkg.name, "/*")
            ]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-newer");

    grunt.registerTask("folders", function () {
        var done = this.async();
        grunt.log.writeln("\nShowing file paths that Grunt will use. You can edit the package.json accordingly\n");
        grunt.log.writeln("TEST_PATH:                      ", TEST_PATH);
        grunt.log.writeln("TEST_WIDGETS_FOLDER:            ", TEST_WIDGETS_FOLDER);
        grunt.log.writeln("TEST_WIDGETS_DEPLOYMENT_FOLDER: ", TEST_WIDGETS_DEPLOYMENT_FOLDER);
        return done();
    });

    grunt.registerTask(
        "default",
        "Watches for changes and automatically creates an MPK file, as well as copying the changes to your deployment folder",
        [ "clean build", "watch" ]
    );

    grunt.registerTask(
        "clean build",
        "Compiles all the assets and copies the files to the build directory.",
        [ "clean", "compress", "copy" ]
    );

    grunt.registerTask(
        "build",
        [ "clean build" ]
    );
};
