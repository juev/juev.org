require 'jekyll_asset_pipeline'

module JekyllAssetPipeline
  class CssCompressor < JekyllAssetPipeline::Compressor
    require 'yui/compressor'

    def self.filetype
      '.css'
    end

    def compress
      return YUI::CssCompressor.new.compress(@content)
    end
  end

  class JavaScriptCompressor < JekyllAssetPipeline::Compressor
    require 'yui/compressor'

    def self.filetype
      '.js'
    end

    def compress
      return YUI::JavaScriptCompressor.new(munge: true).compress(@content)
    end
  end
end

module JekyllAssetPipeline
  class CssTagTemplate < JekyllAssetPipeline::Template
    def self.filetype
      '.css'
    end

    def html
      "<link href='//static.juev.ru/assets/#{@filename}' rel='stylesheet' type='text/css' />\n"
    end
  end

  class JsTagTemplate < JekyllAssetPipeline::Template
    def self.filetype
      '.js'
    end

    def html
      "<script src='//static.juev.ru/assets/#{@filename}' type='text/javascript'></script>\n"
    end
  end
end
