'use strict';

module.exports = function(grunt) {
		// Project configuration.
		grunt.initConfig({
				// Metadata.
				pkg: grunt.file.readJSON('package.json'),
				// Task configuration.
				clean: {
						src: ['source/assets/css', 'source/assets/js']
				},
				concat: {
						options: {
								separator: ';',
								stripBanners: true
						},
						dist: {
								src: ['assets/js/shadowbox.js', 'assets/js/app.js'],
								dest: 'source/assets/js/master.js'
						},
				},
				uglify: {
						options: {
								banner: ''
						},
						dist: {
								files: {
										'source/assets/js/master.js': ['<%= concat.dist.dest %>']
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
										'source/assets/css/master.css': 'assets/scss/master.scss',       // 'destination': 'source'
								}
						}
				},
				postcss: {
						options: {
								processors: [
										require('autoprefixer-core')({browsers: 'last 2 version'}).postcss,
										require('csswring').postcss
								]
						},
						dist: {
								src: 'source/assets/css/*.css'
						}
				},
				filerev: {
						options: {
								algorithm: 'md5',
								length: 8
						},
						release: {
								src: [
										'source/assets/**/*.js',
										'source/assets/**/*.css',
										]
						}
				},
				stripCssComments: {
						options: {
								all: true
						},
						dist: {
								files: {
										'source/assets/css/master.css': 'source/assets/css/master.css',
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
				'postcss',
				'stripCssComments',
				'concat',
				'uglify',
//				'filerev',
		]);
};
