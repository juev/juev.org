require 'rubygems'
require 'bundler/setup'

# Jekyll Task
domain="www.juev.org"

task :default => :build

desc 'Build site with Jekyll.'
task :build  => :clean do
  print "Compiling website...\n"
  # system "grunt"
  system "export TZ=Europe/Moscow"
  system "echo Current date: `date`"

  system "jekyll build"
  # system "compass compile"
  system "rm -rf source/tags"
end # task: build

desc 'Clean public folder'
task :clean do
  print "Clean public folder.\n"
  system "rm -rf public/*"
end # task: clean

desc 'Deploy site'
task :deploy do
  print "Deploying website\n"
#  system "s3_website push --force"
  system "s3deploy -source=public/ -region=eu-west-1 -bucket=www.juev.org -key \"$AWS_KEY_ID\" -secret \"$AWS_ACCESS_KEY\" -force -v"
#   system "rsync -az --delete-after $TRAVIS_BUILD_DIR/public/ web@ssh.juev.org:~/public/juev.org"
end # task: deploy

desc 'Create new post.'
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
    f.puts "date: #{now.strftime('%F %R')}"
    f.puts "tags:"
    f.puts "- "
    f.puts "---"
    f.puts ""
  end

  system("echo #{path}")
  exit
end # task: new

desc 'Update local copy'
task :update do
  print "Update local copy.\n"
  system "git pull"
end # task: update

####

# Ping Pingomatic
desc 'Ping pingomatic'
task :pingomatic do
  begin
    require 'xmlrpc/client'
    puts '* Pinging ping-o-matic'
    XMLRPC::Client.new('rpc.pingomatic.com', '/').call('weblogUpdates.extendedPing', 'www.juev.org' , 'https://www.juev.org', 'https://www.juev.org/atom.xml')
  rescue LoadError
    puts '! Could not ping ping-o-matic, because XMLRPC::Client could not be found.'
  end
end # task :pingomatic

# Ping Google
desc 'Notify Google of the new sitemap'
task :sitemapgoogle do
  begin
    require 'net/http'
    require 'uri'
    puts '* Pinging Google about our sitemap'
    Net::HTTP.get('www.google.com', '/webmasters/tools/ping?sitemap=' + URI.escape('https://www.juev.org/sitemap.xml'))
  rescue LoadError
    puts '! Could not ping Google about our sitemap, because Net::HTTP or URI could not be found.'
  end
end # task :sitemapgoogle

# Ping Bing
desc 'Notify Bing of the new sitemap'
task :sitemapbing do
  begin
    require 'net/http'
    require 'uri'
    puts '* Pinging Bing about our sitemap'
    Net::HTTP.get('www.bing.com', '/webmaster/ping.aspx?siteMap=' + URI.escape('https://www.juev.org/sitemap.xml'))
  rescue LoadError
    puts '! Could not ping Bing about our sitemap, because Net::HTTP or URI could not be found.'
  end
end # task :sitemapbing

# Ping pubsubhubbub
desc 'Notify pubsubhubbub server.'
task :ping do
  begin
    require 'cgi'
    require 'net/http'
    puts '* Pinging pubsubhubbub server'
    data = 'hub.mode=publish&hub.url=' + CGI::escape("https://www.juev.org/atom.xml")
    http = Net::HTTP.new('pubsubhubbub.appspot.com', 80)
    resp, data = http.post('http://pubsubhubbub.appspot.com/publish',
                           data,
                           {'Content-Type' => 'application/x-www-form-urlencoded'})
    puts "Ping error: #{resp}, #{data}" unless resp.code == "204"
  end
end # task: pubsubhubbub

# Usage: rake notify
desc 'Notify various services about new content'
task :notify => [:pingomatic, :sitemapgoogle, :sitemapbing, :ping] do
end # task :notify

####

# Copy
desc 'Copy public'
task :copy do
  print "Copy public to www.\n"
  system "rsync -az --delete public/ ~/web/juev.org/"
end # task: copy

# Publish site
desc 'Publish site'
task :publish => [:build, :deploy, :notify] do
end # task :publish
