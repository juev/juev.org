task :default => :local
 
desc 'Build site with Jekyll.'
task :build do
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
  
  `gvim --remote-silent #{path}`
  exit
end
