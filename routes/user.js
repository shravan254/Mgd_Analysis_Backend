const userRouter = require("express").Router();
var createError = require('http-errors')
const CryptoJS = require("crypto-js");
var bodyParser = require('body-parser')
const { logger } = require('../helpers/logger');

const { setupQuery,setupQueryMod } = require('../helpers/dbconn');
const { signAccessToken } = require('../helpers/jwt_helper');


var jsonParser = bodyParser.json()      


userRouter.post(`/login`, jsonParser ,  async (req, res, next) => {
    console.log(req.body , '/LOGIN INPUT')    
    try {
        console.log("login")
        const username = req.body.username;
        const passwd = req.body.password;

        let passwrd = CryptoJS.SHA512(req.body.password);
        console.log(passwrd)
        if (!username || !passwrd) res.send(createError.BadRequest()) 

        setupQueryMod(`Select usr.Name, usr.UserName,usr.Password,usr.Role, unt.UnitName,usr.ActiveUser from magod_setup.magod_userlist usr
        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID WHERE usr.UserName = '${username}' and usr.ActiveUser = '1'`, async (err,d) => {
            if(err) logger.error(err);
            let data = d
            if (data.length > 0) {

                if (data[0]["Password"] == passwrd) { 
                    console.log("passwor...",data[0]["Password"]);
                    delete data[0]["Password"]

                    setupQueryMod(`Select m.MenuUrl from magod_setup.menumapping mm
                left outer join magod_setup.menus m on m.Id = mm.MenuId
                where mm.Role = '${data[0]["Role"]}' and mm.ActiveMenu = '1'`, async (err,mdata) => {
                    if(err) logger.error(err);
                        let menuarray = []
                        mdata.forEach(element => {
                            menuarray.push(element["MenuUrl"]) 
                        });
                        let accessToken = await signAccessToken(data[0]["UserName"]);
                        res.send({ accessToken: accessToken, data: { ...data, access: menuarray } });
                        logger.info(`Login Success - ${data[0]["UserName"]}`)
                    })
                } else {
                    res.send(createError.Unauthorized("Invalid Username/Password"))
                    logger.error(`Login Failed - ${username} IP : ${req.ip}`)
                }
            } else {
                res.send(createError.Unauthorized("Invalid Username/Password"))
                logger.error(`Login Failed - ${username} IP : ${req.ip}`)
            }

            //      res.send({...data, decPass, encrypted: encrypted.toString(), decrypted: decrypted.toString(CryptoJS.enc.Utf8)});
        })

         //res.send(createError.Unauthorized("Invalid Username/Password"))

    } catch (error) {
        next(error)
        logger.error(`Error - ${error}`)
    }
});


// Working msg is sent as blank
// userRouter.post(`/savemenurolemapping`, async (req, res, next) => {
//     console.log("Save Menu Role Mapping API Call")


//     try {
//         console.log(req.body.newselectedmenu);
//         let data = req.body.newselectedmenu;
//         console.log("data variable : " + data.length)
//         let msg = "";
//         setupQuery(`Select * from magod_setup.menumapping where Role = '${data[0]["role"]}'`, async (dr) => {
//             if (dr.length > 0) {
//                 for (let i = 0; i < data.length; i++) {
//                      setupQuery(`UPDATE magod_setup.menumapping SET ActiveMenu = 0 WHERE Role = '${data[i]["role"]}'`, async (mapdata) => { console.log("Deactivated ") })

//                     setupQuery(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (menuid) => {
//                         if (menuid.length > 0) {
//                             console.log(menuid[0]["Id"] + " " + data[i]["MenuName"])
//                             setupQuery(`UPDATE magod_setup.menumapping SET ActiveMenu = 1 WHERE Role = '${data[i]["role"]}' And MenuId = '${menuid[0]["Id"]}'`, async (dmp) => {
//                                 console.log("Activated ")
//                                 if (dmp.affectedRows == 0) {
//                                     console.log("Inserting ")
//                                     setupQuery(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu)
//                                     VALUES ('${data[i]["role"]}', '${menuid[0]["Id"]}', '1')`, async (ins) => {
//                                         msg = "success"
//                                         //  res.send({ status: "success" })
//                                     })
//                                 }
//                                 else if (dmp.affectedRows > 0) {
//                                     console.log("Updating")
//                                     msg = "updated"
//                                     //  res.send({ status: "updated" })
//                                 }

