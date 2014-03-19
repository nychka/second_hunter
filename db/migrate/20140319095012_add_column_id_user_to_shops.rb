class AddColumnIdUserToShops < ActiveRecord::Migration
  def self.up
      add_column :shops, :user_id, :integer, :null => false, :after => :address
      add_index :shops, :user_id
  end
  def self.down
      remove_column :shops, :user_id, :integer, :null => false
  end
end
