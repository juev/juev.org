# Copyright 2011 Cliff L. Biffle.  All Rights Reserved.
# You are free to use this file under the terms of the Creative Commons
# Attribution-Sharealike 3.0 Unported license, which can be found here:
# http://creativecommons.org/licenses/by-sa/3.0/

#
# Gzip Generation Plugin For Jekyll
#

module Jekyll

  #
  # Polymorphic Monkey-Patching
  #
  # Page, Post, and StaticFile have very different interfaces, but this plugin
  # needs to process all three.  Here, I add methods to each class to create
  # a common interface.
  #

  class StaticFile
    # Expose two attributes that are visible on Page/Post.
    attr_accessor :name, :site

    # output_ext is defined in Convertible.  It returns the file extension of
    # the output file.  Because StaticFile doesn't change the file type, the
    # implementation is easy:
    def output_ext
      File.extname(name)
    end

    # content_length is new for this plugin.  It's necessary because, while Page
    # and Post pull their contents into memory, StaticFile does not.  We have
    # to abstract this difference away.
    def content_length
      File.stat(path).size
    end

  end

  module Convertible
    # This causes content_length to appear on Page and Post, which inherit
    # their @content variables from Convertible.
    def content_length
      @content.length
    end
  end


  #
  # Plugin Code
  #

  # This represents a gzipped derivative of a StaticFile.  It's designed to
  # act like a StaticFile, but isn't one.
  class GzippedContent
    # Derives from the given 'model', which can be a Page, Post, or StaticFile.
    def initialize(model)
      @source_path = model.destination(model.site.dest)
      @dest_path = @source_path + '.gz'
    end

    # Returns the destination path for the gzipped output.  The 'dest' parameter
    # is ignored, because we captured the site's dest during initialization.
    # This is a bit of a hack.
    def destination(dest)
      @dest_path
    end

    # Produces gzipped output.
    def write(dest)
      dest_path = destination(dest)

      FileUtils.mkdir_p(File.dirname(dest_path))

      system "gzip -9 -c #{@source_path} > #{dest_path}"
    end
  end

  # The actual generator:
  class GzipGenerator < Generator
    safe true
    priority :lowest

    def generate(site)
      everything = site.pages + site.posts + site.static_files
      zipped = everything.select { |p| should_compress p }.collect { |p|
        GzippedContent.new(p)
      }

      site.static_files.concat(zipped)
    end

    def should_compress(thing)
      compressible_type(thing.output_ext) && large_enough(thing)
    end

    def compressible_type(ext)
      [
        '.html',
        '.css',
        '.js',
        '.txt',
        '.ttf',
        '.atom',
        '.stl',
      ].include?(ext)
    end

    def large_enough(thing)
      thing.content_length > 200
    end
  end

end