//                             })
//                         }

//                     })
//                 }
//                 res.send({ status: msg })
//             }
//         });
//     } catch (error) {
//         next(error)
//     }
// });

// Modifying the above working for Msg
// userRouter.post(`/savemenurolemapping`, async (req, res, next) => {
//     console.log("Save Menu Role Mapping API Call")
//     try {
//         console.log(req.body.newselectedmenu);
//         let data = req.body.newselectedmenu;


//         setupQuery(`Select * from magod_setup.menumapping where Role = '${data[0]["role"]}'`, async (dr) => {
//             console.log(data[0]["role"])
//             console.log(dr.length)
//             let msg = "";
//             if (dr.length > 0) {
//                 //        let msg = "";
//                 for (let i = 0; i < data.length; i++) {
//                     setupQuery(`UPDATE magod_setup.menumapping SET ActiveMenu = 0 WHERE Role = '${data[i]["role"]}'`, async (mapdata) => {
//                         console.log("Deactivated ")
//                     })

//                     setupQuery(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (menuid) => {
//                         console.log("Menu check "+menuid[0]["Id"])
//                         if (menuid.length > 0) {
//                             setupQuery(`UPDATE magod_setup.menumapping SET ActiveMenu = 1 WHERE Role = '${data[i]["role"]}' And MenuId = '${menuid[0]["Id"]}'`, async (dmp) => {
//                                 console.log("Activated ")
//                                 if (dmp.affectedRows == 0) {
//                                     console.log("Inserting ")
//                                     setupQuery(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid["Id"]}', '1')`, async (ins) => {
//                                         msg = "success"
//                                         console.log(msg)
//                                     })
//                                 } else if (dmp.affectedRows != 0) {
//                                     console.log("Updating")
//                                     msg = "updated"
//                                     console.log(msg)
//                                 }
//                             })
//                         }
//                     })
//                 }
//                 res.send({ status: msg });
//             } else if (dr.length == 0) {

//                 if (data.length > 0) {

//                     for (let i = 0; i < data.length; i++) {
//                         console.log(data[i]["MenuName"])
//                         setupQuery(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (menuid) => {
//                             if (menuid.length > 0) {
//                                 setupQuery(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid["Id"]}', '1')`, async (ins) => {
//                                     msg = "success"
//                                     console.log(msg)
//                                     res.send({ status: msg })
//                                 })
//                             }
//                         })
//                     }

//                 }
//                 //res.send({ status: msg })
//             }

//         });

//     } catch (error) {
//         next(error)
//     }
// });

userRouter.post(`/savemenurolemapping`, async (req, res, next) => {
    console.log("Save Menu Role Mapping API Call")
    
    let sucs = false;
    let updt = false;
    let nomenu = false;
    let inRole = '';
    try {
       // console.log(req.body.newselectedmenu);
        let data = req.body.newselectedmenu;
        let msg = '';
        if (data.length > 0) {
            await setupQueryMod(`Select * from magod_setup.menumapping where Role = '${data[0]["role"]}'`, async (err,dr) => {
                if(err) logger.error(err);
             //   console.log(dr)
                inRole = dr["Role"];
                console.log(inRole);
            });
        }
       
        if (inRole != null) {
            await setupQueryMod(`UPDATE magod_setup.menumapping SET ActiveMenu = 0 WHERE Role = '${data[0]["role"]}'`, async (err,mapdata) => {
                if(err) logger.error(err);
            })

            for (let i = 0; i < data.length; i++) {

                await setupQueryMod(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (err,menuid) => {
                    if(err) logger.error(err);
                    if (menuid.length > 0) {
                        setupQueryMod(`UPDATE magod_setup.menumapping SET ActiveMenu = 1 WHERE Role = '${data[i]["role"]}' And MenuId = '${menuid[0]["Id"]}'`, async (err,dmp) => {
                            if(err) logger.error(err);
                            if (dmp.affectedRows > 0) {
                                msg = "updated";
                            } else if (dmp.affectedRows == 0) {
                                await setupQueryMod(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (err,menuid) => {
                                    if(err) logger.error(err);
                                    if (menuid.length > 0) {
                                        await setupQueryMod(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid[0]["Id"]}', '1')`, async (err,ins) => {
                                            if(err) logger.error(err);
                                            msg = "success";
                                            console.log(msg)
                                        })
                                    }
                                })

                            }
                        })
                    }
                })
               
            }
            console.log(" update & insert "+msg)
            res.send({ status: msg })
        } else if (dr.length == 0) {
            console.log("dr length = 0 ")
            for (let i = 0; i < data.length; i++) {
                await setupQueryMod(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (err,menuid) => {
                    if(err) logger.error(err);
                    if (menuid.length > 0) {
                        await setupQueryMod(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid[0]["Id"]}', '1')`, async (err,ins) => {
                            if(err) logger.error(err);
                            msg = 'success';
                        })
                    }
                })
            }
            console.log("insert "+msg)
            res.send({ status: msg })
        }

    } catch (error) {
        console.log(error) 
        next(error)
    }
});

