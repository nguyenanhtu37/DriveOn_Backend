import Garage from "../models/garage.js";
import ServiceDetail from "../models/serviceDetail.js";

const searchByKeyword = async (keyword) => {
  try {
    const garages = await Garage.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } },
      ],
    });

    const services = await ServiceDetail.find({
      name: { $regex: keyword, $options: "i" },
    });

    // Map garages and services to unified format
    const garageResults = garages.map((g) => ({
      garageId: g._id,
      name: g.name,
      type: "garage",
      description: g.description || "",
      image: g.interiorImages[0] || "",
      address: g.address || "",
    }));

    const serviceResults = services.map((s) => ({
      garageId: s.garage,
      name: s.name,
      type: "service",
      description: s.description || "",
      image: s.images[0] || "",
    }));

    return [...garageResults, ...serviceResults];
  } catch (error) {
    throw new Error("Error searching for garages");
  }
};

const searchWithFilter = async ({
  keyword,
  location,
  service,
  time,
  province,
  page = 1,
  limit = 10,
}) => {
  let garageResults = [];

  try {
    if (keyword) {
      const garages = await Garage.find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { address: { $regex: keyword, $options: "i" } },
        ],
      }).sort({ tag: -1, ratingAverage: -1 });

      if (garages.length > 0) {
        garageResults = garages;
      } else {
        const services = await ServiceDetail.find({
          name: { $regex: keyword, $options: "i" },
        });

        const garageIds = services.map((s) => s.garage);
        const uniqueGarageIds = [
          ...new Set(garageIds.map((id) => id.toString())),
        ];
        garageResults = await Garage.find({
          _id: { $in: uniqueGarageIds },
        }).sort({ tag: -1, ratingAverage: -1 });
      }
    } else {
      garageResults = await Garage.find({}).sort({
        tag: -1,
        ratingAverage: -1,
      });
    }

    if (service) {
      const listOfServices = service.split(",");
      const serviceDetails = await ServiceDetail.find({
        service: { $in: listOfServices },
        isDeleted: false,
      });

      const garageIdsWithService = [
        ...new Set(serviceDetails.map((sd) => sd.garage.toString())),
      ];

      // Filter garages to only those that offer the selected services
      garageResults = garageResults.filter((garage) =>
        garageIdsWithService.includes(garage._id.toString())
      );
    }

    // Operating day filtering
    if (time) {
      const date = new Date(time);
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayName = daysOfWeek[date.getUTCDay()];

      garageResults = garageResults.filter((garage) =>
        garage.operating_days.includes(dayName)
      );
    }

    if (location) {
      const [lat, lng] = location.split(",").map(parseFloat);
      const point = [lng, lat];

      const nearbyGarages = await Garage.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: point },
            distanceField: "distance",
            maxDistance: 5 * 1000,
            spherical: true,
            distanceMultiplier: 0.001,
          },
        },
        {
          $match: {
            _id: {
              $in:
                garageResults.length > 0
                  ? garageResults.map((g) => g._id)
                  : await Garage.distinct("_id"),
            },
          },
        },
      ]);

      const garageResultIds = new Set(
        garageResults.map((g) => g._id.toString())
      );
      garageResults = nearbyGarages.filter((g) =>
        garageResultIds.has(g._id.toString())
      );
    } else if (province) {
      garageResults = garageResults.filter((garage) =>
        garage.address.toLowerCase().includes(province.toLowerCase())
      );
    }

    // Pagination
    const total = garageResults.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedResults = garageResults.slice(start, end);

    return {
      results: paginatedResults,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error("Error searching for garages: " + error.message);
  }
};

export { searchByKeyword, searchWithFilter };
