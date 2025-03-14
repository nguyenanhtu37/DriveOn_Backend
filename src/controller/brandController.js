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
export const getBrands = async (req, res) => {
  try {
    const brandList = await brandService.getBrands();
    if (!brandList || brandList.length === 0) {
      return res.status(404).json({message: "No brand found!"});
    }
    res.status(200).json({message: "Brand list", data: brandList});
  } catch (err) {
    res.status(500).json({ error: err.message});
  }
}