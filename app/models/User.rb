require 'active_record'

class Shop < ActiveRecord::Base
	has_many :shops
end
