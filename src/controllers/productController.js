// Product listing and search with same-denomination default
const { Product, Category, User, Denomination } = require('../models');
const { Op } = require('sequelize');

// Build sorting
function buildSort(sort) {
  switch ((sort || '').toLowerCase()) {
    case 'price_asc':
      return [['price', 'ASC'], ['createdAt', 'DESC']];
    case 'price_desc':
      return [['price', 'DESC'], ['createdAt', 'DESC']];
    case 'trust_desc':
      return [[{ model: User, as: 'seller' }, 'trust_score', 'DESC'], ['createdAt', 'DESC']];
    case 'newest':
    default:
      return [['createdAt', 'DESC']];
  }
}

// GET /products
// Query: q, categoryId, minPrice, maxPrice, active (true/false), approved (true/false), sort, page, limit, all (true to disable same-denom default)
async function listProducts(req, res) {
  try {
    const {
      q,
      categoryId,
      minPrice,
      maxPrice,
      active,
      approved,
      sort,
      page = '1',
      limit = '20',
      all
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    // Build where clause
    const where = {};

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter by price
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    // Filter by active
    if (active === 'true' || active === 'false') {
      where.isActive = active === 'true';
    }

    // Filter by approved
    if (approved === 'true' || approved === 'false') {
      where.isApproved = approved === 'true';
    }

    // Filter by q (search)
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Same-denomination default
    const include = [
      {
        model: User,
        as: 'seller',
        include: [
          {
            model: Denomination,
            as: 'denomination'
          }
        ]
      },
      {
        model: Category,
        as: 'category'
      }
    ];

    if (req.user && all !== 'true' && req.user.denominationId) {
      include[0].where = { denominationId: req.user.denominationId };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include,
      limit: perPage,
      offset,
      order: buildSort(sort || 'newest')
    });

    const filteredProducts = products.map(product => ({
      id: product.id,
      sellerId: product.sellerId,
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      inventoryCount: product.inventoryCount,
      imageUrls: product.imageUrls,
      isActive: product.isActive,
      isApproved: product.isApproved,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      seller: {
        id: product.seller.id,
        firstName: product.seller.firstName,
        lastName: product.seller.lastName,
        businessName: product.seller.businessName,
        trustScore: product.seller.trustScore,
        isVerified: product.seller.isVerified,
        denominationId: product.seller.denominationId,
        denomination: product.seller.denomination ? {
          id: product.seller.denomination.id,
          name: product.seller.denomination.name
        } : null
      },
      category: product.category ? {
        id: product.category.id,
        name: product.category.name
      } : null
    }));

    // Use the count from Sequelize
    const total = count;
    const paginatedProducts = filteredProducts;

    res.status(200).json({
      success: true,
      products: paginatedProducts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / perPage),
        total
      },
      sameDenominationDefault: !!(req.user && all !== 'true' && req.user.denominationId),
      info: req.user && all !== 'true' && !req.user.denominationId
        ? 'User has no denomination; no denomination filter applied'
        : undefined
    });
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).json({ success: false, message: 'Server error listing products' });
  }
}

// GET /products/:id
async function getProductById(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          include: [
            {
              model: Denomination,
              as: 'denomination'
            }
          ]
        },
        {
          model: Category,
          as: 'category'
        }
      ]
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const productWithIncludes = {
      id: product.id,
      sellerId: product.sellerId,
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      inventoryCount: product.inventoryCount,
      imageUrls: product.imageUrls,
      isActive: product.isActive,
      isApproved: product.isApproved,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      seller: {
        id: product.seller.id,
        firstName: product.seller.firstName,
        lastName: product.seller.lastName,
        businessName: product.seller.businessName,
        trustScore: product.seller.trustScore,
        isVerified: product.seller.isVerified,
        denominationId: product.seller.denominationId,
        denomination: product.seller.denomination ? {
          id: product.seller.denomination.id,
          name: product.seller.denomination.name
        } : null
      },
      category: product.category ? {
        id: product.category.id,
        name: product.category.name
      } : null
    };

    // Optional: if same-denomination default should affect detail view listing of related items only; here we just return the item.
    res.status(200).json({ success: true, product: productWithIncludes });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving product' });
  }
}

// Render marketplace page
async function renderMarketplace(req, res, next) {
  try {
    const {
      q,
      category,
      price,
      sort,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const where = { isActive: true };

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (category) {
      // Map frontend categories to database
      const categoryMapping = {
        'technology': 1, // Assuming IDs, but better to query by name
        'equipment': 2,
        'professional': 3,
        'office': 4,
        'retail': 5,
        'other': 6
      };
      if (categoryMapping[category]) {
        where.categoryId = categoryMapping[category];
      }
    }

    if (price) {
      const [min, max] = price.split('-');
      if (min) where.price = { ...where.price, [Op.gte]: Number(min) };
      if (max) where.price = { ...where.price, [Op.lte]: Number(max) };
    }

    const include = [
      {
        model: User,
        as: 'seller',
        include: [{ model: Denomination, as: 'denomination' }]
      },
      { model: Category, as: 'category' }
    ];

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include,
      limit: perPage,
      offset,
      order: buildSort(sort || 'newest')
    });

    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    return res.render('marketplace', {
      title: 'Marketplace',
      user: req.user,
      products,
      categories,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / perPage),
        total: count
      },
      filters: { q, category, price, sort }
    });
  } catch (err) {
    console.error('renderMarketplace error:', err);
    return next(err);
  }
}

module.exports = {
  listProducts,
  getProductById,
  renderMarketplace
};
