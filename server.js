const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config();

const bodyParser=require("body-parser");
const mongoose = require("mongoose");
//MONGO_URI - моя переменная окружения (.env), содержит ссылку на базу данных с паролем 
mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology:true},function (err) {
   if (err) throw err;
   console.log('Successfully connected');
});

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'))//работает без dirname. Эта строка была предустановлена в шаблоне
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
var Schema=mongoose.Schema;

var userSchema= Schema({
  username:String,
 
});
var exerciseSchema = Schema({
  userId: String,
  description: {type:String,required:true},
  duration: {type:Number,required:true},
  date: Date,
 
});
var User = mongoose.model("User",userSchema);
var Exercise=mongoose.model("Exercise", exerciseSchema);

app.route("/api/users")
.post((req,res)=>{
var user= new User ({
  username:req.body.username
});
user.save(function (err){
  if (err)handleError(err);
})
res.send({username:user.username,
_id:user._id});
})
.get(async(req,res)=>{
  var arrayOfUsers= await User.find({},(err,data)=>
  {if(err)console.log(err);}
  );
  res.send(arrayOfUsers);
});

app.post("/api/users/:_id/exercises",async (req,res)=>{
  const userId = req.params._id;
  
  const dateOfExcercise=req.body.date?new Date(req.body.date):new Date();
 
 const findUserName= 
  await User.findById(userId,(err,foundUser)=>{
  if (err)return console.log("user is not found");
  });

  var exercise= new Exercise({
  userId: findUserName._id,
  description: req.body.description,
  duration: req.body.duration,
  date: dateOfExcercise
  });
  
  exercise.save(function (err){
  if(err)console.log(err);
});

res.send({
  _id: findUserName._id,
  username: findUserName.username,
  description: exercise.description,
  duration: exercise.duration,
  date: exercise.date.toDateString()
});
 
});

app.get("/api/users/:_id/logs", async (req,res)=>{
  try{
const {limit}=req.query;
const from=Date.parse(req.query.from);
const to=Date.parse(req.query.to);
const userFound= await User.findById(req.params._id);
var logsOfUser= await Exercise.find({userId:req.params._id}).select({userId:0, __v:0, _id:0}).exec();

if(limit){
logsOfUser=logsOfUser.slice(0,limit)};
if(from){
logsOfUser=logsOfUser
.filter(exercise=>Date.parse(exercise.date)>=from)};
if(to){
logsOfUser=logsOfUser
.filter(exercise=>Date.parse(exercise.date)<=to)};

logsOfUser=logsOfUser.map(x=>({description:x.description,
duration:x.duration,
date:x.date.toDateString()}));

const count =logsOfUser.length;

res.send({
  username: userFound.username,
  _id:userFound._id,
  count:count,
 log:logsOfUser
})
  }catch(err){
    console.log(err)};
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