//                                 if (dmp.affectedRows == 0) {
//                                     console.log("After update to active "+menuid.Id)
//                                     console.log("Inserting " + data[i]["role"], menuid[0]["Id"])
//                                     setupQuery(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid[0]["Id"]}', '1')`, async (ins) => {
//                                         msg = "success"
//                                         console.log(" dr.length > 0 " + msg)

//                                     })
//                                 } else if (dmp.affectedRows != 0) {
//                                     console.log("Updating")
//                                     msg = "updated"
//                                     console.log("dmp.affectedrows <> 0 " + msg)

//                                 }

//                             })
//                           //  res.send({ status: msg });
//                         }
//                     })
//                 }
//                // res.send({ status: msg });

//             } else if (dr.length == 0) {

//                 if (data.length > 0) {
//                     console.log("data length "+data.length)

//                     for (let i = 0; i < data.length; i++) {
//                         setupQuery(`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`, async (menuid) => {
//                             console.log(" Check Menuid - 1" + menuid.Id)
//                             if (menuid.length > 0) {
//                                 setupQuery(`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid.Id}', '1')`, async (ins) => {
//                                     msg = "success"
//                                     console.log(" dr,length == 0 and data.length > 0 and menuid.length > 0 " + msg)
//                                     res.send({ status: msg });
//                                 })
//                             }
//                         })
//                     }
//                     console.log(" dr length = 0 : "+ msg)
//                  //   res.send({ status: msg })

//                 }
//                 //  res.send({ status: msg })
//             }

//         });
//         res.send({ status: msg })
//     } catch (error) {
//         next(error)
//     }
// });


userRouter.post(`/getusers`, async (req, res, next) => {
    console.log('get users')
    try {
        setupQueryMod(`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser = 1`, async (err,d) => {
            if(err) logger.error(err);
            console.log(d);
            res.send(d)
        });
    } catch (error) {
        next(error)
    }
});

userRouter.post(`/delusers`, async (req,res,next) => {
    console.log("Delete User")
    try {
        let usrname = req.body.uname;
        setupQueryMod(`Update magod_setup.magod_userlist set ActiveUser = 0 where UserName = '${usrname}'`,(err,data) => {
            if(err) logger.error(err);
          //  if(data.length>0){
              //  res.send({status:"Deleted"})
                if (data.affectedRows > 0)
                setupQueryMod(`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
                left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser= 1`, async (err,d) => {
                    if(err) logger.error(err);
                     msg = "success";
                     res.send({ d, status: msg })
                });
           // }
        })

    }catch(error)
    {
        next(error);
    }
})

