const express=require("express")
const weatherrout=express.Router()
const redis=require("ioredis");
const rateLimit=require("express-rate-limit");
const {body,validationResult}=require("express-validator");
const axios=require("axios")
const winston=require("winston");
const winstonMongoDB=require("winston-mongodb");
const mongoose=require("mongoose")
require("dotenv").config()

const redisClient=new redis();
const logger=winston.createLogger({
    level:"error",
    transports:[
        new winston.transports.Console(),
        new winstonMongoDB.MongoDB({
            db:process.env.mongoURL,
            collection:"logs"
        })
    ]
});

// blacklist middleware
const checkBlacklist=async (req,res,next)=>{
    const token=req.headers.authorization;
    const isBlacklisted=await redisClient.get(token);
    if(isBlacklisted){
        return res.status(401).send({"message":"token is blacklisted"})
    }
    next()
}

// ratelimiter middleware

const limiter=rateLimit({
    windowMs:3*60*1000,
    max:1
})

// api
weatherrout.get("/weather/:city",limiter,checkBlacklist,async(req,res)=>{
    const  {city}=req.params;
    try {
        if(!/^[a-zA-z\s]+$/.test(city)){
            return res.status(400).send({"msg":"invalid city name"})
        }
        const weatherdata=await redisClient.get(city)
        if(weatherdata){
            res.send({"data":JSON.parse(weatherdata)})
        }
        //fetch
        const apikey= "0d739c3bc088ae492521ed0b6d65ba0b";
        const apiUrl="https://api.openweathermap.org/data/2.5/weather?q={city}&appid={apikey}"
        const response= await axios.get(apiUrl)
        const data=response.data;
        await redisClient.setex(city,30*60,JSON.stringify(data))
        return res.send(data)
    } catch (error) {
        logger.error( `Error retriving weather data for ${city}:${error.message}`);
        res.status(500).send({"message":"server error"})
    }
})
module.exports={weatherrout}


