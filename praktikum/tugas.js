const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require("mysql")
const { EROFS } = require("constants")
const { response } = require("express")
const app = express()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { error } = require("console")
const { syncBuiltinESMExports } = require("module")
const { format } = require("url")
const DATE_FORMATER = require('dateformat');

app.use(express.static(__dirname));
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        //set file storage
        cb(null, './image');
    },
    filename: (req, file, cb) => {
        //get file name
        cb(null, "image-" + Date.now() + path.extname(file.originalname))
    }
})
let upload = multer({ storage: storage })

const db = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "olshop"
    })
    // BARANG
app.post("/barang", upload.single("image"), (req, res) => {
    let data = {
        nama_barang: req.body.nama_barang,
        harga: req.body.harga,
        stok: req.body.stok,
        deskripsi: req.body.deskripsi,
        image: req.file.filename
    }

    if (!req.file) {

        res.json({
            message: "Tidak ada file yang diupload"
        })
    } else {
        let sql = "insert into barang set ?"

        db.query(sql, data, (error, result) => {
            if (error) throw error

            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})
app.put("/barang", upload.single("image"), (req, res) => {
    let data = null,
        sql = null
    let param = { kode_barang: req.body.kode_barang }

    if (!req.file) {
        data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi
        }
        sql = "update barang set ? where ?"

        db.query(sql, [data, param], (error, result) => {
            if (error) {
                res.json({
                    message: error.message
                })
            } else {
                res.json({
                    message: result.affectedRows + " data berhasil diubah"
                })
            }
        })
    } else {
        let data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi,
            image: req.file.filename
        }

        sql = "select * from barang where ?"

        db.query(sql, param, (error, result) => {
            if (error) throw error
            let fileName = result[0].image

            let dir = path.join(__dirname, "image", fileName)
            fs.unlink(dir, (error) => {})
        })
        sql = "update barang set ? where ?"

        db.query(sql, [data, param], (error, result) => {
            if (error) {
                res.json({
                    message: error.message
                })
            } else {
                res.json({
                    message: result.affectedRows + " data berhasil diubah"
                })
            }
        })
    }
})
app.delete("/barang/:kode_barang", (req, res) => {
    let param = {
        kode_barang: req.params.kode_barang
    }

    let sql = "select * from barang where ?"

    db.query(sql, param, (error, result) => {
        if (error) throw error

        let fileName = result[0].image

        let dir = path.join(__dirname, "image", fileName)
        fs.unlink(dir, (error) => {})
    })

    sql = "delete from barang where ?"

    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }
    })
})
app.get("/barang", (req, res) => {
    let sql = "select * from barang"

    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})

// ADMIN
app.get("/admin", (req, res) => {
    let sql = "select * from admin"

    db.query(sql, (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            res.json({
                count: result.length,
                data: result
            })
        }
    })
})
app.post("/admin", (req, res) => {
    let data = {
        id_admin: req.body.id_admin,
        nama_admin: req.body.nama_admin,
        username: req.body.username,
        password: req.body.password
    }

    let sql = "insert into admin set ?"

    db.query(sql, data, (error, result) => {
        if (error) throw error

        res.json({
            message: result.affectedRows + " data berhasil ditambahkan"
        })
    })
})
app.put("/admin", (req, res) => {
    let data = [{
        nama_admin: req.body.nama_admin,
        username: req.body.username,
        password: req.body.password
    }, {
        id_admin: req.body.id_admin
    }]

    let sql = "update admin set ? where ?"

    db.query(sql, data, (error, result) => {
        if (error) throw error

        res.json({
            message: result.affectedRows + " data berhasil diubah"
        })
    })
})
app.delete("/admin/:id_admin", (req, res) => {
    let data = {
        id_admin: req.params.id_admin
    }

    let sql = "delete from admin where ?"

    db.query(sql, data, (error, result) => {
        if (error) throw error

        res.json({
            message: result.affectedRows + " data berhasil di hapus"
        })
    })
})

