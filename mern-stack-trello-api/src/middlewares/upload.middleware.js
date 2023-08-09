import multer from 'multer'

export const LIMIT_COMMON_FILE_SIZE = 10485760 // 10 MB, caculate by byte
export const ALLOW_COMMON_FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png']

const customfileFilter  = (req, file, callback) => {
    if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
      let errorMess = `The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.`
      return callback(errorMess, null)
    }
    return callback(null, true)
}

const upload = multer({
   limits: { fileSize : LIMIT_COMMON_FILE_SIZE },
   fileFilter : customfileFilter
})

export const UploadMiddleware = {
    upload
}