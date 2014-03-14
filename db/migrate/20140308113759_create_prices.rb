class CreatePrices < ActiveRecord::Migration
  def self.up
    create_table :prices, :options => 'ENGINE=InnoDB DEFAULT CHARSET=utf8' do |t|
      t.column :shop_id, :integer, :null => false
      t.column :user_id, :integer, :default => 1
      t.column :price_per_kilo, :integer, :default => 0
      t.column :day, :integer, :default => 0
      t.timestamps 
    end
    add_index :prices, :shop_id
    add_index :prices, :user_id
  end
  def self.down
    drop_table :prices
  end
end