userRouter.post(`/saveusers`, async (req, res, next) => {
    console.log("saveusers");
    try {
        let data = req.body.usrdata;
        console.log(data);
        let passwrd = CryptoJS.SHA512(data.Password);
        let msg = '';
        setupQueryMod(`SELECT Name,UserName,PassWord FROM magod_setup.magod_userlist WHERE UserName = '${data.UserName}'`, async (err,d) => {
            if(err) logger.error(err);
            if (d.length == 0) {

                let sql = `INSERT INTO magod_setup.magod_userlist (Name,UserName,ActiveUser,ResetPassword,UserPassWord,CreatedTime,Role,Password,UnitID) 
                    VALUES ('${data.Name}','${data.UserName}','1','0','',Current_TimeStamp,'${data.Role}','${passwrd}','${data.Unit}')`;
                setupQueryMod(sql, async (err,d) => {
                    if(err) logger.error(err);
                    if (d.affectedRows > 0)
                        setupQueryMod(`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
                        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser= 1`, async (err,d) => {
                            if(err) logger.error(err);
                            msg = "success";
                            res.send({ d, status: msg })
                        });
                });
            } else {
                console.log("Update")
                console.log(data.Name)
                // let rspwd = data.ResetPassword == 1 ? 1 : 0;
                let sql = `Update magod_setup.magod_userlist set Name='${data.Name}',ActiveUser='1',ResetPassword='0'
                ,UserPassWord='',Role='${data.Role}',Password='${passwrd}',UnitID='${data.Unit}' where UserName='${data.UserName}'`;
                setupQueryMod(sql, async (err,d) => {
                    if(err) logger.error(err);
                    if (d.affectedRows > 0)
                        setupQueryMod(`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
                                    left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser= 1`, async (err,d) => {
                                        if(err) logger.error(err);
                            msg = "updated";
                            res.send({ d, status: msg })
                        });
                });
            }
            //  res.send({ d, status: msg });
        });
    } catch (error) {
        next(error)
    }
});


userRouter.get('/user', async (req, res, next) => {
    try {
        const id = req.body.id;
        if (!id) res.send(createError.BadRequest())
        res.send({ id })
    }
    catch (error) {
        next(error)
    }
});

userRouter.post(`/getusermodules`, async (req, res, next) => {
    try {
        const strmodule = req.body.Module;
        setupQueryMod(`Select * from magod_setup.modules`, async (err,updata) => {
            if(err) logger.error(err);
            res.send(updata)
        })
    } catch (error) {
        next(error)
    }
});

userRouter.post(`/getuserroles`, async (req, res, next) => {
    // console.log("getuserroles")
    try {
        setupQueryMod(`Select * FROM magod_setup.userroles`, async (err,data) => {
            if(err) logger.error(err);
            // console.log(data);
            res.send(data)
        })

    } catch (error) {
        next(error)
    }
});


userRouter.post(`/adduserroles`, async (req, res, next) => {
    try {
        console.log("adduserroles")
        const strrole = req.body.usrroledata.Role;
        console.log(strrole)
        setupQueryMod(`Select * from magod_setup.userroles where Role ='${strrole}'`, async (err,datarole) => {
            if(err) logger.error(err);
            console.log(datarole.length)
            if (datarole.length == 0) {
                setupQueryMod(`INSERT INTO magod_setup.userroles (Role) VALUES ('${strrole}')`, async (err,data) => {
                    if(err) logger.error(err);
                    res.send({ status: "success" })
                    // if (data.affectedRows > 0) {
                    //     setupQuery(`Select * from magod_setup.userroles`, async (data1) => {
                    //         res.send(data1)
                    //     })
                    // }
                })
            }
            else {
                res.send({ status: "updated" })
                // setupQuery(`UPDATE magod_setup.userroles set Role ='${strrole}' where Role ='${datarole["Role"]}' `, async (data) => {
                //     console.log("Updated")
                //     if (data.affectedRows > 0) {
                // setupQuery(`Select * from magod_setup.userroles`, async (data) => {
                //     res.send(data)
                // })
           }
            //     })
            // }
        })
    } catch (error) {
        next(error)
    }
});

// userRouter.post(`/upduserroles`, async (req, res, next) => {
//     try {
//         let oldrole = req.body.oldrolename;
//         let newrole = req.body.nrerolename;

//         setupQuery(`Update magod_setup.userroles set Role = '${newrole}' where Role='${oldrole}'`,(data) => {
//             res.send({ status: "updated" })
//         })
//     }catch(error)
//     {
//         next(error);
//     }
// });

userRouter.post(`/deluserroles`, async (req, res, next) => {
    console.log("Delete user Role");
    try {
        let oldrole = req.body.rolenm;
        console.log("Role : " + req.body.rolenm);

        // setupQuery(`Select * from magod_setup.menumapping where Role='${oldrole}'`,(mmdata) => {
        //     if(mmdata.length > 0){
        //         res.send({status : "RoleMenu"});
        //     }else {
                setupQueryMod(`Update magod_setup.menumapping set ActiveMenu = 0 where Role = '${oldrole}'`, (err,mmdata) => {
                    if(err) logger.error(err);
                })
                setupQueryMod(`Delete from magod_setup.userroles where Role='${oldrole}'`,(err,data) => {
                    if(err) logger.error(err);
                    console.log("Role Deleted");
                    res.send({ status: "Deleted" })
                });
        //     }
        // })

      
    }catch(error)
    {
        next(error);
    }
});