//USER
app.get("/user", (req, res) => {
    let sql = "select * from user"

    db.query(sql, (error, result) => {
        if (error) throw error

        res.json({
            count: result.length,
            data: result
        })
    })
})
app.post("/user", upload.single("foto"), (req, res) => {
    let data = {
        id_user: req.body.id_user,
        nama_user: req.body.nama_user,
        alamat: req.body.alamat,
        foto: req.file.filename,
        username: req.body.username,
        password: req.body.password
    }
    if (!req.file) {
        res.json({
            message: "Tidak ada file yang diupload"
        })
    } else {
        let sql = "insert into user set ?"

        db.query(sql, data, (error, result) => {
            if (error) throw error

            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})
app.put("/user", upload.single("foto"), (req, res) => {
    let data = null,
        sql = null
    let param = { id_user: req.body.id_user }

    if (!req.file) {
        data = {
            nama_user: req.body.nama_user,
            alamat: req.body.alamat,
            username: req.body.username,
            password: req.body.password
        }
        sql = "update user set ? where ?"

        db.query(sql, [data, param], (error, result) => {
            if (error) {
                res.json({
                    message: error.message
                })
            } else {
                res.json({
                    message: result.affectedRows + " data berhasil diubah"
                })
            }
        })
    } else {
        let data = {
            nama_user: req.body.nama_user,
            alamat: req.body.alamat,
            foto: req.file.filename,
            username: req.body.username,
            password: req.body.password
        }

        sql = "select * from user where ?"

        db.query(sql, param, (error, result) => {
            if (error) throw error
            let fileName = result[0].foto

            let dir = path.join(__dirname, "image", fileName)
            fs.unlink(dir, (error) => {})
        })
        sql = "update user set ? where ?"

        db.query(sql, [data, param], (error, result) => {
            if (error) {
                res.json({
                    message: error.message
                })
            } else {
                res.json({
                    message: result.affectedRows + " data berhasil diubah"
                })
            }
        })
    }
})
app.delete("/user/:id_user", (req, res) => {
    let param = {
        id_user: req.params.id_user
    }

    let sql = "select * from user where ?"

    db.query(sql, param, (error, result) => {
        if (error) throw error

        let fileName = result[0].foto

        let dir = path.join(__dirname, "image", fileName)
        fs.unlink(dir, (error) => {})
    })

    sql = "delete from user where ?"

    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }
    })
})

//TRANSAKSI
app.post("/transaksi", (req, res) => {
    let kodebarang = { kode_barang: req.body.kode_barang }
    let jumlah = { jumlah: req.body.jumlah }

    var datetime = DATE_FORMATER(new Date(), "yyyy-mm-dd HH:MM:ss");
    let data = {
        kode_transaksi: req.body.kode_transaksi,
        id_user: req.body.id_user,
        tgl_transaksi: datetime
    }

    let sql = "insert into transaksi set ?"

    db.query(sql, data, (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            let sql = "select * from barang where ?"

            db.query(sql, kodebarang, (error, result) => {
                if (error) throw error

                let stok = result[0].stok
                let harga = result[0].harga
                let hargabeli = jumlah.jumlah * harga

                let data = {
                    kode_transaksi: req.body.kode_transaksi,
                    kode_barang: kodebarang.kode_barang,
                    jumlah: jumlah.jumlah,
                    harga_beli: hargabeli
                }

                let sql = "insert into detail_transaksi set ?"

                db.query(sql, data, (error, result) => {
                    if (error) {
                        res.json({ message: error.message })
                    } else {
                        let data = {
                            stok: stok - 1
                        }

                        let sql = "update barang set ? where ?"

                        db.query(sql, [data, kodebarang], (error, result) => {
                            if (error) throw error

                            res.json({
                                message: result.affectedRows + " data berhasil ditambahkan"
                            })
                        })
                    }
                })
            })
        }
    })


})
app.put("/transaksi", (req, res) => {
    let kt = { kode_transaksi: req.body.kode_transaksi }
    let kb = { kode_barang: req.body.kode_barang }
    let jumlah = { jumlah: req.body.jumlah }

    let sql = "select * from barang where ?"

    db.query(sql, kb, (error, result) => {

        let harga = result[0].harga
        let hargabeli = jumlah.jumlah * harga

        let data = {
            kode_barang: kb.kode_barang,
            jumlah: jumlah.jumlah,
            harga_beli: hargabeli
        }

        let sql = "update detail_transaksi set ? where ?"

        db.query(sql, [data, kt], (error, result) => {
            if (error) throw error

            res.json({
                message: result.affectedRows + " data berhasil diubah"
            })
        })

    })
})
app.delete("/transaksi/:kode_transaksi", (req, res) => {
    let kode = { kode_transaksi: req.params.kode_transaksi }

    let sql = "delete from transaksi where ?"

    db.query(sql, kode, (error, result) => {
        if (error) throw error

        res.json({
            message: result.affectedRows + " data berhasil dihapus"
        })
    })
})
app.get("/transaksi", (req, res) => {
    let sql = "select t.kode_transaksi, t.tgl_transaksi, u.nama_user, b.nama_barang, dt.jumlah, dt.harga_beli " +
        "from transaksi t join user u on t.id_user = u.id_user " +
        "join detail_transaksi dt on t.kode_transaksi = dt.kode_transaksi " +
        "join barang b on dt.kode_barang = b.kode_barang"

    db.query(sql, (error, result) => {
        if (error) throw error

        res.json({
            count: result.length,
            data: result
        })
    })
})
app.listen(8080, () => {
    console.log("Server run on port 8080")
})