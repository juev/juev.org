require "bundler/setup"

domain="www.juev.ru"

task :default => :build

desc 'Build site with Jekyll.'
task :build  => :clean do
  Rake::Task["tags"].execute
  Rake::Task["tag_cloud"].execute
  print "Compiling website...\n"
  system "jekyll"
  system "rm source/_includes/tag_cloud.html"
end

desc 'Clean public folder'
task :clean do
  print "Clean public folder.\n"
  system "rm -rf public/*"
end

desc 'Build, deploy.'
task :deploy => :build do
  print "Deploying website to #{domain}\n"
  system "rsync -az --delete public/ ec2:~/www/juevru/"
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
    f.puts "date: #{now.strftime('%F %T')}"
    f.puts "tags:"
    f.puts "  - "
    f.puts "---"
    f.puts ""
    f.puts ""
  end

  system("subl #{path}")
  exit
end

desc 'Generate tags pages'
task :tags do
  puts "Generating tags..."
  require 'rubygems'
  require 'jekyll'
  include Jekyll::Filters

  options = Jekyll.configuration({})
  site = Jekyll::Site.new(options)
  site.read_posts('')

  # Remove tags directory before regenerating
  FileUtils.rm_rf("source/tags")

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

    FileUtils.mkdir_p("source/tags/#{tag}")
    File.open("source/tags/#{tag}/index.html", 'w+') do |file|
      file.puts html
    end
  end
  puts 'Done.'
end

desc 'Generate tags cloud'
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
    line_height = font_size * 1.3
    html << "<a href=\"/tags/#{tag.gsub(/ /,"%20")}/\" title=\"Postings tagged #{tag}\" style=\"font-size: #{font_size}px; line-height:#{line_height}px\">#{tag}</a> "
  end
  File.open('source/_includes/tag_cloud.html', 'w+') do |file|
    file.puts html
  end
  puts 'Done.'
end
