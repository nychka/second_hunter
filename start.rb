require 'sinatra/base'
require 'sinatra/activerecord'
require 'sinatra/json'
#require 'sinatra/async'
#require "em-http-request"
require 'net/http'
require_relative 'db/database.rb'

class SecondHunter < Sinatra::Base
  #register Sinatra::Async
  helpers Sinatra::JSON
  set :server, :thin
  set :sessions, true
  set :logging, true
  set :threaded, true
    
  configure do
    set :threaded, true
    set :root, "app/"
    set :public_folder, Proc.new { File.join(root, "assets") }
  end
  helpers do
    def geocode(address)
      raise ArgumentError, "Address is NOT passed!" if address.nil? or address.is_a?(String) == false
      address ="#{address}+,Івано-Франківськ,+Україна".gsub!(/\s/, "+")
      url="maps.googleapis.com"
      path = "/maps/api/geocode/json?address=#{address}s&sensor=false"# &key=AIzaSyDQWuApUanpte7w4Enl4WDKrIQ0m5cYf7E"
      p "Waiting for response from google maps ..."
      response = Net::HTTP.get_response(url, path)
      if response.code.to_i == 200
        result = JSON.parse(response.body)
        status = result["status"]
        if status == "OK"
          #витягуємо широту та довготу
          location = result["results"][0]["geometry"]["location"]
          p location
          location
        else
          raise StandardError, "status is not ok: #{status}"
        end
      else
        raise StandardError, "bad request, code #{response.code}"
      end
    end
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
  get '/delay/:n' do |n|
    EM.add_timer(n.to_i) { body { "delayed for #{n} seconds" } }
  end
  get '/geocode/:address' do
    location = geocode(params[:address])
    body{location.to_s}
  end
end

#SecondHunter.run!
