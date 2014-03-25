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
    set :session_secret, "second_hunter"
    set :partial_folder, "partials/"
    set :user_roles, ["guest", "user", "hunter"]
  end
  helpers do
    # В залежності від ролі користувача генерувати той чи інший партіал
    def get_partial_according_to_user_role(template)
      p "user_role: #{session["user_role"]}"
      user_role = session["user_role"] || 0
      range = Range.new(0, user_role)
      settings.user_roles.slice(range).reverse.each do |role|
        partial = File.join(settings.partial_folder, role + "/#{template}")
        path = File.expand_path(File.join(File.dirname(__FILE__), File.join(settings.root + 'views', partial + ".erb")))
        p path
        return partial.to_sym if File.exists? path
      end
      raise StandardError, "Partial was not found anywhere :("
    end
     def get_template_according_to_user_role(template)
      p "user_role: #{session["user_role"]}"
      user_role = session["user_role"] || 0
      range = Range.new(0, user_role)
      settings.user_roles.slice(range).reverse.each do |role|
        partial = File.join("templates", role + "/#{template}")
        path = File.expand_path(File.join(File.dirname(__FILE__), File.join(settings.root + 'assets', partial + ".ejs")))
        p path
        return File.open(path, "rb").read if File.exists? path
      end
      raise StandardError, "Partial was not found anywhere :("
    end
    def partial(template, *args)
      options = args.extract_options!
      options.merge!(:layout => false)
      template = get_partial_according_to_user_role(template)
        p template
      if collection = options.delete(:collection) then
        collection.inject([]) do |buffer, member|
          buffer << erb(template, options.merge(:layout =>
                false, :locals => {template.to_sym => member}))
        end.join("\n")
      else
        erb(template, options)
      end
    end
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
    @user = {}
    @user[:id] = session['user_id'] if session['user_id']
    @user[:name] = session['first_name'] if session['first_name']
    erb :index
  end
  get '/new' do
    erb :new
  end
  get '/add' do
    days = params[:days]
    raise StandardError, "Not all days were passed" unless days.count == 7
    settings = {}
    settings[:title] = params[:title] if params[:title].length > 3
    settings[:address] = params[:address]
    settings[:lng] = params["lng"]
    settings[:lat] = params["lat"]
    settings[:monday] = days["monday"]
    settings[:tuesday] = days["tuesday"]
    settings[:wednesday] = days["wednesday"]
    settings[:thursday] = days["thursday"]
    settings[:friday] = days["friday"]
    settings[:saturday] = days["saturday"]
    settings[:sunday] = days["sunday"]
    settings[:user_id] = session["user_id"]
    p settings
    Shop.create settings
    redirect to "/"
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
  get '/template/:name' do
     path = get_template_according_to_user_role(params[:name])
    p path
    content_type 'text/plain', :charset => 'utf-8'
    path
  end
  get '/partial/:name' do
    path = get_partial_according_to_user_role(params[:name])
    p path
    body {path}
  end
  
  get '/geocode/:address' do
    location = geocode(params[:address])
    body{location.to_s}
  end
  get '/profile' do
    p session
    if session["user_id"]
      body{"Hello, #{session["first_name"]}"}
    else
      body {"Hello, stranger"}
    end
  end
  get '/logout' do
    session.clear
    redirect to '/'
  end
  post '/delete/second/:id' do
    json Shop.destroy(params[:id])
  end
  post '/edit/second/status/:id' do
    shop = Shop.find(params[:id])
    p shop.status
    (shop.status) ? shop.update(:status => false) : shop.update(:status => true)
    json shop.status
  end
  post '/edit/second/:id' do
    id = params[:id]
    p params
    params.delete("splat")
    params.delete("id")
    params.delete("captures")
    shop = Shop.update(id, params)
    json shop
    #TODO: відіслати відповідь успішну або помилку
  end
  post '/blank.html' do
    url = URI.parse('http://ulogin.ru/token.php?token='+params[:token]) 
    social_data = JSON.parse(Net::HTTP.get(url))
    p social_data
    @user = User.find_by_email(social_data['email']) if (social_data['email'])
    @user = User.find_by_identity(social_data['identity']) unless @user
    unless @user
      @user = User.new
      @user.first_name = social_data['first_name']
      @user.last_name = social_data['last_name']
      @user.email = social_data['email']
      @user.uid = social_data['uid']
      @user.identity = social_data['identity']
      @user.network = social_data['network']
      @user.profile = social_data['profile']
      @user.save
    end
    session["user_id"] = @user.id
    session["first_name"] = @user.first_name
    session["last_name"] = @user.last_name
    session["user_role"] = @user.role
    redirect to '/'
  end
end

#SecondHunter.run!
