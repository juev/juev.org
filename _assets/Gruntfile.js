'use strict';

module.exports = function(grunt) {
		// Project configuration.
		grunt.initConfig({
				// Metadata.
				pkg: grunt.file.readJSON('package.json'),
				// Task configuration.
				clean: {
						src: ['dist']
				},
				concat: {
						options: {
								separator: ';',
								stripBanners: true
						},
						dist: {
								src: ['assets/js/shadowbox.js', 'assets/js/app.js'],
								dest: 'dist/js/master.js'
						},
				},
				uglify: {
						options: {
								banner: ''
						},
						dist: {
								files: {
										'dist/js/master.js': ['<%= concat.dist.dest %>']
								}
						}
				},
				sass: {                              // Task
						dist: {                            // Target
								options: {                       // Target options
										style: 'compressed',
										compass: true,
										sourcemap: 'none'
								},
								files: {                         // Dictionary of files
										'dist/css/master.css': 'assets/scss/master.scss',       // 'destination': 'source'
								}
						}
				},
				filerev: {
						options: {
								algorithm: 'md5',
								length: 8
						},
						release: {
								src: [
										'dist/**/*.js',
										'dist/**/*.css',
								]
						}
				},
				stripCssComments: {
						options: {
								all: true
						},
						dist: {
								files: {
										'dist/css/master.css': 'dist/css/master.css',
								}
						}
				},
				compress: {
						main: {
								options: {
										mode: 'gzip'
								},
								expand: true,
								cwd: 'dist/',
								src: ['**/*'],
								dest: 'dist/release/'
						}
				}
		});

		// These plugins provide necessary tasks.
		grunt.loadNpmTasks('grunt-contrib-clean');
		grunt.loadNpmTasks('grunt-contrib-compress');
		grunt.loadNpmTasks('grunt-contrib-concat');
		grunt.loadNpmTasks('grunt-contrib-sass');
		grunt.loadNpmTasks('grunt-contrib-uglify');
		grunt.loadNpmTasks('grunt-filerev');
		grunt.loadNpmTasks('grunt-strip-css-comments');

		// Default task.
		grunt.registerTask('default', [
				'clean',
				'sass',
				'stripCssComments',
				'concat',
				'uglify',
				'filerev',
				'compress',
		]);
};
