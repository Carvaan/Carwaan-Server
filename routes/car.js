const express = require("express");
const router = express.Router();
const CarController = require("../controllers/car_controller");
const multer = require("multer");

// const storage =multer.diskStorage({
//     destination : function(req,file,cb){
//         cb(null,'./uploads/')
//     },
//     filename: function(req,file,cb){
//         cb(null,Date.now()+'.jpg')
//     }
// });

// const filefilter=(req,file,cb)=>{
//     console.log(file.mimetype);
//     if(file.mimetype=== 'image/jpeg' || file.mimetype=== 'image/png' || file.mimetype==='image/jpg'){
//         cb(null , true);
//     }else{
//         cb(null,false);
//     }
// };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 1024 * 1024 * 5,
  },
  //fileFilter: filefilter
});

router.post("/addcar", upload.single("img"), CarController.addCar);
router.post("/editcar", upload.single("img"), CarController.editCar);
router.post("/deletecar", CarController.deleteCar);
router.get("/getallshowrooms", CarController.getAllShowrooms);
router.get(
  "/getallshowroomsnotverified",
  CarController.getAllShowroomsNotVerified
);
router.post("/getshowroomcars", CarController.getShowroomCars);
router.get("/getallcars", CarController.getAllCars);
router.post("/bookacar", CarController.bookACar);
router.get("/verifybooking", CarController.confirmBooking);
router.post("/getmybookinguser", CarController.getMyBookingUser);
router.post("/getmybookingshowroom", CarController.getMyBookingShowroom);
router.post("/getshowroomname", CarController.getShowroomName);
router.post("/getcardetails", CarController.getCarDetails);
router.post("/getshowroomno", CarController.getShowroomNo);
router.post("/ratebooking", CarController.rateBooking);

module.exports = {
  router,
};
