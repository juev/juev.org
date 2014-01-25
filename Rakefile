require 'bundler/setup'

domain="www.juev.ru"

task :default => :build

desc 'Build site with Jekyll.'
task :build  => :clean do
  print "Compiling website...\n"
  system "jekyll build"
  system "compass compile"
  system "rm -rf source/tags"
end

desc 'Clean public folder'
task :clean do
  print "Clean public folder.\n"
  system "rm -rf public/*"
end

desc 'Build, deploy.'
task :deploy => :build do
  print "Deploying website to #{domain}\n"
  system "rsync -az --delete public/ o2:~/www/juevru/"
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

  system("mvim #{path}")
  exit
end
