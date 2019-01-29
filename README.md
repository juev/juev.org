[![Build Status](https://travis-ci.org/juev/juev.org.svg?branch=master)](https://travis-ci.org/juev/juev.org)

# About

This directory contains data for my site, [www.juev.org](https://www.juev.org).

# How to Use

	~ $ sudo gem install bundle
	~ $ cd juev.ru
	juev.ru $ bundle install --path vendor/bundle

All tasks present in Rakefile:

	# create new post
	juev.ru $ rake new My new article
	# build site
	juev.ru $ rake build
	# deploy site
	juev.ru $ rake deploy

# License

The following directories and their contents are Copyright Denis Evsyukov. You may not reuse anything therein without my permission:

* `_posts/`

All other directories and files are MIT Licensed. Feel free to use the HTML and CSS as you please. If you do use them, a link back to [www.juev.org](https://www.juev.org) would be appreciated, but is not required.
