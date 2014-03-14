require 'yaml'

DB_CONFIG = YAML.load_file('config/database.yml')['development']
ActiveRecord::Base.establish_connection DB_CONFIG

class Price < ActiveRecord::Base
	belongs_to :shop
end

class Shop < ActiveRecord::Base
	has_many :prices
end