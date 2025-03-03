import * as brandService from "../service/brandService.js";

export const addBrand = async (req, res) => {
  const { brandName, logo } = req.body;
  try {
    const newBrand = await brandService.addBrand(brandName, logo);
    res.status(201).json({ message: "Role added successfully", brand: { newBrand } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};