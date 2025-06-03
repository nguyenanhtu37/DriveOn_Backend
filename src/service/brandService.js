import Brand from "../models/brand.js";
import { brandSchema } from "../validator/brandValidator.js";

const addBrand = async (brandName, logo) => {
  try {
    brandSchema.parse({ brandName, logo });
    const brand_in_DB = await Brand.findOne({ brandName });
    if (brand_in_DB) {
      throw new Error(`Brand ${brandName} already exists!`);
    }
    const newBrand = new Brand({ brandName, logo });
    await newBrand.save();
    return newBrand;
  } catch (err) {
    throw new Error(err.message);
  }
};

// const getBrands = async () => {
//   try {
//     const brandList = await Brand.find({ isDeleted: false });
//     return brandList;
//   } catch (err) {
//     throw new Error("Cannot get brand list!");
//   }
// };

const getBrands = async (page = 1, limit = 10, keyword = "") => {
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const query = { isDeleted: false };

  // Tìm kiếm theo tên brand (nếu có keyword)
  if (keyword && keyword.trim() !== "") {
    const searchRegex = new RegExp(keyword.trim(), "i");
    query.brandName = { $regex: searchRegex };
  }

  const skip = (page - 1) * limit;
  const totalCount = await Brand.countDocuments(query);

  const brands = await Brand.find(query)
    .sort({ brandName: 1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    brands,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const updateBrand = async (brandId, brandName, logo) => {
  try {
    if (!brandId) {
      throw new Error("Invalid brand!");
    }
    brandSchema.parse({ brandName, logo });
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { brandName, logo },
      { new: true }
    );
    if (!updatedBrand) {
      throw new Error("Brand not found!");
    }
    return updatedBrand;
  } catch (err) {
    throw new Error(err.message);
  }
};

const deleteBrand = async (brandId) => {
  try {
    if (!brandId) {
      throw new Error("Invalid brand!");
    }
    const result = await Brand.findByIdAndUpdate(
      brandId,
      { isDeleted: true },
      { new: true }
    );
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
};

export { addBrand, getBrands, updateBrand, deleteBrand };
