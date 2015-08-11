# Require any additional compass plugins here.
project_type = :stand_alone

# Publishing paths
http_path = "//static.juev.org/"
http_images_path = "//static.juev.org/assets/images"
http_fonts_path = "//static.juev.org/assets/fonts"
http_stylesheets_path = "//static.juev.org/assets/css"

# http_images_path = "/assets/images"
# http_fonts_path = "/assets/fonts"
# http_stylesheets_path = "/assets/css"

# Local development paths
sass_dir = "assets/scss"
images_dir = "assets/images"
fonts_dir = "assets/fonts"
css_dir = "dist/assets/css"

line_comments = false
output_style = :compressed

environment = :production
asset_cache_buster :none
