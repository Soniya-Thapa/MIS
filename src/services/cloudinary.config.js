
//cloudinary config
import{v2 as cloudinary} from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
})

// const storage = new CloudinaryStorage({
//   cloudinary : cloudinary,
//   params: async(req , file)=>({
//     //folder: multer ley store gareko file cloudinary bhitra kun folder ma rakhney ta
//     folder: "MIS"
//   })
// })

export {
  cloudinary,
  // storage
} 