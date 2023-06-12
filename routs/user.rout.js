const express=require("express")
const router=express.Router()
const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")
const {userModel}=require("../model/userMode");
require("dotenv").config()
const redis=require("ioredis");

// const {authenticate}=require("../middleware/authenticate")
const redisClient=new redis();


// ************ register section************************

router.post("/signup",async(req,res)=>{
    try {
        const {name,email,password}=req.body
        if(!email){
            return res.status(400).send({"message":"email is required"})
        }
        if(!password){
            return res.status(400).send({"message":"password is required"})
        }
       
        const userExist= await userModel.findOne({email})
        if(userExist){
            return res.status(400).send({"message":"email is already exist please signup"})
        }
        bcrypt.hash(password,7,async(error,hash)=>{
            if(error){
                console.log("bcrypt",error)
                return res.status(500).send({"message":"something went wrong"})  
            }
            const user= new userModel({name,email,password:hash})
             await user.save()
             res.status(200).send({"message":"register seccessfully"})
        })  
    } catch (error) {
        console.log(error)
        res.status(500).send({"message":"something went wrong "})
    }
})

// ********************* login *************************
router.post("/login",async(req,res)=>{
    const {email,password}=req.body
    console.log(email,password)
    try {
        if(!email){
            return res.status(400).send({"message":"put email"})
        }
        if(!password){
            return res.status(400).send({"message":"put password"})
        }
        const user=await userModel.findOne({email})
        console.log(user)
        if(user){
            bcrypt.compare(password,user.password,(error,result)=>{
               if(result){
                const accesstoken=jwt.sign({email,role:user.role},process.env.tokenKey,{expiresIn:"6h"})
                res.status(200).send({"message":"login syccessfull","token":accesstoken})
               }else{
                return res.status(400).send({"message":"wrong password"})
               } 
            })
        }else{
            return res.status(400).send({"message":"put correct email id"})
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({"message":"something went wrong"})
    }
})




// ****************logout***************

// 
router.get("/logout", async (req, res) => {
    const token = req.headers.authorization;
  
    try {
      await redisClient.set(token, token, 'EX', 30 * 60);
      res.status(200).send({ message: "Logout successful" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  });



module.exports={router}