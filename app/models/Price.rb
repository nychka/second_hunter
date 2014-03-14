require 'active_record'

class Price < ActiveRecord::Base
  enum :day => [:monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday]
	belongs_to :shop
end
