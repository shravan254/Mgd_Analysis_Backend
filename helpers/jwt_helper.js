const JWT = require('jsonwebtoken')
const createError = require('http-errors')

let access_secret = "74fdb9a88142d98fefc4ab75a977307c00149af0af50a3842d3f62f5f4d22978";
let refresh_secret = "74fdb9a88142d98fefc4ab75a977307c00149af0af50a3842d3f62f5f4d22978";

module.exports = {
    signAccessToken: (uid) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secret = access_secret
            const options = {
                expiresIn: '10 days',
                issuer: 'Lazer',
                audience: uid
            }
            JWT.sign(payload,secret,options,(err, token) => {
                if (err){
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
    },
    verifyAccessToken: async (req, res, next) => {
        if(!req.headers['authorization']) return next(createError.Unauthorized())
        const authHeader = req.headers['authorization']
        const token = authHeader.split(' ')[1]
        // var checkblacklist = await Blacklist.findOne({accessToken:token})
        // if(!checkblacklist){
            JWT.verify(token, access_secret, (err, payload) => {
                if(err){
                    const message = err.name === 'JsonWebTokenError'? 'Unauthorized' : err.name;
                    return next(createError.Unauthorized(message))
                }
                req.payload = payload
                next()
            })
        // }else return next(createError.Unauthorized())   
    },
    signRefreshToken: (uid) => {
        return new Promise((resolve, reject) => {
            const payload = {}
            const secret = refresh_secret
            const options = {
                expiresIn: '60 days',
                issuer: 'Lazer',
                audience: uid
            }
            JWT.sign(payload,secret,options,(err, token) => {
                if (err){
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
    },
    verifyRefreshToken: async (refreshToken) => {
        // var checkblacklist = await Blacklist.findOne({refreshToken:refreshToken})
        // if(!checkblacklist){
            return new Promise((resolve, reject) => {
                JWT.verify(refreshToken, refresh_secret, (err, payload) => {
                    if (err) return reject(createError.Unauthorized())
                    const email = payload.aud
    
                    resolve(email)
                })
            })
        // }else return createError.Unauthorized() 
    },
    getTokenData: (token) => {
        return new Promise((resolve, reject) => {
            JWT.verify(token, access_secret, (err, payload) => {
                if (err) return reject(createError.Unauthorized())
                const email = payload.aud

                resolve(email)
            })
        })
    }
}