userRouter.post(`/addusermodules`, async (req, res, next) => {
    try {

        const strrole = req.body.Module;
        if (strrole) {
            setupQueryMod(`Select * from magod_setup.modules where ModuleName ='${strrole}'`, async (err,data) => {
                if(err) logger.error(err);
                if (data.length > 0) {
                    setupQueryMod(`Update magod_setup.modules set ModuleName ='${strrole}' where ModuleName ='${data["ModuleName"]}' )`, async (err,updata) => {
                        if(err) logger.error(err);
                        res.send(updata)
                    })

                } else {
                    setupQueryMod(`INSERT INTO magod_setup.modules (ModuleName,ActiveModule) VALUES ('${strrole}','1')`, async (err,data) => {
                        if(err) logger.error(err)
                        if (data.affectedRows > 0) {
                            setupQuery(`Select * from magod_setup.modules`, async (data) => {
                                res.send(data)
                            })
                        }

                    })
                }
            })
        }
    } catch (error) {
        next(error)
    }
});


userRouter.post(`/getrolemenus`, async (req, res, next) => {
    const strrole = req.body.Role;
    try {
        setupQueryMod(`Select mm.role, m.MenuName FROM magod_setup.menumapping mm
        left outer join magod_setup.menus m on m.Id = mm.MenuId
        where mm.Role = '${strrole}' and mm.ActiveMenu = '1'`, async (err,data) => {
            if(err) logger.error(err);
    //        console.log(data);
            res.send(data)
        })

    } catch (error) {
        next(error)
    }
});


userRouter.post(`/getusermenus`, async (req, res, next) => {
    try {
        setupQueryMod(`Select m.MenuName, m.MenuUrl FROM magod_setup.menus m
         where ActiveMenu = '1'`, async (err,data) => {
            if(err) logger.error(err);
     //       console.log(data);
            res.send(data)
        })

    } catch (error) {
        next(error)
    }
});

userRouter.post(`/delusermenus`, async (req, res, next) => {
    try{
        let mnuname = req.body.mname;
        setupQueryMod(`Update magod_setup.menus set ActiveMenu = '0' where MenuName = '${mnuname}'`, (err,data) => {
            if(err) logger.error(err);
            res.send({status : "Deleted"});
        })
    }catch(error)
    {
        next(error);
    }
});

userRouter.post(`/addusermenus`, async (req, res, next) => {
    console.log("addusermenus")
   // console.log(req.body.menu)
    let msg = '';
    try {
        const strmenu = req.body.menu.MenuName;
        const strurl = req.body.menu.MenuUrl;
     
        if ((strmenu != null) && (strurl != null)) {
            setupQueryMod(`Select * from magod_setup.menus where MenuName ='${strmenu}'`, async (err,data) => {
                if(err) logger.error(err);
            // setupQuery(`Select * from magod_setup.menus where MenuName ='${strmenu}' and MenuUrl = '${strurl}'`, async (data) => {
                if (data.length > 0) {

                    setupQueryMod(`Update magod_setup.menus set MenuUrl = '${data[0]["MenuUrl"]}' where MenuName ='${data[0]["MenuName"]}'`, async (err,updata) => {
                        if(err) logger.error(err);
                        res.send({status: "Updated"});
                      //  msg= "updated";
                    })

                } else {
                    setupQuery(`INSERT INTO magod_setup.menus (MenuName, MenuUrl,ActiveMenu) VALUES ('${strmenu}','${strurl}','1')`, async (data) => {
                        console.log("Inserting ")
                        //  res.send(data)
                        if (data.affectedRows > 0) {
                            setupQuery(`Select m.MenuName, m.MenuUrl FROM magod_setup.menus m where ActiveMenu = '1'`, async (data) => {
                                res.send({status: "success"})
                               
                            })
                        }
                    })
                  
                }
             
            })
           
        }
    } catch (error) {
        next(error)
    }
});


module.exports = userRouter;