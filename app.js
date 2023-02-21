//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");
mongoose.connect("mongodb+srv://admin_ramya:testmongodb123@cluster0.blqgvvm.mongodb.net/todoListDB");
mongoose.set('strictQuery', true);

// Define item schema
const itemSchema = {
  name: String
}
const Item = mongoose.model("item",itemSchema);

const item1 = new Item({
  name:"Welcome to your today list"
});
const item2 = new Item({
  name:"Hit + button to add new item"
});
const item3 = new Item({
  name:"<-- Hit this button to delete the item"
});
const defaultItems = [item1,item2,item3];

//Define List schema
const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List",listSchema);

// Route to render the page based on the list found
app.get("/", function(req, res) {
  const foundItems = [];
  Item.find({},function(err,foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully inserted to database!");
        }
      });
      res.redirect("/");
    }else{
       res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

// Route for parameter
app.get("/:customListName", function(req,res){
  const listName = _.capitalize(req.params.customListName);
  List.findOne({name:listName},function(err,foundLists){
    if(!err){
      if(!foundLists){
        // create a new list
        const list = new List({
          name:listName,
          items:defaultItems
        })
        list.save();
        res.redirect("/" + listName);
      }else{
        // show an existing list
        res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items});
      } 
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name:itemName
  });
  if (listName === "Today"){
      item.save();
      res.redirect("/");
  }else{
      List.findOne({name:listName},function(err,foundLists){
        foundLists.items.push(item);
        foundLists.save();
        res.redirect("/" + listName);   
        });
  }
});

// Route for delete
app.post("/delete",function(req,res){
  const itemId = req.body.checkBox;
  const listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(itemId,function(err){
      if(!err){
        console.log("Successfully Deleted from the DB");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: itemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
      });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
