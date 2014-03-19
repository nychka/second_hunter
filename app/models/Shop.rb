require 'active_record'

class Shop < ActiveRecord::Base
	has_many :prices
	belongs_to :user
end
