require "bundler/setup"

domain="www.juev.ru"

task :default => :build

desc 'Build site with Jekyll.'
task :build  => :clean do
  print "Compiling website...\n"
  system "jekyll"
  Rake::Task["gzip_html"].execute
  Rake::Task["gzip_assets"].execute
end

desc 'Clean public folder'
task :clean do
  print "Clean public folder.\n"
  system "rm -rf public/*"
end

desc 'Build, deploy.'
task :deploy => :build do
  print "Deploying website to #{domain}\n"
#  system "rsync -az --delete public/ ec2:~/www/juevru/"
#  system "s3cmd sync -P --delete-removed --no-preserve public/ s3://www.juev.ru/"

  system 's3cmd sync --acl-public --exclude "*.*" --include "*.png" --include "*.jpg" --include "*.ico" --guess-mime-type --add-header="Expires: Sat, 20 Nov 2020 18:46:39 GMT" --add-header="Cache-Control: max-age=6048000" --no-preserve public/ s3://www.juev.ru'
  system 's3cmd sync --acl-public --exclude "*.*" --include  "*.css" --include "*.js" --guess-mime-type --add-header "Content-Encoding: gzip" --add-header "Vary: Accept-Encoding" --add-header="Cache-Control: public, max-age=604800"  --no-preserve public/ s3://static.juev.ru'
  system 's3cmd sync --acl-public --exclude "*.*" --include "*.html" --mime-type="text/html; charset=utf-8" --add-header "Content-Encoding: gzip" --add-header="Cache-Control: max-age=0, private, must-revalidate" --no-preserve public/ s3://www.juev.ru'
  system 's3cmd sync --acl-public --exclude ".DS_Store" --exclude "assets/" --exclude "js/" --exclude "*.html" --guess-mime-type --no-preserve public/ s3://www.juev.ru'
  system 's3cmd sync --acl-public --delete-removed --no-preserve public/ s3://www.juev.ru/'
end

task :new do
  throw "No title given" unless ARGV[1]
  title = ""
  ARGV[1..ARGV.length - 1].each { |v| title += " #{v}" }
  title.strip!
  now = Time.now
  path = "source/_posts/#{now.strftime('%F')}-#{title.downcase.gsub(/[\s\.]/, '-').gsub(/[^\w\d\-]/, '')}.markdown"

  File.open(path, "w") do |f|
    f.puts "---"
    f.puts "layout: post"
    f.puts "title: #{title}"
    f.puts "description: "
    f.puts "keywords: "
    f.puts "gplus: "
    f.puts "published: false"
    f.puts "date: #{now.strftime('%F %R')}"
    f.puts "tags:"
    f.puts "- "
    f.puts "---"
    f.puts ""
  end

  system("subl #{path}")
  exit
end

desc "GZip HTML"
task :gzip_html do
  puts "## GZipping HTML"
  system 'find public/ -type f -name \*.html -exec gzip -9 {} \;'
  # Batch rename .html.gz to .html
  Dir['**/*.html.gz'].each do |f|
    test(?f, f) and File.rename(f, f.gsub(/\.html\.gz/, '.html'))
  end
end

desc "GZip Assets"
task :gzip_assets do
  puts "## GZipping Assets"
  styles_dir = "public/assets"
  system "gzip -9 #{styles_dir}/*"
  Dir["#{styles_dir}/*.css.gz"].each do |f|
    test(?f, f) and File.rename(f, f.gsub(/\.css\.gz/, '.css'))
  end
  Dir["#{styles_dir}/*.js.gz"].each do |f|
    test(?f, f) and File.rename(f, f.gsub(/\.js\.gz/, '.js'))
  end
end
