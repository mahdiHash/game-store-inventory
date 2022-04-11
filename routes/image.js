let express = require('express');
let router = express.Router();
let fs = require('fs');
let os = require('os');
let path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

require('dotenv').config();

const s3 = new S3Client({
  region: 'default',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

// router for: localhost/img/

router.get('/:imgName', (req, res, next) => {
  let dir = `${os.tmpdir()}/${Date.now()}${path.extname(req.params.imgName)}`;
  let temp = fs.createWriteStream(dir);

  // if the user stops page loading, delete the created file
  req.on('close', () => {
    temp.close((err) => {
      if (err) next(err); 
    });
    fs.rm(dir, (err) => {
      if (err) next(err);
    });
  });

  temp.on('finish', () => {
    res.sendFile(dir);
  });

  s3.send(new GetObjectCommand({
    Bucket: process.env.BUCKET,
    Key: req.params.imgName,
  }))
    .then((data) => {
      data.Body.pipe(temp);
    })
    .catch(next);
});

module.exports = router;
