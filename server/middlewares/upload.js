const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination(req, file, cb){

        if(file.fieldname==="resume"){
            cb(null,"uploads/resumes");
        }

        else if(file.fieldname==="certificate"){
            cb(null,"uploads/certificates");
        }

        else if(file.fieldname==="offerLetter"){
            cb(null,"uploads/offerLetters");
        }

        else{

            cb(null,"uploads/projects");

        }

    },

    filename(req,file,cb){

        cb(
            null,
            Date.now()+"-"+file.originalname
        );

    }

});

const upload=multer({storage});

module.exports=upload;