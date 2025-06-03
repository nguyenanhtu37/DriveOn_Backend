import Garage from "../models/garage.js";
import ServiceDetail from "../models/serviceDetail.js";

const searchByKeyword = async (keyword) => {
  try {
    const garages = await Garage.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } },
      ],
      status: "enabled",
    });

    const services = await ServiceDetail.find({
      name: { $regex: keyword, $options: "i" },
    }).populate("garage", "address name");

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
      garageId: s.garage._id, // Now using _id since garage is populated
      name: s.name,
      type: "service",
      description: s.description || "",
      image: s.images[0] || "",
      address: s.garage.address || "", // Adding the garage address
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
  try {
    // Validate pagination parameters
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(50, parseInt(limit) || 10));

    let query = {};

    // Keyword search
    if (keyword) {
      // First search for garages directly
      query = {
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { address: { $regex: keyword, $options: "i" } },
        ],
        status: "enabled",
      };

      // Also find services matching the keyword
      const matchingServices = await ServiceDetail.find({
        name: { $regex: keyword, $options: "i" },
      });

      // Get unique garage IDs from those services
      if (matchingServices.length > 0) {
        const garageIdsFromServices = [
          ...new Set(matchingServices.map((s) => s.garage)),
        ];

        // Expand the query to include garages that have matching services
        query = {
          $or: [query, { _id: { $in: garageIdsFromServices } }],
        };
      }
    }

    // Province filter
    if (province) {
      query.address = { $regex: province, $options: "i" };
    }

    // Service filter
    let garageIdsWithService = [];
    if (service) {
      const listOfServices = service.split(",");
      const serviceDetails = await ServiceDetail.find({
        service: { $in: listOfServices },
        isDeleted: false,
      });

      garageIdsWithService = [
        ...new Set(serviceDetails.map((sd) => sd.garage)),
      ];
      if (garageIdsWithService.length > 0) {
        query._id = { $in: garageIdsWithService };
      }
    }

    // Operating day filter preparation
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
      query.operating_days = dayName;
    }

    // For location search, we need to use aggregation pipeline instead
    if (location) {
      const [lat, lng] = location.split(",").map(parseFloat);
      const point = [lng, lat];

      // Count total matching documents first (for pagination)
      const countPipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: point },
            distanceField: "distance",
            maxDistance: 5 * 1000,
            spherical: true,
            distanceMultiplier: 0.001,
            query: query,
          },
        },
        { $count: "total" },
      ];

      const countResult = await Garage.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Now get paginated results
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: point },
            distanceField: "distance",
            maxDistance: 5 * 1000,
            spherical: true,
            distanceMultiplier: 0.001,
            query: query,
          },
        },
        { $sort: { tag: -1, ratingAverage: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      const results = await Garage.aggregate(pipeline);

      return {
        results,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      // For non-location searches, use standard MongoDB pagination
      const total = await Garage.countDocuments(query);

      const results = await Garage.find(query)
        .sort({ tag: -1, ratingAverage: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        results,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  } catch (error) {
    throw new Error("Error searching for garages: " + error.message);
  }
};

export { searchByKeyword, searchWithFilter };
