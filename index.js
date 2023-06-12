const express=require("express")
const app=express()
app.use(express.json())
const {connect}=require("./database/db")
require("dotenv").config()
const {router}=require("./routs/user.rout")
const {weatherrout}=require("./routs/weather.rout")


app.get("/",(req,res)=>{
    res.send("hii..")
})

app.use("/user",router)
app.use("/temp",weatherrout)

app.listen(process.env.port,async()=>{
    try {
        await connect 
        console.log("connect to db")
    } catch (error) {
        
    }
    console.log(`server is running at${process.env.port}`)
})