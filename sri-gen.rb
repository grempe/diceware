#!/usr/bin/env ruby

# A simple tool to generate Sub Resource Integrity hashes
# and store them in a JSON file which can also be versioned
# or consumed programatically.

require 'digest/sha2'
require 'json'

files = {}

Dir.glob('{css,js}/**/*.{js,css}').each do |file_name|
  next if File.directory? file_name
  files[file_name] = "sha384-#{Digest::SHA384.file(file_name).base64digest}"
end

File.open('sri-hashes.json','w') do |f|
  f.write(JSON.pretty_generate(files))
end
