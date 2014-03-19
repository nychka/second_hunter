require 'yaml'

DB_CONFIG = YAML.load_file('config/database.yml')['development']
ActiveRecord::Base.establish_connection DB_CONFIG

class Shop < ActiveRecord::Base
	belongs_to :user
end
class User < ActiveRecord::Base
	has_many :shops
end
