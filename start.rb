require 'sinatra/base'

class SecondHunter < Sinatra::Base
  set :server, :thin
  set :sessions, true
  set :logging, true
  
  configure do
    set :threaded, true
    set :root, "app/"
    set :public_folder, Proc.new { File.join(root, "assets") }
  end
  get '/' do
    @title = "Warcraft"
    erb :index
  end
end

SecondHunter.run!
