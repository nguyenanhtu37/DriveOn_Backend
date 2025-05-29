import * as searchService from "../service/searchService.js";
const searchByKeyword = async (req, res) => {
  const { keyword } = req.query;
  try {
    const result = await searchService.searchByKeyword(keyword);
    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchWithFilter = async (req, res) => {
  const { keyword, location, service, time, province, page, limit } = req.query;
  try {
    const result = await searchService.searchWithFilter({
      keyword,
      location,
      service,
      time,
      province,
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export { searchByKeyword, searchWithFilter };
