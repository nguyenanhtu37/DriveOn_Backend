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

const getBrands = async () => {
  try {
    const brandList = await Brand.find({ isDeleted: false });
    return brandList;
  } catch (err) {
    throw new Error("Cannot get brand list!");
  }
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
