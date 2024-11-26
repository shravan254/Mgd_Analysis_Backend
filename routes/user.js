/** @format */

const userRouter = require("express").Router();
var createError = require("http-errors");
const CryptoJS = require("crypto-js");
var bodyParser = require("body-parser");

const { setupQuery, setupQueryMod } = require("../helpers/dbconn");
const { signAccessToken } = require("../helpers/jwt_helper");
const { logger } = require("../helpers/logger");

const { exec } = require("child_process");
const fs = require("fs");
// const subprocess = require("subprocess");
var jsonParser = bodyParser.json();

userRouter.post(`/login`, async (req, res, next) => {
	try {
		console.log("login");
		const username = req.body.username;
		const passwd = req.body.password;

		let passwrd = CryptoJS.SHA512(req.body.password);
		console.log(passwrd);
		if (!username || !passwrd) res.send(createError.BadRequest());

		setupQueryMod(
			`Select usr.Name, usr.UserName,usr.Password,usr.Role, unt.UnitName,usr.ActiveUser,unt.State_Id,unt.GST_No from magod_setup.magod_userlist usr
        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID WHERE usr.UserName = '${username}' and usr.ActiveUser = '1'`,
			async (err, d) => {
				if (err) logger.error(err);
				logger.error(
					`Login failed for username '${username}': Invalid username or password.`
				);
				// res.status(401).send({ error: "Invalid username or password" });
				let data = d;
				console.log("data", data);
				if (data.length > 0) {
					if (data[0]["Password"] == passwrd) {
						delete data[0]["Password"];

						setupQueryMod(
							`Select m.MenuUrl,ModuleId  from magod_setup.menumapping mm
                left outer join magod_setup.menus m on m.Id = mm.MenuId
                where mm.Role = '${data[0]["Role"]}' and mm.ActiveMenu = '1'`,
							async (err, mdata) => {
								if (err) logger.error(err);
								let menuarray = [];
								mdata.forEach((element) => {
									menuarray.push(element["MenuUrl"]);
								});
								const moduleIds = [
									...new Set(
										mdata
											.map((menu) => menu.ModuleId)
											.filter((id) => id !== null)
									),
								];
								let accessToken = await signAccessToken(data[0]["UserName"]);

								res.send({
									accessToken: accessToken,
									data: { ...data, access: menuarray },
									moduleIds: moduleIds,
									// access: menuarray,
								});
								logger.info(`Login Success - ${data[0]["UserName"]}`);
							}
						);
					} else {
						res.send(createError.Unauthorized("Invalid Username/Password"));
						logger.error(`Login Failed - ${username} IP : ${req.ip}`);
					}
				} else {
					res.send(createError.Unauthorized("Invalid Username/Password"));
					logger.error(`Login Failed - ${username} IP : ${req.ip}`);
				}
			}
		);
	} catch (error) {
		next(error);
		logger.error(`Error - ${error}`);
	}
});

userRouter.post(`/savemenurolemapping`, async (req, res, next) => {
	console.log("Save Menu Role Mapping API Call");

	let sucs = false;
	let updt = false;
	let nomenu = false;
	let inRole = "";
	try {
		let data = req.body.newselectedmenu;
		let msg = "";
		if (data.length > 0) {
			await setupQueryMod(
				`Select * from magod_setup.menumapping where Role = '${data[0]["role"]}'`,
				async (err, dr) => {
					if (err) logger.error(err);
					inRole = dr["Role"];
					console.log(inRole);
				}
			);
		}

		if (inRole != null) {
			await setupQueryMod(
				`UPDATE magod_setup.menumapping SET ActiveMenu = 0 WHERE Role = '${data[0]["role"]}'`,
				async (err, mapdata) => {
					if (err) logger.error(err);
				}
			);

			for (let i = 0; i < data.length; i++) {
				await setupQueryMod(
					`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`,
					async (err, menuid) => {
						if (err) logger.error(err);
						if (menuid.length > 0) {
							setupQueryMod(
								`UPDATE magod_setup.menumapping SET ActiveMenu = 1 WHERE Role = '${data[i]["role"]}' And MenuId = '${menuid[0]["Id"]}'`,
								async (err, dmp) => {
									if (err) logger.error(err);
									if (dmp.affectedRows > 0) {
										msg = "updated";
									} else if (dmp.affectedRows == 0) {
										await setupQueryMod(
											`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`,
											async (err, menuid) => {
												if (err) logger.error(err);
												if (menuid.length > 0) {
													await setupQueryMod(
														`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid[0]["Id"]}', '1')`,
														async (err, ins) => {
															if (err) logger.error(err);
															msg = "success";
															console.log(msg);
														}
													);
												}
											}
										);
									}
								}
							);
						}
					}
				);
			}
			console.log(" update & insert " + msg);
			res.send({ status: msg });
		} else if (dr.length == 0) {
			console.log("dr length = 0 ");
			for (let i = 0; i < data.length; i++) {
				await setupQueryMod(
					`Select Id from magod_setup.menus where MenuName = '${data[i]["MenuName"]}'`,
					async (err, menuid) => {
						if (err) logger.error(err);
						if (menuid.length > 0) {
							await setupQueryMod(
								`INSERT INTO magod_setup.menumapping (Role, MenuId, ActiveMenu) VALUES ('${data[i]["role"]}', '${menuid[0]["Id"]}', '1')`,
								async (err, ins) => {
									if (err) logger.error(err);
									msg = "success";
								}
							);
						}
					}
				);
			}
			console.log("insert " + msg);
			res.send({ status: msg });
		}
	} catch (error) {
		console.log(error);
		next(error);
	}
});

