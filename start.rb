require 'sinatra'
require 'sinatra/activerecord'
require 'sinatra/json'
require_relative 'db/database.rb'

class SecondHunter < Sinatra::Base
  helpers Sinatra::JSON
  set :server, :thin
  set :sessions, true
  set :logging, true
    
  configure do
    set :threaded, true
    set :root, "app/"
    set :public_folder, Proc.new { File.join(root, "assets") }
  end
  get '/' do
    @title = "Second Hunter - for real clothes hunters!"
    erb :index
  end
  get '/shop/:id' do
    @shop = Shop.find(params[:id])
    json @shop.to_json
  end
  get '/shops' do
    @shop = Shop.all
    json @shop
  end
  get '/code' do
    address="1600+Amphitheatre+Parkway,+Mountain+View,+CA"
    url="http://maps.googleapis.com/maps/api/geocode/json?address=#{address}s&sensor=false"
  end
end

#SecondHunter.run!
