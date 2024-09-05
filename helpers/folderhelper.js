const fs = require('fs');
const path = require('path');

let folderBase = "C:/Magod/Jigani"

let checkdrawings = async (qtnNo, callback) => {
    qtnNo = qtnNo.replaceAll('/', '_');
    // await fs.exists(folderBase + `/QtnDwg/`+qtnNo, async (exists) => {
    //     callback(exists);
    // })
    let month = qtnNo.split("_")[1]
    let monthName = ["January", "Febraury", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"][parseInt(month) - 1]
    let startPath = folderBase + `/QtnDwg/` + monthName + "/" + qtnNo;
    let filter = '.dxf'
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        callback(false)
    }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        if (filename.endsWith(filter)) {
            callback(true)
        };
    };
}

let createFolder = async (SrlType, qno, month, callback) => {
    try {
        switch (SrlType) {
            case "Quotation": {
                await fs.exists(folderBase + `/QtnDwg`, async (exists) => {
                    if (!exists) {
                        await fs.mkdirSync(folderBase + `/QtnDwg`)
                    }
                    await fs.exists(folderBase + `/QtnDwg/${month}`, async (ex) => {
                        if (!ex) {
                            await fs.mkdirSync(folderBase + `/QtnDwg/${month}`)
                        }
                        await fs.exists(folderBase + `/QtnDwg/${month}/${qno}`, async (exist) => {
                            if (!exist) {
                                await fs.mkdirSync(folderBase + `/QtnDwg/${month}/${qno}`)
                            }
                        })
                    })
                })
                break;
            }
            case "Order": {
                await fs.exists(folderBase + `/Wo`, async (exists) => {
                    if (!exists) {
                        await fs.mkdirSync(folderBase + `/Wo`)
                    }
                    await fs.exists(folderBase + `/Wo`, async (ex) => {
                        if (!ex) {
                            await fs.mkdirSync(folderBase + `/Wo/${qno}`)
                        }
                        //   await fs.mkdirSync(folderBase + `/Wo/${qno}`)
                    })
                })
                break;
            }
            case "Customer": {
                await fs.exists(folderBase + `/CustDwg`, async (exists) => {
                    if (!exists) {
                        await fs.mkdirSync(folderBase + `/CustDwg`)
                    }
                    await fs.exists(folderBase + `/CustDwg/${qno}`, async (ex) => {
                        if (!ex) {
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/Accts`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/BOM`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/DWG`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/DXF`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/Material`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/Parts`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/Qtn`)
                            await fs.mkdirSync(folderBase + `/CustDwg/${qno}/WOL`)
                            callback(null, "success");
                        } else {
                            callback("Already Exists", null);
                        }
                    })
                })
                break;
            }
            default:
                break;
        }
    } catch (error) {
        callback(error, null);
    }
}

const copyfiles = async (source, destination, callback) => {
    try {
        var files = fs.readdirSync(source);
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            if (filename.endsWith(".dxf")) {
                fs.copyFile(filename, destination);
            };
        };
        callback(null, true);
    } catch (error) {
        callback(error, null);
    }
}

const copyallfiles = async (DocType, source, destination) => {
    try {
        switch (DocType) {
            case "Customer": {
                let subfolders = ["Accts", "BOM", "DWG", "DXF", "Material", "Parts", "Qtn", "WOL"]
                let fromsource = folderBase + `/CustDwg/${source}`
                if (!fromsource.exists) {
                    break;
                }
                let todestination = folderBase + `/CustDwg/${destination}`
                for (let p = 0; p < subfolders.length; p++) {
                    console.log(fromsource + "/" + subfolders[p])
                    await fs.exists(fromsource + "/" + subfolders[p], async (exists) => {
                        if (exists) {
                            var srcfldr = fromsource + "/" + subfolders[p] + "/";
                            var dstfldr = todestination + "/" + subfolders[p] + "/";
                            var files = fs.readdirSync(srcfldr);
                            for (var i = 0; i < files.length; i++) {
                                var filename = path.join(srcfldr, files[i]);
                                if (filename) {
                                    fs.copyFile(filename, dstfldr);
                                }
                            };

                        }
                    })
                }
                fs.rmdir(fromsource, { recursive: true }, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
                break;
            }
            // case "Quotation": {
            // }
            // case "Order": {
            // }
            default:
                break;
        }
        // callback(null, true);
    } catch (error) {
        console.log(error);
        //  callback(error, null);
    }
}

// const removefiles = async (source, callback) => {
//     try {
//         var files = fs.readdirSync(source);
//         for (var i = 0; i < files.length; i++) {
//             var filename = path.join(startPath, files[i]);
//             if (filename.endsWith(".dxf")) {
//                 fs.rename()    .rmdir(filename);

//             };

const writetofile = async (qtnNo, filename, content, callback) => {
    fs.appendFile(folderBase + `/QtnDwg/${month}/${qtnNo}/${filename}`, content).then(res => {
        callback(null, res);
    }).catch(err => {
        callback(err, null);
    })
}
module.exports = { createFolder, checkdrawings, copyfiles, copyallfiles, writetofile };