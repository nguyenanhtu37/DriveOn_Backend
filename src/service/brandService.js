import Brand from "../models/brand.js";

const addBrand = async (brandName, logo) => {
  try {
    const newBrand = new Brand({ brandName, logo });
    await newBrand.save();
    return newBrand;
  } catch (err) {
    throw new Error(err.message);
  }
};

export { addBrand };