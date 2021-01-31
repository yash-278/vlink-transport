const path = require("path");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const crypto = require("crypto");
const { createReadStream } = require("fs");
const { createModel } = require("mongoose-gridfs");

const conn = mongoose.connection;

// Init Gfs
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Storage for Profile Photos

let userId;

const storage = new GridFsStorage({
  url: `${process.env.MONGOOSE_URL}`,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          id: req.user._id,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const profileUpload = multer({ storage });

app.post("/uploadprofile", profileUpload.single("file"), (req, res) => {
  userId = req.user.id;
  // res.json({ file: req.file });
  res.redirect("/industryprofile");
});

app.delete("/files/:id", (req, res) => {
  // gfs.remove({ _id: req.params.id, root: "uploads" }, (err, gridStore) => {
  //   if (err) {
  //     return res.status(404).json({ err: err });
  //   }
  //   res.redirect("/industryprofile");
  // });

  const bucket = createBucket();
  const id = req.params.id;
  bucket.deleteFile(id, (err, res) => {
    res.redirect("/industryprofile");
  });
});
