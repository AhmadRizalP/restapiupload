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
app.listen(8080, () => {
    console.log("Server run on port 8080")
})
