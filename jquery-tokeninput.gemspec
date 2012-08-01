# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "jquery-tokeninput/version"

Gem::Specification.new do |s|
  s.name        = "jquery-tokeninput"
  s.version     = Jquery::Tokeninput::VERSION
  s.authors     = ["HIDEKUNI Kajita"]
  s.email       = ["hide.nba@gmail.com"]
  s.homepage    = ""
  s.summary     = %q{Jquery Tokeninput automated install for Rails 3.1+}
  s.description = %q{Gem installation of jquery tokeninput scripts and stylesheets}

  s.rubyforge_project = "jquery-tokeninput"

  s.files         = `git ls-files`.split("\n")
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]

  # specify any dependencies here; for example:
  # s.add_development_dependency "rspec"
  # s.add_runtime_dependency "rest-client"
end
