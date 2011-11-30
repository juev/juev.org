task :default => :local
 
desc 'Build site with Jekyll.'
task :build  => :tags do
	print "Compiling website..."
  sh "jekyll"
end
 
desc 'Minify & Combi CSS/JS file'
task :minify do
	print "Minify file...\n"
  sh "jammit -c _assets.yml -u http://www.juev.ru -o assets"
end

desc 'Enter development mode.'
task :local => :build do
	print "Auto-regenerating enabled.\n"
	print "Development server started at http://localhost:4000/ \n"
	print "Development mode entered.\n"
  sh "jekyll --auto --server"
end

desc 'Remove all built files.'
task :clean do
	print "Cleaning build directory...\n"
	sh "rm -rf _site"
end

desc 'Build, deploy, then clean.'
task :deploy => :build do
  domain = "www.juev.ru"
  print "Deploying website to #{domain}\n"
  sh "rsync -az --delete _site/ ec2:~/www/juev.ru/web/"
  Rake::Task['clean'].execute
end

task :new do
  throw "No title given" unless ARGV[1]
  title = ""
  ARGV[1..ARGV.length - 1].each { |v| title += " #{v}" }
  title.strip!
  now = Time.now
  path = "_posts/#{now.strftime('%F')}-#{title.downcase.gsub(/[\s\.]/, '-').gsub(/[^\w\d\-]/, '')}.markdown"
  
  File.open(path, "w") do |f|
    f.puts "---"
    f.puts "layout: post"
    f.puts "title: #{title}"
    f.puts "description: "
    f.puts "keywords: "
    f.puts "date: #{now.strftime('%F %T')}"
    f.puts "tags:"
    f.puts "  - "
    f.puts "---"
    f.puts ""
    f.puts ""
  end
  
  `open -a Byword #{path}`
  exit
end

desc 'Generate tags pages'
task :tags  => :tag_cloud do
  puts "Generating tags..."
  require 'rubygems'
  require 'jekyll'
  include Jekyll::Filters
  
  options = Jekyll.configuration({})
  site = Jekyll::Site.new(options)
  site.read_posts('')

  # Remove tags directory before regenerating
  FileUtils.rm_rf("tags")

  site.tags.sort.each do |tag, posts|
    html = <<-HTML
---
layout: default
title: "tagged: #{tag}"
syntax-highlighting: yes
---
  <h1 class="title">Tagged by #{tag}</h1>
  {% for post in site.posts %}{% for tag in post.tags %}{%if tag == "#{tag}" %}<div class="list"><a href="{{ post.url }}">{{ post.title }}</a></div>{%endif%}{%endfor%}{% endfor %}
HTML

    FileUtils.mkdir_p("tags/#{tag}")
    File.open("tags/#{tag}/index.html", 'w+') do |file|
      file.puts html
    end
  end
  puts 'Done.'
end

desc 'Generate tags pages'
task :tag_cloud do
  puts 'Generating tag cloud...'
  require 'rubygems'
  require 'jekyll'
  include Jekyll::Filters

  options = Jekyll.configuration({})
  site = Jekyll::Site.new(options)
  site.read_posts('')

  html = ''
  max_count = site.tags.map{|t,p| p.count}.max
  site.tags.sort.each do |tag, posts|
    s = posts.count
    font_size = ((20 - 10.0*(max_count-s)/max_count)*2).to_i/1.3
    html << "<a href=\"/tags/#{tag.gsub(/ /,"%20")}\" title=\"Postings tagged #{tag}\" style=\"font-size: #{font_size}px; line-height:#{font_size}px\">#{tag}</a> "
  end
  File.open('_includes/tag_cloud.html', 'w+') do |file|
    file.puts html
  end
  puts 'Done.'
end
