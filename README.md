# About

This directory contains data for my site, [www.juev.ru](http://www.juev.ru).

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

* source/_posts/

All other directories and files are MIT Licensed. Feel free to use the HTML and CSS as you please. If you do use them, a link back to [www.juev.ru](http://www.juev.ru) would be appreciated, but is not required.