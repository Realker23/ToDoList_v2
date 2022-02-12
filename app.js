const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname+"/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();




app.set('view engine','ejs');

app.use(express.static("public")); // to use static files
app.use(bodyParser.json()); // looks at requests where the Content-Type: application/json header is present and transforms the text-based JSON input into JS-accessible variables under req.body.
app.use(bodyParser.urlencoded({ extended: true}));


mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = new mongoose.Schema({
    name : String
});

const Item = mongoose.model('Item',itemSchema);

const item1 = new Item({
    name : 'Welcome to your todolist!'
});

const item2 = new Item({
    name : 'Hit the + button to add a new item.'
});

const item3 = new Item({
    name : '<-- Hit this to delete an item.'
});

const defaultItems = [item1,item2,item3];


const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
})

const List = mongoose.model('List',listSchema);



//root route..
app.get('/', (req, res) => {

    Item.find({},function(err,items){
        if(items.length===0){
            Item.insertMany(defaultItems,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("items added");
                }
            });
            res.redirect("/")
        }else{
            if(err){
                console.log(err);
            }else{
                res.render('list',{listTitle:"Today",
                    newListItem:items
                });
            }
        }

        
       

    })
    
    

});
//custom get...
app.get("/:customListName",function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                //Create a new list
                const list = new List({
                    name:customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect("/"+customListName);
            }else{
                //Show an existing list
                res.render("list",{listTitle:foundList.name,newListItem:foundList.items});
            }
            
        }
    })
    
});

app.post('/', (req, res) => {
    
    
    let newItem = req.body.newItem;
    let listName = req.body.button;
    const item = new Item({
        name:newItem
    });
    if(listName === "Today"){
        item.save();
        console.log("item added");
        res.redirect("/");
    }else{
        List.findOne({name:listName},function(err,found){
            if(!err){
                found.items.push(item);
                found.save(); 
                res.redirect("/"+listName);   
            }
        })
    }
    
    
})

app.post('/delete', (req, res) => {
    const checked = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === "Today"){
        Item.findByIdAndRemove(checked, function(err){
            if(!err){
                console.log("Successfully deleted");
                res.redirect("/");
            }
        });
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checked}}}, function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }
    
})



// app.post('/work', (req, res) => {
//     let newItem = req.body.newItem;
   
// })

app.get('/about', (req, res) => {
    res.render('about')
})

app.listen(3000,function () {
    console.log('listening on port 3000')
});