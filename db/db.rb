require "mongoid"

Mongoid.load!("config/mongoid.yml", :development)
Mongoid.raise_not_found_error = false
class User
  include Mongoid::Document
	
  has_many :shops
  field :first_name, :type => String
  field :last_name, :type => String
  field :identity, :type => String
  field :email, :type => String
  field :role, :type => Integer, :default => 1
  field :uid, :type => String
  field :network, :type => String
  field :profile, :type => String
end
class Shop
	include Mongoid::Document
	
	belongs_to :user
	embeds_one :address
	embeds_one :price
  field :title, :type => String, :default => "Second Hand"
	field :status, :type => Boolean, :default => false
end
class Address
	include Mongoid::Document
	
	embedded_in :shop
	field :city, :type => String, :default => "Ivano-Frankivsk"
	field :street, :type => String
  field :lat, :type => Float
  field :lng, :type => Float
end
class Price
	include Mongoid::Document
	
	embedded_in :shop
	field :monday, :type => Integer
	field :tuesday, :type => Integer
	field :wednesday, :type => Integer
	field :thursday, :type => Integer
	field :friday, :type => Integer
	field :saturday, :type => Integer
	field :sunday, :type => Integer
end


