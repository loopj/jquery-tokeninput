require 'rubygems'
require 'sinatra'
require 'haml'
require 'json'

arr = []
File.new('./vocabulary').each do |t| 
  arr<< { :id => t.length, :name => t.chop }
end

set :public, File.dirname(__FILE__) + '/../'
set :public, File.dirname(__FILE__) + '/../'


get '/' do
  haml :index
end

get '/test' do
  new_arr = []
  matcher = params[:q]
  arr.each do |i|
    if i[:name].downcase.include? matcher.downcase
      new_arr<< i
    end
  end
  new_arr.to_json
end
