# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140319095614) do

  create_table "shops", force: true do |t|
    t.string   "title",      default: "Second hand"
    t.string   "address",                            null: false
    t.integer  "user_id",                            null: false
    t.float    "lat"
    t.float    "lng"
    t.boolean  "status",     default: false
    t.integer  "monday",                             null: false
    t.integer  "tuesday",                            null: false
    t.integer  "wednesday",                          null: false
    t.integer  "thursday",                           null: false
    t.integer  "friday",                             null: false
    t.integer  "saturday",                           null: false
    t.integer  "sunday",                             null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "shops", ["address"], name: "index_shops_on_address", using: :btree
  add_index "shops", ["user_id"], name: "index_shops_on_user_id", using: :btree

  create_table "users", force: true do |t|
    t.string   "first_name",             null: false
    t.string   "last_name",              null: false
    t.string   "identity",               null: false
    t.string   "email"
    t.integer  "role",       default: 1
    t.string   "uid",                    null: false
    t.string   "network",                null: false
    t.string   "profile",                null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "users", ["email"], name: "index_users_on_email", using: :btree

end
