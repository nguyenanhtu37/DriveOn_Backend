import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  registerGarage,
  viewGarages,
  updateGarage,
  getGarageById,
  viewGarageRegistrations,
  approveGarageRegistration,
  rejectGarageRegistration,
  getGarageRegistrationById,
  addStaff,
  viewStaff,
  disableStaff,
  enableStaff,
  getStaffById,
  enableGarage,
  disableGarage,
  viewGarageExisting,
  viewGarage,
  findGarages,
  findRescueGarages,
  // getCoordinates,
  // getGaragesWithinRadius,
  // filterGarages,
  // filterGaragesByRating,,
  viewAllGaragesByAdmin,
  viewGarageRegistrationsCarOwner,
  viewDashboardOverview,
  viewDashboardChart,
  getGarageList,
} from "../controller/garageController.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// garage staff - protected routes
router.post("/:id/add-staff", authMiddleware, addStaff);
router.get("/:id/staff", authMiddleware, viewStaff);
router.get("/:id/staff/:staffId", authMiddleware, getStaffById);
router.put("/:id/staff/disable", authMiddleware, disableStaff);
router.put("/:id/staff/enable", authMiddleware, enableStaff);

// filter garage:
router.get("/filter", findGarages);
// emergency assistance
router.get("/emergency", findRescueGarages);

// lấy kinh độ, vĩ độ khi ng dùng nhập text
// router.get("/get-coordinates", getCoordinates);

// API để lấy danh sách garage trong phạm vi
// router.get("/filter", getGaragesWithinRadius);
// router.get('/filter', filterGarages);
// router.get('/filter-by-rating', filterGaragesByRating);

router.post("/register-garage", authMiddleware, registerGarage); // register new garage
router.get("/garages/:id", getGarageById); // view garage details
router.get("/garage-registrations", adminMiddleware, viewGarageRegistrations); // view garage registration list
router.get(
  "/garage-registrations/:id",
  adminMiddleware,
  getGarageRegistrationById
); // view garage registration details
router.post(
  "/garage-registrations/:id/approve",
  adminMiddleware,
  approveGarageRegistration
); // approve garage registration
router.post(
  "/garage-registrations/:id/reject",
  adminMiddleware,
  rejectGarageRegistration
); // reject garage registration
router.get("/garages", authMiddleware, viewGarages); // view all garages that are managed by the garage manager
router.put("/garages/:id", authMiddleware, updateGarage);
// router.delete('/garage/:id', deleteGarage);
router.get(
  "/garage-registrations-carOwner",
  authMiddleware,
  viewGarageRegistrationsCarOwner
);

router.get("/existing", viewGarageExisting);
router.put("/:id/enable", adminMiddleware, enableGarage);
router.put("/:id/disable", adminMiddleware, disableGarage);

router.get("/viewGarage", viewGarage);

router.get("/viewGarageList", getGarageList);

router.get(
  "/view-all-garages-by-admin",
  adminMiddleware,
  viewAllGaragesByAdmin
); // Admin xem toàn bộ garage

router.get(
  "/:id/dashboardOverview",
  authorizeRoles(["staff", "manager"]),
  viewDashboardOverview
);
router.get(
  "/:id/dashboardChart",
  authorizeRoles(["staff", "manager"]),
  viewDashboardChart
);

export default router;
