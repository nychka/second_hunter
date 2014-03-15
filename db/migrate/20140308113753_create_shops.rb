class CreateShops < ActiveRecord::Migration
  def self.up
    create_table :shops, :options => 'ENGINE=InnoDB DEFAULT CHARSET=utf8' do |t|
      t.column :title, :string, :default => 'Second hand'
      t.column :address, :string, :null => false
      t.column :lat, :float
      t.column :lng, :float
      t.column :status, :boolean, :default => false
      t.column :monday, :integer, :null => false
      t.column :tuesday, :integer, :null => false
      t.column :wednesday, :integer, :null => false
      t.column :thursday, :integer, :null => false
      t.column :friday, :integer, :null => false
      t.column :saturday, :integer, :null => false
      t.column :sunday, :integer, :null => false
      t.timestamps 
    end
    add_index :shops, :address
  end
  def self.down
    drop_table :shops
  end
end
