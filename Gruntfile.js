'use strict';

module.exports = function(grunt) {
		// Project configuration.
		grunt.initConfig({
				// Metadata.
				pkg: grunt.file.readJSON('package.json'),
				// Task configuration.
				clean: {
						src: ['dist/assets/css', 'dist/assets/js']
				},
				concat: {
						options: {
								separator: ';',
								stripBanners: true
						},
						dist: {
								src: ['assets/js/shadowbox.js', 'assets/js/app.js'],
								dest: 'dist/assets/js/master.js'
						},
				},
				uglify: {
						options: {
								banner: ''
						},
						dist: {
								files: {
										'dist/assets/js/master.js': ['<%= concat.dist.dest %>']
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
										'dist/assets/css/master.css': 'assets/scss/master.scss',       // 'destination': 'source'
								}
						}
				},
				postcss: {
						options: {
								processors: [
										require('autoprefixer-core')({browsers: 'last 1 version'}).postcss,
										require('csswring').postcss
								]
						},
						dist: {
								src: 'dist/assets/css/*.css'
						}
				},
				filerev: {
						options: {
								algorithm: 'md5',
								length: 8
						},
						release: {
								src: [
										'dist/assets/**/*.js',
										'dist/assets/**/*.css',
										]
						}
				},
				stripCssComments: {
						options: {
								all: true
						},
						dist: {
								files: {
										'dist/assets/css/master.css': 'dist/assets/css/master.css',
								}
						}
				},
		});

		// These plugins provide necessary tasks.
		grunt.loadNpmTasks('grunt-contrib-clean');
		grunt.loadNpmTasks('grunt-contrib-concat');
		grunt.loadNpmTasks('grunt-contrib-uglify');
		grunt.loadNpmTasks('grunt-contrib-sass');
		grunt.loadNpmTasks('grunt-postcss');
		grunt.loadNpmTasks('grunt-filerev');
		grunt.loadNpmTasks('grunt-strip-css-comments');

		// Default task.
		grunt.registerTask('default', [
				'clean',
				'sass',
//				'postcss',
				'stripCssComments',
				'concat',
				'uglify',
				'filerev',
		]);
};
