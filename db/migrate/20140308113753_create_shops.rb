class CreateShops < ActiveRecord::Migration
  def self.up
    create_table :shops, :options => 'ENGINE=InnoDB DEFAULT CHARSET=utf8' do |t|
      t.column :title, :string, :default => 'Second hand'
      t.column :city, :string, :null => false, :default => 'Ivano-Frankivsk'
      t.column :address, :string, :null => false
      t.column :phone, :string
      t.column :about, :text
      t.timestamps 
    end
    add_index :shops, :address
  end
  def self.down
    drop_table :shops
  end
end