userRouter.post(`/getusers`, async (req, res, next) => {
	console.log("get users");
	try {
		setupQueryMod(
			`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser = 1`,
			async (err, d) => {
				if (err) logger.error(err);
				// console.log(d);
				res.send(d);
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/delusers`, async (req, res, next) => {
	console.log("Delete User");
	try {
		let usrname = req.body.uname;
		setupQueryMod(
			`Update magod_setup.magod_userlist set ActiveUser = 0 where UserName = '${usrname}'`,
			(err, data) => {
				if (err) logger.error(err);
				//  if(data.length>0){
				//  res.send({status:"Deleted"})
				if (data.affectedRows > 0)
					setupQueryMod(
						`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
                left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser= 1`,
						async (err, d) => {
							if (err) logger.error(err);
							msg = "success";
							res.send({ d, status: msg });
						}
					);
				// }
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/saveusers`, async (req, res, next) => {
	try {
		let data = req.body.usrdata;
		console.log(data);
		let passwrd = CryptoJS.SHA512(data.Password);
		let msg = "";
		setupQueryMod(
			`SELECT Name,UserName,PassWord FROM magod_setup.magod_userlist WHERE UserName = '${data.UserName}'`,
			async (err, d) => {
				if (err) logger.error(err);
				if (d.length == 0) {
					let sql = `INSERT INTO magod_setup.magod_userlist (Name,UserName,ActiveUser,ResetPassword,UserPassWord,CreatedTime,Role,Password,UnitID) 
                    VALUES ('${data.Name}','${data.UserName}','1','0','',Current_TimeStamp,'${data.Role}','${passwrd}','${data.Unit}')`;
					setupQueryMod(sql, async (err, d) => {
						if (err) logger.error(err);
						if (d.affectedRows > 0)
							setupQueryMod(
								`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
                        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser= 1`,
								async (err, d) => {
									if (err) logger.error(err);
									msg = "success";
									res.send({ d, status: msg });
								}
							);
					});
				} else {
					console.log("Update");
					console.log(data.Name);
					// let rspwd = data.ResetPassword == 1 ? 1 : 0;
					let sql = `Update magod_setup.magod_userlist set Name='${data.Name}',ActiveUser='1',ResetPassword='0'
                ,UserPassWord='',Role='${data.Role}',Password='${passwrd}',UnitID='${data.Unit}' where UserName='${data.UserName}'`;
					setupQueryMod(sql, async (err, d) => {
						if (err) logger.error(err);
						if (d.affectedRows > 0)
							setupQueryMod(
								`Select usr.Name, usr.UserName,usr.Role, unt.UnitName from magod_setup.magod_userlist usr
                                    left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID where usr.ActiveUser= 1`,
								async (err, d) => {
									if (err) logger.error(err);
									msg = "updated";
									res.send({ d, status: msg });
								}
							);
					});
				}
				//  res.send({ d, status: msg });
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.get("/user", async (req, res, next) => {
	try {
		const id = req.body.id;
		if (!id) res.send(createError.BadRequest());
		res.send({ id });
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/getusermodules`, async (req, res, next) => {
	try {
		const strmodule = req.body.Module;
		setupQueryMod(`Select * from magod_setup.modules`, async (err, updata) => {
			if (err) logger.error(err);
			res.send(updata);
		});
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/getuserroles`, async (req, res, next) => {
	try {
		setupQueryMod(`Select * FROM magod_setup.userroles`, async (err, data) => {
			if (err) logger.error(err);
			// console.log(data);
			res.send(data);
		});
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/adduserroles`, async (req, res, next) => {
	try {
		console.log("adduserroles");
		const strrole = req.body.usrroledata.Role;
		console.log(strrole);
		setupQueryMod(
			`Select * from magod_setup.userroles where Role ='${strrole}'`,
			async (err, datarole) => {
				if (err) logger.error(err);
				console.log(datarole.length);
				if (datarole.length == 0) {
					setupQueryMod(
						`INSERT INTO magod_setup.userroles (Role) VALUES ('${strrole}')`,
						async (err, data) => {
							if (err) logger.error(err);
							res.send({ status: "success" });
							// if (data.affectedRows > 0) {
							//     setupQuery(`Select * from magod_setup.userroles`, async (data1) => {
							//         res.send(data1)
							//     })
							// }
						}
					);
				} else {
					res.send({ status: "updated" });
					// setupQuery(`UPDATE magod_setup.userroles set Role ='${strrole}' where Role ='${datarole["Role"]}' `, async (data) => {
					//     console.log("Updated")
					//     if (data.affectedRows > 0) {
					// setupQuery(`Select * from magod_setup.userroles`, async (data) => {
					//     res.send(data)
					// })
				}
				//     })
				// }
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/deluserroles`, async (req, res, next) => {
	console.log("Delete user Role");
	try {
		let oldrole = req.body.rolenm;
		console.log("Role : " + req.body.rolenm);

		// setupQuery(`Select * from magod_setup.menumapping where Role='${oldrole}'`,(mmdata) => {
		//     if(mmdata.length > 0){
		//         res.send({status : "RoleMenu"});
		//     }else {
		setupQueryMod(
			`Update magod_setup.menumapping set ActiveMenu = 0 where Role = '${oldrole}'`,
			(err, mmdata) => {
				if (err) logger.error(err);
			}
		);
		setupQueryMod(
			`Delete from magod_setup.userroles where Role='${oldrole}'`,
			(err, data) => {
				if (err) logger.error(err);
				console.log("Role Deleted");
				res.send({ status: "Deleted" });
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/addusermodules`, async (req, res, next) => {
	try {
		const strrole = req.body.Module;
		if (strrole) {
			setupQueryMod(
				`Select * from magod_setup.modules where ModuleName ='${strrole}'`,
				async (err, data) => {
					if (err) logger.error(err);
					if (data.length > 0) {
						setupQueryMod(
							`Update magod_setup.modules set ModuleName ='${strrole}' where ModuleName ='${data["ModuleName"]}' )`,
							async (err, updata) => {
								if (err) logger.error(err);
								res.send(updata);
							}
						);
					} else {
						setupQueryMod(
							`INSERT INTO magod_setup.modules (ModuleName,ActiveModule) VALUES ('${strrole}','1')`,
							async (err, data) => {
								if (err) logger.error(err);
								if (data.affectedRows > 0) {
									setupQuery(
										`Select * from magod_setup.modules`,
										async (data) => {
											res.send(data);
										}
									);
								}
							}
						);
					}
				}
			);
		}
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/getrolemenus`, async (req, res, next) => {
	const strrole = req.body.Role;
	try {
		setupQueryMod(
			`Select mm.role, m.MenuName FROM magod_setup.menumapping mm
        left outer join magod_setup.menus m on m.Id = mm.MenuId
        where mm.Role = '${strrole}' and mm.ActiveMenu = '1'`,
			async (err, data) => {
				if (err) logger.error(err);

				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/getusermenus`, async (req, res, next) => {
	try {
		setupQueryMod(
			`Select m.MenuName, m.MenuUrl FROM magod_setup.menus m
         where ActiveMenu = '1'`,
			async (err, data) => {
				if (err) logger.error(err);

				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/delusermenus`, async (req, res, next) => {
	try {
		let mnuname = req.body.mname;
		setupQueryMod(
			`Update magod_setup.menus set ActiveMenu = '0' where MenuName = '${mnuname}'`,
			(err, data) => {
				if (err) logger.error(err);
				res.send({ status: "Deleted" });
			}
		);
	} catch (error) {
		next(error);
	}
});

userRouter.post(`/addusermenus`, async (req, res, next) => {
	console.log("addusermenus");

	let msg = "";
	try {
		const strmenu = req.body.menu.MenuName;
		const strurl = req.body.menu.MenuUrl;

		if (strmenu != null && strurl != null) {
			setupQueryMod(
				`Select * from magod_setup.menus where MenuName ='${strmenu}'`,
				async (err, data) => {
					if (err) logger.error(err);
					// setupQuery(`Select * from magod_setup.menus where MenuName ='${strmenu}' and MenuUrl = '${strurl}'`, async (data) => {
					if (data.length > 0) {
						setupQueryMod(
							`Update magod_setup.menus set MenuUrl = '${data[0]["MenuUrl"]}' where MenuName ='${data[0]["MenuName"]}'`,
							async (err, updata) => {
								if (err) logger.error(err);
								res.send({ status: "Updated" });
								//  msg= "updated";
							}
						);
					} else {
						setupQuery(
							`INSERT INTO magod_setup.menus (MenuName, MenuUrl,ActiveMenu) VALUES ('${strmenu}','${strurl}','1')`,
							async (data) => {
								console.log("Inserting ");
								//  res.send(data)
								if (data.affectedRows > 0) {
									setupQuery(
										`Select m.MenuName, m.MenuUrl FROM magod_setup.menus m where ActiveMenu = '1'`,
										async (data) => {
											res.send({ status: "success" });
										}
									);
								}
							}
						);
					}
				}
			);
		}
	} catch (error) {
		next(error);
	}
});

// New endpoint to fetch menu URLs (no login)
userRouter.post("/fetchMenuUrls", async (req, res, next) => {
	try {
		const { role, username } = req.body;
		console.log("req.body", req.body);
		if (!role || !username) return res.send(createError.BadRequest());

		setupQueryMod(
			`Select usr.Name, usr.UserName,usr.Password,usr.Role, unt.UnitName,usr.ActiveUser from magod_setup.magod_userlist usr
        left join magod_setup.magodlaser_units unt on unt.UnitID = usr.UnitID WHERE usr.UserName = '${username}' and usr.ActiveUser = '1'`,
			async (err, d) => {
				if (err) logger.error(err);
				let data = d;
				if (data.length > 0) {
					setupQueryMod(
						`Select m.MenuUrl,ModuleId  from magod_setup.menumapping mm
                left outer join magod_setup.menus m on m.Id = mm.MenuId
                where mm.Role = '${data[0]["Role"]}' and mm.ActiveMenu = '1'`,
						async (err, mdata) => {
							if (err) logger.error(err);
							let menuarray = [];
							mdata.forEach((element) => {
								menuarray.push(element["MenuUrl"]);
							});
							const moduleIds = [
								...new Set(
									mdata.map((menu) => menu.ModuleId).filter((id) => id !== null)
								),
							];
							res.send({
								data: { ...data, access: menuarray },
								moduleIds: moduleIds,
							});
						}
					);
				} else {
					res.send(createError.Unauthorized("Invalid Username"));
					logger.error(` Failed - ${username} IP : ${req.ip}`);
				}
			}
		);
	} catch (error) {
		next(error);
		logger.error(`Error - ${error}`);
	}
});

userRouter.post("/openexplorer", (req, res) => {
	const testPath = req.body.path || "E:\\After-Restoration"; // Default path
	exec(
		`powershell.exe Start-Process explorer.exe -ArgumentList "${testPath}"`,
		(err, stdout, stderr) => {
			if (err) {
				console.error(`Error opening path: ${err.message}`);
				console.error(`stderr: ${stderr}`);
				return res.status(500).send("Failed to open the path");
			}
			console.log(`stdout: ${stdout}`);
			res.send(`Opened path: ${testPath}`);
		}
	);
});

// Test execution with a simple command
// exec("echo Test", (err, stdout, stderr) => {
//   if (err) {
//     console.error(`Error: ${err.message}`);
//     return;
//   }
//   console.log(`Output: ${stdout}`);
// });

module.exports = userRouter;
