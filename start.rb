require 'sinatra/base'
require 'sinatra/json'
require 'net/http'
require_relative 'db/db.rb'

class SecondHunter < Sinatra::Base
  helpers Sinatra::JSON
  set :server, :thin
  set :sessions, true
  set :logging, true
  set :threaded, true
    
  configure do
    set :threaded, true
    set :root, "app/"
    set :public_folder, Proc.new { File.join(settings.root, "assets") }
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
    def send_response(data,success,error)
      unless(data.nil?)
        status = "ok"
        message = success
      else
        status = "error"
        message = error
      end
      content_type 'application/json'
      {:status => status,:message => message, :data =>data}.to_json
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
    if (session['user_role'] && session['user_role'] == 2)
      @user_can_edit_second = true 
    end
    @user = {}
    @user[:id] = session['user_id'] if session['user_id']
    @user[:name] = session['first_name'] if session['first_name']
    erb :index
  end
  post '/add' do
    halt "Спочатку ввійдіть в систему" unless session["user_id"]
    price = params[:price]
    p params
    raise StandardError, "Not all days were passed" unless price.count == 7
    raise StandardError, "user_id is not defined in session" unless session["user_id"]
    title = {:title => params[:title]} if params[:title].length > 3
    address = params[:address]
    
    user = User.find(session["user_id"])
    raise StandardError, "User not found" if user.nil?
    shop = Shop.new(title) if user
    shop.create_address(address) if shop
    shop.create_price(price) if shop
    user.shops << shop
    
    redirect to "/" unless request.xhr? 
    send_response(shop, "Секонд успішно добавлений", "Сталась помилка під час добавлення")
  end
  get '/shops/:city' do
    p params[:city]
    shops = Shop.find_by_city(params[:city])
    p shops
    #json @shop
    send_response(shops, "Секонди успішно завантажені", "Сталась помилка під час завантаження")
  end
  get '/template/:name' do
    content_type 'text/plain', :charset => 'utf-8'
    get_template_according_to_user_role(params[:name])
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
    result = Shop.find(params[:id]).delete
    send_response(result,"Секонд успішно видалений","Сталась помилка під час видалення")
  end
  post '/edit/second/status/:id' do
    shop = Shop.find(params[:id])
    p shop.status
    (shop && shop.status) ? shop.update(:status => false) : shop.update(:status => true)
    #json shop.status
    send_response(shop, "Статус секонда успішно змінений", "Сталась помилка при зміні статусу")
  end
  post '/edit/second/:id' do
    id = params[:id]
    title = params[:title]
    price = params[:price]
    p params
    params.delete("splat")
    params.delete("id")
    params.delete("captures")
    shop = Shop.find(id)
    shop.update(:title => title) if title
    shop.price.update(price) if price
    send_response(shop, "Секонд успішно оновлено", 'Сталась помилка при оновлені')
  end
  post '/blank.html' do
    url = URI.parse('http://ulogin.ru/token.php?token='+params[:token]) 
    social_data = JSON.parse(Net::HTTP.get(url))
    p social_data
    @user = User.find_by(:email => social_data['email']) if (social_data['email'])
    @user = User.find_by(:identity => social_data['identity']) unless @user
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